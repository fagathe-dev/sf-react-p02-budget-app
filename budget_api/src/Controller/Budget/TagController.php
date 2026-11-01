<?php

namespace App\Controller\Budget;

use App\Service\Budget\TagService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/tags', name: 'api_tag_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class TagController extends AbstractController
{
    public function __construct(private readonly TagService $service) {}

    /**
     * Mes tags, ou ceux d'un board partagé (?boardId=)
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $res = $this->service->listTags($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->createTag($request);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{tagId}', name: 'update', requirements: ['tagId' => Requirement::UUID], methods: ['PUT'])]
    public function update(Request $request, string $tagId): JsonResponse
    {
        $res = $this->service->updateTag($request, $tagId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{tagId}', name: 'delete', requirements: ['tagId' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(string $tagId): JsonResponse
    {
        $res = $this->service->deleteTag($tagId);
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
