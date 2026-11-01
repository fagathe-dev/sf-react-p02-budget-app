<?php

declare(strict_types=1);

namespace App\Controller;

use App\Enum\Auth\RoleEnum;
use App\Service\EmailMockService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/emails', name: 'api_admin_emails_')]
#[IsGranted(RoleEnum::RoleAdmin->value)]
final class EmailPreviewerController extends AbstractController
{
    public function __construct(private readonly EmailMockService $emailMockService) {}

    /**
     * Liste des e-mails prévisualisables (alimente le menu du front)
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json($this->emailMockService->getPreviews());
    }

    /**
     * Rendu HTML du template d'e-mail avec des données factices
     */
    #[Route('/{slug}', name: 'preview', requirements: ['slug' => '[a-z-]+'], methods: ['GET'])]
    public function preview(string $slug): Response
    {
        $email = $this->emailMockService->createEmail($slug);

        if ($email === null) {
            throw $this->createNotFoundException(sprintf('Aucun e-mail "%s" à prévisualiser.', $slug));
        }

        return $this->render((string) $email->getHtmlTemplate(), $email->getContext());
    }
}
