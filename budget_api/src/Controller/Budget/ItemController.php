<?php

namespace App\Controller\Budget;

use App\Service\Budget\ItemService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/boards/{id}/items', name: 'api_board_item_', requirements: ['id' => Requirement::UUID])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ItemController extends AbstractController
{
    public function __construct(private readonly ItemService $service) {}

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, string $id): JsonResponse
    {
        $res = $this->service->createItem($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Modifier un poste : nouvelle révision à partir de effectiveFrom
     */
    #[Route('/{itemId}', name: 'update', requirements: ['itemId' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $id, string $itemId): JsonResponse
    {
        $res = $this->service->reviseItem($request, $id, $itemId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Activer ou désactiver le poste (simulation), board recalculé pour ?month=AAAA-MM
     */
    #[Route('/{itemId}/toggle', name: 'toggle', requirements: ['itemId' => Requirement::UUID], methods: ['PATCH'])]
    public function toggle(Request $request, string $id, string $itemId): JsonResponse
    {
        $res = $this->service->toggleItem($request, $id, $itemId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{itemId}', name: 'delete', requirements: ['itemId' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(string $id, string $itemId): JsonResponse
    {
        $res = $this->service->deleteItem($id, $itemId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
