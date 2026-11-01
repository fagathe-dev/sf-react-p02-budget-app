// frontend/src/ui/components/Content/EmptyState/EmptyState.tsx
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface EmptyStateProps extends BaseComponentProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing[8]} ${theme.spacing[4]}`};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const IconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.base};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const Heading = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing[1.5]} 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

const Description = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  max-width: 420px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const EmptyState = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
  children,
  ...rest
}: EmptyStateProps) => {
  return (
    <Container {...rest}>
      {icon && (
        <IconCircle>
          <Icon name={icon} size={28} />
        </IconCircle>
      )}
      <Heading>{title}</Heading>
      {description && <Description>{description}</Description>}
      {action && <div>{action}</div>}
      {children}
    </Container>
  );
};
