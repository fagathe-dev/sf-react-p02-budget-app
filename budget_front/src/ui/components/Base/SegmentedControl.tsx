// src/ui/components/Base/SegmentedControl.tsx
import { Icon } from '@/ui/components/Base/Icon';
import React, { useRef } from 'react';
import styled, { css } from 'styled-components';

// Base commune de l'option
interface SegmentedOptionBase<T extends string = string> {
  value: T;
  /** Infobulle (ex. précision sur le comportement de l'option) */
  title?: string;
}

/**
 * Au moins `label` OU `icon` est obligatoire (les deux peuvent être présents simultanément).
 */
export type SegmentedOption<T extends string = string> = SegmentedOptionBase<T> &
  ({ label: string; icon?: string } | { label?: string; icon: string });
type SegmentedSize = 'sm' | 'md';

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nom accessible du groupe (ex. "Mode d'affichage") */
  'aria-label': string;
  /** Occupe toute la largeur du parent avec des segments de largeur égale */
  fullWidth?: boolean;
  size?: SegmentedSize;
  /** Coche sur le segment sélectionné (désactivé par défaut pour privilégier l'icône de l'option) */
  showCheck?: boolean;
}

// Espacements (clés du thème) et taille de police par taille de composant
const SIZES = {
  sm: { block: 1.5, inline: 3, font: 'xs', icon: 15 },
  md: { block: 2, inline: 3.5, font: 'sm', icon: 17 },
} as const;

const Group = styled.div<{ $fullWidth: boolean }>`
  display: ${({ $fullWidth }) => ($fullWidth ? 'flex' : 'inline-flex')};
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]};
  max-width: 100%;
  border: ${({ theme }) => theme.borders.widths.thin} solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg ?? theme.radii.base};
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;

      & > button {
        flex: 1 1 0;
      }
    `}
`;

const Segment = styled.button<{ $selected: boolean; $size: SegmentedSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme, $size }) => `${theme.spacing[SIZES[$size].block]} ${theme.spacing[SIZES[$size].inline]}`};
  border: none;
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary.subtle : 'transparent')};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.primary.dark : theme.colors.text.body)};
  font-family: inherit;
  font-size: ${({ theme, $size }) => theme.typography.sizes[SIZES[$size].font]};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: ${({ $selected, theme }) =>
      $selected ? theme.colors.primary.subtle : theme.colors.background.surfaceHover};
  }

  &:active {
    background-color: ${({ $selected, theme }) =>
      $selected ? theme.colors.primary.subtle : theme.colors.background.surfaceActive};
  }

  &:focus-visible {
    outline: ${({ theme }) => `${theme.borders.focusRing.width} solid${theme.borders.focusRing.color}`};
    outline-offset: -2px;
  }
`;

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  fullWidth = false,
  size = 'md',
  showCheck = false,
}: SegmentedControlProps<T>) => {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    let next = selectedIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = selectedIndex >= last ? 0 : selectedIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = selectedIndex <= 0 ? last : selectedIndex - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    const target = options[next];
    if (!target) return;
    onChange(target.value);
    buttonsRef.current[next]?.focus();
  };

  const iconSize = SIZES[size].icon;

  return (
    <Group role="radiogroup" aria-label={ariaLabel} $fullWidth={fullWidth} onKeyDown={handleKeyDown}>
      {options.map((option, index) => {
        const selected = index === selectedIndex;

        return (
          <Segment
            key={option.value}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={!option.label ? (option.title ?? option.value) : undefined}
            tabIndex={index === tabbableIndex ? 0 : -1}
            title={option.title}
            $selected={selected}
            $size={size}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? (
              <Icon name={option.icon} size={iconSize} />
            ) : (
              selected && showCheck && <Icon name="check" size={iconSize} />
            )}
            {option.label && <span>{option.label}</span>}
          </Segment>
        );
      })}
    </Group>
  );
};
