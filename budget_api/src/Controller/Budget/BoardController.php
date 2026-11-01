<?php

namespace App\Controller\Budget;

use App\Service\Budget\BoardService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/boards', name: 'api_board_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class BoardController extends AbstractController
{
    public function __construct(private readonly BoardService $service) {}

    /**
     * Mes boards (perso + partagés dont je suis membre) avec leurs totaux du mois (?month=AAAA-MM)
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $res = $this->service->listBoards($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->createBoard($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Board calculé pour un mois (?month=AAAA-MM, mois en cours par défaut)
     */
    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::UUID], methods: ['GET'])]
    public function show(Request $request, string $id): JsonResponse
    {
        $res = $this->service->getBoard($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $id): JsonResponse
    {
        $res = $this->service->updateBoard($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $res = $this->service->deleteBoard($id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Répartition par défaut du board à partir d'un mois ({ strategy, effectiveFrom, entries })
     */
    #[Route('/{id}/split-rule', name: 'split_rule', requirements: ['id' => Requirement::UUID], methods: ['PUT'])]
    public function splitRule(Request $request, string $id): JsonResponse
    {
        $res = $this->service->setSplitRule($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
