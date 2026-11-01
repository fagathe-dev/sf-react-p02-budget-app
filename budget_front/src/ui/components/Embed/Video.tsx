import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';

export type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type VideoRadius = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | 'pill' | 'full';

export interface VideoSource {
  src: string;
  type?: string;
}

export interface VideoProps
  extends React.VideoHTMLAttributes<HTMLVideoElement>,
    BaseComponentProps {
  sources?: VideoSource[];
  fluid?: boolean;
  fit?: ObjectFit;
  aspectRatio?: string;
  radius?: VideoRadius;
  fallbackUrl?: string;
  fallbackText?: React.ReactNode;
}

const StyledVideo = styled.video<{
  $fluid?: boolean;
  $fit?: ObjectFit;
  $aspectRatio?: string;
  $radius?: VideoRadius;
}>`
  display: block;
  max-width: ${({ $fluid = true }) => ($fluid ? '100%' : 'none')};
  width: ${({ $fluid = true, width }) => ($fluid && !width ? '100%' : undefined)};
  height: ${({ $fluid = true, height }) => ($fluid && !height ? 'auto' : undefined)};

  ${({ $fit }) =>
    $fit &&
    css`
      object-fit: ${$fit};
    `}

  ${({ $aspectRatio }) =>
    $aspectRatio &&
    css`
      aspect-ratio: ${$aspectRatio};
    `}

  ${({ $radius, theme }) =>
    $radius &&
    css`
      border-radius: ${theme.radii[$radius]};
    `}
`;

export const Video: React.FC<VideoProps> = ({
  sources = [],
  src,
  fluid = true,
  fit,
  aspectRatio,
  radius,
  fallbackUrl,
  fallbackText,
  controls = true,
  children,
  ...props
}) => {
  const downloadLink = fallbackUrl || sources[0]?.src || src;

  return (
    <StyledVideo
      $fluid={fluid}$fit={fit}
      $aspectRatio={aspectRatio}$radius={radius}
      controls={controls}
      src={src}
      {...props}
    >
      {sources.map((source, index) => (
        <source key={`${source.src}-${index}`} src={source.src} type={source.type} />
      ))}

      {children}

      <p>
        {fallbackText ?? (
          <>
            Votre navigateur ne prend pas en charge les vidéos HTML5. Voici{' '}
            {downloadLink && (
              <a href={downloadLink} download>
                un lien pour télécharger la vidéo
              </a>
            )}
            .
          </>
        )}
      </p>
    </StyledVideo>
  );
};