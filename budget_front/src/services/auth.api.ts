import {
  AccountDeletionRequestResponse,
  AuthResponse,
  ChangeEmailPayload,
  ChangePasswordPayload,
  ConfirmEmailChangeResponse,
  LoginCodePayload,
  LoginCodeRequestResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
} from '@/types/auth.types';
import { encodeSecret } from '@/utils';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const AUTH_BASE_URL = '/auth';
const ACCOUNT_BASE_URL = '/account';

// ─────────────────────────────────────────────────────────────────────────────
// Auth (/auth)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchRegister = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const res = await fetchAPI<RegisterResponse>(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    body: { ...payload, password: encodeSecret(payload.password) },
  });

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'inscription");
  }

  return res.data;
};

export const fetchLogin = async (credentials: LoginPayload): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    body: { ...credentials, password: encodeSecret(credentials.password) },
  });

  if (!res.ok) {
    throw toApiError(res, 'Identifiants invalides');
  }

  return res.data;
};

/** Connexion sans mot de passe, étape 1 : envoi d'un code temporaire par e-mail */
export const requestLoginCode = async (username: string): Promise<LoginCodeRequestResponse> => {
  const res = await fetchAPI<LoginCodeRequestResponse>(`${AUTH_BASE_URL}/login-code`, {
    method: 'POST',
    body: { username },
  });

  if (!res.ok) {
    throw toApiError(res, "Impossible d'envoyer le code de connexion");
  }

  return res.data;
};

/** Connexion sans mot de passe, étape 2 : identifiant + code reçu */
export const loginWithCode = async (payload: LoginCodePayload): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/login-code/verify`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Code invalide ou expiré');
  }

  return res.data;
};

/** Lien de vérification reçu à l'inscription : active le compte et renvoie une session */
export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/verify-email`, {
    method: 'POST',
    body: { token },
  });

  if (!res.ok) {
    throw toApiError(res, 'Ce lien de vérification est invalide ou a expiré.');
  }

  return res.data;
};

export const resendVerificationEmail = async (username: string): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/resend-verification`, {
    method: 'POST',
    body: { username },
  });

  if (!res.ok) {
    throw toApiError(res, "Impossible de renvoyer l'e-mail de vérification");
  }

  return res.data;
};

export const requestPasswordReset = async (email: string): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/forgot-password`, {
    method: 'POST',
    body: { email },
  });

  if (!res.ok) {
    throw toApiError(res, 'Impossible de traiter la demande de réinitialisation');
  }

  return res.data;
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/reset-password`, {
    method: 'POST',
    body: { token: payload.token, password: encodeSecret(payload.password) },
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la réinitialisation du mot de passe');
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Account & Profile (/account)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchProfile = async (token?: string): Promise<User> => {
  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error('Session expirée');
  }

  return res.data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/profile`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la mise à jour des informations');
  }

  return res.data;
};

export const updateAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('avatar', file, file.name);

  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de la mise à jour de l'avatar");
  }

  return res.data;
};

/** Étape 1 : envoie un lien de confirmation sur la nouvelle adresse (l'e-mail actuel reste inchangé) */
export const updateEmail = async (payload: ChangeEmailPayload): Promise<{ message: string }> => {
  const res = await fetchAPI<{ message: string }>(`${ACCOUNT_BASE_URL}/email`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de la modification de l'adresse e-mail");
  }

  return res.data;
};

/** Étape 2 : valide le jeton reçu par e-mail (route publique) */
export const confirmEmailChange = async (token: string): Promise<ConfirmEmailChangeResponse> => {
  const res = await fetchAPI<ConfirmEmailChangeResponse>(`${AUTH_BASE_URL}/confirm-email-change`, {
    method: 'POST',
    body: { token },
  });

  if (!res.ok) {
    throw toApiError(res, 'Le lien de confirmation est invalide ou a expiré.');
  }

  return res.data;
};

export const updatePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
  const res = await fetchAPI<{ message: string }>(`${ACCOUNT_BASE_URL}/password`, {
    method: 'PUT',
    body: {
      currentPassword: encodeSecret(payload.currentPassword),
      newPassword: encodeSecret(payload.newPassword),
    },
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification du mot de passe');
  }

  return res.data;
};

/** Suppression du compte, étape 1 : envoi d'un code de confirmation (10 min) par e-mail */
export const requestAccountDeletion = async (): Promise<AccountDeletionRequestResponse> => {
  const res = await fetchAPI<AccountDeletionRequestResponse>(`${ACCOUNT_BASE_URL}/delete-request`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw toApiError(res, "Impossible d'envoyer le code de confirmation");
  }

  return res.data;
};

/** Suppression du compte, étape 2 : suppression définitive avec le code reçu */
export const deleteAccount = async (code: string): Promise<void> => {
  const res = await fetchAPI(`${ACCOUNT_BASE_URL}`, {
    method: 'DELETE',
    body: { code },
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la suppression du compte');
  }
};
