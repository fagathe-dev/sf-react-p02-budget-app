<?php

namespace App\Controller\ExpenseSplitter;

use App\Service\ExpenseSplitter\ExpenseService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/expense-groups/{id}/expenses', name: 'api_expense_', requirements: ['id' => Requirement::UUID])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ExpenseController extends AbstractController
{
    public function __construct(private readonly ExpenseService $service) {}

    /**
     * Lister (?from=AAAA-MM-JJ&to=AAAA-MM-JJ&tagId=&paidBy=)
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, string $id): JsonResponse
    {
        $res = $this->service->listExpenses($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, string $id): JsonResponse
    {
        $res = $this->service->addExpense($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Corriger : nouvelle dépense qui remplace l'ancienne
     */
    #[Route('/{expenseId}', name: 'update', requirements: ['expenseId' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $id, string $expenseId): JsonResponse
    {
        $res = $this->service->correctExpense($request, $id, $expenseId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Annuler (voidedAt), rien n'est supprimé
     */
    #[Route('/{expenseId}', name: 'delete', requirements: ['expenseId' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(string $id, string $expenseId): JsonResponse
    {
        $res = $this->service->voidExpense($id, $expenseId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
