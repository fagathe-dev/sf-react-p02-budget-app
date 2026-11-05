import { useBudget } from '@/hooks/useBudget';
import { PeriodSelector } from '@/pages/budget/components';
import { buildBoardPath, ROUTES } from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import { fetchInsights } from '@/services/insights.api';
import {
  InsightItem,
  InsightLevel,
  InsightsResponse,
} from '@/types/insights.types';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  EmptyState,
  Flex,
  Grid,
  Icon,
  Lead,
  Progress,
  Row,
  Skeleton,
  StatCard,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Title,
  TRow,
} from '@/ui/components';
import {
  formatMoney,
  formatPeriodLabel,
  formatRatioPercent,
  formatSignedMoney,
  ITEM_KIND_LABELS,
} from '@/utils/budget';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const INSIGHT_ALERT_VARIANT: Record<
  InsightLevel,
  'danger' | 'warning' | 'primary' | 'info' | 'success'
> = {
  alert: 'danger',
  warning: 'warning',
  reminder: 'primary',
  suggestion: 'info',
  info: 'info',
};

const INSIGHT_LEVEL_LABELS: Record<InsightLevel, string> = {
  alert: 'Alerte',
  warning: 'Attention',
  reminder: 'Rappel',
  suggestion: 'Suggestion',
  info: 'Information',
};

export interface InsightsPageProps {
  // Définition des props
}

export const InsightsPage: React.FC<InsightsPageProps> = (props) => {
  void props;

  const {
    period,
    isCurrentPeriod,
    dismissedInsightKeys,
    setPeriod,
    nextPeriod,
    previousPeriod,
    resetToCurrentPeriod,
    dismissInsight,
    clearDismissedInsights,
  } = useBudget();

  const [data, setData] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchInsights(period)
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              "Impossible de charger la synthèse du mois pour l'instant."
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const visibleInsights: InsightItem[] = (data?.insights ?? []).filter(
    (item) => !dismissedInsightKeys.includes(item.key)
  );
  const hiddenCount = (data?.insights.length ?? 0) - visibleInsights.length;

  const chargesRatioValue =
    data?.kpis.chargesRatio !== null && data?.kpis.chargesRatio !== undefined
      ? Math.min(100, Math.max(0, Math.round(data.kpis.chargesRatio)))
      : 0;

  return (
    <Flex direction="column" gap="1.5rem">
      {/* En-tête & Sélecteur de mois */}
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <div>
          <Title as="h2">Vue d'ensemble</Title>
          <Lead>
            Votre situation financière et les points à surveiller pour{' '}
            {formatPeriodLabel(period)}.
          </Lead>
        </div>

        <Flex align="center" gap="0.75rem" wrap="wrap">
          <PeriodSelector
            period={period}
            isCurrentPeriod={isCurrentPeriod}
            onPrevious={() => previousPeriod()}
            onNext={() => nextPeriod()}
            onResetToday={() => resetToCurrentPeriod()}
            onChangePeriod={(next) => setPeriod(next)}
          />

          <Button href={ROUTES.BOARDS} variant="outline" size="sm">
            <Icon name="wallet-outline" size={16} />
            <span>Mes budgets</span>
          </Button>

          <Button
            href={ROUTES.EXPENSE_GROUPS}
            variant="outline"
            size="sm"
          >
            <Icon name="account-group-outline" size={16} />
            <span>Dépenses partagées</span>
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading && !data ? (
        <Grid columns={4} gap="1rem">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
        </Grid>
      ) : (
        data && (
          <>
            {/* 1. KPI du mois */}
            <Row gutter="1rem">
              <Col span={12} sm={6} lg={3}>
                <StatCard
                  label="Reste à vivre du mois"
                  value={formatMoney(data.kpis.remainingCents)}
                  icon="scale-balance"
                  trend={
                    data.kpis.remainingDeltaCents !== 0
                      ? `${formatSignedMoney(data.kpis.remainingDeltaCents)} vs mois dernier`
                      : 'Stable vs mois dernier'
                  }
                  trendVariant={
                    data.kpis.remainingCents < 0
                      ? 'danger'
                      : data.kpis.remainingDeltaCents >= 0
                        ? 'success'
                        : 'warning'
                  }
                />
              </Col>

              <Col span={12} sm={6} lg={3}>
                <StatCard
                  label="Revenus du mois"
                  value={formatMoney(data.kpis.incomeCents)}
                  icon="cash-plus"
                  trendVariant="success"
                />
              </Col>

              <Col span={12} sm={6} lg={3}>
                <StatCard
                  label="Charges totales"
                  value={formatMoney(data.kpis.chargesCents)}
                  icon="cart-outline"
                  trend={
                    data.kpis.sharedChargesCents > 0
                      ? `dont ${formatMoney(data.kpis.sharedChargesCents)} partagés`
                      : data.kpis.chargesDeltaCents !== 0
                        ? `${formatSignedMoney(data.kpis.chargesDeltaCents)} vs mois dernier`
                        : undefined
                  }
                  trendVariant={
                    data.kpis.chargesDeltaCents > 0 ? 'warning' : 'info'
                  }
                />
              </Col>

              <Col span={12} sm={6} lg={3}>
                <StatCard
                  label="Épargne du mois"
                  value={formatMoney(data.kpis.savingsCents)}
                  icon="piggy-bank-outline"
                  trend={
                    data.kpis.chargesRatio !== null
                      ? `Taux de charges : ${formatRatioPercent(data.kpis.chargesRatio)}`
                      : undefined
                  }
                  trendVariant="primary"
                />
              </Col>
            </Row>

            {/* Barre de progression du taux de charges */}
            {data.kpis.chargesRatio !== null && (
              <Card bordered elevation="sm">
                <Card.Body>
                  <Flex
                    align="center"
                    justify="space-between"
                    gap="1rem"
                    wrap="wrap"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <Flex align="center" gap="0.5rem">
                      <Icon name="chart-donut" size={18} />
                      <Text size="sm" weight="medium">
                        Poids des charges sur vos revenus ({formatPeriodLabel(period)})
                      </Text>
                    </Flex>
                    <Badge
                      variant={
                        chargesRatioValue > 65
                          ? 'danger'
                          : chargesRatioValue > 50
                            ? 'warning'
                            : 'success'
                      }
                      pill
                    >
                      {formatRatioPercent(data.kpis.chargesRatio)}
                    </Badge>
                  </Flex>
                  <Progress
                    value={chargesRatioValue}
                    height="8px"
                    variant={
                      chargesRatioValue > 65
                        ? 'danger'
                        : chargesRatioValue > 50
                          ? 'warning'
                          : 'success'
                    }
                  />
                </Card.Body>
              </Card>
            )}

            {/* 2. Messages & Alertes (Insights) */}
            {(visibleInsights.length > 0 || hiddenCount > 0) && (
              <Card bordered elevation="sm">
                <Card.Header>
                  <Flex
                    align="center"
                    justify="space-between"
                    gap="1rem"
                    wrap="wrap"
                  >
                    <Flex align="center" gap="0.5rem">
                      <Icon name="bell-ring-outline" size={20} />
                      <Card.Title>
                        À surveiller ce mois-ci ({visibleInsights.length})
                      </Card.Title>
                    </Flex>

                    {hiddenCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDismissedInsights}
                      >
                        <Icon name="eye-outline" size={16} />
                        <span>
                          Réafficher {hiddenCount} message
                          {hiddenCount > 1 ? 's' : ''} masqué
                          {hiddenCount > 1 ? 's' : ''}
                        </span>
                      </Button>
                    )}
                  </Flex>
                </Card.Header>

                <Card.Body>
                  {visibleInsights.length === 0 ? (
                    <Text size="sm" color="muted">
                      Tous les messages du mois ont été marqués comme lus.
                    </Text>
                  ) : (
                    <Flex direction="column" gap="0.75rem">
                      {visibleInsights.map((item) => (
                        <Alert
                          key={item.key}
                          variant={INSIGHT_ALERT_VARIANT[item.level]}
                          title={INSIGHT_LEVEL_LABELS[item.level]}
                          onClose={() => dismissInsight(item.key)}
                        >
                          <Flex
                            align="center"
                            justify="space-between"
                            gap="1rem"
                            wrap="wrap"
                          >
                            <Text size="sm">{item.message}</Text>

                            <Flex align="center" gap="0.5rem">
                              {item.amountCents !== 0 && (
                                <Badge variant="neutral" pill>
                                  {formatMoney(item.amountCents)}
                                </Badge>
                              )}
                              {item.link && (
                                <Button
                                  href={item.link}
                                  variant="outline"
                                  size="sm"
                                >
                                  <span>Ouvrir</span>
                                  <Icon name="arrow-right" size={15} />
                                </Button>
                              )}
                            </Flex>
                          </Flex>
                        </Alert>
                      ))}
                    </Flex>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* 3. Postes du mois & Budgets partagés */}
            <Row gutter="1.5rem">
              <Col span={12} lg={7}>
                <Card bordered elevation="sm">
                  <Card.Header>
                    <Flex
                      align="center"
                      justify="space-between"
                      gap="1rem"
                      wrap="wrap"
                    >
                      <Flex align="center" gap="0.5rem">
                        <Icon name="calendar-clock" size={20} />
                        <Card.Title>
                          Échéances & postes du mois ({data.upcoming.length})
                        </Card.Title>
                      </Flex>
                      <Button
                        href={ROUTES.BOARDS}
                        variant="ghost"
                        size="sm"
                      >
                        Gérer mes postes
                      </Button>
                    </Flex>
                  </Card.Header>

                  <Card.Body>
                    {data.upcoming.length === 0 ? (
                      <EmptyState
                        icon="calendar-check-outline"
                        title="Aucune échéance enregistrée"
                        description="Vos charges et épargnes actives du mois apparaîtront ici triées par jour de prélèvement."
                        action={
                          <Button
                            href={ROUTES.BOARDS}
                            variant="primary"
                            size="sm"
                          >
                            Ouvrir mon budget
                          </Button>
                        }
                      />
                    ) : (
                      <Table hoverable bordered dense>
                        <Thead>
                          <TRow>
                            <Th width="88px">Jour</Th>
                            <Th>Poste & Budget</Th>
                            <Th>Catégorie</Th>
                            <Th align="right">Ma part</Th>
                          </TRow>
                        </Thead>
                        <Tbody>
                          {data.upcoming.map((item) => (
                            <TRow key={`${item.boardId}-${item.itemId}`}>
                              <Td>
                                <Badge variant="neutral" pill>
                                  {item.dueDay ? `Le ${item.dueDay}` : 'Mensuel'}
                                </Badge>
                              </Td>
                              <Td>
                                <Flex direction="column" gap="0.15rem">
                                  <Text weight="semibold" size="sm">
                                    {item.label}
                                  </Text>
                                  <Link
                                    to={buildBoardPath(item.boardId, period)}
                                    style={{
                                      textDecoration: 'none',
                                      color: 'inherit',
                                    }}
                                  >
                                    <Text size="xs" color="muted">
                                      {item.boardName}
                                    </Text>
                                  </Link>
                                </Flex>
                              </Td>
                              <Td>
                                <Flex align="center" gap="0.35rem" wrap="wrap">
                                  <Badge
                                    variant={
                                      item.kind === 'savings'
                                        ? 'primary'
                                        : 'warning'
                                    }
                                    pill
                                  >
                                    {ITEM_KIND_LABELS[item.kind]}
                                  </Badge>
                                  {item.tags.map((tag) => (
                                    <Badge key={tag.id} color={tag.hex} pill>
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </Flex>
                              </Td>
                              <Td align="right">
                                <Text weight="bold" size="sm">
                                  {formatMoney(item.amountCents)}
                                </Text>
                              </Td>
                            </TRow>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col span={12} lg={5}>
                <Card bordered elevation="sm">
                  <Card.Header>
                    <Flex
                      align="center"
                      justify="space-between"
                      gap="1rem"
                      wrap="wrap"
                    >
                      <Flex align="center" gap="0.5rem">
                        <Icon name="home-group" size={20} />
                        <Card.Title>
                          Budgets partagés ({data.sharedBoards.length})
                        </Card.Title>
                      </Flex>
                      <Button
                        href={ROUTES.BOARDS}
                        variant="ghost"
                        size="sm"
                      >
                        Tout voir
                      </Button>
                    </Flex>
                  </Card.Header>

                  <Card.Body>
                    {data.sharedBoards.length === 0 ? (
                      <EmptyState
                        icon="home-group"
                        title="Aucun budget partagé"
                        description="Créez un budget partagé pour suivre vos dépenses de foyer et vos versements sur compte commun."
                        action={
                          <Button
                            href={ROUTES.BOARDS}
                            variant="outline"
                            size="sm"
                          >
                            Créer un budget partagé
                          </Button>
                        }
                      />
                    ) : (
                      <Flex direction="column" gap="1rem">
                        {data.sharedBoards.map((board) => {
                          const balanceVariant =
                            board.balanceCents === 0
                              ? 'success'
                              : board.balanceCents > 0
                                ? 'info'
                                : 'warning';

                          return (
                            <Card key={board.boardId} bordered elevation="none">
                              <Card.Body>
                                <Flex
                                  align="center"
                                  justify="space-between"
                                  gap="0.5rem"
                                  wrap="wrap"
                                  style={{ marginBottom: '0.75rem' }}
                                >
                                  <Text weight="semibold" size="base">
                                    {board.name}
                                  </Text>
                                  <Button
                                    href={buildBoardPath(board.boardId, period)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <span>Ouvrir</span>
                                    <Icon name="arrow-right" size={14} />
                                  </Button>
                                </Flex>

                                <Grid columns={2} gap="0.5rem">
                                  <div>
                                    <Text size="xs" color="muted">
                                      Total foyer
                                    </Text>
                                    <div>
                                      <Text weight="semibold" size="sm">
                                        {formatMoney(board.householdCents)}
                                      </Text>
                                    </div>
                                  </div>
                                  <div>
                                    <Text size="xs" color="muted">
                                      Ma part
                                    </Text>
                                    <div>
                                      <Text
                                        weight="bold"
                                        size="sm"
                                        color="primary"
                                      >
                                        {formatMoney(board.myShareCents)}
                                      </Text>
                                    </div>
                                  </div>
                                  <div>
                                    <Text size="xs" color="muted">
                                      Versement compte commun
                                    </Text>
                                    <div>
                                      <Text weight="semibold" size="sm">
                                        {formatMoney(board.contributionCents)}
                                      </Text>
                                    </div>
                                  </div>
                                  <div>
                                    <Text size="xs" color="muted">
                                      Équilibre
                                    </Text>
                                    <div>
                                      <Badge variant={balanceVariant} pill>
                                        {board.summary ??
                                          formatSignedMoney(board.balanceCents)}
                                      </Badge>
                                    </div>
                                  </div>
                                </Grid>
                              </Card.Body>
                            </Card>
                          );
                        })}
                      </Flex>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )
      )}
    </Flex>
  );
};
