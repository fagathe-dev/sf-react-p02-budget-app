<?php

namespace App\Service;

use App\Dto\Account\ChangeEmailDto;
use App\Dto\Account\ChangePasswordDto;
use App\Dto\Account\UpdateAccountDto;
use App\Dto\Account\UploadAvatarDto;
use App\Dto\Mail\AccountDeletionCodeMailDto;
use App\Dto\Mail\EmailChangeVerificationMailDto;
use App\Entity\User;
use App\Enum\Auth\UserRequestTypeEnum;
use App\Repository\UserRepository;
use App\Service\Budget\AccountBoardsCleaner;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\File\FileTrait;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Fagathe\CorePhp\Mailer\Exception\RecipientUnreachableException;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Fagathe\CorePhp\Uploader\UploaderService;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class AccountService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait, FileTrait;

    /** Suppression de compte : validité du code, essais autorisés, délai entre deux envois */
    public const DELETION_CODE_TTL_MINUTES = 10;
    public const DELETION_CODE_MAX_ATTEMPTS = 5;
    public const DELETION_CODE_RESEND_DELAY_SECONDS = 30;

    public function __construct(
        private readonly Security $security,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly ValidatorInterface $validator,
        private readonly SerializerInterface $serializer,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly UploaderService $uploader,
        private readonly UserRequestService $userRequestService,
        private readonly SecretDecoder $secretDecoder,
        private readonly EmailDispatcherService $emailDispatcher,
        private readonly CacheItemPoolInterface $cache,
        private readonly AccountBoardsCleaner $accountBoardsCleaner,
        private readonly ?string $defaultUri = null,
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private readonly ?string $frontendUrl = null,
    ) {}

    public function getBaseUri(): string
    {
        if (!empty($this->defaultUri)) {
            return rtrim($this->defaultUri, '/');
        }

        return rtrim($this->getOrigin(), '/');
    }

    public function formatFileUri(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return sprintf('%s/%s', $this->getBaseUri(), ltrim($path, '/'));
    }

    private function extractRelativePath(?string $urlOrPath): ?string
    {
        if (!$urlOrPath) {
            return null;
        }

        $parsed = parse_url($urlOrPath, PHP_URL_PATH);

        return ltrim($parsed ?: $urlOrPath, '/');
    }

    public function getProfile(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    /**
     * PUT /api/account/profile : Mise à jour nom, prénom, username
     */
    public function updateProfile(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var UpdateAccountDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), UpdateAccountDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $cleanUsername = trim($dto->username);
        if ($cleanUsername !== $user->getUsername()) {
            $existing = $this->userRepository->findOneBy(['username' => $cleanUsername]);
            if ($existing && (string) $existing->getId() !== (string) $user->getId()) {
                return $this->sendViolations(['username' => 'Ce nom d\'utilisateur est déjà utilisé.']);
            }
            $user->setUsername($cleanUsername);
        }

        $user->setFirstname($dto->firstname !== null && trim($dto->firstname) !== '' ? trim($dto->firstname) : null);
        $user->setLastname($dto->lastname !== null && trim($dto->lastname) !== '' ? trim($dto->lastname) : null);
        $user->setUpdatedAt($this->now());

        try {
            $this->em->flush();

            return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de la mise à jour du profil',
                    'user_id'   => (string) $user->getId(),
                    'exception' => $e,
                ],
                ['action' => 'account.update.critical_error']
            );

            return $this->sendJson(['message' => 'Erreur interne lors de la mise à jour du profil.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Étape 1 : PUT /api/account/email
     * Ne modifie PAS l'e-mail du User en BDD. Crée un UserRequest (24h) et envoie le lien sur le nouvel e-mail.
     */
    public function changeEmail(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var ChangeEmailDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), ChangeEmailDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $cleanEmail = strtolower(trim($dto->email));
        if ($cleanEmail === strtolower((string) $user->getEmail())) {
            return $this->sendViolations(['email' => 'Cette adresse e-mail est déjà votre adresse actuelle.']);
        }

        $existing = $this->userRepository->findOneBy(['email' => $cleanEmail]);
        if ($existing && (string) $existing->getId() !== (string) $user->getId()) {
            return $this->sendViolations(['email' => 'Cette adresse e-mail est déjà utilisée.']);
        }

        // Sauvegarde de la nouvelle adresse dans UserRequest::$payload (valable 24h = 1440 min)
        $userRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::EmailChange,
            ttlMinutes: 1440,
            isOtp: false,
            payload: ['new_email' => $cleanEmail]
        );

        if (!$userRequest || $userRequest->getToken() === null) {
            return $this->sendJson(
                ['message' => 'Erreur lors de la génération de la demande de changement d\'e-mail.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $confirmationUrl = sprintf(
            '%s/confirm-email-change?token=%s',
            $this->resolveFrontendBaseUrl(),
            urlencode($userRequest->getToken())
        );

        try {
            $this->emailDispatcher->dispatch(new EmailChangeVerificationMailDto(
                newEmail: $cleanEmail,
                recipientName: $this->resolveRecipientName($user),
                confirmationUrl: $confirmationUrl,
                ttlHours: 24,
            ));
        } catch (RecipientUnreachableException) {
            return $this->sendJson(
                ['message' => 'Le domaine de cette nouvelle adresse e-mail ne semble pas pouvoir recevoir d\'e-mails.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        } catch (MailerExceptionInterface) {
            return $this->sendJson(
                ['message' => 'Impossible d\'envoyer l\'e-mail de confirmation pour le moment.'],
                Response::HTTP_BAD_GATEWAY
            );
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de l\'envoi du lien de changement d\'e-mail',
                    'user_id'   => (string) $user->getId(),
                    'exception' => $e,
                ],
                ['action' => 'account.email_change.critical_error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de l\'envoi de l\'e-mail de confirmation.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->sendJson([
            'message' => sprintf(
                'Un lien de validation valable 24h a été envoyé à l\'adresse %s. Votre adresse actuelle reste active tant que vous n\'avez pas cliqué sur ce lien.',
                $cleanEmail
            ),
        ]);
    }

    /**
     * Étape 2 : POST /api/auth/confirm-email-change (route publique, le jeton fait foi)
     * Valide le token du lien et persiste enfin la nouvelle adresse e-mail dans la table user.
     */
    public function confirmEmailChange(Request $request): object
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $token = trim((string) ($data['token'] ?? $request->query->get('token', '')));

        if ($token === '') {
            return $this->sendJson(['message' => 'Le jeton de confirmation est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $userRequest = $this->userRequestService->findValidRequest($token, UserRequestTypeEnum::EmailChange);
        if (!$userRequest) {
            return $this->sendJson(
                ['message' => 'Le lien de confirmation est invalide ou a expiré (délai de 24h dépassé).'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $payload = $userRequest->getPayload() ?? [];
        $newEmail = isset($payload['new_email']) ? strtolower(trim((string) $payload['new_email'])) : '';

        if ($newEmail === '') {
            return $this->sendJson(['message' => 'Données de changement d\'e-mail introuvables.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRequest->getUser();

        // Vérification finale d'unicité au cas où l'adresse aurait été prise dans les 24h
        $existing = $this->userRepository->findOneBy(['email' => $newEmail]);
        if ($existing && (string) $existing->getId() !== (string) $user->getId()) {
            $this->userRequestService->consume($userRequest);

            return $this->sendJson(
                ['message' => 'Cette adresse e-mail est désormais utilisée par un autre compte.'],
                Response::HTTP_CONFLICT
            );
        }

        // Persistance effective dans la table User
        // Le clic sur le lien reçu prouve la possession de la nouvelle adresse
        $user->setEmail($newEmail);
        $user->setEmailVerifiedAt($this->now());
        $user->setUpdatedAt($this->now());

        // Consomme la UserRequest et flush l'ensemble
        $this->userRequestService->consume($userRequest);

        return $this->sendJson(
            [
                'user'    => $user,
                'message' => 'Votre nouvelle adresse e-mail a été validée et enregistrée avec succès.',
            ],
            Response::HTTP_OK,
            context: ['groups' => ['user.read']]
        );
    }

    /**
     * PUT /api/account/password : Mise à jour du mot de passe
     */
    public function changePassword(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $body = $this->secretDecoder->decodeJsonBody($request->getContent(), ['currentPassword', 'newPassword']);
        if ($body === null) {
            return $this->sendJson(['message' => 'Format de données invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            /** @var ChangePasswordDto $dto */
            $dto = $this->serializer->deserialize($body, ChangePasswordDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        if (!$this->hasher->isPasswordValid($user, $dto->currentPassword)) {
            return $this->sendJson(['message' => 'Le mot de passe actuel est incorrect.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->setPassword($this->hasher->hashPassword($user, $dto->newPassword));
        $user->setUpdatedAt($this->now());
        $this->em->flush();

        return $this->sendJson(['message' => 'Mot de passe modifié avec succès.']);
    }

    /**
     * POST /api/account/avatar : Upload et mise à jour de l'avatar utilisateur
     */
    public function updateAvatar(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $uploadedFile = $request->files->get('avatar') ?? $request->files->get('file');
        $dto = new UploadAvatarDto($uploadedFile);

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $oldPath = $this->extractRelativePath($user->getAvatar());

            $uploadResult = $this->uploader
                ->setUploadDirectory('avatars/' . (string) $user->getId())
                ->upload($dto->file, $oldPath);

            $fullAvatarUrl = $this->formatFileUri($uploadResult->relativePath);
            $user->setAvatar($fullAvatarUrl);
            $user->setUpdatedAt($this->now());

            $this->em->flush();

            return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
        } catch (FileUploadException $e) {
            return $this->sendJson(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de l\'upload de l\'avatar',
                    'user_id'   => (string) $user->getId(),
                    'exception' => $e,
                ],
                ['action' => 'account.avatar.update.error']
            );

            return $this->sendJson(['message' => 'Erreur interne lors de la mise à jour de l\'avatar.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/account/delete-request : envoie un code (OTP 10 min) confirmant la suppression du compte.
     * Un nouvel envoi n'est possible qu'après 30 secondes.
     */
    public function requestAccountDeletion(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $response = [
            'message'         => sprintf('Un code de confirmation valable %d minutes a été envoyé à l\'adresse %s.', self::DELETION_CODE_TTL_MINUTES, $user->getEmail()),
            'expiresIn'       => self::DELETION_CODE_TTL_MINUTES * 60,
            'resendAvailable' => self::DELETION_CODE_RESEND_DELAY_SECONDS,
        ];

        $sentItem = $this->cache->getItem('account_deletion_code_sent_' . $user->getId());
        if ($sentItem->isHit()) {
            return $this->sendJson(
                ['message' => sprintf('Un code vient déjà de vous être envoyé. Patientez %d secondes avant d\'en demander un nouveau.', self::DELETION_CODE_RESEND_DELAY_SECONDS)],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $deletionRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::AccountDeletion,
            ttlMinutes: self::DELETION_CODE_TTL_MINUTES,
            isOtp: true
        );

        if ($deletionRequest?->getCode() === null) {
            return $this->sendJson(['message' => 'Erreur lors de la génération du code de confirmation.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        try {
            $this->emailDispatcher->dispatch(new AccountDeletionCodeMailDto(
                recipientEmail: (string) $user->getEmail(),
                recipientName: $this->resolveRecipientName($user),
                code: $deletionRequest->getCode(),
                ttlMinutes: self::DELETION_CODE_TTL_MINUTES,
            ));
        } catch (MailerExceptionInterface) {
            // Déjà journalisé par AbstractMailerHandler
            $this->userRequestService->revokeActiveRequests($user, UserRequestTypeEnum::AccountDeletion);

            return $this->sendJson(['message' => 'Impossible d\'envoyer le code de confirmation pour le moment.'], Response::HTTP_BAD_GATEWAY);
        }

        $this->cache->save($sentItem->set(true)->expiresAfter(self::DELETION_CODE_RESEND_DELAY_SECONDS));
        $this->cache->deleteItem('account_deletion_attempts_' . $user->getId());

        $this->generateLog(
            LoggerLevelEnum::Info,
            ['message' => 'Code de suppression de compte envoyé', 'user_id' => (string) $user->getId()],
            ['action' => 'account.delete.code_sent']
        );

        return $this->sendJson($response);
    }

    /**
     * DELETE /api/account : vérifie le code reçu par e-mail puis supprime le compte et tous ses fichiers.
     * Au-delà de 5 essais erronés, le code est révoqué (un nouveau doit être demandé).
     */
    public function deleteAccount(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $code = is_array($data) ? trim((string) ($data['code'] ?? '')) : '';

        if (!preg_match('/^\d{6}$/', $code)) {
            return $this->sendViolations(['code' => 'Le code de confirmation doit contenir exactement 6 chiffres.']);
        }

        $deletionRequest = $this->userRequestService->findValidRequestForUser($user, $code, UserRequestTypeEnum::AccountDeletion);

        if (!$deletionRequest) {
            $attemptsItem = $this->cache->getItem('account_deletion_attempts_' . $user->getId());
            $attempts = (int) $attemptsItem->get() + 1;
            $this->cache->save($attemptsItem->set($attempts)->expiresAfter(self::DELETION_CODE_TTL_MINUTES * 60));

            if ($attempts >= self::DELETION_CODE_MAX_ATTEMPTS) {
                $this->userRequestService->revokeActiveRequests($user, UserRequestTypeEnum::AccountDeletion);
                $this->generateLog(
                    LoggerLevelEnum::Warning,
                    ['message' => 'Code de suppression de compte révoqué après trop de tentatives', 'user_id' => (string) $user->getId()],
                    ['action' => 'account.delete.code_revoked']
                );

                return $this->sendJson(
                    ['message' => 'Trop de tentatives. Demandez un nouveau code de confirmation.'],
                    Response::HTTP_TOO_MANY_REQUESTS
                );
            }

            return $this->sendJson(['message' => 'Code de confirmation invalide ou expiré.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->userRequestService->consume($deletionRequest);
        $this->cache->deleteItem('account_deletion_attempts_' . $user->getId());

        return $this->performAccountDeletion($user);
    }

    /**
     * Suppression totale du compte et de tous les fichiers physiques sur le disque
     */
    private function performAccountDeletion(User $user): object
    {
        try {
            // 1. Suppression physique de l'avatar sur le disque
            if ($user->getAvatar()) {
                $this->uploader->delete((string) $this->extractRelativePath($user->getAvatar()));
            }

            // 2. Boards partagés : transmis à un autre membre lié, adhésions converties en invités locaux
            $this->accountBoardsCleaner->beforeAccountDeletion($user);

            // 3. Suppression en base de données (cascade sur les demandes UserRequest, le board perso et les tags)
            $this->userRepository->remove($user, true);

            $this->generateLog(
                LoggerLevelEnum::Info,
                ['message' => 'Compte supprimé après confirmation par code', 'user_id' => (string) $user->getId()],
                ['action' => 'account.delete.success']
            );

            return $this->sendNoContent();
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de la suppression du compte',
                    'user_id'   => (string) $user->getId(),
                    'exception' => $e,
                ],
                ['action' => 'account.delete.critical_error']
            );

            return $this->sendJson(['message' => 'Erreur interne lors de la suppression du compte.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function getAuthenticatedUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
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
