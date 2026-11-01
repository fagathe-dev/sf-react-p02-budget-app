import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { createExpenseGroup } from '@/services/expenseSplitter.api';
import { ExpenseGroupDetail } from '@/types/expenseSplitter.types';
import {
  Alert,
  Button,
  Modal,
  TextareaField,
  TextField,
  useToast,
} from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  CreateExpenseGroupFormValues,
  createExpenseGroupSchema,
} from '../expenseSplitterSchemas';

export interface CreateExpenseGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: ExpenseGroupDetail) => void;
}

export const CreateExpenseGroupModal: React.FC<
  CreateExpenseGroupModalProps
> = ({ isOpen, onClose, onCreated }) => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseGroupFormValues>({
    resolver: zodResolver(createExpenseGroupSchema),
    defaultValues: {
      name: '',
      currency: 'EUR',
      participantsText: '',
    },
  });

  const onSubmit = async (values: CreateExpenseGroupFormValues) => {
    setServerError(null);
    try {
      const participants = values.participantsText
        ? values.participantsText
            .split(/[,\n]/)
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined;

      const created = await createExpenseGroup({
        name: values.name.trim(),
        currency: values.currency.trim().toUpperCase(),
        participants,
      });

      success(`Le groupe « ${created.group.name} » a été créé.`);
      reset();
      onCreated(created);
      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'name' || field === 'currency') {
          setError(field, { message });
        }
      });
      setServerError(
        getErrorMessage(err, 'Impossible de créer ce groupe de dépenses.')
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="520px">
      <Modal.Header title="Nouveau groupe de dépenses" onClose={onClose} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <TextField
            label="Nom du groupe"
            placeholder="Ex : Vacances Biarritz, Week-end ski, Colocation…"
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

          <TextareaField
            label="Participants (en plus de vous)"
            placeholder="Ex : Camille, Alex, Thomas (séparés par une virgule)"
            hint="Vous pourrez aussi inviter des participants par e-mail ou lien de partage."
            rows={2}
            error={errors.participantsText?.message}
            {...register('participantsText')}
          />
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
            Créer le groupe
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
