import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { createBoard } from '@/services/budget.api';
import { CalculatedBoard } from '@/types/budget.types';
import {
  Alert,
  Button,
  ChoiceField,
  Modal,
  TextareaField,
  TextField,
  useToast,
} from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateBoardFormValues, createBoardSchema } from '../budgetSchemas';

export interface CreateBoardModalProps {
  isOpen: boolean;
  defaultType?: 'personal' | 'shared';
  hasPersonalBoard?: boolean;
  onClose: () => void;
  onCreated: (board: CalculatedBoard) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  defaultType = 'shared',
  hasPersonalBoard = true,
  onClose,
  onCreated,
}) => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBoardFormValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      name: '',
      type: defaultType,
      currency: 'EUR',
      guestsText: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (values: CreateBoardFormValues) => {
    setServerError(null);
    try {
      const guests =
        values.type === 'shared' && values.guestsText
          ? values.guestsText
              .split(/[,\n]/)
              .map((g) => g.trim())
              .filter(Boolean)
          : undefined;

      const created = await createBoard({
        name: values.name.trim(),
        type: values.type,
        currency: values.currency.trim().toUpperCase(),
        guests,
      });

      success(`Le budget « ${created.name} » a été créé.`);
      reset();
      onCreated(created);
      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'name' || field === 'type' || field === 'currency') {
          setError(field, { message });
        }
      });
      setServerError(
        getErrorMessage(err, 'Impossible de créer ce budget pour le moment.')
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="520px">
      <Modal.Header title="Nouveau budget" onClose={onClose} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <ChoiceField
            label="Type de budget"
            required
            error={errors.type?.message}
            {...register('type')}
          >
            <option value="shared">Budget partagé (foyer, couple, colocation)</option>
            {!hasPersonalBoard && (
              <option value="personal">Budget personnel</option>
            )}
          </ChoiceField>

          <TextField
            label="Nom du budget"
            placeholder={
              selectedType === 'personal' ? 'Mon budget' : 'Ex : Foyer Alice & Bob'
            }
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <TextField
            label="Devise (ISO 4217)"
            placeholder="EUR"
            maxLength={3}
            required
            error={errors.currency?.message}
            {...register('currency')}
          />

          {selectedType === 'shared' && (
            <TextareaField
              label="Membres locaux initiaux (optionnel)"
              placeholder="Ex : Bob, Camille (séparés par une virgule)"
              hint="Vous pourrez inviter des membres par e-mail ou lien de partage à tout moment."
              rows={2}
              error={errors.guestsText?.message}
              {...register('guestsText')}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Créer le budget
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
