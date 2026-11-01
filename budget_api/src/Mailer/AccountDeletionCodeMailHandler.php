<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\AccountDeletionCodeMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<AccountDeletionCodeMailDto>
 */
final class AccountDeletionCodeMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/auth/account_deletion_code.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return sprintf('Code de confirmation de suppression de compte : %s', $dto->code);
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
