import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import {
  createBoardItem,
  createTag,
  reviseBoardItem,
} from '@/services/budget.api';
import {
  AllocationMode,
  CalculatedBoard,
  CalculatedLine,
  ItemKind,
  RecurrenceType,
  SplitStrategy,
  Tag,
} from '@/types/budget.types';
import {
  Alert,
  Button,
  CheckField,
  ChoiceField,
  Col,
  Divider,
  Flex,
  HelperText,
  Input,
  Label,
  Modal,
  Row,
  SegmentedControl,
  Table,
  TagInput,
  TagOption,
  Tbody,
  Td,
  TextField,
  Th,
  Thead,
  ToggleField,
  TRow,
  useToast,
} from '@/ui/components';
import {
  ALLOCATION_MODE_LABELS,
  centsToEuros,
  distributeEqualAmounts,
  distributeEqualBasisPoints,
  eurosToCents,
  ITEM_KIND_SINGULAR_LABELS,
  MONTH_OPTIONS,
  percentToBasisPoints,
  rebalanceSplitInputs,
  RECURRENCE_TYPE_LABELS,
  TAG_COLOR_PALETTE,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BudgetItemFormValues, budgetItemFormSchema } from '../budgetSchemas';

export interface ItemFormModalProps {
  isOpen: boolean;
  board: CalculatedBoard;
  availableTags: Tag[];
  defaultKind?: ItemKind;
  editingLine?: CalculatedLine | null;
  onClose: () => void;
  onSaved: (board: CalculatedBoard) => void;
  onTagsChanged?: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  board,
  availableTags,
  defaultKind = 'expense',
  editingLine = null,
  onClose,
  onSaved,
  onTagsChanged,
}) => {
  const { success } = useToast();
  const isEditing = Boolean(editingLine);
  const isShared = board.type === 'shared';
  const activeMembers = board.members.filter((m) => m.status !== 'left');

  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [splitMemberValues, setSplitMemberValues] = useState<
    Record<string, string>
  >({});
  const [editedSplitMemberIds, setEditedSplitMemberIds] = useState<string[]>(
    []
  );

  const allowedKind: ItemKind =
    isShared && defaultKind === 'income' ? 'expense' : defaultKind;

  const getInitialSpecificMonths = (line: CalculatedLine | null): number[] => {
    const rawMonths = line?.recurrenceParams?.months;
    if (Array.isArray(rawMonths)) {
      const valid = rawMonths
        .map((m) => Number(m))
        .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12)
        .sort((a, b) => a - b);
      if (valid.length > 0) {
        return Array.from(new Set(valid));
      }
    }
    if (line?.recurrenceType === 'specific_months') {
      const boardMonth = Number(board.period.split('-')[1]);
      return boardMonth >= 1 && boardMonth <= 12 ? [boardMonth] : [1];
    }
    return [];
  };

  const getInitialIntervalMonths = (line: CalculatedLine | null): number => {
    const rawInterval = Number(line?.recurrenceParams?.interval);
    if (
      Number.isInteger(rawInterval) &&
      rawInterval >= 1 &&
      rawInterval <= 120
    ) {
      return rawInterval;
    }
    return line && !line.isMonthly ? 12 : 1;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemFormSchema),
    defaultValues: {
      kind: editingLine?.kind ?? allowedKind,
      label: editingLine?.label ?? '',
      amountEuros: editingLine
        ? centsToEuros(editingLine.ruleAmountCents ?? editingLine.amountCents)
        : 0,
      recurrenceType:
        (editingLine?.recurrenceType as RecurrenceType) ?? 'interval',
      intervalMonths: getInitialIntervalMonths(editingLine),
      specificMonths: getInitialSpecificMonths(editingLine),
      isVariable: editingLine?.isVariable ?? false,
      allocation: (editingLine?.allocation as AllocationMode) ?? 'on_due',
      effectiveFrom: board.period,
      endPeriod: editingLine?.endPeriod ?? '',
      dueDay: editingLine?.dueDay ? String(editingLine.dueDay) : '',
      paidByMemberId: editingLine?.paidByMemberId ?? '',
      splitStrategy: 'default',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);

    const initialKind: ItemKind = editingLine
      ? editingLine.kind
      : isShared && defaultKind === 'income'
        ? 'expense'
        : defaultKind;

    reset({
      kind: initialKind,
      label: editingLine?.label ?? '',
      amountEuros: editingLine
        ? centsToEuros(editingLine.ruleAmountCents ?? editingLine.amountCents)
        : 0,
      recurrenceType:
        (editingLine?.recurrenceType as RecurrenceType) ?? 'interval',
      intervalMonths: getInitialIntervalMonths(editingLine),
      specificMonths: getInitialSpecificMonths(editingLine),
      isVariable: editingLine?.isVariable ?? false,
      allocation: (editingLine?.allocation as AllocationMode) ?? 'on_due',
      effectiveFrom: board.period,
      endPeriod: editingLine?.endPeriod ?? '',
      dueDay: editingLine?.dueDay ? String(editingLine.dueDay) : '',
      paidByMemberId: editingLine?.paidByMemberId ?? '',
      splitStrategy: 'default',
    });

    setSelectedTags(
      editingLine
        ? editingLine.tags.map((t) => ({
            id: t.id,
            label: t.name,
            color: t.hex,
          }))
        : []
    );

    const equalParts = distributeEqualBasisPoints(activeMembers.length);
    const defaults: Record<string, string> = {};
    activeMembers.forEach((m, idx) => {
      defaults[m.id] = ((equalParts[idx] ?? 0) / 100).toFixed(2);
    });
    setSplitMemberValues(defaults);
    setEditedSplitMemberIds([]);
  }, [isOpen, editingLine, defaultKind, board.period, isShared, reset]);

  const kind = watch('kind');
  const recurrenceType = watch('recurrenceType');
  const intervalMonths = watch('intervalMonths');
  const specificMonths = watch('specificMonths');
  const allocation = watch('allocation');
  const splitStrategy = watch('splitStrategy');
  const amountEuros = watch('amountEuros');
  const totalAmountCents = eurosToCents(
    Number.isFinite(amountEuros) ? amountEuros : 0
  );

  // Coche automatiquement le mois courant du board lorsqu'on bascule sur `specific_months` sans mois coché
  useEffect(() => {
    if (!isOpen || recurrenceType !== 'specific_months') return;
    if (specificMonths.length === 0) {
      const boardMonth = Number(board.period.split('-')[1]);
      const defaultMonth =
        boardMonth >= 1 && boardMonth <= 12 ? boardMonth : 1;
      setValue('specificMonths', [defaultMonth], { shouldValidate: true });
    }
  }, [isOpen, recurrenceType, specificMonths.length, board.period, setValue]);

  // Réinitialise et équilibre les parts lorsque la stratégie ou le montant change
  useEffect(() => {
    if (!isOpen) return;
    if (splitStrategy !== 'percentage' && splitStrategy !== 'amount') return;
    const includedIds = activeMembers.map((m) => m.id);
    if (includedIds.length === 0) return;

    setEditedSplitMemberIds([]);
    if (splitStrategy === 'percentage') {
      const equalBp = distributeEqualBasisPoints(includedIds.length);
      const next: Record<string, string> = {};
      includedIds.forEach((id, idx) => {
        next[id] = ((equalBp[idx] ?? 0) / 100).toFixed(2);
      });
      setSplitMemberValues(next);
    } else {
      const equalCents = distributeEqualAmounts(
        totalAmountCents,
        includedIds.length
      );
      const next: Record<string, string> = {};
      includedIds.forEach((id, idx) => {
        next[id] = String(centsToEuros(equalCents[idx] ?? 0));
      });
      setSplitMemberValues(next);
    }
  }, [isOpen, splitStrategy]);

  useEffect(() => {
    if (!isOpen || splitStrategy !== 'amount') return;
    const includedIds = activeMembers.map((m) => m.id);
    if (includedIds.length === 0) return;

    setSplitMemberValues((prev) => {
      const rebalanced = rebalanceSplitInputs({
        strategy: 'amount',
        totalAmountCents,
        includedIds,
        currentValues: prev,
        editedIds: editedSplitMemberIds,
      });
      return rebalanced.values;
    });
  }, [totalAmountCents, isOpen, splitStrategy]);

  const handleSplitMemberValueChange = (memberId: string, rawValue: string) => {
    if (splitStrategy !== 'percentage' && splitStrategy !== 'amount') {
      setSplitMemberValues((prev) => ({ ...prev, [memberId]: rawValue }));
      return;
    }

    const includedIds = activeMembers.map((m) => m.id);
    const rebalanced = rebalanceSplitInputs({
      strategy: splitStrategy,
      totalAmountCents,
      includedIds,
      currentValues: splitMemberValues,
      editedIds: editedSplitMemberIds,
      changedMemberId: memberId,
      newRawValue: rawValue,
    });

    setSplitMemberValues(rebalanced.values);
    setEditedSplitMemberIds(rebalanced.editedIds);
  };

  const isNonMonthly =
    (recurrenceType === 'interval' && intervalMonths > 1) ||
    (recurrenceType === 'specific_months' && specificMonths.length < 12);

  const tagSuggestions: TagOption[] = availableTags.map((tag) => ({
    id: tag.id,
    label: tag.name,
    color: tag.hex,
  }));

  const toggleSpecificMonth = (monthVal: number) => {
    const exists = specificMonths.includes(monthVal);
    const next = exists
      ? specificMonths.filter((m) => m !== monthVal)
      : [...specificMonths, monthVal].sort((a, b) => a - b);
    setValue('specificMonths', next, { shouldValidate: true });
  };

  const resolveTagIds = async (): Promise<string[]> => {
    const resolvedIds: string[] = [];
    const existingIds = new Set(availableTags.map((t) => t.id));
    let createdAny = false;

    for (const option of selectedTags) {
      if (existingIds.has(option.id)) {
        resolvedIds.push(option.id);
      } else {
        const randomPalette =
          TAG_COLOR_PALETTE[
            resolvedIds.length % TAG_COLOR_PALETTE.length
          ] ?? TAG_COLOR_PALETTE[0]!;
        const created = await createTag({
          name: option.label.trim().slice(0, 50),
          color: randomPalette.value,
          boardId: isShared ? board.boardId : null,
        });
        resolvedIds.push(created.id);
        createdAny = true;
      }
    }

    if (createdAny && onTagsChanged) {
      onTagsChanged();
    }

    return resolvedIds;
  };

  const onSubmit = async (values: BudgetItemFormValues) => {
    setServerError(null);

    try {
      const tagIds = await resolveTagIds();
      const amountCents = eurosToCents(values.amountEuros);
      const dueDay = values.dueDay ? Number(values.dueDay) : null;
      const endPeriod = values.endPeriod ? values.endPeriod : null;

      const recurrenceParams =
        values.recurrenceType === 'interval'
          ? {
              interval: values.intervalMonths,
              anchor: values.effectiveFrom,
              variable: values.isVariable,
            }
          : values.recurrenceType === 'specific_months'
            ? {
                months: values.specificMonths,
                variable: values.isVariable,
              }
            : {
                variable: values.isVariable,
              };

      const effectiveSplitStrategy: SplitStrategy | null =
        isShared && values.splitStrategy !== 'default'
          ? values.splitStrategy
          : null;

      const splitEntries =
        effectiveSplitStrategy && effectiveSplitStrategy !== 'equals'
          ? activeMembers.map((m) => {
              const raw = Number(
                (splitMemberValues[m.id] ?? '0').replace(',', '.')
              );
              return {
                memberId: m.id,
                value:
                  effectiveSplitStrategy === 'percentage'
                    ? percentToBasisPoints(raw)
                    : eurosToCents(raw),
              };
            })
          : effectiveSplitStrategy === 'equals'
            ? activeMembers.map((m) => ({ memberId: m.id, value: null }))
            : undefined;

      if (effectiveSplitStrategy === 'percentage' && splitEntries) {
        const sumBp = splitEntries.reduce(
          (acc, entry) => acc + (entry.value ?? 0),
          0
        );
        if (sumBp !== 10000) {
          setServerError(
            `La somme des pourcentages doit être égale à 100 % (actuellement ${(sumBp / 100).toFixed(2)} %).`
          );
          return;
        }
      }

      if (isEditing && editingLine) {
        const recalculated = await reviseBoardItem(
          board.boardId,
          editingLine.itemId,
          {
            label: values.label.trim(),
            amountCents,
            recurrenceType: values.recurrenceType,
            recurrenceParams,
            allocation: isNonMonthly ? values.allocation : 'on_due',
            effectiveFrom: values.effectiveFrom,
            endPeriod,
            dueDay,
            paidByMemberId: isShared ? values.paidByMemberId || null : null,
            tagIds,
            splitStrategy: effectiveSplitStrategy,
            splitEntries,
          },
          board.period
        );
        success(`Le poste « ${values.label} » a été révisé.`);
        onSaved(recalculated);
      } else {
        const recalculated = await createBoardItem(
          board.boardId,
          {
            kind: values.kind,
            label: values.label.trim(),
            amountCents,
            recurrenceType: values.recurrenceType,
            recurrenceParams,
            allocation: isNonMonthly ? values.allocation : 'on_due',
            effectiveFrom: values.effectiveFrom,
            endPeriod,
            dueDay,
            paidByMemberId: isShared ? values.paidByMemberId || null : null,
            tagIds,
            splitStrategy: effectiveSplitStrategy,
            splitEntries,
          },
          board.period
        );
        success(`Le poste « ${values.label} » a été ajouté.`);
        onSaved(recalculated);
      }

      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'label') setError('label', { message });
        if (field === 'amountCents') setError('amountEuros', { message });
        if (field === 'effectiveFrom') setError('effectiveFrom', { message });
        if (field === 'endPeriod') setError('endPeriod', { message });
        if (field === 'dueDay') setError('dueDay', { message });
      });
      setServerError(
        getErrorMessage(err, "Impossible d'enregistrer ce poste budgétaire.")
      );
    }
  };

  const kindOptions = isShared
    ? [
        {
          value: 'expense' as ItemKind,
          label: ITEM_KIND_SINGULAR_LABELS.expense,
          icon: 'cart-outline',
        },
        {
          value: 'savings' as ItemKind,
          label: ITEM_KIND_SINGULAR_LABELS.savings,
          icon: 'piggy-bank-outline',
        },
      ]
    : [
        {
          value: 'income' as ItemKind,
          label: ITEM_KIND_SINGULAR_LABELS.income,
          icon: 'cash-plus',
        },
        {
          value: 'expense' as ItemKind,
          label: ITEM_KIND_SINGULAR_LABELS.expense,
          icon: 'cart-outline',
        },
        {
          value: 'savings' as ItemKind,
          label: ITEM_KIND_SINGULAR_LABELS.savings,
          icon: 'piggy-bank-outline',
        },
      ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="640px">
      <Modal.Header
        title={
          isEditing
            ? `Réviser « ${editingLine?.label} »`
            : 'Nouveau poste budgétaire'
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

          {!isEditing && (
            <div style={{ marginBottom: '1rem' }}>
              <Label required>Nature du poste</Label>
              <SegmentedControl<ItemKind>
                aria-label="Nature du poste"
                fullWidth
                size="sm"
                options={kindOptions}
                value={kind}
                onChange={(val) => setValue('kind', val, { shouldValidate: true })}
              />
            </div>
          )}

          <Row gutter="0.75rem">
            <Col span={12} md={7}>
              <TextField
                label="Libellé"
                placeholder="Ex : Loyer, Salaire, Électricité…"
                required
                error={errors.label?.message}
                {...register('label')}
              />
            </Col>
            <Col span={12} md={5}>
              <TextField
                label={`Montant (${board.currency})`}
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
            <Col span={12} md={6}>
              <ChoiceField
                label="Fréquence"
                error={errors.recurrenceType?.message}
                {...register('recurrenceType')}
              >
                <option value="interval">
                  {RECURRENCE_TYPE_LABELS.interval}
                </option>
                <option value="specific_months">
                  {RECURRENCE_TYPE_LABELS.specific_months}
                </option>
                <option value="one_off">
                  {RECURRENCE_TYPE_LABELS.one_off}
                </option>
              </ChoiceField>
            </Col>

            {recurrenceType === 'interval' && (
              <Col span={12} md={6}>
                <TextField
                  label="Tous les N mois"
                  type="number"
                  min={1}
                  max={120}
                  hint="1 = mensuel, 3 = trimestriel, 12 = annuel"
                  error={errors.intervalMonths?.message}
                  {...register('intervalMonths', { valueAsNumber: true })}
                />
              </Col>
            )}
          </Row>

          {recurrenceType === 'specific_months' && (
            <div style={{ marginBottom: '1rem' }}>
              <Label required>Mois de prélèvement</Label>
              <Flex gap="0.5rem" wrap="wrap">
                {MONTH_OPTIONS.map((m) => (
                  <CheckField
                    key={m.value}
                    label={m.shortLabel}
                    checked={specificMonths.includes(m.value)}
                    onChange={() => toggleSpecificMonth(m.value)}
                  />
                ))}
              </Flex>
              {errors.specificMonths?.message && (
                <HelperText state="invalid">
                  {errors.specificMonths.message}
                </HelperText>
              )}
            </div>
          )}

          {isNonMonthly && (
            <div style={{ marginBottom: '1rem' }}>
              <Label>Mode d'affectation mensuelle</Label>
              <SegmentedControl<AllocationMode>
                aria-label="Mode d'affectation"
                fullWidth
                size="sm"
                options={[
                  {
                    value: 'on_due',
                    label: ALLOCATION_MODE_LABELS.on_due,
                    icon: 'calendar-check-outline',
                  },
                  {
                    value: 'smoothed',
                    label: ALLOCATION_MODE_LABELS.smoothed,
                    icon: 'chart-timeline-variant',
                  },
                ]}
                value={allocation}
                onChange={(val) =>
                  setValue('allocation', val, { shouldValidate: true })
                }
              />
            </div>
          )}

          <ToggleField
            label="Facture à montant variable (ex : électricité, eau)"
            {...register('isVariable')}
          />

          <Row gutter="0.75rem">
            <Col span={12} md={4}>
              <TextField
                label={
                  isEditing
                    ? 'Prend effet à partir de (AAAA-MM)'
                    : 'Début de validité (AAAA-MM)'
                }
                placeholder="AAAA-MM"
                required
                error={errors.effectiveFrom?.message}
                {...register('effectiveFrom')}
              />
            </Col>
            <Col span={12} md={4}>
              <TextField
                label="Fin de validité (AAAA-MM)"
                placeholder="Optionnel"
                error={errors.endPeriod?.message}
                {...register('endPeriod')}
              />
            </Col>
            <Col span={12} md={4}>
              <TextField
                label="Jour d'échéance (1-31)"
                type="number"
                min={1}
                max={31}
                placeholder="Ex : 5"
                error={errors.dueDay?.message}
                {...register('dueDay')}
              />
            </Col>
          </Row>

          <TagInput
            label="Tags associés"
            value={selectedTags}
            onChange={setSelectedTags}
            suggestions={tagSuggestions}
            placeholder="Sélectionner ou créer un tag…"
            hint="Appuyez sur Entrée pour créer un nouveau tag à la volée."
          />

          {isShared && (
            <>
              <Divider margin="1rem 0" />
              <Row gutter="0.75rem">
                <Col span={12} md={6}>
                  <ChoiceField
                    label="Payé par"
                    hint="Par défaut : payé par le compte commun"
                    {...register('paidByMemberId')}
                  >
                    <option value="">Compte commun du foyer</option>
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} (compte personnel)
                      </option>
                    ))}
                  </ChoiceField>
                </Col>
                <Col span={12} md={6}>
                  <ChoiceField
                    label="Répartition de ce poste"
                    {...register('splitStrategy')}
                  >
                    <option value="default">
                      Suivre la répartition du budget
                    </option>
                    <option value="equals">Parts égales</option>
                    <option value="percentage">
                      Pourcentage personnalisé
                    </option>
                    <option value="amount">Montant fixe par membre</option>
                  </ChoiceField>
                </Col>
              </Row>

              {(splitStrategy === 'percentage' || splitStrategy === 'amount') && (
                <Table dense bordered>
                  <Thead>
                    <TRow>
                      <Th>Membre</Th>
                      <Th align="right" width="160px">
                        {splitStrategy === 'percentage'
                          ? 'Part (%)'
                          : `Montant (${board.currency})`}
                      </Th>
                    </TRow>
                  </Thead>
                  <Tbody>
                    {activeMembers.map((m) => (
                      <TRow key={m.id}>
                        <Td>{m.displayName}</Td>
                        <Td align="right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            aria-label={`Part de ${m.displayName}`}
                            value={splitMemberValues[m.id] ?? ''}
                            onChange={(e) =>
                              handleSplitMemberValueChange(
                                m.id,
                                e.target.value
                              )
                            }
                          />
                        </Td>
                      </TRow>
                    ))}
                  </Tbody>
                </Table>
              )}
            </>
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
            {isEditing ? 'Enregistrer la révision' : 'Ajouter le poste'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
