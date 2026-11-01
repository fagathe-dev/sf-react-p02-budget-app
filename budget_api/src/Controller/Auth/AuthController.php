<?php

namespace App\Controller\Auth;

use App\Service\AccountService;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Routes publiques d'authentification (voir access_control : ^/api/auth/ en PUBLIC_ACCESS)
 */
#[Route('/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $service,
        private readonly AccountService $accountService,
    ) {}

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $res = $this->service->login($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Connexion sans mot de passe, étape 1 : envoi du code temporaire par e-mail
     */
    #[Route('/login-code', name: 'login_code_request', methods: ['POST'])]
    public function requestLoginCode(Request $request): JsonResponse
    {
        $res = $this->service->requestLoginCode($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Connexion sans mot de passe, étape 2 : identifiant + code
     */
    #[Route('/login-code/verify', name: 'login_code_verify', methods: ['POST'])]
    public function loginWithCode(Request $request): JsonResponse
    {
        $res = $this->service->loginWithCode($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $res = $this->service->register($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Lien de vérification reçu à l'inscription : active le compte et renvoie un JWT
     */
    #[Route('/verify-email', name: 'verify_email', methods: ['POST'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $res = $this->service->verifyEmail($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/resend-verification', name: 'resend_verification', methods: ['POST'])]
    public function resendVerification(Request $request): JsonResponse
    {
        $res = $this->service->resendVerification($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/forgot-password', name: 'forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $res = $this->service->forgotPassword($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/reset-password', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $res = $this->service->resetPassword($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Validation du lien reçu sur la nouvelle adresse (le jeton fait foi)
     */
    #[Route('/confirm-email-change', name: 'confirm_email_change', methods: ['POST'])]
    public function confirmEmailChange(Request $request): JsonResponse
    {
        $res = $this->accountService->confirmEmailChange($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
