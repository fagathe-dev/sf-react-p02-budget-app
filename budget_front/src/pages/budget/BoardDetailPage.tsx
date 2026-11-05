import { useBudget } from '@/hooks/useBudget';
import { buildBoardPath, ROUTES } from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import { deleteBoardItem, toggleBoardItem } from '@/services/budget.api';
import {
  CalculatedLine,
  ItemKind,
  RollupResult,
} from '@/types/budget.types';
import {
  Accordion,
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Flex,
  Icon,
  IconButton,
  Loading,
  Row,
  SegmentedControl,
  StatCard,
  Table,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Title,
  Toggle,
  TRow,
  useToast,
} from '@/ui/components';
import {
  ADJUSTMENT_TYPE_LABELS,
  formatLineRecurrenceSummary,
  formatMoney,
  formatPeriodLabel,
  formatRatioPercent,
   isValidPeriod,
  ITEM_KIND_LABELS,
} from '@/utils/budget';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AdjustmentModal,
  BoardSettingsModal,
  ItemFormModal,
  MembersDrawer,
  PeriodSelector,
} from './components';

type KindFilter = 'all' | ItemKind;

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success } = useToast();

  const {
    period,
    isCurrentPeriod,
    currentBoard,
    tags,
    isLoadingBoard,
    setPeriod,
    nextPeriod,
    previousPeriod,
    resetToCurrentPeriod,
    setCurrentBoard,
    loadBoard,
    loadTags,
  } = useBudget();

  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemDefaultKind, setItemDefaultKind] = useState<ItemKind>('expense');
  const [editingLine, setEditingLine] = useState<CalculatedLine | null>(null);
  const [adjustmentLine, setAdjustmentLine] = useState<CalculatedLine | null>(
    null
  );
  const [deletingLine, setDeletingLine] = useState<CalculatedLine | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);

  const monthQuery = searchParams.get('month');
  const effectivePeriod =
    monthQuery && isValidPeriod(monthQuery) ? monthQuery : period;

  useEffect(() => {
    if (monthQuery && isValidPeriod(monthQuery) && monthQuery !== period) {
      setPeriod(monthQuery);
    }
  }, [monthQuery, period, setPeriod]);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    setError(null);

    loadBoard(boardId, effectivePeriod).catch((err) => {
      if (!cancelled) {
        setError(getErrorMessage(err, 'Impossible de charger ce budget.'));
      }
    });

    loadTags(boardId).catch(() => {
      // Silencieux : les tags restent optionnels
    });

    return () => {
      cancelled = true;
    };
  }, [boardId, effectivePeriod, loadBoard, loadTags]);

  const handlePeriodChange = (nextMonth: string) => {
    setPeriod(nextMonth);
    setSearchParams({ month: nextMonth }, { replace: true });
  };

  const handleToggleItem = async (line: CalculatedLine) => {
    if (!currentBoard) return;
    try {
      const recalculated = await toggleBoardItem(
        currentBoard.boardId,
        line.itemId,
        effectivePeriod
      );
      setCurrentBoard(recalculated);
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de basculer l'état de ce poste.")
      );
    }
  };

  const handleConfirmDeleteLine = async () => {
    if (!currentBoard || !deletingLine) return;
    try {
      setIsDeletingItem(true);
      await deleteBoardItem(currentBoard.boardId, deletingLine.itemId);
      success(`Le poste « ${deletingLine.label} » a été supprimé.`);
      setDeletingLine(null);
      await loadBoard(currentBoard.boardId, effectivePeriod);
    } catch (err) {
      setDeletingLine(null);
      setError(getErrorMessage(err, 'Impossible de supprimer ce poste.'));
    } finally {
      setIsDeletingItem(false);
    }
  };

  if (isLoadingBoard && (!currentBoard || currentBoard.boardId !== boardId)) {
    return (
      <Flex
        align="center"
        justify="center"
        direction="column"
        gap="1rem"
        style={{ padding: '4rem 0' }}
      >
        <Loading size="lg" label="Calcul du budget en cours…" />
        <Text size="sm" color="muted">
          Calcul du budget pour {formatPeriodLabel(effectivePeriod)}…
        </Text>
      </Flex>
    );
  }

  if (!currentBoard) {
    return (
      <Flex direction="column" gap="1rem">
        {error && <Alert variant="danger">{error}</Alert>}
        <EmptyState
          icon="alert-circle-outline"
          title="Budget introuvable"
          description="Ce budget n'existe pas ou vous n'y avez pas accès."
          action={
            <Button href={ROUTES.BOARDS} variant="primary">
              Retour à mes budgets
            </Button>
          }
        />
      </Flex>
    );
  }

  const isShared = currentBoard.type === 'shared';
  const canEdit = currentBoard.board.permissions.canEdit;
  const activeMembers = currentBoard.members.filter((m) => m.status !== 'left');
  const myMemberId = currentBoard.board.myMemberId;
  const myShareCents = myMemberId
    ? (currentBoard.memberShares[myMemberId] ?? 0)
    : 0;

  const filteredLines =
    kindFilter === 'all'
      ? currentBoard.lines
      : currentBoard.lines.filter((l) => l.kind === kindFilter);

  const filterOptions = isShared
    ? [
        { value: 'all' as KindFilter, label: 'Tous les postes' },
        { value: 'expense' as KindFilter, label: ITEM_KIND_LABELS.expense },
        { value: 'savings' as KindFilter, label: ITEM_KIND_LABELS.savings },
      ]
    : [
        { value: 'all' as KindFilter, label: 'Tous les postes' },
        { value: 'income' as KindFilter, label: ITEM_KIND_LABELS.income },
        { value: 'expense' as KindFilter, label: ITEM_KIND_LABELS.expense },
        { value: 'savings' as KindFilter, label: ITEM_KIND_LABELS.savings },
      ];

  const rollupDisplay = currentBoard.board.settings?.rollupDisplay ?? 'grouped';

  const renderRollupSection = (rollup: RollupResult) => (
    <Card key={rollup.linkId} bordered elevation="sm">
      <Card.Header>
        <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
          <Flex align="center" gap="0.5rem">
            <Icon name="home-group" size={20} />
            <Card.Title>{rollup.sourceBoardName}</Card.Title>
            <Badge variant="info" pill>
              Remontée automatique
            </Badge>
          </Flex>
          <Button
            href={buildBoardPath(rollup.sourceBoardId, effectivePeriod)}
            variant="outline"
            size="sm"
          >
            <span>Voir le budget partagé</span>
            <Icon name="open-in-new" size={15} />
          </Button>
        </Flex>
      </Card.Header>

      <Card.Body>
        <Row gutter="1rem">
          <Col span={12} sm={4}>
            <Text size="xs" color="muted">
              Ma part des charges
            </Text>
            <div>
              <Text weight="bold" size="lg">
                {formatMoney(rollup.expenseCents, currentBoard.currency)}
              </Text>
            </div>
          </Col>
          <Col span={12} sm={4}>
            <Text size="xs" color="muted">
              Ma part de l'épargne
            </Text>
            <div>
              <Text weight="bold" size="lg">
                {formatMoney(rollup.savingsCents, currentBoard.currency)}
              </Text>
            </div>
          </Col>
          <Col span={12} sm={4}>
            <Text size="xs" color="muted">
              Versement compte commun
            </Text>
            <div>
              <Text weight="bold" size="lg" color="primary">
                {rollup.contributionCents !== null
                  ? formatMoney(rollup.contributionCents, currentBoard.currency)
                  : '—'}
              </Text>
            </div>
          </Col>
        </Row>

        {rollupDisplay === 'detailed' && rollup.lines.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <Table dense bordered>
              <Thead>
                <TRow>
                  <Th>Poste partagé</Th>
                  <Th align="right">Montant foyer</Th>
                  <Th align="right">Ma part</Th>
                </TRow>
              </Thead>
              <Tbody>
                {rollup.lines.map((rLine) => (
                  <TRow key={rLine.sourceItemId}>
                    <Td>
                      <Flex align="center" gap="0.5rem" wrap="wrap">
                        <Text weight="medium" size="sm">
                          {rLine.label}
                        </Text>
                        {rLine.tags.map((t) => (
                          <Badge key={t.id} color={t.hex} pill>
                            {t.name}
                          </Badge>
                        ))}
                      </Flex>
                    </Td>
                    <Td align="right">
                      <Text size="sm" color="muted">
                        {formatMoney(
                          rLine.householdAmountCents,
                          currentBoard.currency
                        )}
                      </Text>
                    </Td>
                    <Td align="right">
                      <Text weight="semibold" size="sm">
                        {formatMoney(rLine.amountCents, currentBoard.currency)}
                      </Text>
                    </Td>
                  </TRow>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <Flex direction="column" gap="1.5rem">
      <Breadcrumb
        items={[
          { label: 'Mes budgets', to: ROUTES.BOARDS, icon: 'wallet-outline' },
          { label: currentBoard.name, active: true },
        ]}
      />

      {/* En-tête du board */}
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <Flex align="center" gap="0.75rem" wrap="wrap">
          <Title as="h2" style={{ margin: 0 }}>
            {currentBoard.name}
          </Title>
          <Badge variant={isShared ? 'info' : 'primary'} pill>
            {isShared ? 'Budget partagé' : 'Budget personnel'}
          </Badge>
        </Flex>

        <Flex align="center" gap="0.75rem" wrap="wrap">
          <PeriodSelector
            period={effectivePeriod}
            isCurrentPeriod={isCurrentPeriod}
            onPrevious={() => handlePeriodChange(previousPeriod())}
            onNext={() => handlePeriodChange(nextPeriod())}
            onResetToday={() => handlePeriodChange(resetToCurrentPeriod())}
            onChangePeriod={handlePeriodChange}
          />

          {isShared && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMembersDrawerOpen(true)}
            >
              <Icon name="account-multiple-outline" size={18} />
              <span>Membres ({activeMembers.length})</span>
            </Button>
          )}

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
              >
                <Icon name="cog-outline" size={18} />
                <span>Paramètres</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingLine(null);
                  setItemDefaultKind(
                    kindFilter === 'all' ? 'expense' : kindFilter
                  );
                  setItemModalOpen(true);
                }}
              >
                <Icon name="plus" size={18} />
                <span>Ajouter un poste</span>
              </Button>
            </>
          )}
        </Flex>
      </Flex>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cartes d'indicateurs KPI */}
      {isShared ? (
        <Row gutter="1rem">
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Coût total du foyer"
              value={formatMoney(
                currentBoard.totals.householdCents,
                currentBoard.currency
              )}
              icon="home-group"
              trendVariant="info"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Charges communes"
              value={formatMoney(
                currentBoard.totals.expenseCents,
                currentBoard.currency
              )}
              icon="cart-outline"
              trendVariant="warning"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Épargne commune"
              value={formatMoney(
                currentBoard.totals.savingsCents,
                currentBoard.currency
              )}
              icon="piggy-bank-outline"
              trendVariant="primary"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Ma part ce mois-ci"
              value={formatMoney(myShareCents, currentBoard.currency)}
              icon="account-cash-outline"
              trend={currentBoard.balance?.summary ?? undefined}
              trendVariant="success"
            />
          </Col>
        </Row>
      ) : (
        <Row gutter="1rem">
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Revenus"
              value={formatMoney(
                currentBoard.totals.incomeCents,
                currentBoard.currency
              )}
              icon="cash-plus"
              trendVariant="success"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Charges totales"
              value={formatMoney(
                currentBoard.totals.chargesCents,
                currentBoard.currency
              )}
              icon="cart-outline"
              trend={
                currentBoard.totals.rollupExpenseCents > 0
                  ? `dont ${formatMoney(currentBoard.totals.rollupExpenseCents, currentBoard.currency)} partagés`
                  : undefined
              }
              trendVariant="info"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Épargne"
              value={formatMoney(
                currentBoard.totals.savingsCents,
                currentBoard.currency
              )}
              icon="piggy-bank-outline"
              trendVariant="primary"
            />
          </Col>
          <Col span={12} sm={6} lg={3}>
            <StatCard
              label="Reste à vivre"
              value={formatMoney(
                currentBoard.totals.remainingCents,
                currentBoard.currency
              )}
              icon="scale-balance"
              trend={`Taux de charges : ${formatRatioPercent(currentBoard.totals.chargesRatio)}`}
              trendVariant={
                currentBoard.totals.remainingCents >= 0 ? 'success' : 'danger'
              }
            />
          </Col>
        </Row>
      )}

      {/* Tableau des postes budgétaires */}
      <Card bordered elevation="sm">
        <Card.Header>
          <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
            <Card.Title>
              Postes du mois ({filteredLines.length})
            </Card.Title>

            <SegmentedControl<KindFilter>
              aria-label="Filtrer par catégorie de poste"
              size="sm"
              options={filterOptions}
              value={kindFilter}
              onChange={setKindFilter}
            />
          </Flex>
        </Card.Header>

        <Card.Body>
          {filteredLines.length === 0 ? (
            <EmptyState
              icon="format-list-bulleted"
              title="Aucun poste dans cette catégorie"
              description="Ajoutez un revenu, une charge ou une épargne pour calculer automatiquement votre budget du mois."
              action={
                canEdit ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingLine(null);
                      setItemDefaultKind(
                        kindFilter === 'all' ? 'expense' : kindFilter
                      );
                      setItemModalOpen(true);
                    }}
                  >
                    <Icon name="plus" size={16} />
                    <span>Ajouter un poste</span>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table hoverable bordered>
              <Thead>
                <TRow>
                  {canEdit && <Th width="64px">Actif</Th>}
                  <Th>Poste & périodicité</Th>
                  <Th>Catégorie & Tags</Th>
                  {isShared && <Th>Payé par</Th>}
                  {isShared &&
                    activeMembers.map((member) => (
                      <Th key={member.id} align="right">
                        Part {member.displayName}
                      </Th>
                    ))}
                  <Th align="right">Montant du mois</Th>
                  {canEdit && (
                    <Th align="right" width="70px">
                      Actions
                    </Th>
                  )}
                </TRow>
              </Thead>

              <Tbody>
                {filteredLines.map((line) => {
                  const payer = line.paidByMemberId
                    ? currentBoard.members.find(
                        (m) => m.id === line.paidByMemberId
                      )
                    : null;

                  const kindBadgeVariant =
                    line.kind === 'income'
                      ? 'success'
                      : line.kind === 'savings'
                        ? 'primary'
                        : 'warning';

                  return (
                    <TRow
                      key={line.itemId}
                      style={{ opacity: line.isActive ? 1 : 0.55 }}
                    >
                      {canEdit && (
                        <Td>
                          <Toggle
                            aria-label={`Activer ou désactiver ${line.label}`}
                            checked={line.isActive}
                            onChange={() => handleToggleItem(line)}
                          />
                        </Td>
                      )}

                      <Td>
                        <Flex direction="column" gap="0.2rem">
                          <Flex align="center" gap="0.5rem" wrap="wrap">
                            <Text weight="semibold" size="sm">
                              {line.label}
                            </Text>
                            {!line.isDue && line.amountCents === 0 && (
                              <Badge variant="neutral" pill>
                                Non dû ce mois
                              </Badge>
                            )}
                            {line.adjustmentType && (
                              <Badge variant="info" pill>
                                {ADJUSTMENT_TYPE_LABELS[
                                  line.adjustmentType as keyof typeof ADJUSTMENT_TYPE_LABELS
                                ] ?? 'Ajusté ce mois'}
                              </Badge>
                            )}
                          </Flex>
                          <Text size="xs" color="muted">
                            {formatLineRecurrenceSummary(line)}
                            {line.ruleAmountCents !== null &&
                            line.ruleAmountCents !== line.amountCents
                              ? ` • Règle : ${formatMoney(line.ruleAmountCents, currentBoard.currency)}`
                              : ''}
                          </Text>
                        </Flex>
                      </Td>

                      <Td>
                        <Flex align="center" gap="0.35rem" wrap="wrap">
                          <Badge variant={kindBadgeVariant} pill>
                            {ITEM_KIND_LABELS[line.kind]}
                          </Badge>
                          {line.tags.map((tag) => (
                            <Badge key={tag.id} color={tag.hex} pill>
                              {tag.name}
                            </Badge>
                          ))}
                        </Flex>
                      </Td>

                      {isShared && (
                        <Td>
                          <Text size="xs" color="muted">
                            {payer ? payer.displayName : 'Compte commun'}
                          </Text>
                        </Td>
                      )}

                      {isShared &&
                        activeMembers.map((member) => (
                          <Td key={member.id} align="right">
                            <Text size="sm" color="muted">
                              {formatMoney(
                                line.shares[member.id] ?? 0,
                                currentBoard.currency
                              )}
                            </Text>
                          </Td>
                        ))}

                      <Td align="right">
                        <Flex direction="column" align="flex-end" gap="0.1rem">
                          <Text
                            weight="bold"
                            size="sm"
                            color={
                              line.kind === 'income'
                                ? 'success'
                                : line.kind === 'savings'
                                  ? 'primary'
                                  : undefined
                            }
                          >
                            {formatMoney(
                              line.amountCents,
                              currentBoard.currency
                            )}
                          </Text>
                          {!line.isDue &&
                            line.amountCents === 0 &&
                            line.ruleAmountCents !== null &&
                            line.ruleAmountCents > 0 && (
                              <Text size="xs" color="muted">
                                Échéance :{' '}
                                {formatMoney(
                                  line.ruleAmountCents,
                                  currentBoard.currency
                                )}
                              </Text>
                            )}
                        </Flex>
                      </Td>

                      {canEdit && (
                        <Td align="right">
                          <Dropdown>
                            <Dropdown.Trigger>
                              <IconButton
                                name="dots-vertical"
                                size="sm"
                                variant="ghost"
                                aria-label={`Actions pour ${line.label}`}
                              />
                            </Dropdown.Trigger>
                            <Dropdown.Menu align="right" minWidth="200px">
                              <Dropdown.Item
                                icon={<Icon name="calendar-edit" size={16} />}
                                onClick={() => setAdjustmentLine(line)}
                              >
                                Ce mois-ci…
                              </Dropdown.Item>
                              <Dropdown.Item
                                icon={<Icon name="pencil-outline" size={16} />}
                                onClick={() => {
                                  setEditingLine(line);
                                  setItemModalOpen(true);
                                }}
                              >
                                Réviser la règle…
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                variant="danger"
                                icon={
                                  <Icon name="trash-can-outline" size={16} />
                                }
                                onClick={() => setDeletingLine(line)}
                              >
                                Supprimer
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Td>
                      )}
                    </TRow>
                  );
                })}
              </Tbody>

              {isShared && activeMembers.length > 0 && (
                <Tfoot>
                  <TRow>
                    {canEdit && <Td />}
                    <Td>Total des parts du mois</Td>
                    <Td />
                    <Td />
                    {activeMembers.map((member) => (
                      <Td key={member.id} align="right">
                        {formatMoney(
                          currentBoard.memberShares[member.id] ?? 0,
                          currentBoard.currency
                        )}
                      </Td>
                    ))}
                    <Td align="right">
                      {formatMoney(
                        currentBoard.totals.householdCents,
                        currentBoard.currency
                      )}
                    </Td>
                    {canEdit && <Td />}
                  </TRow>
                </Tfoot>
              )}
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Section Remontées des budgets partagés (pour le budget personnel) */}
      {!isShared && currentBoard.rollups.length > 0 && (
        <Flex direction="column" gap="1rem">
          <Title as="h3">
            Parts issues de vos budgets partagés ({currentBoard.rollups.length})
          </Title>
          {currentBoard.rollups.map(renderRollupSection)}
        </Flex>
      )}

      {/* Section Équilibre & Virements (pour un budget partagé) */}
      {isShared && currentBoard.balance && (
        <Card bordered elevation="sm">
          <Card.Header>
            <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
              <Flex align="center" gap="0.5rem">
                <Icon name="scale-balance" size={20} />
                <Card.Title>Équilibre & versements du mois</Card.Title>
              </Flex>
              {currentBoard.balance.summary && (
                <Badge variant="info" pill>
                  {currentBoard.balance.summary}
                </Badge>
              )}
            </Flex>
          </Card.Header>

          <Card.Body>
            <Table dense bordered>
              <Thead>
                <TRow>
                  <Th>Membre</Th>
                  <Th align="right">Part totale du mois</Th>
                  <Th align="right">Versement au compte commun</Th>
                  <Th align="right">Solde personnel</Th>
                </TRow>
              </Thead>
              <Tbody>
                {activeMembers.map((member) => {
                  const share = currentBoard.memberShares[member.id] ?? 0;
                  const contribution =
                    currentBoard.balance?.contributions[member.id] ?? 0;
                  const memberBalance =
                    currentBoard.balance?.balances[member.id] ?? 0;

                  return (
                    <TRow key={member.id}>
                      <Td>
                        <Text weight="semibold" size="sm">
                          {member.displayName}
                        </Text>
                      </Td>
                      <Td align="right">
                        {formatMoney(share, currentBoard.currency)}
                      </Td>
                      <Td align="right">
                        <Text weight="semibold" size="sm" color="primary">
                          {formatMoney(contribution, currentBoard.currency)}
                        </Text>
                      </Td>
                      <Td align="right">
                        <Badge
                          variant={
                            memberBalance === 0
                              ? 'success'
                              : memberBalance > 0
                                ? 'info'
                                : 'warning'
                          }
                          pill
                        >
                          {memberBalance > 0 ? '+' : ''}
                          {formatMoney(memberBalance, currentBoard.currency)}
                        </Badge>
                      </Td>
                    </TRow>
                  );
                })}
              </Tbody>
            </Table>

            {currentBoard.balance.transfers.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <Accordion defaultActiveKeys={['transfers']}>
                  <Accordion.Item itemKey="transfers">
                    <Accordion.Trigger>
                      Plan de remboursement direct entre membres (
                      {currentBoard.balance.transfers.length})
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <Flex direction="column" gap="0.5rem">
                        {currentBoard.balance.transfers.map((tr, idx) => (
                          <Flex
                            key={`${tr.from}-${tr.to}-${idx}`}
                            align="center"
                            justify="space-between"
                          >
                            <Text size="sm">
                              <strong>{tr.fromName}</strong> rembourse{' '}
                              <strong>{tr.toName}</strong>
                            </Text>
                            <Badge variant="primary" pill>
                              {formatMoney(
                                tr.amountCents,
                                currentBoard.currency
                              )}
                            </Badge>
                          </Flex>
                        ))}
                      </Flex>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modales et Tiroir */}
      <ItemFormModal
        isOpen={itemModalOpen}
        board={currentBoard}
        availableTags={tags}
        defaultKind={itemDefaultKind}
        editingLine={editingLine}
        onClose={() => {
          setItemModalOpen(false);
          setEditingLine(null);
        }}
        onSaved={(updated) => setCurrentBoard(updated)}
        onTagsChanged={() => {
          void loadTags(currentBoard.boardId);
        }}
      />

      <AdjustmentModal
        isOpen={Boolean(adjustmentLine)}
        boardId={currentBoard.boardId}
        period={effectivePeriod}
        currency={currentBoard.currency}
        line={adjustmentLine}
        onClose={() => setAdjustmentLine(null)}
        onUpdated={(updated) => setCurrentBoard(updated)}
      />

      <BoardSettingsModal
        isOpen={settingsModalOpen}
        board={currentBoard}
        onClose={() => setSettingsModalOpen(false)}
        onBoardMetaUpdated={() => {
          void loadBoard(currentBoard.boardId, effectivePeriod);
        }}
        onCalculatedBoardUpdated={(updated) => setCurrentBoard(updated)}
        onBoardDeleted={() => navigate(ROUTES.BOARDS)}
      />

      {isShared && (
        <MembersDrawer
          isOpen={membersDrawerOpen}
          board={currentBoard}
          onClose={() => setMembersDrawerOpen(false)}
          onRefreshBoard={async () => {
            await loadBoard(currentBoard.boardId, effectivePeriod);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingLine)}
        onClose={() => setDeletingLine(null)}
        onConfirm={handleConfirmDeleteLine}
        title="Supprimer ce poste ?"
        message={
          deletingLine
            ? `Voulez-vous vraiment supprimer « ${deletingLine.label} » et tout son historique ?`
            : ''
        }
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={isDeletingItem}
      />
    </Flex>
  );
};
