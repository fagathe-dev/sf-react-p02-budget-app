<?php

namespace App\Controller\ExpenseSplitter;

use App\Service\ExpenseSplitter\SettlementService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/expense-groups/{id}/settlements', name: 'api_settlement_', requirements: ['id' => Requirement::UUID])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class SettlementController extends AbstractController
{
    public function __construct(private readonly SettlementService $service) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(string $id): JsonResponse
    {
        $res = $this->service->listSettlements($id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * « Marquer comme payé » ou remboursement libre
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, string $id): JsonResponse
    {
        $res = $this->service->recordSettlement($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{settlementId}', name: 'delete', requirements: ['settlementId' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(string $id, string $settlementId): JsonResponse
    {
        $res = $this->service->voidSettlement($id, $settlementId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
