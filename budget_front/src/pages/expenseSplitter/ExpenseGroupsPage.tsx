import { buildExpenseGroupPath } from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import { fetchExpenseGroups } from '@/services/expenseSplitter.api';
import {
  ExpenseGroupDetail,
  ExpenseGroupSummary,
} from '@/types/expenseSplitter.types';
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
  Row,
  Skeleton,
  StatCard,
  Text,
  Title,
} from '@/ui/components';
import {
  formatDateShort,
  formatMoney,
  formatSignedMoney,
} from '@/utils/budget';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateExpenseGroupModal } from './components';

export interface ExpenseGroupsPageProps {
  // Définition des props
}

export const ExpenseGroupsPage: React.FC<ExpenseGroupsPageProps> = (props) => {
  void props;

  const navigate = useNavigate();
  const [groups, setGroups] = useState<ExpenseGroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchExpenseGroups();
      setGroups(res.groups);
    } catch (err) {
      setError(
        getErrorMessage(err, 'Impossible de charger vos groupes de dépenses.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const handleCreatedGroup = (created: ExpenseGroupDetail) => {
    navigate(buildExpenseGroupPath(created.group.id));
  };

  const totalSpentAllCents = groups.reduce(
    (acc, g) => acc + g.totalSpentCents,
    0
  );
  const netBalanceAllCents = groups.reduce(
    (acc, g) => acc + (g.myBalanceCents ?? 0),
    0
  );

  return (
    <Flex direction="column" gap="1.5rem">
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <div>
          <Title as="h2">Dépenses partagées</Title>
          <Lead>
            Saisissez vos dépenses de vacances, sorties ou colocation et équilibrez vos comptes avec un minimum de virements.
          </Lead>
        </div>

        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          <Icon name="plus" size={18} />
          <span>Nouveau groupe</span>
        </Button>
      </Flex>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Grid columns={3} gap="1rem">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
        </Grid>
      ) : (
        <>
          <Row gutter="1rem">
            <Col span={12} sm={4}>
              <StatCard
                label="Groupes actifs"
                value={groups.length}
                icon="account-group-outline"
                trendVariant="primary"
              />
            </Col>
            <Col span={12} sm={4}>
              <StatCard
                label="Total dépensé cumulé"
                value={formatMoney(totalSpentAllCents)}
                icon="cash-multiple"
                trendVariant="info"
              />
            </Col>
            <Col span={12} sm={4}>
              <StatCard
                label="Mon solde net global"
                value={formatSignedMoney(netBalanceAllCents)}
                icon="scale-balance"
                trend={
                  netBalanceAllCents > 0
                    ? 'On vous doit de l’argent'
                    : netBalanceAllCents < 0
                      ? 'Vous devez rembourser'
                      : 'Comptes à l’équilibre'
                }
                trendVariant={
                  netBalanceAllCents === 0
                    ? 'success'
                    : netBalanceAllCents > 0
                      ? 'info'
                      : 'warning'
                }
              />
            </Col>
          </Row>

          {groups.length === 0 ? (
            <EmptyState
              icon="account-group-outline"
              title="Aucun groupe de dépenses"
              description="Créez un groupe pour vos prochaines vacances, un week-end entre amis ou des dépenses ponctuelles à partager."
              action={
                <Button
                  variant="primary"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Icon name="plus" size={16} />
                  <span>Créer mon premier groupe</span>
                </Button>
              }
            />
          ) : (
            <Row gutter="1rem">
              {groups.map((group) => {
                const balance = group.myBalanceCents ?? 0;
                const badgeVariant =
                  balance === 0 ? 'success' : balance > 0 ? 'info' : 'warning';
                const balanceLabel =
                  balance === 0
                    ? 'À l’équilibre'
                    : balance > 0
                      ? `On vous doit ${formatMoney(balance, group.currency)}`
                      : `Vous devez ${formatMoney(Math.abs(balance), group.currency)}`;

                return (
                  <Col key={group.id} span={12} md={6} lg={4}>
                    <Card bordered elevation="sm">
                      <Card.Header>
                        <Flex
                          align="center"
                          justify="space-between"
                          gap="0.5rem"
                          wrap="wrap"
                        >
                          <Card.Title>{group.name}</Card.Title>
                          <Badge variant="neutral" pill>
                            {group.memberCount} participant
                            {group.memberCount > 1 ? 's' : ''}
                          </Badge>
                        </Flex>
                      </Card.Header>

                      <Card.Body>
                        <Flex direction="column" gap="0.75rem">
                          <Flex align="center" justify="space-between">
                            <Text size="xs" color="muted">
                              Total dépensé
                            </Text>
                            <Text weight="bold" size="lg">
                              {formatMoney(
                                group.totalSpentCents,
                                group.currency
                              )}
                            </Text>
                          </Flex>

                          <Flex align="center" justify="space-between">
                            <Text size="xs" color="muted">
                              Ma situation
                            </Text>
                            <Badge variant={badgeVariant} pill>
                              {balanceLabel}
                            </Badge>
                          </Flex>

                          <Flex align="center" justify="space-between">
                            <Text size="xs" color="muted">
                              Créé le
                            </Text>
                            <Text size="xs" color="muted">
                              {formatDateShort(group.createdAt)}
                            </Text>
                          </Flex>
                        </Flex>
                      </Card.Body>

                      <Card.Footer>
                        <Flex justify="flex-end">
                          <Button
                            href={buildExpenseGroupPath(group.id)}
                            variant="outline"
                            size="sm"
                          >
                            <span>Ouvrir le groupe</span>
                            <Icon name="arrow-right" size={16} />
                          </Button>
                        </Flex>
                      </Card.Footer>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      <CreateExpenseGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreatedGroup}
      />
    </Flex>
  );
};
