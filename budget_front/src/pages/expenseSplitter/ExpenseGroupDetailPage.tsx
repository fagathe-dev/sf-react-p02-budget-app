import { useBudget } from '@/hooks/useBudget';
import { ROUTES } from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import {
  fetchExpenseGroup,
  fetchExpenses,
  fetchSettlements,
  voidExpense,
  voidSettlement,
} from '@/services/expenseSplitter.api';
import { BalanceTransfer } from '@/types/budget.types';
import {
  Expense,
  ExpenseGroupDetail,
  ExpenseListFilters,
  GroupBalancesResponse,
  Settlement,
} from '@/types/expenseSplitter.types';
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  ChoiceField,
  Col,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Flex,
  Icon,
  IconButton,
  Loading,
  Row,
  StatCard,
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
  Title,
  Tooltip,
  TRow,
  useToast,
} from '@/ui/components';
import {
  formatDateShort,
  formatMoney,
  formatSignedMoney,
  SPLIT_STRATEGY_LABELS,
} from '@/utils/budget';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ExpenseFormModal,
  GroupParticipantsDrawer,
  GroupSettingsModal,
  SettlementModal,
} from './components';

export interface ExpenseGroupDetailPageProps {
  // Définition des props
}

export const ExpenseGroupDetailPage: React.FC<ExpenseGroupDetailPageProps> = (
  props
) => {
  void props;

  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { success } = useToast();
  const { tags, loadTags } = useBudget();

  const [groupDetail, setGroupDetail] = useState<ExpenseGroupDetail | null>(
    null
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres de dépenses
  const [filterPaidBy, setFilterPaidBy] = useState('');
  const [filterTagId, setFilterTagId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Modales & actions
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [voidingExpense, setVoidingExpense] = useState<Expense | null>(null);
  const [isVoidingExpense, setIsVoidingExpense] = useState(false);

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [prefillTransfer, setPrefillTransfer] =
    useState<BalanceTransfer | null>(null);
  const [voidingSettlement, setVoidingSettlement] = useState<Settlement | null>(
    null
  );
  const [isVoidingSettlement, setIsVoidingSettlement] = useState(false);

  const [participantsDrawerOpen, setParticipantsDrawerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const applyBalancesUpdate = (balancesData: GroupBalancesResponse) => {
    setGroupDetail((prev) =>
      prev
        ? {
            ...prev,
            totalSpentCents: balancesData.totalSpentCents,
            balances: balancesData.balances,
            transfers: balancesData.transfers,
          }
        : prev
    );
  };

  const loadExpensesList = useCallback(
    async (id: string, filters?: ExpenseListFilters) => {
      const expRes = await fetchExpenses(id, filters);
      setExpenses(expRes.expenses);
    },
    []
  );

  const loadAll = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const [detailRes, expRes, setRes] = await Promise.all([
          fetchExpenseGroup(id),
          fetchExpenses(id),
          fetchSettlements(id),
        ]);
        setGroupDetail(detailRes);
        setExpenses(expRes.expenses);
        setSettlements(setRes.settlements);
        void loadTags(id);
      } catch (err) {
        setError(
          getErrorMessage(err, 'Impossible de charger ce groupe de dépenses.')
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadTags]
  );

  useEffect(() => {
    if (!groupId) return;
    void loadAll(groupId);
  }, [groupId, loadAll]);

  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    try {
      setError(null);
      await loadExpensesList(groupId, {
        paidBy: filterPaidBy || undefined,
        tagId: filterTagId || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
    } catch (err) {
      setError(
        getErrorMessage(err, 'Impossible de filtrer les dépenses.')
      );
    }
  };

  const handleResetFilters = async () => {
    setFilterPaidBy('');
    setFilterTagId('');
    setFilterFrom('');
    setFilterTo('');
    if (!groupId) return;
    await loadExpensesList(groupId);
  };

  const handleConfirmVoidExpense = async () => {
    if (!groupId || !voidingExpense) return;
    try {
      setIsVoidingExpense(true);
      const balances = await voidExpense(groupId, voidingExpense.id);
      applyBalancesUpdate(balances);
      setExpenses((prev) => prev.filter((e) => e.id !== voidingExpense.id));
      success(`La dépense « ${voidingExpense.label} » a été annulée.`);
      setVoidingExpense(null);
    } catch (err) {
      setVoidingExpense(null);
      setError(
        getErrorMessage(err, "Impossible d'annuler cette dépense.")
      );
    } finally {
      setIsVoidingExpense(false);
    }
  };

  const handleConfirmVoidSettlement = async () => {
    if (!groupId || !voidingSettlement) return;
    try {
      setIsVoidingSettlement(true);
      const balances = await voidSettlement(groupId, voidingSettlement.id);
      applyBalancesUpdate(balances);
      setSettlements((prev) =>
        prev.filter((s) => s.id !== voidingSettlement.id)
      );
      success('Le remboursement a été annulé.');
      setVoidingSettlement(null);
    } catch (err) {
      setVoidingSettlement(null);
      setError(
        getErrorMessage(err, "Impossible d'annuler ce remboursement.")
      );
    } finally {
      setIsVoidingSettlement(false);
    }
  };

  if (isLoading && !groupDetail) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="1rem"
        style={{ padding: '4rem 0' }}
      >
        <Loading size="lg" label="Chargement du groupe de dépenses…" />
        <Text size="sm" color="muted">
          Chargement des dépenses et calcul des soldes…
        </Text>
      </Flex>
    );
  }

  if (!groupDetail) {
    return (
      <Flex direction="column" gap="1rem">
        {error && <Alert variant="danger">{error}</Alert>}
        <EmptyState
          icon="alert-circle-outline"
          title="Groupe de dépenses introuvable"
          description="Ce groupe n'existe pas ou vous n'y avez pas accès."
          action={
            <Button href={ROUTES.EXPENSE_GROUPS} variant="primary">
              Retour aux groupes
            </Button>
          }
        />
      </Flex>
    );
  }

  const currency = groupDetail.group.currency;
  const activeMembers = groupDetail.members.filter((m) => m.status !== 'left');
  const myMember = groupDetail.members.find(
    (m) => m.id === groupDetail.myMemberId
  );
  const canEdit = myMember ? myMember.role !== 'viewer' : true;
  const canManage = myMember ? myMember.role === 'owner' : false;

  const myBalanceEntry = groupDetail.balances.find(
    (b) => b.memberId === groupDetail.myMemberId
  );
  const myPaidCents = myBalanceEntry?.paidCents ?? 0;
  const myOwedCents = myBalanceEntry?.owedCents ?? 0;
  const myBalanceCents = myBalanceEntry?.balanceCents ?? 0;

  const findMemberName = (memberId: string): string =>
    groupDetail.members.find((m) => m.id === memberId)?.displayName ??
    'Participant';

  const findTag = (tagId: string | null) =>
    tagId ? tags.find((t) => t.id === tagId) : undefined;

  return (
    <Flex direction="column" gap="1.5rem">
      <Breadcrumb
        items={[
          {
            label: 'Dépenses partagées',
            to: ROUTES.EXPENSE_GROUPS,
            icon: 'account-group-outline',
          },
          { label: groupDetail.group.name, active: true },
        ]}
      />

      {/* En-tête du groupe */}
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <Flex align="center" gap="0.75rem" wrap="wrap">
          <Title as="h2" style={{ margin: 0 }}>
            {groupDetail.group.name}
          </Title>
          <Badge variant="info" pill>
            {activeMembers.length} participant
            {activeMembers.length > 1 ? 's' : ''}
          </Badge>
        </Flex>

        <Flex align="center" gap="0.5rem" wrap="wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParticipantsDrawerOpen(true)}
          >
            <Icon name="account-multiple-outline" size={18} />
            <span>Participants ({activeMembers.length})</span>
          </Button>

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
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPrefillTransfer(null);
                  setSettlementModalOpen(true);
                }}
              >
                <Icon name="cash-Transfer" size={18} />
                <span>Rembourser</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
              >
                <Icon name="plus" size={18} />
                <span>Ajouter une dépense</span>
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

      {/* Cartes KPI */}
      <Row gutter="1rem">
        <Col span={12} sm={6} lg={3}>
          <StatCard
            label="Total dépensé du groupe"
            value={formatMoney(groupDetail.totalSpentCents, currency)}
            icon="cash-multiple"
            trend={`${expenses.length} dépense${expenses.length > 1 ? 's' : ''}`}
            trendVariant="info"
          />
        </Col>
        <Col span={12} sm={6} lg={3}>
          <StatCard
            label="J'ai avancé"
            value={formatMoney(myPaidCents, currency)}
            icon="wallet-outline"
            trendVariant="primary"
          />
        </Col>
        <Col span={12} sm={6} lg={3}>
          <StatCard
            label="Ma part des dépenses"
            value={formatMoney(myOwedCents, currency)}
            icon="chart-pie"
            trendVariant="warning"
          />
        </Col>
        <Col span={12} sm={6} lg={3}>
          <StatCard
            label="Mon solde net"
            value={formatSignedMoney(myBalanceCents, currency)}
            icon="scale-balance"
            trend={
              myBalanceCents > 0
                ? 'On vous doit de l’argent'
                : myBalanceCents < 0
                  ? 'Vous devez rembourser'
                  : 'À l’équilibre'
            }
            trendVariant={
              myBalanceCents === 0
                ? 'success'
                : myBalanceCents > 0
                  ? 'info'
                  : 'warning'
            }
          />
        </Col>
      </Row>

      {/* Navigation par onglets : Dépenses | Équilibre & Virements | Remboursements */}
      <Tabs defaultValue="expenses">
        <TabList>
          <TabTrigger value="expenses">
            <Icon name="receipt-text-outline" size={16} />
            <span>Dépenses ({expenses.length})</span>
          </TabTrigger>
          <TabTrigger value="balances">
            <Icon name="scale-balance" size={16} />
            <span>
              Équilibre & Virements ({groupDetail.transfers.length})
            </span>
          </TabTrigger>
          <TabTrigger value="settlements">
            <Icon name="handshake-outline" size={16} />
            <span>Remboursements ({settlements.length})</span>
          </TabTrigger>
        </TabList>

        {/* ONGLET 1 : Liste des dépenses */}
        <TabContent value="expenses">
          <Flex direction="column" gap="1rem">
            <Card bordered elevation="sm">
              <Card.Body>
                <form onSubmit={handleApplyFilters}>
                  <Row gutter="0.75rem">
                    <Col span={12} sm={6} md={3}>
                      <ChoiceField
                        label="Payé par"
                        value={filterPaidBy}
                        onChange={(e) => setFilterPaidBy(e.target.value)}
                      >
                        <option value="">Tous les participants</option>
                        {groupDetail.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName}
                          </option>
                        ))}
                      </ChoiceField>
                    </Col>
                    <Col span={12} sm={6} md={3}>
                      <ChoiceField
                        label="Tag"
                        value={filterTagId}
                        onChange={(e) => setFilterTagId(e.target.value)}
                      >
                        <option value="">Tous les tags</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </ChoiceField>
                    </Col>
                    <Col span={12} sm={6} md={2}>
                      <TextField
                        label="Du (AAAA-MM-JJ)"
                        placeholder="2026-08-01"
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                      />
                    </Col>
                    <Col span={12} sm={6} md={2}>
                      <TextField
                        label="Au (AAAA-MM-JJ)"
                        placeholder="2026-08-31"
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                      />
                    </Col>
                    <Col span={12} md={2}>
                      <Flex
                        align="flex-end"
                        gap="0.5rem"
                        style={{ height: '100%', paddingBottom: '0.75rem' }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Filtrer
                        </Button>
                        {(filterPaidBy ||
                          filterTagId ||
                          filterFrom ||
                          filterTo) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </Flex>
                    </Col>
                  </Row>
                </form>
              </Card.Body>
            </Card>

            <Card bordered elevation="sm">
              <Card.Body>
                {expenses.length === 0 ? (
                  <EmptyState
                    icon="receipt-text-outline"
                    title="Aucune dépense enregistrée"
                    description="Ajoutez une première dépense pour calculer automatiquement les parts et l'équilibre entre participants."
                    action={
                      canEdit ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setEditingExpense(null);
                            setExpenseModalOpen(true);
                          }}
                        >
                          <Icon name="plus" size={16} />
                          <span>Ajouter une dépense</span>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <Table hoverable bordered>
                    <Thead>
                      <TRow>
                        <Th width="110px">Date</Th>
                        <Th>Dépense</Th>
                        <Th>Payé par</Th>
                        <Th>Répartition</Th>
                        <Th align="right">Montant</Th>
                        {canEdit && (
                          <Th align="right" width="70px">
                            Actions
                          </Th>
                        )}
                      </TRow>
                    </Thead>
                    <Tbody>
                      {expenses.map((expense) => {
                        const tag = findTag(expense.tagId);
                        const strategyLabel =
                          SPLIT_STRATEGY_LABELS[
                            expense.splitStrategy as keyof typeof SPLIT_STRATEGY_LABELS
                          ] ?? expense.splitStrategy;

                        return (
                          <TRow key={expense.id}>
                            <Td>
                              <Text size="xs" color="muted">
                                {formatDateShort(expense.spentOn)}
                              </Text>
                            </Td>

                            <Td>
                              <Flex
                                align="center"
                                gap="0.5rem"
                                wrap="wrap"
                              >
                                <Text weight="semibold" size="sm">
                                  {expense.label}
                                </Text>
                                {expense.supersedesId && (
                                  <Badge variant="info" pill>
                                    Corrigée
                                  </Badge>
                                )}
                                {tag && (
                                  <Badge color={tag.hex} pill>
                                    {tag.name}
                                  </Badge>
                                )}
                              </Flex>
                            </Td>

                            <Td>
                              <Flex align="center" gap="0.5rem">
                                <Avatar
                                  name={findMemberName(expense.paidByMemberId)}
                                  size="sm"
                                />
                                <Text size="sm" weight="medium">
                                  {findMemberName(expense.paidByMemberId)}
                                </Text>
                              </Flex>
                            </Td>

                            <Td>
                              <Flex direction="column" gap="0.2rem">
                                <Text size="xs" color="muted">
                                  {strategyLabel} ({expense.shares.length}{' '}
                                  participant
                                  {expense.shares.length > 1 ? 's' : ''})
                                </Text>
                                <Flex gap="0.35rem" wrap="wrap">
                                  {expense.shares.map((share) => (
                                    <Badge
                                      key={share.memberId}
                                      variant="neutral"
                                      pill
                                    >
                                      {findMemberName(share.memberId)} :{' '}
                                      {formatMoney(
                                        share.amountCents,
                                        expense.amount.currency
                                      )}
                                    </Badge>
                                  ))}
                                </Flex>
                              </Flex>
                            </Td>

                            <Td align="right">
                              <Text weight="bold" size="sm">
                                {formatMoney(
                                  expense.amount.amountCents,
                                  expense.amount.currency
                                )}
                              </Text>
                            </Td>

                            {canEdit && (
                              <Td align="right">
                                <Dropdown>
                                  <Dropdown.Trigger>
                                    <IconButton
                                      name="dots-vertical"
                                      size="sm"
                                      variant="ghost"
                                      aria-label={`Actions pour ${expense.label}`}
                                    />
                                  </Dropdown.Trigger>
                                  <Dropdown.Menu align="right" minWidth="190px">
                                    <Dropdown.Item
                                      icon={
                                        <Icon name="pencil-outline" size={16} />
                                      }
                                      onClick={() => {
                                        setEditingExpense(expense);
                                        setExpenseModalOpen(true);
                                      }}
                                    >
                                      Corriger la dépense…
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                      variant="danger"
                                      icon={
                                        <Icon
                                          name="trash-can-outline"
                                          size={16}
                                        />
                                      }
                                      onClick={() => setVoidingExpense(expense)}
                                    >
                                      Annuler la dépense
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </Td>
                            )}
                          </TRow>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Flex>
        </TabContent>

        {/* ONGLET 2 : Équilibre & Plan de virements ("Qui doit combien à qui") */}
        <TabContent value="balances">
          <Row gutter="1.5rem">
            <Col span={12} lg={5}>
              <Card bordered elevation="sm">
                <Card.Header>
                  <Flex align="center" gap="0.5rem">
                    <Icon name="swap-horizontal" size={20} />
                    <Card.Title>
                      Remboursements conseillés ({groupDetail.transfers.length})
                    </Card.Title>
                  </Flex>
                </Card.Header>
                <Card.Body>
                  {groupDetail.transfers.length === 0 ? (
                    <EmptyState
                      icon="check-decagram-outline"
                      title="Tout le monde est à l'équilibre !"
                      description="Aucun remboursement n'est nécessaire entre les participants pour le moment."
                    />
                  ) : (
                    <Flex direction="column" gap="0.75rem">
                      {groupDetail.transfers.map((tr, idx) => (
                        <Card
                          key={`${tr.from}-${tr.to}-${idx}`}
                          bordered
                          elevation="none"
                        >
                          <Card.Body>
                            <Flex
                              align="center"
                              justify="space-between"
                              gap="0.75rem"
                              wrap="wrap"
                            >
                              <Flex direction="column" gap="0.2rem">
                                <Text size="sm">
                                  <strong>{tr.fromName}</strong> doit à{' '}
                                  <strong>{tr.toName}</strong>
                                </Text>
                                <Text weight="bold" size="lg" color="primary">
                                  {formatMoney(tr.amountCents, currency)}
                                </Text>
                              </Flex>

                              {canEdit && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setPrefillTransfer(tr);
                                    setSettlementModalOpen(true);
                                  }}
                                >
                                  <Icon name="check" size={16} />
                                  <span>Marquer comme payé</span>
                                </Button>
                              )}
                            </Flex>
                          </Card.Body>
                        </Card>
                      ))}
                    </Flex>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col span={12} lg={7}>
              <Card bordered elevation="sm">
                <Card.Header>
                  <Card.Title>Soldes détaillés par participant</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table hoverable bordered>
                    <Thead>
                      <TRow>
                        <Th>Participant</Th>
                        <Th align="right">A payé</Th>
                        <Th align="right">Part due</Th>
                        <Th align="right">Envoyé / Reçu</Th>
                        <Th align="right">Solde net</Th>
                      </TRow>
                    </Thead>
                    <Tbody>
                      {groupDetail.balances.map((b) => {
                        const badgeVariant =
                          b.balanceCents === 0
                            ? 'success'
                            : b.balanceCents > 0
                              ? 'info'
                              : 'warning';

                        return (
                          <TRow key={b.memberId}>
                            <Td>
                              <Flex align="center" gap="0.5rem">
                                <Avatar name={b.displayName} size="sm" />
                                <Text weight="semibold" size="sm">
                                  {b.displayName}
                                </Text>
                                {b.memberId === groupDetail.myMemberId && (
                                  <Badge variant="primary" pill>
                                    Moi
                                  </Badge>
                                )}
                              </Flex>
                            </Td>
                            <Td align="right">
                              {formatMoney(b.paidCents, currency)}
                            </Td>
                            <Td align="right">
                              {formatMoney(b.owedCents, currency)}
                            </Td>
                            <Td align="right">
                              <Text size="xs" color="muted">
                                +{formatMoney(b.sentCents, currency)} / −
                                {formatMoney(b.receivedCents, currency)}
                              </Text>
                            </Td>
                            <Td align="right">
                              <Badge variant={badgeVariant} pill>
                                {formatSignedMoney(b.balanceCents, currency)}
                              </Badge>
                            </Td>
                          </TRow>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </TabContent>

        {/* ONGLET 3 : Historique des remboursements */}
        <TabContent value="settlements">
          <Card bordered elevation="sm">
            <Card.Body>
              {settlements.length === 0 ? (
                <EmptyState
                  icon="handshake-outline"
                  title="Aucun remboursement enregistré"
                  description="Lorsqu'un participant rembourse un autre membre, enregistrez-le ici ou depuis l'onglet « Équilibre & Virements »."
                  action={
                    canEdit ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setPrefillTransfer(null);
                          setSettlementModalOpen(true);
                        }}
                      >
                        Enregistrer un remboursement
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <Table hoverable bordered>
                  <Thead>
                    <TRow>
                      <Th width="110px">Date</Th>
                      <Th>De</Th>
                      <Th>Vers</Th>
                      <Th>Note</Th>
                      <Th align="right">Montant</Th>
                      {canEdit && (
                        <Th align="right" width="70px">
                          Actions
                        </Th>
                      )}
                    </TRow>
                  </Thead>
                  <Tbody>
                    {settlements.map((settlement) => (
                      <TRow key={settlement.id}>
                        <Td>
                          <Text size="xs" color="muted">
                            {formatDateShort(settlement.settledOn)}
                          </Text>
                        </Td>
                        <Td>
                          <Text weight="semibold" size="sm">
                            {findMemberName(settlement.fromMemberId)}
                          </Text>
                        </Td>
                        <Td>
                          <Text weight="semibold" size="sm">
                            {findMemberName(settlement.toMemberId)}
                          </Text>
                        </Td>
                        <Td>
                          <Text size="sm" color="muted">
                            {settlement.note || '—'}
                          </Text>
                        </Td>
                        <Td align="right">
                          <Badge variant="success" pill>
                            {formatMoney(
                              settlement.amount.amountCents,
                              settlement.amount.currency
                            )}
                          </Badge>
                        </Td>
                        {canEdit && (
                          <Td align="right">
                            <Tooltip
                              content="Annuler ce remboursement"
                              placement="top"
                            >
                              <IconButton
                                name="trash-can-outline"
                                size="sm"
                                variant="danger"
                                aria-label="Annuler ce remboursement"
                                onClick={() => setVoidingSettlement(settlement)}
                              />
                            </Tooltip>
                          </Td>
                        )}
                      </TRow>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </TabContent>
      </Tabs>

      {/* Modales et Tiroir */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        groupId={groupDetail.group.id}
        currency={currency}
        members={groupDetail.members}
        myMemberId={groupDetail.myMemberId}
        availableTags={tags}
        editingExpense={editingExpense}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSaved={(mutation) => {
          applyBalancesUpdate(mutation);
          void loadExpensesList(groupDetail.group.id, {
            paidBy: filterPaidBy || undefined,
            tagId: filterTagId || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
          });
        }}
      />

      <SettlementModal
        isOpen={settlementModalOpen}
        groupId={groupDetail.group.id}
        currency={currency}
        members={groupDetail.members}
        prefillTransfer={prefillTransfer}
        onClose={() => {
          setSettlementModalOpen(false);
          setPrefillTransfer(null);
        }}
        onRecorded={(mutation) => {
          applyBalancesUpdate(mutation);
          setSettlements((prev) => [mutation.settlement, ...prev]);
        }}
      />

      <GroupParticipantsDrawer
        isOpen={participantsDrawerOpen}
        groupDetail={groupDetail}
        canManage={canManage}
        onClose={() => setParticipantsDrawerOpen(false)}
        onRefreshGroup={async () => {
          await loadAll(groupDetail.group.id);
        }}
      />

      <GroupSettingsModal
        isOpen={settingsModalOpen}
        groupDetail={groupDetail}
        canCloseGroup={canManage}
        onClose={() => setSettingsModalOpen(false)}
        onUpdated={(updated) => setGroupDetail(updated)}
        onClosedGroup={() => navigate(ROUTES.EXPENSE_GROUPS)}
      />

      <ConfirmDialog
        isOpen={Boolean(voidingExpense)}
        onClose={() => setVoidingExpense(null)}
        onConfirm={handleConfirmVoidExpense}
        title="Annuler cette dépense ?"
        message={
          voidingExpense
            ? `Voulez-vous vraiment annuler la dépense « ${voidingExpense.label} » (${formatMoney(voidingExpense.amount.amountCents, voidingExpense.amount.currency)}) ? Les soldes du groupe seront recalculés immédiatement.`
            : ''
        }
        confirmLabel="Annuler la dépense"
        variant="danger"
        loading={isVoidingExpense}
      />

      <ConfirmDialog
        isOpen={Boolean(voidingSettlement)}
        onClose={() => setVoidingSettlement(null)}
        onConfirm={handleConfirmVoidSettlement}
        title="Annuler ce remboursement ?"
        message="Voulez-vous vraiment annuler ce remboursement ? Les soldes et le plan de virements du groupe seront recalculés."
        confirmLabel="Annuler le remboursement"
        variant="danger"
        loading={isVoidingSettlement}
      />
    </Flex>
  );
};
