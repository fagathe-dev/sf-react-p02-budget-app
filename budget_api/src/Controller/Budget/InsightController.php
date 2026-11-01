<?php

namespace App\Controller\Budget;

use App\Insight\InsightService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/insights', name: 'api_insight_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class InsightController extends AbstractController
{
    public function __construct(private readonly InsightService $service) {}

    /**
     * Page d'accueil : KPI, insights, postes à venir et boards partagés (?month=AAAA-MM)
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $res = $this->service->getInsights($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
