<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Dto\Budget\TagDto;
use App\Entity\Board;
use App\Entity\Tag;
use App\Entity\User;
use App\Enum\Budget\ColorEnum;
use App\Repository\BoardRepository;
use App\Repository\TagRepository;
use App\Security\Voter\BoardVoter;
use App\Security\Voter\OwnerVoter;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

/**
 * Tags & catégories : tags personnels, ou tags d'un board partagé visibles par tous ses membres.
 * Une couleur par tag, donc 13 tags au plus par propriétaire.
 */
final class TagService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly TagRepository $tagRepository,
    ) {}

    /**
     * GET /api/tags?boardId= : mes tags, ou ceux d'un board.
     */
    public function listTags(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $boardId = $request->query->get('boardId');
        if ($boardId !== null && $boardId !== '') {
            $board = $this->findGrantedBoard($boardId, BoardVoter::VIEW);
            if (!$board instanceof Board) {
                return $board;
            }

            return $this->sendJson(['tags' => $this->tagRepository->findByBoard($board)], context: ['groups' => ['tag.read']]);
        }

        return $this->sendJson(['tags' => $this->tagRepository->findByOwner($user)], context: ['groups' => ['tag.read']]);
    }

    /**
     * POST /api/tags
     */
    public function createTag(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $dto = $this->deserializeDto($request->getContent(), TagDto::class);
        if (!$dto instanceof TagDto) {
            return $dto;
        }

        $owner = $user;
        if ($dto->boardId !== null) {
            $owner = $this->findGrantedBoard($dto->boardId, BoardVoter::EDIT);
            if (!$owner instanceof Board) {
                return $owner;
            }
        }

        if ($this->tagRepository->countForOwner($owner) >= Tag::MAX_PER_OWNER) {
            return $this->sendViolations(['name' => sprintf('Vous avez atteint la limite de %d tags.', Tag::MAX_PER_OWNER)]);
        }

        $color = ColorEnum::from($dto->color);
        if ($this->tagRepository->findOneByOwnerAndColor($owner, $color) !== null) {
            return $this->sendViolations(['color' => 'Cette couleur est déjà utilisée par un autre tag.']);
        }

        try {
            $tag = $owner instanceof User ? new Tag(owner: $owner) : new Tag(ownerBoard: $owner);
            $tag->setName(trim($dto->name))->setColor($color);
            $this->tagRepository->save($tag, isCreation: true);

            return $this->sendJson($tag, Response::HTTP_CREATED, context: ['groups' => ['tag.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la création du tag.', 'tag.create.error', $e);
        }
    }

    /**
     * PUT /api/tags/{tagId} : renommer, changer de couleur.
     */
    public function updateTag(Request $request, string $tagId): object
    {
        $tag = $this->findEditableTag($tagId);
        if (!$tag instanceof Tag) {
            return $tag;
        }

        $dto = $this->deserializeDto($request->getContent(), TagDto::class);
        if (!$dto instanceof TagDto) {
            return $dto;
        }

        $color = ColorEnum::from($dto->color);
        $sameColor = $this->tagRepository->findOneByOwnerAndColor($tag->getOwner() ?? $tag->getOwnerBoard(), $color);
        if ($sameColor !== null && (string) $sameColor->getId() !== (string) $tag->getId()) {
            return $this->sendViolations(['color' => 'Cette couleur est déjà utilisée par un autre tag.']);
        }

        try {
            $this->tagRepository->save($tag->setName(trim($dto->name))->setColor($color));

            return $this->sendJson($tag, context: ['groups' => ['tag.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la modification du tag.', 'tag.update.error', $e, ['tag_id' => $tagId]);
        }
    }

    /**
     * DELETE /api/tags/{tagId} : les postes et dépenses perdent simplement ce tag.
     */
    public function deleteTag(string $tagId): object
    {
        $tag = $this->findEditableTag($tagId);
        if (!$tag instanceof Tag) {
            return $tag;
        }

        try {
            $this->tagRepository->remove($tag);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la suppression du tag.', 'tag.delete.error', $e, ['tag_id' => $tagId]);
        }
    }

    /**
     * @return Tag|object le tag, ou la réponse d'erreur (404 / 403)
     */
    private function findEditableTag(string $tagId): object
    {
        $tag = $this->tagRepository->find($tagId);

        if (!$tag instanceof Tag) {
            return $this->notFoundResponse('Tag introuvable.');
        }

        $granted = $tag->getOwnerBoard() !== null
            ? $this->security->isGranted(BoardVoter::EDIT, $tag->getOwnerBoard())
            : $this->security->isGranted(OwnerVoter::EDIT, $tag);

        return $granted ? $tag : $this->sendForbidden('Vous ne pouvez pas modifier ce tag.');
    }
}
