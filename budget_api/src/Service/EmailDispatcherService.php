<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\Mail\AccountDeletionCodeMailDto;
use App\Dto\Mail\AccountVerificationMailDto;
use App\Dto\Mail\AdminAccountCreatedMailDto;
use App\Dto\Mail\BoardInvitationMailDto;
use App\Dto\Mail\EmailChangeVerificationMailDto;
use App\Dto\Mail\ForgotPasswordMailDto;
use App\Dto\Mail\OtpVerificationMailDto;
use App\Dto\Mail\RegistrationConfirmedMailDto;
use App\Mailer\AccountDeletionCodeMailHandler;
use App\Mailer\AccountVerificationMailHandler;
use App\Mailer\AdminAccountCreatedMailHandler;
use App\Mailer\BoardInvitationMailHandler;
use App\Mailer\EmailChangeVerificationMailHandler;
use App\Mailer\ForgotPasswordMailHandler;
use App\Mailer\OtpVerificationMailHandler;
use App\Mailer\RegistrationConfirmedMailHandler;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Fagathe\CorePhp\Trait\LoggerTrait;
use InvalidArgumentException;
use Psr\Container\ContainerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\AutowireLocator;
use Throwable;

final readonly class EmailDispatcherService
{
    use LoggerTrait;

    /**
     * @var array<class-string, class-string<AbstractMailerHandler>>
     */
    private const HANDLER_MAP = [
        AccountDeletionCodeMailDto::class     => AccountDeletionCodeMailHandler::class,
        AccountVerificationMailDto::class     => AccountVerificationMailHandler::class,
        AdminAccountCreatedMailDto::class     => AdminAccountCreatedMailHandler::class,
        BoardInvitationMailDto::class         => BoardInvitationMailHandler::class,
        EmailChangeVerificationMailDto::class => EmailChangeVerificationMailHandler::class,
        ForgotPasswordMailDto::class          => ForgotPasswordMailHandler::class,
        OtpVerificationMailDto::class         => OtpVerificationMailHandler::class,
        RegistrationConfirmedMailDto::class   => RegistrationConfirmedMailHandler::class,
    ];

    public function __construct(
        #[AutowireLocator(self::HANDLER_MAP)]
        private ContainerInterface $handlersLocator,
    ) {}

    /**
     * @throws MailerExceptionInterface
     */
    public function dispatch(object $dto): void
    {
        $this->resolveHandler($dto)->send($dto);
    }

    /**
     * Envoi non bloquant : aucun échec (configuration, transport…) ne remonte à l'appelant.
     */
    public function dispatchSilently(object $dto): bool
    {
        try {
            $this->resolveHandler($dto)->send($dto);

            return true;
        } catch (MailerExceptionInterface) {
            // Déjà journalisé par AbstractMailerHandler
            return false;
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Échec inattendu lors de l\'envoi silencieux d\'un e-mail',
                    'data'      => ['dto' => $dto::class],
                    'exception' => $e,
                ],
                ['action' => 'mailer.dispatch_silently.error']
            );

            return false;
        }
    }

    public function createEmail(object $dto): TemplatedEmail
    {
        return $this->resolveHandler($dto)->createEmail($dto);
    }

    /**
     * @return AbstractMailerHandler<object>
     */
    private function resolveHandler(object $dto): AbstractMailerHandler
    {
        $dtoClass = $dto::class;

        if (!$this->handlersLocator->has($dtoClass)) {
            throw new InvalidArgumentException(sprintf(
                'Aucun MailerHandler configuré dans %s pour le DTO "%s".',
                self::class,
                $dtoClass
            ));
        }

        /** @var AbstractMailerHandler<object> $handler */
        $handler = $this->handlersLocator->get($dtoClass);

        return $handler;
    }
}