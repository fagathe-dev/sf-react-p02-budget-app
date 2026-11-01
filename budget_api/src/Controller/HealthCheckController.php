<?php

declare(strict_types=1);

namespace App\Controller;

use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Throwable;

final class HealthCheckController extends AbstractController
{
    use DatetimeTrait;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {}

    #[Route('/health-check', name: 'health_check', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $startTime = microtime(true);
        $dbStatus = 'healthy';
        $dbLatencyMs = null;

        try {
            $dbStart = microtime(true);
            $this->entityManager->getConnection()->executeQuery('SELECT 1');
            $dbLatencyMs = round((microtime(true) - $dbStart) * 1000, 2);
        } catch (Throwable) {
            $dbStatus = 'unhealthy';
        }

        $projectDir = (string) $this->getParameter('kernel.project_dir');
        $varWritable = is_writable($projectDir . '/var');

        $isHealthy = $dbStatus === 'healthy' && $varWritable;

        return $this->json([
            'status'    => $isHealthy ? 'ok' : 'degraded',
            'timestamp' => $this->now()->format(DateTimeInterface::ATOM),
            'service'   => 'budget-api',
            'version'   => '1.0.0',
            'checks'    => [
                'database' => [
                    'status'     => $dbStatus,
                    'latency_ms' => $dbLatencyMs,
                ],
                'storage'  => [
                    'var_writable' => $varWritable,
                ],
            ],
            'system'    => [
                'php_version'     => PHP_VERSION,
                'environment'     => $this->getParameter('kernel.environment'),
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'response_ms'     => round((microtime(true) - $startTime) * 1000, 2),
            ],
        ], $isHealthy ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
