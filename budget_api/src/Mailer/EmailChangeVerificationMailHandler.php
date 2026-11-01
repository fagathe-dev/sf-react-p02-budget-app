<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\EmailChangeVerificationMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<EmailChangeVerificationMailDto>
 */
final class EmailChangeVerificationMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/auth/email_change_verification.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return 'Confirmez votre nouvelle adresse e-mail';
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->newEmail, $dto->recipientName)];
    }
}