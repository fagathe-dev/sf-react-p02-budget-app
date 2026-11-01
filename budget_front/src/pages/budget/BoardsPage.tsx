import { useBudget } from '@/hooks/useBudget';
import { buildBoardPath } from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import { BoardSummary, CalculatedBoard } from '@/types/budget.types';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  EmptyState,
  Flex,
  Grid,
  Icon,
  Lead,
  Progress,
  Row,
  Skeleton,
  StatCard,
  Text,
  Title,
} from '@/ui/components';
import {
  formatMoney,
  formatPeriodLabel,
  formatRatioPercent,
  MEMBER_ROLE_LABELS,
} from '@/utils/budget';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateBoardModal, PeriodSelector } from './components';

export const BoardsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    period,
    isCurrentPeriod,
    personalBoard,
    sharedBoards,
    isLoadingBoards,
    setPeriod,
    nextPeriod,
    previousPeriod,
    resetToCurrentPeriod,
    loadBoards,
  } = useBudget();

  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<
    'personal' | 'shared'
  >('shared');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadBoards(period).catch((err) => {
      if (!cancelled) {
        setError(
          getErrorMessage(err, 'Impossible de charger vos espaces budgétaires.')
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [period, loadBoards]);

  const handleCreatedBoard = (created: CalculatedBoard) => {
    navigate(buildBoardPath(created.boardId, period));
  };

  const renderSharedBoardCard = (board: BoardSummary) => {
    const balanceCents = board.balance?.balanceCents ?? 0;
    const balanceVariant =
      balanceCents === 0 ? 'success' : balanceCents > 0 ? 'info' : 'warning';

    return (
      <Card key={board.id} bordered elevation="sm">
        <Card.Header>
          <Flex align="center" justify="space-between" gap="0.75rem" wrap="wrap">
            <Flex align="center" gap="0.5rem">
              <Icon name="home-group" size={20} />
              <Card.Title>{board.name}</Card.Title>
            </Flex>
            <Flex align="center" gap="0.5rem">
              <Badge variant="info" pill>
                {board.memberCount} membre{board.memberCount > 1 ? 's' : ''}
              </Badge>
              {board.role && (
                <Badge variant="neutral" pill>
                  {MEMBER_ROLE_LABELS[board.role]}
                </Badge>
              )}
            </Flex>
          </Flex>
        </Card.Header>

        <Card.Body>
          <Grid columns={2} gap="0.75rem">
            <div>
              <Text size="xs" color="muted">
                Coût total du foyer
              </Text>
              <div>
                <Text weight="bold" size="lg">
                  {formatMoney(board.totals.householdCents, board.currency)}
                </Text>
              </div>
            </div>

            <div>
              <Text size="xs" color="muted">
                Ma part du mois
              </Text>
              <div>
                <Text weight="bold" size="lg" color="primary">
                  {board.myShareCents !== null
                    ? formatMoney(board.myShareCents, board.currency)
                    : '—'}
                </Text>
              </div>
            </div>

            <div>
              <Text size="xs" color="muted">
                Versement compte commun
              </Text>
              <div>
                <Text weight="semibold" size="sm">
                  {board.balance?.contributionCents !== null &&
                  board.balance?.contributionCents !== undefined
                    ? formatMoney(
                        board.balance.contributionCents,
                        board.currency
                      )
                    : '—'}
                </Text>
              </div>
            </div>

            <div>
              <Text size="xs" color="muted">
                Équilibre
              </Text>
              <div>
                <Badge variant={balanceVariant} pill>
                  {board.balance?.summary ?? 'À l’équilibre'}
                </Badge>
              </div>
            </div>
          </Grid>
        </Card.Body>

        <Card.Footer>
          <Flex justify="flex-end">
            <Button
              as={Link}
              to={buildBoardPath(board.id, period)}
              variant="outline"
              size="sm"
            >
              <span>Ouvrir le budget</span>
              <Icon name="arrow-right" size={16} />
            </Button>
          </Flex>
        </Card.Footer>
      </Card>
    );
  };

  const ratioPercent =
    personalBoard?.totals.chargesRatio !== null &&
    personalBoard?.totals.chargesRatio !== undefined
      ? Math.min(100, Math.max(0, Math.round(personalBoard.totals.chargesRatio)))
      : 0;

  return (
    <Flex direction="column" gap="1.5rem">
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <div>
          <Title as="h2">Mes budgets</Title>
          <Lead>
            Pilotez votre budget personnel et vos budgets de foyer pour{' '}
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

          <Button
            variant="primary"
            onClick={() => {
              setCreateDefaultType('shared');
              setCreateModalOpen(true);
            }}
          >
            <Icon name="plus" size={18} />
            <span>Nouveau budget partagé</span>
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Alert
          variant="danger"
          title="Erreur de chargement"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {isLoadingBoards ? (
        <Grid columns={4} gap="1rem">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
        </Grid>
      ) : (
        <>
          <Card bordered elevation="sm">
            <Card.Header>
              <Flex
                align="center"
                justify="space-between"
                gap="1rem"
                wrap="wrap"
              >
                <Flex align="center" gap="0.75rem">
                  <Icon name="wallet-outline" size={22} />
                  <div>
                    <Card.Title>
                      {personalBoard?.name ?? 'Mon budget personnel'}
                    </Card.Title>
                    <Text size="xs" color="muted">
                      Synthèse personnelle incluant vos parts des budgets
                      partagés
                    </Text>
                  </div>
                </Flex>

                {personalBoard ? (
                  <Button
                    as={Link}
                    to={buildBoardPath(personalBoard.id, period)}
                    variant="primary"
                    size="sm"
                  >
                    <span>Détail de mon budget</span>
                    <Icon name="arrow-right" size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setCreateDefaultType('personal');
                      setCreateModalOpen(true);
                    }}
                  >
                    <Icon name="plus" size={16} />
                    <span>Initialiser mon budget</span>
                  </Button>
                )}
              </Flex>
            </Card.Header>

            {personalBoard ? (
              <Card.Body>
                <Row gutter="1rem">
                  <Col span={12} sm={6} lg={3}>
                    <StatCard
                      label="Revenus du mois"
                      value={formatMoney(
                        personalBoard.totals.incomeCents,
                        personalBoard.currency
                      )}
                      icon="cash-plus"
                      trendVariant="success"
                    />
                  </Col>
                  <Col span={12} sm={6} lg={3}>
                    <StatCard
                      label="Charges (perso + foyer)"
                      value={formatMoney(
                        personalBoard.totals.chargesCents,
                        personalBoard.currency
                      )}
                      icon="cart-outline"
                      trend={
                        personalBoard.totals.rollupExpenseCents > 0
                          ? `dont ${formatMoney(personalBoard.totals.rollupExpenseCents, personalBoard.currency)} partagés`
                          : undefined
                      }
                      trendVariant="info"
                    />
                  </Col>
                  <Col span={12} sm={6} lg={3}>
                    <StatCard
                      label="Épargne du mois"
                      value={formatMoney(
                        personalBoard.totals.savingsCents,
                        personalBoard.currency
                      )}
                      icon="piggy-bank-outline"
                      trendVariant="primary"
                    />
                  </Col>
                  <Col span={12} sm={6} lg={3}>
                    <StatCard
                      label="Reste à vivre"
                      value={formatMoney(
                        personalBoard.totals.remainingCents,
                        personalBoard.currency
                      )}
                      icon="scale-balance"
                      trend={`Taux de charges : ${formatRatioPercent(personalBoard.totals.chargesRatio)}`}
                      trendVariant={
                        personalBoard.totals.remainingCents >= 0
                          ? 'success'
                          : 'danger'
                      }
                    />
                  </Col>
                </Row>

                {personalBoard.totals.chargesRatio !== null && (
                  <div style={{ marginTop: '1rem' }}>
                    <Flex
                      align="center"
                      justify="space-between"
                      style={{ marginBottom: '0.35rem' }}
                    >
                      <Text size="xs" color="muted">
                        Poids des charges sur vos revenus
                      </Text>
                      <Text size="xs" weight="semibold">
                        {formatRatioPercent(personalBoard.totals.chargesRatio)}
                      </Text>
                    </Flex>
                    <Progress
                      value={ratioPercent}
                      variant={
                        ratioPercent > 80
                          ? 'danger'
                          : ratioPercent > 50
                            ? 'warning'
                            : 'success'
                      }
                    />
                  </div>
                )}
              </Card.Body>
            ) : (
              <Card.Body>
                <EmptyState
                  icon="wallet-plus-outline"
                  title="Aucun budget personnel"
                  description="Créez votre budget personnel pour suivre vos revenus, charges, épargne et reste à vivre."
                  action={
                    <Button
                      variant="primary"
                      onClick={() => {
                        setCreateDefaultType('personal');
                        setCreateModalOpen(true);
                      }}
                    >
                      Créer mon budget personnel
                    </Button>
                  }
                />
              </Card.Body>
            )}
          </Card>

          <Divider />

          <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
            <div>
              <Title as="h3">Budgets partagés ({sharedBoards.length})</Title>
              <Text as="p" size="sm">
                Charges communes de votre foyer, couple ou colocation réparties
                automatiquement.
              </Text>
            </div>
          </Flex>

          {sharedBoards.length === 0 ? (
            <EmptyState
              icon="home-group"
              title="Aucun budget partagé pour le moment"
              description="Créez un budget partagé pour répartir les charges communes (loyer, courses, factures) à parts égales, au prorata ou au montant fixe."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setCreateDefaultType('shared');
                    setCreateModalOpen(true);
                  }}
                >
                  <Icon name="plus" size={16} />
                  <span>Créer un budget partagé</span>
                </Button>
              }
            />
          ) : (
            <Row gutter="1rem">
              {sharedBoards.map((board) => (
                <Col key={board.id} span={12} md={6}>
                  {renderSharedBoardCard(board)}
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      <CreateBoardModal
        isOpen={createModalOpen}
        defaultType={createDefaultType}
        hasPersonalBoard={Boolean(personalBoard)}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreatedBoard}
      />
    </Flex>
  );
};
