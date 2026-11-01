import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto';

export interface ColProps extends BaseComponentProps {
  span?: ColSpan;
  sm?: ColSpan;
  md?: ColSpan;
  lg?: ColSpan;
  xl?: ColSpan;
  offset?: number;
}

const computeWidth = (span?: ColSpan) => {
  if (!span) return '';
  if (span === 'auto') {
    return css`
      flex: 1 0 0%;
      width: auto;
      max-width: 100%;
    `;
  }
  const pct = `${(span / 12) * 100}%`;
  return css`
    flex: 0 0 auto;
    width: ${pct};
  `;
};

export const Col = styled.div.attrs<ColProps>((props) => ({
  as: props.as || 'div',
}))<ColProps>`
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;

  ${({ span }) => computeWidth(span)}
  ${({ offset }) =>
    offset &&
    css`
      margin-left: ${(offset / 12) * 100}%;
    `}

  ${({ sm, theme }) =>
    sm &&
    css`
      ${theme.media.up('sm')} {
        ${computeWidth(sm)}
      }
    `}

  ${({ md, theme }) =>
    md &&
    css`
      ${theme.media.up('md')} {
        ${computeWidth(md)}
      }
    `}

  ${({ lg, theme }) =>
    lg &&
    css`
      ${theme.media.up('lg')} {
        ${computeWidth(lg)}
      }
    `}

  ${({ xl, theme }) =>
    xl &&
    css`
      ${theme.media.up('xl')} {
        ${computeWidth(xl)}
      }
    `}
`;
