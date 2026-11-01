<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Enum\Auth\RoleEnum;
use App\Service\LogService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Consultation des fichiers de log de l'API (réservé ROLE_ADMIN).
 */
#[Route('/admin/logs', name: 'api_admin_logs_')]
#[IsGranted(RoleEnum::RoleAdmin->value)]
final class LogController extends AbstractController
{
    public function __construct(private readonly LogService $logService) {}

    /**
     * Arborescence des fichiers de log groupés par date
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json($this->logService->getLogTree());
    }

    /**
     * Entrées d'un fichier de log.
     * filePath utilise des points comme séparateurs (ex: service.todo-service)
     */
    #[Route(
        '/{date}/{filePath}',
        name: 'view',
        requirements: ['date' => '\d{2}-\d{2}-\d{4}', 'filePath' => '[\w\-]+(\.[\w\-]+)*'],
        methods: ['GET']
    )]
    public function view(string $date, string $filePath): JsonResponse
    {
        $logs = $this->logService->getLogFileContent($date, $filePath);

        if ($logs === null) {
            return $this->json(['message' => 'Fichier de log introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($logs);
    }
}
