<?php

namespace App\Controller\Auth;

use App\Service\AccountService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/account', name: 'api_account_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class AccountController extends AbstractController
{
    public function __construct(private readonly AccountService $service) {}

    #[Route('/profile', name: 'profile', methods: ['GET'])]
    public function profile(): JsonResponse
    {
        $res = $this->service->getProfile();
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/profile', name: 'update_profile', methods: ['PUT', 'PATCH'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $res = $this->service->updateProfile($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/email', name: 'change_email', methods: ['PUT', 'PATCH'])]
    public function changeEmail(Request $request): JsonResponse
    {
        $res = $this->service->changeEmail($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/password', name: 'change_password', methods: ['PUT', 'PATCH'])]
    public function changePassword(Request $request): JsonResponse
    {
        $res = $this->service->changePassword($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/avatar', name: 'update_avatar', methods: ['POST'])]
    public function updateAvatar(Request $request): JsonResponse
    {
        $res = $this->service->updateAvatar($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Étape 1 : envoi du code de confirmation par e-mail
     */
    #[Route('/delete-request', name: 'delete_request', methods: ['POST'])]
    public function requestAccountDeletion(): JsonResponse
    {
        $res = $this->service->requestAccountDeletion();
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Étape 2 : suppression définitive avec le code reçu ({ "code": "123456" })
     */
    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function deleteAccount(Request $request): JsonResponse
    {
        $res = $this->service->deleteAccount($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
