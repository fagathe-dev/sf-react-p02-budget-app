import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/ui/components';
import { Icon } from '@/ui/components';
import { TabContent, TabList, Tabs, TabTrigger } from '@/ui/components';
import { Text } from '@/ui/components';
import { Title } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';
import {
  ChangeAvatarForm,
  ChangeEmailForm,
  ChangeInformationsForm,
  ChangePasswordForm,
  DeleteAccountCard,
} from './components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 820px;
  width: 100%;
`;

const ProfileBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  flex-wrap: wrap;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { isAdmin, roleLabel } = useAuth();

  if (!user) return null;

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');

  return (
    <PageContainer>
      <Title as="h2">Mon Profil</Title>

      <ProfileBanner>
        <ChangeAvatarForm />
        <div>
          <TitleRow>
            <Title as="h3" style={{ margin: 0 }}>
              {fullName || user.username}
            </Title>
            <Badge variant={isAdmin ? 'primary' : 'neutral'} pill>
              {roleLabel}
            </Badge>
          </TitleRow>
          <Text size="sm" color="muted">
            @{user.username} • {user.email}
          </Text>
        </div>
      </ProfileBanner>

      <Tabs defaultValue="informations">
        <TabList>
          <TabTrigger value="informations">
            <Icon name="account-outline" size={16} />
            <span>Informations</span>
          </TabTrigger>

          <TabTrigger value="security">
            <Icon name="shield-lock-outline" size={16} />
            <span>Sécurité & Connexion</span>
          </TabTrigger>

          <TabTrigger value="danger">
            <Icon name="alert-octagon-outline" size={16} />
            <span>Danger Zone</span>
          </TabTrigger>
        </TabList>

        <TabContent value="informations">
          <ChangeInformationsForm />
        </TabContent>

        <TabContent value="security">
          <Stack>
            <ChangeEmailForm />
            <ChangePasswordForm />
          </Stack>
        </TabContent>

        <TabContent value="danger">
          <DeleteAccountCard />
        </TabContent>
      </Tabs>
    </PageContainer>
  );
};
