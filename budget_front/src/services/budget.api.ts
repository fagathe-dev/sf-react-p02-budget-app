import {
  AcceptInvitationResponse,
  AddMemberPayload,
  AddMemberResponse,
  BoardEntity,
  BoardListResponse,
  CalculatedBoard,
  CreateBoardPayload,
  CreateItemPayload,
  InvitationPreview,
  InviteMemberPayload,
  InviteMemberResponse,
  PeriodString,
  ReviseItemPayload,
  SetAdjustmentPayload,
  SplitRulePayload,
  Tag,
  TagListResponse,
  TagPayload,
  UpdateBoardPayload,
  UpdateMemberPayload,
} from '@/types/budget.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const BOARDS_BASE_URL = '/boards';
const INVITATIONS_BASE_URL = '/invitations';
const TAGS_BASE_URL = '/tags';

const withMonthQuery = (path: string, month?: PeriodString): string =>
  month ? `${path}?month=${encodeURIComponent(month)}` : path;

// ─────────────────────────────────────────────────────────────────────────────
// Boards (/api/boards)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/boards?month=AAAA-MM : board perso d'abord, puis boards partagés */
export const fetchBoards = async (month?: PeriodString): Promise<BoardListResponse> => {
  const res = await fetchAPI<BoardListResponse>(withMonthQuery(BOARDS_BASE_URL, month));

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement des boards');
  }

  return res.data;
};

/** POST /api/boards : crée un board perso ou partagé et renvoie le board calculé du mois en cours */
export const createBoard = async (payload: CreateBoardPayload): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(BOARDS_BASE_URL, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la création du board');
  }

  return res.data;
};

/** GET /api/boards/{id}?month=AAAA-MM : board calculé pour le mois demandé */
export const fetchBoard = async (boardId: string, month?: PeriodString): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    withMonthQuery(`${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}`, month)
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement du board');
  }

  return res.data;
};

/** PUT /api/boards/{id} : renommer ou modifier les réglages (fusionnés avec l'existant) */
export const updateBoard = async (boardId: string, payload: UpdateBoardPayload): Promise<BoardEntity> => {
  const res = await fetchAPI<BoardEntity>(`${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la mise à jour du board');
  }

  return res.data;
};

/** DELETE /api/boards/{id} : archive le board (interdit sur le board perso) */
export const deleteBoard = async (boardId: string): Promise<void> => {
  const res = await fetchAPI(`${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la suppression du board');
  }
};

/** PUT /api/boards/{id}/split-rule : définit la répartition par défaut du board à partir d'un mois */
export const updateBoardSplitRule = async (
  boardId: string,
  payload: SplitRulePayload
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/split-rule`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification de la répartition');
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Membres (/api/boards/{id}/members)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/boards/{id}/members : ajoute un invité local ou envoie une invitation par e-mail */
export const addBoardMember = async (
  boardId: string,
  payload: AddMemberPayload
): Promise<AddMemberResponse> => {
  const res = await fetchAPI<AddMemberResponse>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/members`,
    {
      method: 'POST',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'ajout du membre");
  }

  return res.data;
};

/** PUT /api/boards/{id}/members/{memberId} : modifie le prénom, le rôle ou la part d'un membre */
export const updateBoardMember = async (
  boardId: string,
  memberId: string,
  payload: UpdateMemberPayload
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification du membre');
  }

  return res.data;
};

/** DELETE /api/boards/{id}/members/{memberId} : retire un membre (statut `left`) */
export const removeBoardMember = async (boardId: string, memberId: string): Promise<void> => {
  const res = await fetchAPI(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du retrait du membre');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Postes (/api/boards/{id}/items)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/boards/{id}/items?month= : crée un poste budgétaire et renvoie le board recalculé */
export const createBoardItem = async (
  boardId: string,
  payload: CreateItemPayload,
  month?: PeriodString
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    withMonthQuery(`${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items`, month),
    {
      method: 'POST',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la création du poste');
  }

  return res.data;
};

/** PUT /api/boards/{id}/items/{itemId}?month= : crée une révision datée du poste */
export const reviseBoardItem = async (
  boardId: string,
  itemId: string,
  payload: ReviseItemPayload,
  month?: PeriodString
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    withMonthQuery(
      `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}`,
      month
    ),
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification du poste');
  }

  return res.data;
};

/** PATCH /api/boards/{id}/items/{itemId}/toggle?month= : active/désactive un poste (simulation) */
export const toggleBoardItem = async (
  boardId: string,
  itemId: string,
  month?: PeriodString
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    withMonthQuery(
      `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}/toggle`,
      month
    ),
    {
      method: 'PATCH',
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'activation ou de la désactivation du poste");
  }

  return res.data;
};

/** DELETE /api/boards/{id}/items/{itemId} : archive le poste */
export const deleteBoardItem = async (boardId: string, itemId: string): Promise<void> => {
  const res = await fetchAPI(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la suppression du poste');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exceptions du mois (/api/boards/{id}/items/{itemId}/months/{AAAA-MM})
// ─────────────────────────────────────────────────────────────────────────────

/** PUT /api/boards/{id}/items/{itemId}/months/{month} : définit une exception pour le mois */
export const setItemAdjustment = async (
  boardId: string,
  itemId: string,
  month: PeriodString,
  payload: SetAdjustmentPayload
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}/months/${encodeURIComponent(month)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'enregistrement de l'exception du mois");
  }

  return res.data;
};

/** DELETE /api/boards/{id}/items/{itemId}/months/{month} : supprime l'exception (retour à la règle) */
export const removeItemAdjustment = async (
  boardId: string,
  itemId: string,
  month: PeriodString
): Promise<CalculatedBoard> => {
  const res = await fetchAPI<CalculatedBoard>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/items/${encodeURIComponent(itemId)}/months/${encodeURIComponent(month)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du retour à la règle');
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Invitations (/api/boards/{id}/invitations & /api/invitations/{token})
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/boards/{id}/invitations : crée une invitation par e-mail ou par lien partageable */
export const createBoardInvitation = async (
  boardId: string,
  payload: InviteMemberPayload
): Promise<InviteMemberResponse> => {
  const res = await fetchAPI<InviteMemberResponse>(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/invitations`,
    {
      method: 'POST',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de la création de l'invitation");
  }

  return res.data;
};

/** DELETE /api/boards/{id}/invitations/{invitationId} : révoque une invitation en attente */
export const revokeBoardInvitation = async (boardId: string, invitationId: string): Promise<void> => {
  const res = await fetchAPI(
    `${BOARDS_BASE_URL}/${encodeURIComponent(boardId)}/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de la révocation de l'invitation");
  }
};

/** GET /api/invitations/{token} : aperçu public d'une invitation avant acceptation */
export const fetchInvitationPreview = async (token: string): Promise<InvitationPreview> => {
  const res = await fetchAPI<InvitationPreview>(`${INVITATIONS_BASE_URL}/${encodeURIComponent(token)}`);

  if (!res.ok) {
    throw toApiError(res, 'Invitation introuvable ou expirée');
  }

  return res.data;
};

/** POST /api/invitations/{token}/accept : accepte l'invitation et rattache le compte connecté */
export const acceptInvitation = async (token: string): Promise<AcceptInvitationResponse> => {
  const res = await fetchAPI<AcceptInvitationResponse>(
    `${INVITATIONS_BASE_URL}/${encodeURIComponent(token)}/accept`,
    {
      method: 'POST',
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Impossible d'accepter cette invitation");
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tags (/api/tags)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/tags?boardId= : liste les tags personnels ou ceux d'un board */
export const fetchTags = async (boardId?: string): Promise<TagListResponse> => {
  const endpoint = boardId
    ? `${TAGS_BASE_URL}?boardId=${encodeURIComponent(boardId)}`
    : TAGS_BASE_URL;
  const res = await fetchAPI<TagListResponse>(endpoint);

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement des tags');
  }

  return res.data;
};

/** POST /api/tags : crée un tag personnel ou de board (13 tags max par propriétaire) */
export const createTag = async (payload: TagPayload): Promise<Tag> => {
  const res = await fetchAPI<Tag>(TAGS_BASE_URL, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la création du tag');
  }

  return res.data;
};

/** PUT /api/tags/{tagId} : renomme ou change la couleur d'un tag */
export const updateTag = async (tagId: string, payload: TagPayload): Promise<Tag> => {
  const res = await fetchAPI<Tag>(`${TAGS_BASE_URL}/${encodeURIComponent(tagId)}`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification du tag');
  }

  return res.data;
};

/** DELETE /api/tags/{tagId} : supprime un tag */
export const deleteTag = async (tagId: string): Promise<void> => {
  const res = await fetchAPI(`${TAGS_BASE_URL}/${encodeURIComponent(tagId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la suppression du tag');
  }
};
