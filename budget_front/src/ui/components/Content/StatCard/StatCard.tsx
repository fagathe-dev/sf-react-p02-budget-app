// frontend/src/ui/components/Content/StatCard/StatCard.tsx
import { Badge, BadgeVariant } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { Card } from '@/ui/components/Content/Card';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface StatCardProps extends BaseComponentProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendVariant?: BadgeVariant;
}

const StyledCard = styled(Card)`
  height: 100%;
  width: 100%;
  min-width: 0;
  overflow: hidden;
`;

const StyledBody = styled(Card.Body)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  height: 100%;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
`;

const LabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  min-width: 0;
`;

const IconBox = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.base};
`;

const BottomRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
`;

const ValueNumber = styled.strong`
  font-size: ${({ theme }) => theme.typography.sizes['2xl']};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.heading};
  line-height: 1.1;
`;

const TrendBadge = styled(Badge)`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StatCard = ({ label, value, icon, trend, trendVariant = 'success', ...rest }: StatCardProps) => {
  return (
    <StyledCard bordered elevation="sm" {...rest}>
      <StyledBody>
        <TopRow>
          <LabelText>{label}</LabelText>
          <IconBox>
            <Icon name={icon} size={20} />
          </IconBox>
        </TopRow>
        <BottomRow>
          <ValueNumber>{value}</ValueNumber>
          {trend && (
            <TrendBadge variant={trendVariant} pill>
              {trend}
            </TrendBadge>
          )}
        </BottomRow>
      </StyledBody>
    </StyledCard>
  );
};
