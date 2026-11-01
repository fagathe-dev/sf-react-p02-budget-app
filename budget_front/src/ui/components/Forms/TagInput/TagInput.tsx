// frontend/src/ui/components/Forms/TagInput/TagInput.tsx
import { Badge } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import React, { useState } from 'react';
import styled from 'styled-components';
import { HelperText } from '../HelperText';
import { Label } from '../Label';

export interface TagOption {
  id: string;
  label: string;
  color?: string; // Hexcode ex: '#3b82f6'
}

export interface TagInputProps extends BaseComponentProps {
  label?: string;
  value: TagOption[];
  onChange: (tags: TagOption[]) => void;
  suggestions?: TagOption[];
  placeholder?: string;
  allowCreate?: boolean;
  error?: string;
  hint?: string;
}

const InputBox = styled.div<{ $hasError: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[2.5]}`};
  min-height: 40px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ $hasError, theme }) => ($hasError ? theme.colors.danger.base : theme.colors.border.default)};
  border-radius: ${({ theme }) => theme.radii.base};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.borders.focusRing.color};
  }
`;

const BareInput = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
`;

const RemoveBtn = styled.button`
  display: inline-flex;
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  cursor: pointer;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

const SuggestionsList = styled.ul`
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
  padding: ${({ theme }) => theme.spacing[1]};
  list-style: none;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  max-height: 160px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[2]}`};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }
`;

const ColorDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
`;

export const TagInput = ({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Ajouter un tag…',
  allowCreate = true,
  error,
  hint,
  ...rest
}: TagInputProps) => {
  const [query, setQuery] = useState('');

  const availableSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.id === s.id) && s.label.toLowerCase().includes(query.toLowerCase())
  );

  const addTag = (tag: TagOption) => {
    onChange([...value, tag]);
    setQuery('');
  };

  const removeTag = (id: string) => {
    onChange(value.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      const existing = availableSuggestions[0];
      if (existing) {
        addTag(existing);
      } else if (allowCreate) {
        addTag({
          id: query.trim().toLowerCase(),
          label: query.trim(),
          color: '#739566',
        });
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      const lastTag = value[value.length - 1];
      if (lastTag) {
        removeTag(lastTag.id);
      }
    }
  };

  return (
    <div {...rest}>
      {label && <Label>{label}</Label>}
      <InputBox $hasError={Boolean(error)}>
        {value.map((tag) => (
          <Badge key={tag.id} pill color={tag.color} variant="primary">
            {tag.label}
            <RemoveBtn type="button" onClick={() => removeTag(tag.id)} aria-label={`Retirer ${tag.label}`}>
              <Icon name="close" size={12} />
            </RemoveBtn>
          </Badge>
        ))}
        <BareInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
        />
      </InputBox>
      {query && availableSuggestions.length > 0 && (
        <SuggestionsList>
          {availableSuggestions.map((s) => (
            <SuggestionItem key={s.id} onClick={() => addTag(s)}>
              {s.color && <ColorDot $color={s.color} />}
              <span>{s.label}</span>
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}
      {error && <HelperText state="invalid">{error}</HelperText>}
      {!error && hint && <HelperText>{hint}</HelperText>}
    </div>
  );
};
