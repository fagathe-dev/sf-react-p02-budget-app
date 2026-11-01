<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\Auth\ResetPasswordDto;
use App\Dto\Mail\AccountVerificationMailDto;
use App\Dto\Mail\ForgotPasswordMailDto;
use App\Dto\Mail\OtpVerificationMailDto;
use App\Dto\Mail\RegistrationConfirmedMailDto;
use App\Entity\User;
use App\Enum\Auth\RoleEnum;
use App\Enum\Auth\UserRequestTypeEnum;
use App\Event\UserActivatedEvent;
use App\Repository\UserRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Fagathe\CorePhp\Mailer\Exception\RecipientUnreachableException;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

final class AuthService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    /** Validité du lien de vérification envoyé à l'inscription */
    private const VERIFICATION_TTL_HOURS = 72;

    /** Validité du lien de réinitialisation du mot de passe */
    private const PASSWORD_RESET_TTL_HOURS = 24;

    /** Connexion sans mot de passe : validité du code, essais autorisés, délai entre deux envois */
    private const LOGIN_CODE_TTL_SECONDS = 90;
    private const LOGIN_CODE_VALIDITY_LABEL = '1 min 30';
    private const LOGIN_CODE_MAX_ATTEMPTS = 5;
    private const LOGIN_CODE_RESEND_DELAY_SECONDS = 30;

    /** Code renvoyé au front quand le compte n'est pas encore vérifié */
    public const ERROR_EMAIL_NOT_VERIFIED = 'email_not_verified';

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
        private readonly SerializerInterface $serializer,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly UserRequestService $userRequestService,
        private readonly SecretDecoder $secretDecoder,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly EmailDispatcherService $emailDispatcher,
        private readonly CacheItemPoolInterface $cache,
        private readonly EventDispatcherInterface $dispatcher,
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private readonly ?string $frontendUrl = null,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Inscription & vérification du compte
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Inscription d'un nouvel utilisateur et envoi du lien de vérification (72h).
     * Le compte reste inactif (connexion refusée) tant que le lien n'a pas été utilisé.
     */
    public function register(Request $request): object
    {
        $now = $this->now();

        // Le mot de passe arrive en base64 : on le décode AVANT la désérialisation et la validation
        $body = $this->secretDecoder->decodeJsonBody($request->getContent(), ['password']);
        if ($body === null) {
            return $this->sendJson(['message' => 'Format de données invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            /** @var User $user */
            $user = $this->serializer->deserialize(
                $body,
                User::class,
                'json',
                [
                    AbstractNormalizer::IGNORED_ATTRIBUTES => [
                        'id',
                        'role',
                        'createdAt',
                        'updatedAt',
                        'emailVerifiedAt',
                        'isVerified',
                    ],
                ]
            );
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $user
            ->setPassword($this->hasher->hashPassword($user, (string) $user->getPassword()))
            ->setRole(RoleEnum::RoleUser)
            ->setCreatedAt($now)
            ->setIsVerified(false);

        try {
            $this->userRepository->save($user, isCreation: true);
            $this->sendVerificationEmail($user);

            return $this->sendJson(
                [
                    'user'    => $user,
                    'message' => sprintf(
                        'Compte créé avec succès. Un lien de vérification valable %dh vous a été envoyé à l\'adresse %s.',
                        self::VERIFICATION_TTL_HOURS,
                        $user->getEmail()
                    ),
                ],
                Response::HTTP_CREATED,
                context: ['groups' => ['user.read']]
            );
        } catch (RecipientUnreachableException) {
            $this->cancelRegistration($user);

            return $this->sendJson(
                ['message' => 'Le domaine de cette adresse e-mail semble invalide ou ne peut pas recevoir de messages.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        } catch (MailerExceptionInterface) {
            // Déjà journalisé par AbstractMailerHandler
            $this->cancelRegistration($user);

            return $this->sendJson(
                ['message' => 'Impossible d\'envoyer l\'e-mail de vérification pour le moment. Veuillez réessayer.'],
                Response::HTTP_BAD_GATEWAY
            );
        } catch (Throwable $e) {
            $this->cancelRegistration($user);

            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'    => 'Erreur critique lors de l\'inscription',
                    'user'       => $user->getUsername(),
                    'user_agent' => $this->getUserAgent(),
                    'exception'  => $e,
                ],
                ['action' => 'user.register.critical_error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de la création du compte.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Validation du lien reçu à l'inscription : active le compte et connecte automatiquement l'utilisateur.
     */
    public function verifyEmail(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $token = trim((string) ($data['token'] ?? ''));

        if ($token === '') {
            return $this->sendJson(['message' => 'Le jeton de validation est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $userRequest = $this->userRequestService->findValidRequest($token, UserRequestTypeEnum::EmailVerification);

        if (!$userRequest) {
            return $this->sendJson(
                ['message' => 'Ce lien de vérification est invalide ou a expiré. Connectez-vous pour en recevoir un nouveau.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $user = $userRequest->getUser();
        $wasVerified = $user->isVerified();

        $user->setIsVerified(true);
        $user->setEmailVerifiedAt($this->now());

        // Consomme la demande et enregistre l'activation du compte
        $this->userRequestService->consume($userRequest);

        if (!$wasVerified) {
            // Création du board perso par CreatePersonalBoardListener (l'authentification reste indépendante du budget)
            $this->dispatcher->dispatch(new UserActivatedEvent($user));
            $this->sendWelcomeEmail($user);
        }

        return $this->sendAuthenticated($user, 'Votre compte a été vérifié avec succès. Bienvenue !');
    }

    /**
     * Renvoi du lien de vérification (lien expiré ou e-mail perdu). Réponse constante (anti-énumération).
     */
    public function resendVerification(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $identifier = trim((string) ($data['username'] ?? ''));

        if ($identifier === '') {
            return $this->sendJson(['message' => 'L\'identifiant est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $this->findUserByIdentifier($identifier);

        if ($user instanceof User && !$user->isVerified()) {
            try {
                $this->sendVerificationEmail($user);
            } catch (Throwable) {
                // Échec déjà journalisé (AbstractMailerHandler) : la réponse reste identique
            }
        }

        return $this->sendJson([
            'message' => 'Si ce compte est en attente de vérification, un nouveau lien vous a été envoyé par e-mail.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Connexion : mot de passe ou code temporaire (passwordless)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Connexion : le mot de passe est reçu en base64, décodé, puis vérifié contre le hash en base
     */
    public function login(Request $request): object
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $identifier = trim((string) ($data['username'] ?? ''));
        $password = $this->secretDecoder->decode($data['password'] ?? '');

        if ($password === null) {
            return $this->sendJson(['message' => 'Format de données invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if ($identifier === '' || $password === '') {
            return $this->sendJson(['message' => 'Identifiant et mot de passe obligatoires.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $this->findUserByIdentifier($identifier);

        if (!$user instanceof User) {
            // Hash factice pour lisser le temps de réponse (anti-énumération d'utilisateurs)
            $this->hasher->hashPassword(new User(), $password);

            return $this->sendJson(['message' => 'Identifiants invalides.'], Response::HTTP_UNAUTHORIZED);
        }

        // $password est ici le mot de passe DÉCODÉ : c'est lui qui est comparé au hash
        if (!$this->hasher->isPasswordValid($user, $password)) {
            return $this->sendJson(['message' => 'Identifiants invalides.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isVerified()) {
            return $this->sendEmailNotVerified();
        }

        return $this->sendAuthenticated($user);
    }

    /**
     * Connexion sans mot de passe, étape 1 : envoi d'un code à 6 chiffres valable 1 min 30.
     * Réponse constante (anti-énumération) ; un nouvel envoi n'est possible qu'après 30 secondes.
     */
    public function requestLoginCode(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $identifier = trim((string) ($data['username'] ?? ''));

        if ($identifier === '') {
            return $this->sendJson(['message' => 'L\'identifiant est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $this->findUserByIdentifier($identifier);

        if ($user instanceof User && $user->isVerified() && $this->acquireLoginCodeSendSlot($user)) {
            $loginRequest = $this->userRequestService->createRequest(
                user: $user,
                type: UserRequestTypeEnum::OtpLogin,
                isOtp: true,
                ttlSeconds: self::LOGIN_CODE_TTL_SECONDS,
            );

            if ($loginRequest?->getCode() !== null) {
                $this->resetLoginCodeAttempts($user);

                $this->emailDispatcher->dispatchSilently(new OtpVerificationMailDto(
                    recipientEmail: (string) $user->getEmail(),
                    recipientName: $this->resolveRecipientName($user),
                    otpCode: $loginRequest->getCode(),
                    purposeLabel: 'vous connecter',
                    validityLabel: self::LOGIN_CODE_VALIDITY_LABEL,
                ));
            }
        }

        return $this->sendJson([
            'message'         => 'Si ce compte existe, un code de connexion vous a été envoyé par e-mail.',
            'expiresIn'       => self::LOGIN_CODE_TTL_SECONDS,
            'resendAvailable' => self::LOGIN_CODE_RESEND_DELAY_SECONDS,
        ]);
    }

    /**
     * Connexion sans mot de passe, étape 2 : vérification du code pour CET utilisateur.
     * Au-delà de 5 essais erronés, le code est révoqué (un nouveau doit être demandé).
     */
    public function loginWithCode(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $identifier = trim((string) ($data['username'] ?? ''));
        $code = trim((string) ($data['code'] ?? ''));

        if ($identifier === '' || $code === '') {
            return $this->sendJson(['message' => 'Identifiant et code obligatoires.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $invalid = $this->sendJson(['message' => 'Code invalide ou expiré.'], Response::HTTP_UNAUTHORIZED);

        $user = $this->findUserByIdentifier($identifier);
        if (!$user instanceof User || !$user->isVerified() || !preg_match('/^\d{6}$/', $code)) {
            return $invalid;
        }

        $loginRequest = $this->userRequestService->findValidRequestForUser($user, $code, UserRequestTypeEnum::OtpLogin);

        if (!$loginRequest) {
            if ($this->registerFailedLoginCodeAttempt($user) >= self::LOGIN_CODE_MAX_ATTEMPTS) {
                $this->userRequestService->revokeActiveRequests($user, UserRequestTypeEnum::OtpLogin);

                return $this->sendJson(
                    ['message' => 'Trop de tentatives. Demandez un nouveau code de connexion.'],
                    Response::HTTP_TOO_MANY_REQUESTS
                );
            }

            return $invalid;
        }

        $this->userRequestService->consume($loginRequest);
        $this->resetLoginCodeAttempts($user);

        return $this->sendAuthenticated($user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mot de passe oublié
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Demande de réinitialisation : envoi d'un lien valable 24h. Réponse constante (anti-énumération).
     */
    public function forgotPassword(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($data['email'] ?? ''));

        if ($email === '') {
            return $this->sendJson(['message' => 'L\'adresse e-mail est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);

        if ($user instanceof User) {
            $userRequest = $this->userRequestService->createRequest(
                user: $user,
                type: UserRequestTypeEnum::PasswordReset,
                ttlMinutes: self::PASSWORD_RESET_TTL_HOURS * 60,
                isOtp: false
            );

            if ($userRequest?->getToken() !== null) {
                $resetUrl = sprintf(
                    '%s/reset-password?token=%s',
                    $this->resolveFrontendBaseUrl(),
                    urlencode($userRequest->getToken())
                );

                // Échec déjà journalisé par AbstractMailerHandler : réponse constante (anti-énumération)
                $this->emailDispatcher->dispatchSilently(new ForgotPasswordMailDto(
                    recipientEmail: (string) $user->getEmail(),
                    recipientName: $this->resolveRecipientName($user),
                    resetUrl: $resetUrl,
                    ttlHours: self::PASSWORD_RESET_TTL_HOURS,
                ));
            }
        }

        return $this->sendJson([
            'message' => 'Si cette adresse est associée à un compte, un lien de réinitialisation vous a été envoyé.',
        ]);
    }

    /**
     * Réinitialisation effective : le nouveau mot de passe (base64) est validé puis enregistré.
     */
    public function resetPassword(Request $request): object
    {
        $body = $this->secretDecoder->decodeJsonBody($request->getContent(), ['password']);
        if ($body === null) {
            return $this->sendJson(['message' => 'Format de données invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            /** @var ResetPasswordDto $dto */
            $dto = $this->serializer->deserialize($body, ResetPasswordDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $userRequest = $this->userRequestService->findValidRequest(trim($dto->token), UserRequestTypeEnum::PasswordReset);

        if (!$userRequest) {
            return $this->sendJson(
                ['message' => 'Le lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $user = $userRequest->getUser();
        $user->setPassword($this->hasher->hashPassword($user, $dto->password));
        $user->setUpdatedAt($this->now());

        // Le lien reçu prouve la possession de l'adresse : le compte peut être activé
        $wasVerified = (bool) $user->isVerified();
        if (!$wasVerified) {
            $user->setIsVerified(true);
            $user->setEmailVerifiedAt($this->now());
        }

        // Consomme la demande et enregistre le nouveau mot de passe
        $this->userRequestService->consume($userRequest);

        if (!$wasVerified) {
            $this->dispatcher->dispatch(new UserActivatedEvent($user));
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            ['message' => 'Mot de passe réinitialisé', 'user_id' => (string) $user->getId()],
            ['action' => 'user.password_reset.success']
        );

        return $this->sendJson(['message' => 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function findUserByIdentifier(string $identifier): ?User
    {
        return $this->userRepository->findOneBy(['username' => $identifier])
            ?? $this->userRepository->findOneBy(['email' => $identifier]);
    }

    private function sendAuthenticated(User $user, ?string $message = null): object
    {
        return $this->sendJson(
            array_filter([
                'token'   => $this->jwtManager->create($user),
                'user'    => $user,
                'message' => $message,
            ], static fn (mixed $value): bool => $value !== null),
            Response::HTTP_OK,
            context: ['groups' => ['user.read']]
        );
    }

    private function sendEmailNotVerified(): object
    {
        return $this->sendJson(
            [
                'code'    => self::ERROR_EMAIL_NOT_VERIFIED,
                'message' => 'Veuillez vérifier votre adresse e-mail avant de vous connecter.',
            ],
            Response::HTTP_FORBIDDEN
        );
    }

    /**
     * Crée un lien de vérification (72h) et l'envoie.
     *
     * @throws MailerExceptionInterface
     */
    private function sendVerificationEmail(User $user): void
    {
        $verificationRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::EmailVerification,
            ttlMinutes: self::VERIFICATION_TTL_HOURS * 60,
            isOtp: false
        );

        if ($verificationRequest?->getToken() === null) {
            throw new \RuntimeException('Impossible de générer le lien de vérification.');
        }

        $this->emailDispatcher->dispatch(new AccountVerificationMailDto(
            recipientEmail: (string) $user->getEmail(),
            recipientName: $this->resolveRecipientName($user),
            verificationUrl: sprintf(
                '%s/verify-email?token=%s',
                $this->resolveFrontendBaseUrl(),
                urlencode($verificationRequest->getToken())
            ),
            ttlHours: self::VERIFICATION_TTL_HOURS,
        ));
    }

    /**
     * true si aucun code n'a été envoyé à cet utilisateur depuis 30 secondes (limite le spam d'e-mails).
     */
    private function acquireLoginCodeSendSlot(User $user): bool
    {
        $item = $this->cache->getItem('login_code_sent_' . $user->getId());

        if ($item->isHit()) {
            return false;
        }

        $this->cache->save($item->set(true)->expiresAfter(self::LOGIN_CODE_RESEND_DELAY_SECONDS));

        return true;
    }

    /**
     * @return int Nombre d'essais erronés pour le code en cours
     */
    private function registerFailedLoginCodeAttempt(User $user): int
    {
        $item = $this->cache->getItem('login_code_attempts_' . $user->getId());
        $attempts = (int) $item->get() + 1;

        $this->cache->save($item->set($attempts)->expiresAfter(self::LOGIN_CODE_TTL_SECONDS));

        return $attempts;
    }

    private function resetLoginCodeAttempts(User $user): void
    {
        $this->cache->deleteItem('login_code_attempts_' . $user->getId());
    }

    /**
     * Annule une inscription dont l'e-mail de vérification n'a pas pu partir,
     * pour libérer l'e-mail et le username (les UserRequest sont supprimées en cascade).
     */
    private function cancelRegistration(User $user): void
    {
        try {
            $this->userRepository->remove($user);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Impossible d\'annuler l\'inscription après un échec d\'envoi',
                    'user'      => $user->getUsername(),
                    'exception' => $e,
                ],
                ['action' => 'user.register.rollback_error']
            );
        }
    }

    /**
     * E-mail de bienvenue : son échec ne doit pas bloquer la vérification du compte
     */
    private function sendWelcomeEmail(User $user): void
    {
        $this->emailDispatcher->dispatchSilently(new RegistrationConfirmedMailDto(
            recipientEmail: (string) $user->getEmail(),
            recipientName: $this->resolveRecipientName($user),
            loginUrl: sprintf('%s/login', $this->resolveFrontendBaseUrl()),
        ));
    }

    private function resolveRecipientName(User $user): string
    {
        $fullName = trim(sprintf('%s %s', (string) $user->getFirstname(), (string) $user->getLastname()));

        return $fullName !== '' ? $fullName : (string) ($user->getUsername() ?? 'Utilisateur');
    }

    private function resolveFrontendBaseUrl(): string
    {
        if (!empty($this->frontendUrl)) {
            return rtrim($this->frontendUrl, '/');
        }

        return rtrim($this->getOrigin(), '/');
    }
}
