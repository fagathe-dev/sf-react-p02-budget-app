import styled from 'styled-components';

export const FormCard = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  max-width: 640px;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.heading};
`;

export const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radii.base};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.body || 'transparent'};
  color: ${({ theme }) => theme.colors.text.heading};
  font-size: 14px;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary.base};
  }
`;

export const FeedbackMsg = styled.div<{ $type: 'success' | 'error' }>`
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  background-color: ${({ $type }) => ($type === 'success' ? '#f0fdf4' : '#fef2f2')};
  color: ${({ $type }) => ($type === 'success' ? '#15803d' : '#dc2626')};
  border: 1px solid ${({ $type }) => ($type === 'success' ? '#bbf7d0' : '#fecaca')};
`;

export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
`;
