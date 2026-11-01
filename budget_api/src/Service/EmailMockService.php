<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\Mail\AccountDeletionCodeMailDto;
use App\Dto\Mail\AccountVerificationMailDto;
use App\Dto\Mail\AdminAccountCreatedMailDto;
use App\Dto\Mail\BoardInvitationMailDto;
use App\Dto\Mail\EmailChangeVerificationMailDto;
use App\Dto\Mail\ForgotPasswordMailDto;
use App\Dto\Mail\OtpVerificationMailDto;
use App\Dto\Mail\RegistrationConfirmedMailDto;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mime\Address;

/**
 * Génère des DTO d'e-mails factices pour la prévisualisation des templates (aucun envoi).
 */
final readonly class EmailMockService
{
    private const RECIPIENT_EMAIL = 'jane.doe@example.com';
    private const RECIPIENT_NAME = 'Jane Doe';
    private const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

    /**
     * @var array<string, array{label: string, description: string}>
     */
    private const PREVIEWS = [
        'account-verification' => [
            'label'       => 'Vérification du compte',
            'description' => 'Lien d\'activation envoyé à l\'inscription.',
        ],
        'otp-verification' => [
            'label'       => 'Code de connexion',
            'description' => 'Code à 6 chiffres (1 min 30) pour la connexion sans mot de passe.',
        ],
        'registration-confirmed' => [
            'label'       => 'Bienvenue',
            'description' => 'Confirmation envoyée une fois l\'adresse e-mail vérifiée.',
        ],
        'forgot-password' => [
            'label'       => 'Mot de passe oublié',
            'description' => 'Lien de réinitialisation du mot de passe.',
        ],
        'email-change-verification' => [
            'label'       => 'Changement d\'e-mail',
            'description' => 'Lien de confirmation envoyé sur la nouvelle adresse.',
        ],
        'account-deletion-code' => [
            'label'       => 'Suppression de compte',
            'description' => 'Code à 6 chiffres (10 min) confirmant la suppression définitive du compte.',
        ],
        'admin-account-created' => [
            'label'       => 'Compte administrateur créé',
            'description' => 'Récapitulatif et lien de changement de mot de passe (core-php:create-admin-user).',
        ],
        'board-invitation' => [
            'label'       => 'Invitation dans un board',
            'description' => 'Lien (7 jours) pour rejoindre un board partagé ou un groupe de dépenses.',
        ],
    ];

    public function __construct(
        private EmailDispatcherService $emailDispatcher,
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private ?string $frontendUrl = null,
    ) {}

    /**
     * @return list<array{slug: string, label: string, description: string, subject: string|null, from: list<array{name: string|null, email: string}>, to: list<array{name: string|null, email: string}>}>
     */
    public function getPreviews(): array
    {
        $previews = [];

        foreach (self::PREVIEWS as $slug => $meta) {
            $email = $this->createEmail($slug);

            $previews[] = [
                'slug'    => $slug,
                ...$meta,
                'subject' => $email?->getSubject(),
                'from'    => $this->formatAddresses($email?->getFrom() ?? []),
                'to'      => $this->formatAddresses($email?->getTo() ?? []),
            ];
        }

        return $previews;
    }

    /**
     * Construit l'e-mail (template + contexte) sans l'envoyer, ou null si le slug est inconnu.
     */
    public function createEmail(string $slug): ?TemplatedEmail
    {
        $dto = $this->createMock($slug);

        return $dto !== null ? $this->emailDispatcher->createEmail($dto) : null;
    }

    public function createMock(string $slug): ?object
    {
        $baseUrl = rtrim($this->frontendUrl ?: self::DEFAULT_FRONTEND_URL, '/');
        $token = bin2hex(random_bytes(32));

        return match ($slug) {
            'account-verification' => new AccountVerificationMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                verificationUrl: sprintf('%s/verify-email?token=%s', $baseUrl, $token),
                ttlHours: 72,
            ),
            'otp-verification' => new OtpVerificationMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                otpCode: (string) random_int(100000, 999999),
                purposeLabel: 'vous connecter',
                validityLabel: '1 min 30',
            ),
            'registration-confirmed' => new RegistrationConfirmedMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                loginUrl: sprintf('%s/login', $baseUrl),
            ),
            'forgot-password' => new ForgotPasswordMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                resetUrl: sprintf('%s/reset-password?token=%s', $baseUrl, $token),
                ttlHours: 24,
            ),
            'email-change-verification' => new EmailChangeVerificationMailDto(
                newEmail: 'jane.new@example.com',
                recipientName: self::RECIPIENT_NAME,
                confirmationUrl: sprintf('%s/confirm-email-change?token=%s', $baseUrl, $token),
                ttlHours: 24,
            ),
            'account-deletion-code' => new AccountDeletionCodeMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                code: (string) random_int(100000, 999999),
                ttlMinutes: 10,
            ),
            'admin-account-created' => new AdminAccountCreatedMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                username: 'jane.admin',
                plainPassword: 'MotDePasse123',
                roleLabel: 'Administrateur',
                loginUrl: sprintf('%s/login', $baseUrl),
                changePasswordUrl: sprintf('%s/reset-password?token=%s', $baseUrl, $token),
                createdAt: new \DateTimeImmutable(),
            ),
            'board-invitation' => new BoardInvitationMailDto(
                recipientEmail: self::RECIPIENT_EMAIL,
                recipientName: self::RECIPIENT_NAME,
                inviterName: 'Frédérick',
                boardName: 'Appartement',
                boardTypeLabel: 'Board partagé',
                acceptUrl: sprintf('%s/invitations/%s', $baseUrl, $token),
                expiresAt: new \DateTimeImmutable('+7 days'),
            ),
            default => null,
        };
    }

    /**
     * @param Address[] $addresses
     *
     * @return list<array{name: string|null, email: string}>
     */
    private function formatAddresses(array $addresses): array
    {
        return array_values(array_map(
            static fn (Address $address): array => [
                'name'  => $address->getName() !== '' ? $address->getName() : null,
                'email' => $address->getAddress(),
            ],
            $addresses
        ));
    }
}
