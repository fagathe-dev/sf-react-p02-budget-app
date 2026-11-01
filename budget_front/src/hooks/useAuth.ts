import { useAuthStore } from '@/stores/auth.store';
import { RoleEnum, User } from '@/types/auth.types';
import { isTokenValid } from '@/utils/jwt';
import { getPrimaryRole, getRoleLabel } from '@/utils/role';

export interface UseAuthReturn {
  isAuth: boolean;
  user: User | null;
  role?: RoleEnum;
  isAdmin: boolean;
  roleLabel: string;
  isLoading: boolean;
  token: string | null;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { token, user, isLoading, logout } = useAuthStore();

  const isTokenActive = isTokenValid(token);
  const isAuth = Boolean(token && isTokenActive && user);
  const role = user?.role;
  const isAdmin = getPrimaryRole(role) === 'ROLE_ADMIN';
  const roleLabel = getRoleLabel(role);

  return {
    isAuth,
    user,
    role,
    isAdmin,
    roleLabel,
    isLoading,
    token,
    logout,
  };
};

// Export alias direct si tu souhaites importer spécifiquement "useIsAuth"
export const useIsAuth = useAuth;
