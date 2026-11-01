<?php

namespace App\Controller\ExpenseSplitter;

use App\Service\ExpenseSplitter\BalanceService;
use App\Service\ExpenseSplitter\ExpenseGroupService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Les participants se gèrent par /api/boards/{id}/members et /api/boards/{id}/invitations (un groupe est un Board).
 */
#[Route('/expense-groups', name: 'api_expense_group_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ExpenseGroupController extends AbstractController
{
    public function __construct(
        private readonly ExpenseGroupService $service,
        private readonly BalanceService $balanceService,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $res = $this->service->listGroups();
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->createGroup($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::UUID], methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $res = $this->service->getGroup($id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $id): JsonResponse
    {
        $res = $this->service->updateGroup($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Clôturer le groupe (archivage)
     */
    #[Route('/{id}', name: 'close', requirements: ['id' => Requirement::UUID], methods: ['DELETE'])]
    public function close(string $id): JsonResponse
    {
        $res = $this->service->closeGroup($id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Soldes et virements proposés
     */
    #[Route('/{id}/balances', name: 'balances', requirements: ['id' => Requirement::UUID], methods: ['GET'])]
    public function balances(string $id): JsonResponse
    {
        $res = $this->balanceService->getBalances($id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
