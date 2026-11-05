import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, Badge, Icon } from '@/ui/components';
import { Image } from '@/ui/components';
import { Container } from '@/ui/components';
import {
  Navbar,
  NavbarBrand,
  NavbarDropdown,
  NavbarDropdownDivider,
  NavbarDropdownItem,
  NavbarDropdownMenu,
  NavbarDropdownToggle,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarToggle,
  ThemeModeSwitcher,
} from '@/ui/components';
import { Text } from '@/ui/components';
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';

// ---------------------------------------------------------------------------
// Styles du Layout Dashboard
// ---------------------------------------------------------------------------

const DashboardRoot = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background.body};
  overflow: hidden;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
`;

const ScrollArea = styled.main`
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;

  /* Défilement fluide et discret */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radii.full};
  }
`;

const MainContent = styled(Container)`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing[4]};
  padding-bottom: ${({ theme }) => theme.spacing[6]};
`;

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  text-decoration: none;
  color: inherit;
`;

const AvatarToggle = styled(NavbarDropdownToggle)`
  padding: 0;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;

  &:hover {
    background: transparent;
    opacity: 0.85;
  }
`;

const MenuActionContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[3]};
`;

// Assez large pour afficher les trois segments du sélecteur de thème
const AccountMenu = styled(NavbarDropdownMenu)`
  min-width: 18rem;
`;

const ThemeSetting = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
`;

const UserProfilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2.5]};
  overflow: hidden;
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const RoleBadge = styled(Badge)`
  align-self: flex-start;
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const AccountSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
`;

// ---------------------------------------------------------------------------
// Configuration des menus de la Sidebar
// ---------------------------------------------------------------------------

export interface NavModule {
  label: string;
  path: string;
  icon: string;
}

export const PRIMARY_MODULES: NavModule[] = [
  { label: 'Vue d’ensemble', path: ROUTES.HOME, icon: 'view-dashboard-outline' },
  { label: 'Mes budgets', path: ROUTES.BOARDS, icon: 'wallet-outline' },
  {
    label: 'Dépenses partagées',
    path: ROUTES.EXPENSE_GROUPS,
    icon: 'account-group-outline',
  },
  { label: 'Tags & catégories', path: ROUTES.TAGS, icon: 'tag-multiple-outline' },
];

export const ADMIN_MODULES: NavModule[] = [
  { label: 'E-mails', path: ROUTES.ADMIN_EMAILS, icon: 'email-outline' },
  { label: 'Logs', path: ROUTES.ADMIN_LOGS, icon: 'text-box-search-outline' },
];

// ---------------------------------------------------------------------------
// Composant AppLayout
// ---------------------------------------------------------------------------

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { isAdmin, roleLabel } = useAuth();
  const location = useLocation();

  const isCurrentPath = (path: string) =>
    location.pathname === path ||
    (path !== ROUTES.HOME && location.pathname.startsWith(path));

  return (
    <SidebarProvider breakpoint="md">
      <DashboardRoot>
        {/* ================================================================= */}
        {/* SIDEBAR : Reste fixe à gauche, avec son propre scroll interne     */}
        {/* ================================================================= */}
        <Sidebar width="260px" breakpoint="md">
          <SidebarHeader>
            <BrandLink to={ROUTES.HOME}>
              <Image
                src="/images/logo.webp"
                srcSet="/images/logo.webp"
                width={32}
                alt="Logo de l'application Budget App"
              />
            </BrandLink>
          </SidebarHeader>

          <SidebarNav>
            {PRIMARY_MODULES.length > 0 && (
              <>
                <SidebarSection>Espaces de travail</SidebarSection>
                {PRIMARY_MODULES.map(({ label, path, icon }) => {
                  const active = isCurrentPath(path);
                  return (
                    <SidebarItem key={path}>
                      <SidebarLink
                        as={Link}
                        to={path}
                        active={active}
                        icon={<Icon name={icon} size={18} />}
                        aria-current={active ? 'page' : undefined}
                      >
                        {label}
                      </SidebarLink>
                    </SidebarItem>
                  );
                })}
              </>
            )}

            {isAdmin && (
              <>
                <SidebarSection>Administration</SidebarSection>
                {ADMIN_MODULES.map(({ label, path, icon }) => {
                  const active = isCurrentPath(path);
                  return (
                    <SidebarItem key={path}>
                      <SidebarLink
                        as={Link}
                        to={path}
                        active={active}
                        icon={<Icon name={icon} size={18} />}
                        aria-current={active ? 'page' : undefined}
                      >
                        {label}
                      </SidebarLink>
                    </SidebarItem>
                  );
                })}
              </>
            )}
          </SidebarNav>

          <SidebarFooter>
            <UserProfilePreview>
              <Avatar
                name={user?.username ?? 'Utilisateur'}
                src={user?.avatar ?? undefined}
                size="sm"
              />
              <UserMeta>
                <Text weight="semibold" size="xs" color="tertiary">
                  {user?.username ?? 'Utilisateur'}
                </Text>
                <Text size="xs" color="muted">
                  {user?.email ?? ''}
                </Text>
                <RoleBadge variant={isAdmin ? 'primary' : 'neutral'} pill>
                  {roleLabel}
                </RoleBadge>
              </UserMeta>
            </UserProfilePreview>
          </SidebarFooter>
        </Sidebar>

        {/* ================================================================= */}
        {/* ZONE DE CONTENU : Navbar fixe en haut, ScrollArea seule à défiler */}
        {/* ================================================================= */}
        <ContentArea>
          <Navbar sticky breakpoint="md">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <SidebarToggle />
              <NavbarBrand>
                <Text
                  weight="medium"
                  size="sm"
                  color="tertiary"
                  style={{ paddingInline: 10 }}
                >
                  Mon Espace
                </Text>
              </NavbarBrand>
            </div>

            {/* L'avatar est placé directement ici : visible sur toutes les résolutions */}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <NavbarDropdown>
                <AvatarToggle aria-label="Menu du compte utilisateur">
                  <Avatar
                    name={user?.username ?? 'Utilisateur'}
                    src={user?.avatar ?? undefined}
                    size="base"
                  />
                </AvatarToggle>

                <AccountMenu align="right">
                  <AccountSummary>
                    <UserMeta>
                      <Text weight="semibold" size="sm">
                        {user?.username ?? 'Utilisateur'}
                      </Text>
                      <Text size="xs" color="muted">
                        {user?.email ?? ''}
                      </Text>
                    </UserMeta>
                    <Badge variant={isAdmin ? 'primary' : 'neutral'} pill>
                      {roleLabel}
                    </Badge>
                  </AccountSummary>

                  <NavbarDropdownDivider />

                  <NavbarDropdownItem as={Link} to={ROUTES.PROFILE}>
                    <MenuActionContent>
                      <span>Mon profil</span>
                      <Icon name="account" size={18} />
                    </MenuActionContent>
                  </NavbarDropdownItem>

                  <NavbarDropdownDivider />

                  <ThemeSetting>
                    <Text size="xs" weight="semibold" color="muted">
                      Apparence
                    </Text>
                    <ThemeModeSwitcher fullWidth />
                  </ThemeSetting>

                  <NavbarDropdownDivider />

                  <NavbarDropdownItem as={Link} to={ROUTES.LOGOUT}>
                    <MenuActionContent>
                      <span>Se déconnecter</span>
                      <Icon name="logout" size={18} />
                    </MenuActionContent>
                  </NavbarDropdownItem>
                </AccountMenu>
              </NavbarDropdown>
            </div>
          </Navbar>

          <ScrollArea>
            <MainContent
              fluid
              style={{ maxWidth: 1500, marginInline: 'auto' }}
            >
              <Outlet />
            </MainContent>
          </ScrollArea>
        </ContentArea>
      </DashboardRoot>
    </SidebarProvider>
  );
};
