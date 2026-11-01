<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\ForgotPasswordMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<ForgotPasswordMailDto>
 */
final class ForgotPasswordMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/auth/forgot_password.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return 'Réinitialisation de votre mot de passe';
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
