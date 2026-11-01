import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { addExpense, correctExpense } from '@/services/expenseSplitter.api';
import {
  BoardMember,
  CurrencyCode,
  SplitStrategy,
  Tag,
} from '@/types/budget.types';
import {
  Expense,
  ExpenseMutationResponse,
} from '@/types/expenseSplitter.types';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ChoiceField,
  Col,
  Divider,
  Flex,
  Input,
  Label,
  Modal,
  Row,
  SegmentedControl,
  Table,
  Tbody,
  Td,
  Text,
  TextField,
  Tfoot,
  Th,
  Thead,
  TRow,
  useToast,
} from '@/ui/components';
import {
  basisPointsToPercent,
  centsToEuros,
  distributeEqualAmounts,
  distributeEqualBasisPoints,
  eurosToCents,
  formatMoney,
  percentToBasisPoints,
  rebalanceSplitInputs,
  SPLIT_STRATEGY_LABELS,
  toIsoDateInput,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ExpenseFormValues, expenseFormSchema } from '../expenseSplitterSchemas';

export interface ExpenseFormModalProps {
  isOpen: boolean;
  groupId: string;
  currency: CurrencyCode;
  members: BoardMember[];
  myMemberId: string | null;
  availableTags: Tag[];
  editingExpense?: Expense | null;
  onClose: () => void;
  onSaved: (mutation: ExpenseMutationResponse) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  groupId,
  currency,
  members,
  myMemberId,
  availableTags,
  editingExpense = null,
  onClose,
  onSaved,
}) => {
  const { success } = useToast();
  const isEditing = Boolean(editingExpense);
  const activeMembers = members.filter((m) => m.status !== 'left');

  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [participantValues, setParticipantValues] = useState<
    Record<string, string>
  >({});
  const [editedParticipantIds, setEditedParticipantIds] = useState<string[]>(
    []
  );

  const defaultPayerId =
    editingExpense?.paidByMemberId ??
    myMemberId ??
    activeMembers[0]?.id ??
    '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      label: editingExpense?.label ?? '',
      amountEuros: editingExpense
        ? centsToEuros(editingExpense.amount.amountCents)
        : 0,
      spentOn: toIsoDateInput(editingExpense?.spentOn),
      paidByMemberId: defaultPayerId,
      tagId: editingExpense?.tagId ?? '',
      splitStrategy:
        (editingExpense?.splitStrategy as SplitStrategy) ?? 'equals',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    setEditedParticipantIds([]);

    const initialStrategy: SplitStrategy =
      editingExpense?.splitStrategy === 'percentage' ||
      editingExpense?.splitStrategy === 'amount' ||
      editingExpense?.splitStrategy === 'equals'
        ? editingExpense.splitStrategy
        : 'equals';

    reset({
      label: editingExpense?.label ?? '',
      amountEuros: editingExpense
        ? centsToEuros(editingExpense.amount.amountCents)
        : 0,
      spentOn: toIsoDateInput(editingExpense?.spentOn),
      paidByMemberId:
        editingExpense?.paidByMemberId ??
        myMemberId ??
        activeMembers[0]?.id ??
        '',
      tagId: editingExpense?.tagId ?? '',
      splitStrategy: initialStrategy,
    });

    if (editingExpense && editingExpense.shares.length > 0) {
      const shareMemberIds = editingExpense.shares.map((s) => s.memberId);
      setSelectedParticipantIds(shareMemberIds);

      const valuesMap: Record<string, string> = {};
      editingExpense.shares.forEach((s) => {
        if (initialStrategy === 'percentage') {
          valuesMap[s.memberId] = String(
            basisPointsToPercent(s.inputValue ?? 0)
          );
        } else if (initialStrategy === 'amount') {
          valuesMap[s.memberId] = String(
            centsToEuros(s.inputValue ?? s.amountCents)
          );
        }
      });
      setParticipantValues(valuesMap);
    } else {
      const allIds = activeMembers.map((m) => m.id);
      setSelectedParticipantIds(allIds);

      const equalBp = distributeEqualBasisPoints(activeMembers.length);
      const defaults: Record<string, string> = {};
      activeMembers.forEach((m, idx) => {
        defaults[m.id] = ((equalBp[idx] ?? 0) / 100).toFixed(2);
      });
      setParticipantValues(defaults);
    }
  }, [isOpen, editingExpense, myMemberId, reset]);

  const splitStrategy = watch('splitStrategy');
  const amountEuros = watch('amountEuros');
  const totalAmountCents = eurosToCents(
    Number.isFinite(amountEuros) ? amountEuros : 0
  );

  // Recalcule les parts non modifiées lorsque le montant total de la dépense change en mode montant fixe
  useEffect(() => {
    if (!isOpen || splitStrategy !== 'amount') return;
    const includedIds = activeMembers
      .filter((m) => selectedParticipantIds.includes(m.id))
      .map((m) => m.id);
    if (includedIds.length === 0) return;

    setParticipantValues((prev) => {
      const rebalanced = rebalanceSplitInputs({
        strategy: 'amount',
        totalAmountCents,
        includedIds,
        currentValues: prev,
        editedIds: editedParticipantIds,
      });
      return rebalanced.values;
    });
  }, [totalAmountCents, isOpen, splitStrategy]);

  const toggleParticipant = (memberId: string) => {
    const nextSelectedIds = selectedParticipantIds.includes(memberId)
      ? selectedParticipantIds.filter((id) => id !== memberId)
      : [...selectedParticipantIds, memberId];

    setSelectedParticipantIds(nextSelectedIds);

    const nextEditedIds = editedParticipantIds.filter((id) =>
      nextSelectedIds.includes(id)
    );
    setEditedParticipantIds(nextEditedIds);

    if (splitStrategy === 'percentage' || splitStrategy === 'amount') {
      const includedIds = activeMembers
        .filter((m) => nextSelectedIds.includes(m.id))
        .map((m) => m.id);
      const rebalanced = rebalanceSplitInputs({
        strategy: splitStrategy,
        totalAmountCents,
        includedIds,
        currentValues: participantValues,
        editedIds: nextEditedIds,
      });
      setParticipantValues(rebalanced.values);
      setEditedParticipantIds(rebalanced.editedIds);
    }
  };

  const handleParticipantValueChange = (memberId: string, rawValue: string) => {
    if (splitStrategy !== 'percentage' && splitStrategy !== 'amount') {
      setParticipantValues((prev) => ({ ...prev, [memberId]: rawValue }));
      return;
    }

    const includedIds = activeMembers
      .filter((m) => selectedParticipantIds.includes(m.id))
      .map((m) => m.id);

    const rebalanced = rebalanceSplitInputs({
      strategy: splitStrategy,
      totalAmountCents,
      includedIds,
      currentValues: participantValues,
      editedIds: editedParticipantIds,
      changedMemberId: memberId,
      newRawValue: rawValue,
    });

    setParticipantValues(rebalanced.values);
    setEditedParticipantIds(rebalanced.editedIds);
  };

  const handleStrategyChange = (nextStrategy: SplitStrategy) => {
    setValue('splitStrategy', nextStrategy, { shouldValidate: true });
    setEditedParticipantIds([]);

    const includedMembers = activeMembers.filter((m) =>
      selectedParticipantIds.includes(m.id)
    );
    if (includedMembers.length === 0) return;

    if (nextStrategy === 'percentage') {
      const equalBp = distributeEqualBasisPoints(includedMembers.length);
      const nextMap: Record<string, string> = {};
      includedMembers.forEach((m, idx) => {
        nextMap[m.id] = ((equalBp[idx] ?? 0) / 100).toFixed(2);
      });
      setParticipantValues((prev) => ({ ...prev, ...nextMap }));
    } else if (nextStrategy === 'amount') {
      const equalCents = distributeEqualAmounts(
        totalAmountCents,
        includedMembers.length
      );
      const nextMap: Record<string, string> = {};
      includedMembers.forEach((m, idx) => {
        nextMap[m.id] = String(centsToEuros(equalCents[idx] ?? 0));
      });
      setParticipantValues((prev) => ({ ...prev, ...nextMap }));
    }
  };

  // Aperçu temps réel des parts
  const includedMembers = activeMembers.filter((m) =>
    selectedParticipantIds.includes(m.id)
  );
  const equalPreviewCents = distributeEqualAmounts(
    totalAmountCents,
    includedMembers.length
  );

  const onSubmit = async (values: ExpenseFormValues) => {
    setServerError(null);

    if (includedMembers.length === 0) {
      setServerError(
        'Veuillez sélectionner au moins un participant pour répartir la dépense.'
      );
      return;
    }

    const amountCents = eurosToCents(values.amountEuros);

    const participants =
      values.splitStrategy === 'equals'
        ? includedMembers.map((m) => ({ memberId: m.id, value: null }))
        : includedMembers.map((m) => {
            const raw = Number(
              (participantValues[m.id] ?? '0').replace(',', '.')
            );
            const value =
              values.splitStrategy === 'percentage'
                ? percentToBasisPoints(raw)
                : eurosToCents(raw);
            return { memberId: m.id, value };
          });

    if (values.splitStrategy === 'percentage') {
      const sumBp = participants.reduce(
        (acc, p) => acc + (p.value ?? 0),
        0
      );
      if (sumBp !== 10000) {
        setServerError(
          `La somme des pourcentages doit être exactement égale à 100 % (actuellement ${(sumBp / 100).toFixed(2)} %).`
        );
        return;
      }
    }

    if (values.splitStrategy === 'amount') {
      const sumCents = participants.reduce(
        (acc, p) => acc + (p.value ?? 0),
        0
      );
      if (sumCents !== amountCents) {
        const diffCents = amountCents - sumCents;
        setServerError(
          `La somme des montants (${formatMoney(sumCents, currency)}) ne correspond pas au total de la dépense (${formatMoney(amountCents, currency)}). Reste à répartir : ${formatMoney(diffCents, currency)}.`
        );
        return;
      }
    }

    try {
      const payload = {
        paidByMemberId: values.paidByMemberId,
        amountCents,
        spentOn: values.spentOn,
        label: values.label.trim(),
        tagId: values.tagId || null,
        splitStrategy: values.splitStrategy,
        participants,
      };

      if (isEditing && editingExpense) {
        const result = await correctExpense(
          groupId,
          editingExpense.id,
          payload
        );
        success(
          `La dépense « ${values.label} » a été corrigée (l'ancienne saisie a été remplacée).`
        );
        onSaved(result);
      } else {
        const result = await addExpense(groupId, payload);
        success(`Dépense « ${values.label} » ajoutée.`);
        onSaved(result);
      }

      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'label') setError('label', { message });
        if (field === 'amountCents') setError('amountEuros', { message });
        if (field === 'spentOn') setError('spentOn', { message });
        if (field === 'paidByMemberId') setError('paidByMemberId', { message });
      });
      setServerError(
        getErrorMessage(err, "Impossible d'enregistrer cette dépense.")
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="640px">
      <Modal.Header
        title={
          isEditing
            ? `Corriger « ${editingExpense?.label} »`
            : 'Nouvelle dépense partagée'
        }
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

          {isEditing && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="info">
                En corrigeant cette dépense, une nouvelle écriture remplacera
                l'ancienne (qui sera conservée dans l'historique comme annulée).
              </Alert>
            </div>
          )}

          <Row gutter="0.75rem">
            <Col span={12} md={7}>
              <TextField
                label="Libellé de la dépense"
                placeholder="Ex : Courses, Restaurant, Péage…"
                required
                error={errors.label?.message}
                {...register('label')}
              />
            </Col>
            <Col span={12} md={5}>
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
          </Row>

          <Row gutter="0.75rem">
            <Col span={12} md={4}>
              <ChoiceField
                label="Payé par"
                required
                error={errors.paidByMemberId?.message}
                {...register('paidByMemberId')}
              >
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </ChoiceField>
            </Col>
            <Col span={12} md={4}>
              <TextField
                label="Date (AAAA-MM-JJ)"
                placeholder="AAAA-MM-JJ"
                required
                error={errors.spentOn?.message}
                {...register('spentOn')}
              />
            </Col>
            <Col span={12} md={4}>
              <ChoiceField label="Tag (optionnel)" {...register('tagId')}>
                <option value="">Aucun tag</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </ChoiceField>
            </Col>
          </Row>

          <Divider margin="0.75rem 0" />

          <div style={{ marginBottom: '1rem' }}>
            <Label>Mode de répartition entre participants</Label>
            <SegmentedControl<SplitStrategy>
              aria-label="Mode de répartition"
              fullWidth
              size="sm"
              options={[
                { value: 'equals', label: SPLIT_STRATEGY_LABELS.equals },
                {
                  value: 'percentage',
                  label: SPLIT_STRATEGY_LABELS.percentage,
                },
                { value: 'amount', label: SPLIT_STRATEGY_LABELS.amount },
              ]}
              value={splitStrategy}
              onChange={handleStrategyChange}
            />
          </div>

          <Table dense bordered>
            <Thead>
              <TRow>
                <Th width="56px">Inclure</Th>
                <Th>Participant</Th>
                {splitStrategy !== 'equals' && (
                  <Th align="right" width="160px">
                    {splitStrategy === 'percentage'
                      ? 'Part (%)'
                      : `Montant (${currency})`}
                  </Th>
                )}
                <Th align="right" width="140px">
                  Part calculée
                </Th>
              </TRow>
            </Thead>
            <Tbody>
              {activeMembers.map((member) => {
                const isSelected = selectedParticipantIds.includes(member.id);
                const includedIndex = includedMembers.findIndex(
                  (m) => m.id === member.id
                );

                let previewCents = 0;
                if (isSelected) {
                  if (splitStrategy === 'equals') {
                    previewCents = equalPreviewCents[includedIndex] ?? 0;
                  } else if (splitStrategy === 'percentage') {
                    const pct = Number(
                      (participantValues[member.id] ?? '0').replace(',', '.')
                    );
                    previewCents = Number.isFinite(pct)
                      ? Math.round((totalAmountCents * pct) / 100)
                      : 0;
                  } else {
                    const eur = Number(
                      (participantValues[member.id] ?? '0').replace(',', '.')
                    );
                    previewCents = eurosToCents(eur);
                  }
                }

                return (
                  <TRow
                    key={member.id}
                    style={{ opacity: isSelected ? 1 : 0.55 }}
                  >
                    <Td>
                      <Checkbox
                        aria-label={`Inclure ${member.displayName}`}
                        checked={isSelected}
                        onChange={() => toggleParticipant(member.id)}
                      />
                    </Td>
                    <Td>
                      <Flex align="center" gap="0.5rem">
                        <Text weight="medium" size="sm">
                          {member.displayName}
                        </Text>
                        {member.id === myMemberId && (
                          <Badge variant="primary" pill>
                            Moi
                          </Badge>
                        )}
                      </Flex>
                    </Td>
                    {splitStrategy !== 'equals' && (
                      <Td align="right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!isSelected}
                          aria-label={`Valeur pour ${member.displayName}`}
                          value={
                            isSelected ? (participantValues[member.id] ?? '') : ''
                          }
                          onChange={(e) =>
                            handleParticipantValueChange(
                              member.id,
                              e.target.value
                            )
                          }
                        />
                      </Td>
                    )}
                    <Td align="right">
                      <Text weight="semibold" size="sm">
                        {isSelected ? formatMoney(previewCents, currency) : '—'}
                      </Text>
                    </Td>
                  </TRow>
                );
              })}
            </Tbody>
            <Tfoot>
              <TRow>
                <Td />
                <Td>
                  Total ({includedMembers.length} participant
                  {includedMembers.length > 1 ? 's' : ''})
                </Td>
                {splitStrategy !== 'equals' && <Td />}
                <Td align="right">
                  {formatMoney(totalAmountCents, currency)}
                </Td>
              </TRow>
            </Tfoot>
          </Table>
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
            {isEditing ? 'Enregistrer la correction' : 'Ajouter la dépense'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
