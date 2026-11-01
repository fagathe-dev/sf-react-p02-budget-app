import { getErrorMessage } from '@/services/apiError';
import {
  deleteBoard,
  updateBoard,
  updateBoardSplitRule,
} from '@/services/budget.api';
import {
  BoardEntity,
  CalculatedBoard,
  RollupDisplayMode,
  SplitStrategy,
} from '@/types/budget.types';
import {
  Alert,
  Button,
  ConfirmDialog,
  Divider,
  Flex,
  Icon,
  Input,
  Label,
  Modal,
  SegmentedControl,
  TabContent,
  Table,
  TabList,
  Tabs,
  TabTrigger,
  Tbody,
  Td,
  Text,
  TextField,
  Th,
  Thead,
  TRow,
  useToast,
} from '@/ui/components';
import {
  distributeEqualBasisPoints,
  eurosToCents,
  formatPeriodLabel,
  percentToBasisPoints,
  rebalanceSplitInputs,
  SPLIT_STRATEGY_LABELS,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UpdateBoardFormValues, updateBoardSchema } from '../budgetSchemas';

export interface BoardSettingsModalProps {
  isOpen: boolean;
  board: CalculatedBoard;
  onClose: () => void;
  onBoardMetaUpdated: (entity: BoardEntity) => void;
  onCalculatedBoardUpdated: (calculated: CalculatedBoard) => void;
  onBoardDeleted: () => void;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  board,
  onClose,
  onBoardMetaUpdated,
  onCalculatedBoardUpdated,
  onBoardDeleted,
}) => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeMembers = board.members.filter((m) => m.status !== 'left');
  const [splitStrategy, setSplitStrategy] = useState<SplitStrategy>('equals');
  const [splitEffectiveFrom, setSplitEffectiveFrom] = useState(board.period);
  const [memberValues, setMemberValues] = useState<Record<string, string>>({});
  const [editedMemberIds, setEditedMemberIds] = useState<string[]>([]);
  const [isSavingSplit, setIsSavingSplit] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBoardFormValues>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      name: board.name,
      rollupDisplay: board.board.settings?.rollupDisplay ?? 'grouped',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: board.name,
      rollupDisplay: board.board.settings?.rollupDisplay ?? 'grouped',
    });
    setSplitEffectiveFrom(board.period);
    const equalParts = distributeEqualBasisPoints(activeMembers.length);
    const defaults: Record<string, string> = {};
    activeMembers.forEach((m, idx) => {
      defaults[m.id] = ((equalParts[idx] ?? 0) / 100).toFixed(2);
    });
    setMemberValues(defaults);
    setEditedMemberIds([]);
    setServerError(null);
  }, [isOpen, board.boardId, board.name, board.period]);

  const handleMemberValueChange = (memberId: string, rawValue: string) => {
    if (splitStrategy === 'percentage') {
      const includedIds = activeMembers.map((m) => m.id);
      const rebalanced = rebalanceSplitInputs({
        strategy: 'percentage',
        totalAmountCents: 0,
        includedIds,
        currentValues: memberValues,
        editedIds: editedMemberIds,
        changedMemberId: memberId,
        newRawValue: rawValue,
      });
      setMemberValues(rebalanced.values);
      setEditedMemberIds(rebalanced.editedIds);
      return;
    }

    if (splitStrategy === 'amount' && board.totals.householdCents > 0) {
      const includedIds = activeMembers.map((m) => m.id);
      const rebalanced = rebalanceSplitInputs({
        strategy: 'amount',
        totalAmountCents: board.totals.householdCents,
        includedIds,
        currentValues: memberValues,
        editedIds: editedMemberIds,
        changedMemberId: memberId,
        newRawValue: rawValue,
      });
      setMemberValues(rebalanced.values);
      setEditedMemberIds(rebalanced.editedIds);
      return;
    }

    setMemberValues((prev) => ({
      ...prev,
      [memberId]: rawValue,
    }));
  };

  const rollupDisplay = watch('rollupDisplay');

  const onSaveGeneral = async (values: UpdateBoardFormValues) => {
    setServerError(null);
    try {
      const updated = await updateBoard(board.boardId, {
        name: values.name.trim(),
        settings: {
          ...board.board.settings,
          rollupDisplay: values.rollupDisplay,
        },
      });
      success('Paramètres du budget enregistrés.');
      onBoardMetaUpdated(updated);
      onClose();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de mettre à jour ce budget.')
      );
    }
  };

  const handleSaveSplitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const entries =
      splitStrategy === 'equals'
        ? activeMembers.map((m) => ({ memberId: m.id, value: null }))
        : activeMembers.map((m) => {
            const raw = Number((memberValues[m.id] ?? '0').replace(',', '.'));
            const value =
              splitStrategy === 'percentage'
                ? percentToBasisPoints(raw)
                : eurosToCents(raw);
            return { memberId: m.id, value };
          });

    if (splitStrategy === 'percentage') {
      const totalBp = entries.reduce((acc, item) => acc + (item.value ?? 0), 0);
      if (totalBp !== 10000) {
        setServerError(
          `La somme des pourcentages doit être exactement égale à 100 % (actuellement ${(totalBp / 100).toFixed(2)} %).`
        );
        return;
      }
    }

    try {
      setIsSavingSplit(true);
      const recalculated = await updateBoardSplitRule(board.boardId, {
        strategy: splitStrategy,
        effectiveFrom: splitEffectiveFrom,
        entries,
      });
      success('Règle de répartition mise à jour.');
      onCalculatedBoardUpdated(recalculated);
      onClose();
    } catch (err) {
      setServerError(
        getErrorMessage(
          err,
          'Impossible de mettre à jour la règle de répartition.'
        )
      );
    } finally {
      setIsSavingSplit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setServerError(null);
    try {
      setIsDeleting(true);
      await deleteBoard(board.boardId);
      success(`Le budget « ${board.name} » a été archivé.`);
      setConfirmDeleteOpen(false);
      onClose();
      onBoardDeleted();
    } catch (err) {
      setConfirmDeleteOpen(false);
      setServerError(
        getErrorMessage(err, 'Impossible d’archiver ce budget partagé.')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="620px">
        <Modal.Header title="Paramètres du budget" onClose={onClose} />
        <Modal.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <Tabs defaultValue="general">
            <TabList>
              <TabTrigger value="general">
                <Icon name="cog-outline" size={16} />
                <span>Général</span>
              </TabTrigger>
              {board.type === 'shared' && (
                <TabTrigger value="split">
                  <Icon name="chart-pie" size={16} />
                  <span>Répartition par défaut</span>
                </TabTrigger>
              )}
            </TabList>

            <TabContent value="general">
              <form onSubmit={handleSubmit(onSaveGeneral)} noValidate>
                <TextField
                  label="Nom du budget"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />

                {board.type === 'personal' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <Label>Affichage des remontées des budgets partagés</Label>
                    <SegmentedControl<RollupDisplayMode>
                      aria-label="Affichage des remontées"
                      fullWidth
                      options={[
                        {
                          value: 'grouped',
                          label: 'Groupé par budget partagé',
                          icon: 'folder-outline',
                        },
                        {
                          value: 'detailed',
                          label: 'Détaillé ligne par ligne',
                          icon: 'format-list-bulleted',
                        },
                      ]}
                      value={rollupDisplay}
                      onChange={(val) =>
                        setValue('rollupDisplay', val, { shouldDirty: true })
                      }
                    />
                  </div>
                )}

                {board.type === 'shared' && (
                  <>
                    <Divider margin="1.25rem 0" />
                    <Flex
                      align="center"
                      justify="space-between"
                      gap="1rem"
                      wrap="wrap"
                    >
                      <div>
                        <Text weight="semibold" size="sm" color="danger">
                          Archiver ce budget partagé
                        </Text>
                        <Text as="p" size="xs">
                          Le budget n'apparaîtra plus dans vos espaces actifs.
                        </Text>
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirmDeleteOpen(true)}
                      >
                        <Icon name="archive-outline" size={16} />
                        <span>Archiver</span>
                      </Button>
                    </Flex>
                  </>
                )}

                <Divider margin="1.25rem 0" />
                <Flex justify="flex-end" gap="0.5rem">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                  >
                    Enregistrer
                  </Button>
                </Flex>
              </form>
            </TabContent>

            {board.type === 'shared' && (
              <TabContent value="split">
                <form onSubmit={handleSaveSplitRule}>
                  <div style={{ marginBottom: '1rem' }}>
                    <Label>Stratégie de répartition du foyer</Label>
                    <SegmentedControl<SplitStrategy>
                      aria-label="Stratégie de répartition"
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
                      onChange={setSplitStrategy}
                    />
                  </div>

                  <TextField
                    label="Prend effet à partir du mois (AAAA-MM)"
                    placeholder="AAAA-MM"
                    value={splitEffectiveFrom}
                    hint={`Mois affiché : ${formatPeriodLabel(board.period)}`}
                    onChange={(e) => setSplitEffectiveFrom(e.target.value)}
                  />

                  {splitStrategy !== 'equals' && (
                    <Table dense bordered>
                      <Thead>
                        <TRow>
                          <Th>Membre</Th>
                          <Th align="right" width="180px">
                            {splitStrategy === 'percentage'
                              ? 'Part (%)'
                              : `Montant (${board.currency})`}
                          </Th>
                        </TRow>
                      </Thead>
                      <Tbody>
                        {activeMembers.map((member) => (
                          <TRow key={member.id}>
                            <Td>{member.displayName}</Td>
                            <Td align="right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                aria-label={`Part de ${member.displayName}`}
                                value={memberValues[member.id] ?? ''}
                                onChange={(e) =>
                                  handleMemberValueChange(
                                    member.id,
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

                  <Divider margin="1.25rem 0" />
                  <Flex justify="flex-end" gap="0.5rem">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      disabled={isSavingSplit}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSavingSplit}
                    >
                      Appliquer la répartition
                    </Button>
                  </Flex>
                </form>
              </TabContent>
            )}
          </Tabs>
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Archiver ce budget partagé ?"
        message={`Voulez-vous vraiment archiver « ${board.name} » ? Cette action le masquera pour l'ensemble des membres.`}
        confirmLabel="Archiver définitivement"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
};
