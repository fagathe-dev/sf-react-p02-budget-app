<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\AdminAccountCreatedMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<AdminAccountCreatedMailDto>
 */
final class AdminAccountCreatedMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/admin/account_created.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return 'Votre compte administrateur a été créé';
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
