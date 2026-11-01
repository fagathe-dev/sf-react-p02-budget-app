// frontend/src/ui/components/Navigation/Pagination/PaginationEllipsis.tsx
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

const StyledEllipsis = styled.span<BaseComponentProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

export const PaginationEllipsis: React.FC<BaseComponentProps> = ({ children = '…', ...rest }) => {
  return (
    <StyledEllipsis aria-hidden="true" {...rest}>
      {children}
    </StyledEllipsis>
  );
};
