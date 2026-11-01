<?php

namespace App\Controller\Budget;

use App\Service\Budget\InvitationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route(name: 'api_invitation_')]
final class InvitationController extends AbstractController
{
    private const TOKEN = '[A-Za-z0-9_-]{8,128}';

    public function __construct(private readonly InvitationService $service) {}

    /**
     * Inviter par e-mail ou créer un lien d'invitation (board partagé ou groupe de dépenses)
     */
    #[Route('/boards/{id}/invitations', name: 'create', requirements: ['id' => Requirement::UUID], methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, string $id): JsonResponse
    {
        $res = $this->service->invite($request, $id);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/boards/{id}/invitations/{invitationId}', name: 'revoke', requirements: ['id' => Requirement::UUID, 'invitationId' => Requirement::UUID], methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function revoke(string $id, string $invitationId): JsonResponse
    {
        $res = $this->service->revoke($id, $invitationId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Aperçu public avant acceptation : nom du board, qui invite, expiration
     */
    #[Route('/invitations/{token}', name: 'preview', requirements: ['token' => self::TOKEN], methods: ['GET'])]
    public function preview(string $token): JsonResponse
    {
        $res = $this->service->preview($token);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Accepter : la part remonte dans le board perso de l'utilisateur connecté
     */
    #[Route('/invitations/{token}/accept', name: 'accept', requirements: ['token' => self::TOKEN], methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function accept(string $token): JsonResponse
    {
        $res = $this->service->accept($token);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
