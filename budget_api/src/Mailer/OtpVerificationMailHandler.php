<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\OtpVerificationMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<OtpVerificationMailDto>
 */
final class OtpVerificationMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/auth/otp_verification.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return sprintf('Votre code de vérification : %s', $dto->otpCode);
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }

    protected function getContext(object $dto): array
    {
        return [
            'dto'         => $dto,
            'generatedAt' => new \DateTimeImmutable(),
        ];
    }
}
