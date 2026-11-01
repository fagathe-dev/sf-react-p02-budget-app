<?php

namespace App\Controller\Budget;

use App\Service\Budget\MemberService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/boards/{id}/members', name: 'api_board_member_', requirements: ['id' => Requirement::UUID])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class MemberController extends AbstractController
{
    public function __construct(private readonly MemberService $service) {}

    /**
     * Ajouter un membre : un prénom (invité local) ou l'e-mail d'un inscrit
     */
    #[Route('', name: 'add', methods: ['POST'])]
    public function add(Request $request, string $id): JsonResponse
    {
        $res = $this->service->addMember($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Modifier un membre : prénom, rôle, part ({ shareBasisPoints, effectiveFrom })
     */
    #[Route('/{memberId}', name: 'update', requirements: ['memberId' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $id, string $memberId): JsonResponse
    {
        $res = $this->service->updateMember($request, $id, $memberId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{memberId}', name: 'remove', requirements: ['memberId' => Requirement::UUID], methods: ['DELETE'])]
    public function remove(string $id, string $memberId): JsonResponse
    {
        $res = $this->service->removeMember($id, $memberId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
