<?php

declare(strict_types=1);

namespace App\Dto\Mail;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class OtpVerificationMailDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'L\'adresse e-mail du destinataire est obligatoire.')]
        #[Assert\Email(message: 'L\'adresse e-mail est invalide.')]
        public string $recipientEmail,

        #[Assert\NotBlank(message: 'Le nom d\'affichage est obligatoire.')]
        public string $recipientName,

        #[Assert\NotBlank(message: 'Le code OTP est obligatoire.')]
        #[Assert\Regex(pattern: '/^\d{6}$/', message: 'Le code OTP doit contenir exactement 6 chiffres.')]
        public string $otpCode,

        #[Assert\Positive]
        public int $ttlMinutes = 15,

        public string $purposeLabel = 'vérifier votre adresse e-mail',

        /** Durée lisible prioritaire sur $ttlMinutes (ex: "1 min 30") */
        public ?string $validityLabel = null,
    ) {}
}
