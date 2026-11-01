<?php

namespace App\Controller\Budget;

use App\Service\Budget\AdjustmentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route(
    '/boards/{id}/items/{itemId}/months/{month}',
    name: 'api_board_adjustment_',
    requirements: ['id' => Requirement::UUID, 'itemId' => Requirement::UUID, 'month' => '\d{4}-(0[1-9]|1[0-2])']
)]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class AdjustmentController extends AbstractController
{
    public function __construct(private readonly AdjustmentService $service) {}

    /**
     * Exception du mois : compter, ne pas compter ou montant réel ({ type, amountCents, note })
     */
    #[Route('', name: 'set', methods: ['PUT'])]
    public function set(Request $request, string $id, string $itemId, string $month): JsonResponse
    {
        $res = $this->service->setAdjustment($request, $id, $itemId, $month);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Revenir à la règle
     */
    #[Route('', name: 'remove', methods: ['DELETE'])]
    public function remove(string $id, string $itemId, string $month): JsonResponse
    {
        $res = $this->service->removeAdjustment($id, $itemId, $month);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
