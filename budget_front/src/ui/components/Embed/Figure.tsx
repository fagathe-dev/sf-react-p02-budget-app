import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export type CaptionAlign = 'start' | 'center' | 'end';
export type CaptionPosition = 'top' | 'bottom';

export interface FigureCaptionProps extends BaseComponentProps {
  align?: CaptionAlign;
  position?: CaptionPosition;
}

export const FigureCaption = styled.figcaption<FigureCaptionProps>`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: ${({ align = 'start' }) => align};
  margin-top: ${({ position = 'bottom', theme }) =>
    position === 'bottom' ? theme.spacing[2] : '0'};
  margin-bottom: ${({ position = 'bottom', theme }) =>
    position === 'top' ? theme.spacing[2] : '0'};
`;

const StyledFigure = styled.figure`
  margin: 0;
  display: inline-flex;
  flex-direction: column;
  max-width: 100%;
`;

export interface FigureProps extends BaseComponentProps {
  caption?: React.ReactNode;
  captionAlign?: CaptionAlign;
  captionPosition?: CaptionPosition;
}

type FigureComponent = React.FC<FigureProps> & {
  Caption: typeof FigureCaption;
};

export const Figure: FigureComponent = ({
  caption,
  captionAlign = 'start',
  captionPosition = 'bottom',
  children,
  ...rest
}) => {
  return (
    <StyledFigure {...rest}>
      {caption && captionPosition === 'top' && (
        <FigureCaption align={captionAlign} position="top">
          {caption}
        </FigureCaption>
      )}
      {children}
      {caption && captionPosition === 'bottom' && (
        <FigureCaption align={captionAlign} position="bottom">
          {caption}
        </FigureCaption>
      )}
    </StyledFigure>
  );
};

Figure.Caption = FigureCaption;
