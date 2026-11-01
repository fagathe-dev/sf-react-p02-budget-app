<?php

declare(strict_types=1);

namespace App\Dto\Mail;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BoardInvitationMailDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'L\'adresse e-mail du destinataire est obligatoire.')]
        #[Assert\Email(message: 'L\'adresse e-mail est invalide.')]
        public string $recipientEmail,

        #[Assert\NotBlank(message: 'Le nom de la personne invitée est obligatoire.')]
        public string $recipientName,

        #[Assert\NotBlank(message: 'Le nom de la personne qui invite est obligatoire.')]
        public string $inviterName,

        #[Assert\NotBlank(message: 'Le nom du board est obligatoire.')]
        public string $boardName,

        #[Assert\NotBlank(message: 'Le type de board est obligatoire.')]
        public string $boardTypeLabel,

        #[Assert\NotBlank(message: 'Le lien d\'invitation est obligatoire.')]
        #[Assert\Url(message: 'Le lien d\'invitation est invalide.', requireTld: false)]
        public string $acceptUrl,

        public \DateTimeImmutable $expiresAt,
    ) {}
}
