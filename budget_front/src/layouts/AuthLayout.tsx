import { Icon, Text, ThemeModeSwitcher } from '@/ui/components';
import { Outlet } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.background.body};
  position: relative;
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
`;

const BrandHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  user-select: none;
`;

const FormBox = styled.div`
  width: 100%;
  max-width: 420px;
`;

export const AuthLayout = () => {
  const theme = useTheme();

  return (
    <AuthContainer>
      <ThemeToggleWrapper>
        <ThemeModeSwitcher />
      </ThemeToggleWrapper>

      <BrandHeader>
        <Icon name="check-decagram" size={40} color={theme.colors.primary.base} />
        <Text weight="bold" size="xl" color="secondary">
          Budget App
        </Text>
      </BrandHeader>

      <FormBox>
        <Outlet />
      </FormBox>
    </AuthContainer>
  );
};
