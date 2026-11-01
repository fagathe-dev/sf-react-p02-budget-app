// frontend/src/ui/components/Navigation/Pagination/PaginationItem.tsx
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface PaginationItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    BaseComponentProps {}

export const PaginationItem = styled.li<PaginationItemProps>`
  display: inline-flex;
`;