import { RoleEnum } from '@/types/auth.types';

/** Libellés alignés sur RoleEnum::mapRole() côté API */
export const ROLE_LABELS: Record<RoleEnum, string> = {
  ROLE_USER: 'Utilisateur',
  ROLE_ADMIN: 'Administrateur',
};

/** Rôle principal de l'utilisateur (ROLE_USER par défaut) */
export const getPrimaryRole = (role: RoleEnum | null | undefined): RoleEnum =>
  role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER';

export const getRoleLabel = (role: RoleEnum | null | undefined): string => ROLE_LABELS[getPrimaryRole(role)];
