<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\Mail\AdminAccountCreatedMailDto;
use App\Entity\User;
use App\Enum\Auth\RoleEnum;
use App\Enum\Auth\UserRequestTypeEnum;
use App\Repository\UserRepository;
use Fagathe\CorePhp\Command\AdminUserManagerInterface;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

/**
 * Création des administrateurs pour la commande core-php:create-admin-user.
 *
 * L'administrateur est créé vérifié, puis reçoit un e-mail récapitulatif avec un lien (72h)
 * pour choisir son propre mot de passe avant sa première connexion (page /reset-password du front).
 *
 * L'alias est nécessaire : l'interface vit dans core-php, hors de src/, donc Symfony ne la relie pas
 * automatiquement à cette implémentation.
 */
#[AsAlias(AdminUserManagerInterface::class)]
final class AdminUserManager implements AdminUserManagerInterface
{
    use DatetimeTrait, LoggerTrait, RequestTrait;

    /** Validité du lien de changement de mot de passe envoyé à l'administrateur */
    public const PASSWORD_LINK_TTL_HOURS = 72;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly ValidatorInterface $validator,
        private readonly UserRequestService $userRequestService,
        private readonly EmailDispatcherService $emailDispatcher,
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private readonly ?string $frontendUrl = null,
    ) {}

    public function getAdminRoles(): array
    {
        return ['admin' => RoleEnum::RoleAdmin->value];
    }

    public function usernameExists(string $username): bool
    {
        return $this->userRepository->findOneBy(['username' => $username]) !== null;
    }

    public function emailExists(string $email): bool
    {
        return $this->userRepository->findOneBy(['email' => $email]) !== null;
    }

    public function createAdmin(string $username, string $email, string $plainPassword, string $role): void
    {
        $now = $this->now();
        $roleEnum = RoleEnum::tryFrom($role) ?? RoleEnum::RoleAdmin;

        $user = (new User())
            ->setUsername($username)
            ->setEmail($email)
            ->setPassword($plainPassword)
            ->setRole($roleEnum)
            ->setIsVerified(true)
            ->setEmailVerifiedAt($now)
            ->setCreatedAt($now);

        // Mêmes contraintes qu'à l'inscription (complexité du mot de passe en clair, unicité…)
        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            $messages = [];
            foreach ($violations as $violation) {
                $messages[] = $violation->getPropertyPath() . ' : ' . $violation->getMessage();
            }

            throw new \InvalidArgumentException(implode(' ', $messages));
        }

        $user->setPassword($this->hasher->hashPassword($user, $plainPassword));

        if (!$this->userRepository->save($user, isCreation: true)) {
            throw new \RuntimeException('L\'administrateur n\'a pas pu être enregistré en base de données.');
        }

        $this->sendAccountCreatedEmail($user, $plainPassword, $role);
    }

    /**
     * Récapitulatif + lien de changement de mot de passe. Un échec d'envoi ne remet pas en cause
     * la création (le compte existe) : il est journalisé et l'administrateur peut utiliser « Mot de passe oublié ».
     */
    private function sendAccountCreatedEmail(User $user, string $plainPassword, string $role): void
    {
        $passwordRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::PasswordReset,
            ttlMinutes: self::PASSWORD_LINK_TTL_HOURS * 60,
            isOtp: false
        );

        if ($passwordRequest?->getToken() === null) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                ['message' => 'Lien de changement de mot de passe non généré : e-mail administrateur non envoyé', 'data' => ['user_id' => (string) $user->getId()]],
                ['action' => 'admin.account_created.link_error']
            );

            return;
        }

        $baseUrl = $this->resolveFrontendBaseUrl();
        $roleEnum = RoleEnum::tryFrom($role);

        try {
            $this->emailDispatcher->dispatch(new AdminAccountCreatedMailDto(
                recipientEmail: (string) $user->getEmail(),
                recipientName: (string) $user->getUsername(),
                username: (string) $user->getUsername(),
                plainPassword: $plainPassword,
                roleLabel: $roleEnum !== null ? RoleEnum::mapRole($roleEnum) : $role,
                loginUrl: sprintf('%s/login', $baseUrl),
                changePasswordUrl: sprintf('%s/reset-password?token=%s', $baseUrl, urlencode($passwordRequest->getToken())),
                createdAt: $this->now(),
                ttlHours: self::PASSWORD_LINK_TTL_HOURS,
                createdBy: 'command',
            ));
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Administrateur créé mais e-mail récapitulatif non envoyé',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e,
                ],
                ['action' => 'admin.account_created.mail_error']
            );
        }
    }

    private function resolveFrontendBaseUrl(): string
    {
        if (!empty($this->frontendUrl)) {
            return rtrim($this->frontendUrl, '/');
        }

        return rtrim($this->getOrigin(), '/');
    }
}
