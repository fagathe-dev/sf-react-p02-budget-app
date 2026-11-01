<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Dto\Mail\BoardInvitationMailDto;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\Invitation;
use App\Entity\User;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\InvitationChannelEnum;
use App\Repository\InvitationRepository;
use App\Service\EmailDispatcherService;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Émet une invitation : jeton aléatoire dont seul le hash est stocké, puis e-mail (canal email).
 * Les invitations en attente pour le même membre sont révoquées.
 */
final readonly class InvitationIssuer
{
    use RequestTrait;

    private const TOKEN_BYTES = 32;

    public function __construct(
        private InvitationRepository $invitationRepository,
        private EmailDispatcherService $emailDispatcher,
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private ?string $frontendUrl = null,
    ) {}

    /**
     * @return array{invitation: Invitation, url: string}
     *
     * @throws MailerExceptionInterface l'invitation est alors révoquée
     */
    public function issue(
        Board $board,
        BoardMember $member,
        User $inviter,
        InvitationChannelEnum $channel,
        ?string $email,
        int $maxUses = 1,
        int $ttlDays = 7,
    ): array {
        foreach ($this->invitationRepository->findPendingForMember($member) as $pending) {
            $this->invitationRepository->save($pending->revoke(), flush: false);
        }

        $token = bin2hex(random_bytes(self::TOKEN_BYTES));
        $invitation = (new Invitation())
            ->setBoard($board)
            ->setMember($member)
            ->setInvitedBy($inviter)
            ->setEmail($email)
            ->setChannel($channel)
            ->setTokenHash(Invitation::hashToken($token))
            ->setExpiresAt(new \DateTimeImmutable(sprintf('+%d days', $ttlDays)))
            ->setMaxUses($channel === InvitationChannelEnum::Email ? 1 : $maxUses);

        $this->invitationRepository->save($invitation, isCreation: true);
        $url = sprintf('%s/invitations/%s', $this->resolveFrontendBaseUrl(), $token);

        if ($channel === InvitationChannelEnum::Email && $email !== null) {
            try {
                $this->emailDispatcher->dispatch(new BoardInvitationMailDto(
                    recipientEmail: $email,
                    recipientName: (string) $member->getDisplayName(),
                    inviterName: BoardFactory::displayNameOf($inviter),
                    boardName: (string) $board->getName(),
                    boardTypeLabel: BoardTypeEnum::labelOf($board->getType()),
                    acceptUrl: $url,
                    expiresAt: $invitation->getExpiresAt(),
                ));
            } catch (MailerExceptionInterface $e) {
                $this->invitationRepository->save($invitation->revoke());

                throw $e;
            }
        }

        return ['invitation' => $invitation, 'url' => $url];
    }

    private function resolveFrontendBaseUrl(): string
    {
        if (!empty($this->frontendUrl)) {
            return rtrim($this->frontendUrl, '/');
        }

        return rtrim($this->getOrigin(), '/');
    }
}
