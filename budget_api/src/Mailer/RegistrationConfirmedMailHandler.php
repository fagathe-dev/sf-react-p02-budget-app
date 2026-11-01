<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\RegistrationConfirmedMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<RegistrationConfirmedMailDto>
 */
final class RegistrationConfirmedMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/auth/registration_confirmed.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return 'Bienvenue ! Votre compte est maintenant activé';
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
