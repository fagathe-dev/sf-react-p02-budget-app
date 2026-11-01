import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { recordSettlement } from '@/services/expenseSplitter.api';
import {
  BalanceTransfer,
  BoardMember,
  CurrencyCode,
} from '@/types/budget.types';
import { SettlementMutationResponse } from '@/types/expenseSplitter.types';
import {
  Alert,
  Button,
  ChoiceField,
  Col,
  Modal,
  Row,
  TextareaField,
  TextField,
  useToast,
} from '@/ui/components';
import {
  centsToEuros,
  eurosToCents,
  toIsoDateInput,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  SettlementFormValues,
  settlementFormSchema,
} from '../expenseSplitterSchemas';

export interface SettlementModalProps {
  isOpen: boolean;
  groupId: string;
  currency: CurrencyCode;
  members: BoardMember[];
  prefillTransfer?: BalanceTransfer | null;
  onClose: () => void;
  onRecorded: (result: SettlementMutationResponse) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  groupId,
  currency,
  members,
  prefillTransfer = null,
  onClose,
  onRecorded,
}) => {
  const { success } = useToast();
  const activeMembers = members.filter((m) => m.status !== 'left');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      fromMemberId: prefillTransfer?.from ?? activeMembers[0]?.id ?? '',
      toMemberId: prefillTransfer?.to ?? activeMembers[1]?.id ?? '',
      amountEuros: prefillTransfer
        ? centsToEuros(prefillTransfer.amountCents)
        : 0,
      settledOn: toIsoDateInput(),
      note: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    reset({
      fromMemberId: prefillTransfer?.from ?? activeMembers[0]?.id ?? '',
      toMemberId:
        prefillTransfer?.to ??
        activeMembers.find((m) => m.id !== activeMembers[0]?.id)?.id ??
        '',
      amountEuros: prefillTransfer
        ? centsToEuros(prefillTransfer.amountCents)
        : 0,
      settledOn: toIsoDateInput(),
      note: '',
    });
  }, [isOpen, prefillTransfer, reset]);

  const onSubmit = async (values: SettlementFormValues) => {
    setServerError(null);
    try {
      const result = await recordSettlement(groupId, {
        fromMemberId: values.fromMemberId,
        toMemberId: values.toMemberId,
        amountCents: eurosToCents(values.amountEuros),
        settledOn: values.settledOn,
        note: values.note.trim() || null,
      });

      const fromName =
        activeMembers.find((m) => m.id === values.fromMemberId)?.displayName ??
        'Participant';
      const toName =
        activeMembers.find((m) => m.id === values.toMemberId)?.displayName ??
        'Participant';

      success(`Remboursement de ${fromName} vers ${toName} enregistré.`);
      onRecorded(result);
      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'fromMemberId') setError('fromMemberId', { message });
        if (field === 'toMemberId') setError('toMemberId', { message });
        if (field === 'amountCents') setError('amountEuros', { message });
        if (field === 'settledOn') setError('settledOn', { message });
        if (field === 'note') setError('note', { message });
      });
      setServerError(
        getErrorMessage(err, "Impossible d'enregistrer ce remboursement.")
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <Modal.Header
        title="Enregistrer un remboursement"
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <Row gutter="0.75rem">
            <Col span={12} sm={6}>
              <ChoiceField
                label="Qui rembourse ?"
                required
                error={errors.fromMemberId?.message}
                {...register('fromMemberId')}
              >
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </ChoiceField>
            </Col>
            <Col span={12} sm={6}>
              <ChoiceField
                label="À qui ?"
                required
                error={errors.toMemberId?.message}
                {...register('toMemberId')}
              >
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </ChoiceField>
            </Col>
          </Row>

          <Row gutter="0.75rem">
            <Col span={12} sm={6}>
              <TextField
                label={`Montant (${currency})`}
                type="number"
                step="0.01"
                min="0.01"
                required
                error={errors.amountEuros?.message}
                {...register('amountEuros', { valueAsNumber: true })}
              />
            </Col>
            <Col span={12} sm={6}>
              <TextField
                label="Date (AAAA-MM-JJ)"
                placeholder="AAAA-MM-JJ"
                required
                error={errors.settledOn?.message}
                {...register('settledOn')}
              />
            </Col>
          </Row>

          <TextareaField
            label="Note (optionnelle)"
            placeholder="Ex : Virement Lydia, Paylib, Espèces…"
            rows={2}
            error={errors.note?.message}
            {...register('note')}
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
            Marquer comme payé
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
