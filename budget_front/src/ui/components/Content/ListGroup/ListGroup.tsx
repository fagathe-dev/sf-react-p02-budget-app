import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';
import { ListGroupItem } from './ListGroupItem';

export interface ListGroupProps
  extends React.HTMLAttributes<HTMLUListElement>, BaseComponentProps {
  flush?: boolean;
}

const StyledListGroup = styled.ul<ListGroupProps>`
  display: flex;
  flex-direction: column;
  padding-left: 0;
  margin: 0;
  list-style: none;
  border-radius: ${({ flush, theme }) => (flush ? '0' : theme.radii.base)};

  ${({ flush }) =>
    flush &&
    css`
      & > ${ListGroupItem} {
        border-width: 0 0 1px 0;
        border-radius: 0 !important;

        &:last-child {
          border-bottom-width: 0;
        }
      }
    `}
`;

export const ListGroup = Object.assign(StyledListGroup, {
  Item: ListGroupItem,
});
