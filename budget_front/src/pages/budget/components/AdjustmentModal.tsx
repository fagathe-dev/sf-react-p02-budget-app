import { getErrorMessage } from '@/services/apiError';
import {
  removeItemAdjustment,
  setItemAdjustment,
} from '@/services/budget.api';
import {
  AdjustmentType,
  CalculatedBoard,
  CalculatedLine,
  CurrencyCode,
  PeriodString,
} from '@/types/budget.types';
import {
  Alert,
  Button,
  Flex,
  Icon,
  Label,
  Modal,
  SegmentedControl,
  Text,
  TextareaField,
  TextField,
  useToast,
} from '@/ui/components';
import {
  centsToEuros,
  eurosToCents,
  formatMoney,
  formatPeriodLabel,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AdjustmentFormValues, adjustmentFormSchema } from '../budgetSchemas';

export interface AdjustmentModalProps {
  isOpen: boolean;
  boardId: string;
  period: PeriodString;
  currency: CurrencyCode;
  line: CalculatedLine | null;
  onClose: () => void;
  onUpdated: (board: CalculatedBoard) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  boardId,
  period,
  currency,
  line,
  onClose,
  onUpdated,
}) => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const initialType: AdjustmentType =
    line?.adjustmentType === 'include' ||
    line?.adjustmentType === 'exclude' ||
    line?.adjustmentType === 'amount'
      ? line.adjustmentType
      : 'amount';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      type: initialType,
      amountEuros: line ? String(centsToEuros(line.amountCents)) : '0',
      note: '',
    },
  });

  useEffect(() => {
    if (!isOpen || !line) return;
    const defaultType: AdjustmentType =
      line.adjustmentType === 'include' ||
      line.adjustmentType === 'exclude' ||
      line.adjustmentType === 'amount'
        ? line.adjustmentType
        : line.isDue
          ? 'amount'
          : 'include';

    reset({
      type: defaultType,
      amountEuros: String(
        centsToEuros(line.amountCents || line.ruleAmountCents || 0)
      ),
      note: '',
    });
    setServerError(null);
  }, [isOpen, line, reset]);

  if (!line) return null;

  const selectedType = watch('type');

  const onSubmit = async (values: AdjustmentFormValues) => {
    setServerError(null);
    try {
      const amountCents =
        values.type === 'amount'
          ? eurosToCents(Number(values.amountEuros.replace(',', '.')))
          : null;

      const updated = await setItemAdjustment(boardId, line.itemId, period, {
        type: values.type,
        amountCents,
        note: values.note.trim() || null,
      });

      success(`Exception enregistrée pour « ${line.label} ».`);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Impossible d'enregistrer cette exception.")
      );
    }
  };

  const handleRevertToRule = async () => {
    setServerError(null);
    try {
      setIsRemoving(true);
      const updated = await removeItemAdjustment(boardId, line.itemId, period);
      success(`« ${line.label} » suit à nouveau sa règle habituelle.`);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de supprimer cette exception.')
      );
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <Modal.Header
        title={`Ce mois-ci : ${line.label}`}
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

          <div style={{ marginBottom: '1rem' }}>
            <Text as="p" size="sm">
              Ajustez le comportement de ce poste uniquement pour{' '}
              <strong>{formatPeriodLabel(period)}</strong> sans modifier sa
              règle habituelle
              {line.ruleAmountCents !== null
                ? ` (${formatMoney(line.ruleAmountCents, currency)})`
                : ''}
              .
            </Text>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Label>Action pour ce mois</Label>
            <SegmentedControl<AdjustmentType>
              aria-label="Type d'exception du mois"
              fullWidth
              size="sm"
              options={[
                { value: 'amount', label: 'Montant réel…', icon: 'cash-edit' },
                { value: 'include', label: 'Compter', icon: 'check' },
                { value: 'exclude', label: 'Ne pas compter', icon: 'cancel' },
              ]}
              value={selectedType}
              onChange={(val) => setValue('type', val, { shouldValidate: true })}
            />
          </div>

          {selectedType === 'amount' && (
            <TextField
              label={`Montant réel pour ${formatPeriodLabel(period)} (${currency})`}
              type="number"
              step="0.01"
              min="0"
              required
              error={errors.amountEuros?.message}
              {...register('amountEuros')}
            />
          )}

          <TextareaField
            label="Note (optionnelle)"
            placeholder="Ex : Régularisation annuelle, mois offert…"
            rows={2}
            error={errors.note?.message}
            {...register('note')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Flex
            align="center"
            justify="space-between"
            gap="0.5rem"
            style={{ width: '100%' }}
          >
            <div>
              {line.adjustmentType && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isRemoving}
                  onClick={handleRevertToRule}
                >
                  <Icon name="restore" size={16} />
                  <span>Revenir à la règle</span>
                </Button>
              )}
            </div>
            <Flex gap="0.5rem">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting || isRemoving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isRemoving}
              >
                Enregistrer
              </Button>
            </Flex>
          </Flex>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
