<?php

declare(strict_types=1);

namespace App\Mailer;

use App\Dto\Mail\BoardInvitationMailDto;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<BoardInvitationMailDto>
 */
final class BoardInvitationMailHandler extends AbstractMailerHandler
{
    protected function getTemplate(): string
    {
        return 'emails/budget/board_invitation.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return sprintf('%s vous invite à rejoindre « %s »', $dto->inviterName, $dto->boardName);
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
