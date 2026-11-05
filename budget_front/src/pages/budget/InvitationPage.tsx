import { useAuth } from '@/hooks/useAuth';
import {
  buildBoardPath,
  buildExpenseGroupPath,
  ROUTES,
} from '@/router/routes';
import { getErrorMessage } from '@/services/apiError';
import {
  acceptInvitation,
  fetchInvitationPreview,
} from '@/services/budget.api';
import { InvitationPreview } from '@/types/budget.types';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Icon,
  Loading,
  Text,
  Title,
  useToast,
} from '@/ui/components';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const { success } = useToast();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Lien d'invitation invalide.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchInvitationPreview(token)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getErrorMessage(err, 'Impossible de récupérer cette invitation.')
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
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setError(null);
    try {
      setIsAccepting(true);
      const result = await acceptInvitation(token);
      success(result.message || 'Invitation acceptée avec succès !');

      if (result.boardType === 'expense_group') {
        navigate(buildExpenseGroupPath(result.boardId));
      } else {
        navigate(buildBoardPath(result.boardId));
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible d'accepter cette invitation.")
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <Card bordered elevation="sm">
        <Card.Body>
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="1rem"
            style={{ padding: '2rem 0' }}
          >
            <Loading size="base" label="Vérification de l'invitation…" />
            <Text size="sm" color="muted">
              Vérification de l'invitation…
            </Text>
          </Flex>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card bordered elevation="sm">
      <Card.Body>
        <Flex direction="column" gap="1rem">
          <Flex align="center" justify="space-between" gap="0.5rem">
            <Title as="h3" style={{ margin: 0 }}>
              Invitation à rejoindre un espace
            </Title>
            {preview && (
              <Badge
                variant={preview.isUsable ? 'success' : 'warning'}
                pill
              >
                {preview.isUsable ? 'Active' : preview.status}
              </Badge>
            )}
          </Flex>

          {error && <Alert variant="danger">{error}</Alert>}

          {preview && (
            <>
              <Text as="p" size="sm">
                {preview.invitedBy ? (
                  <>
                    <strong>{preview.invitedBy}</strong> vous invite à rejoindre{' '}
                  </>
                ) : (
                  <>Vous êtes invité(e) à rejoindre </>
                )}
                l'espace <strong>« {preview.boardName} »</strong> (
                {preview.boardTypeLabel}).
              </Text>

              <Divider margin="0.5rem 0" />

              <Flex direction="column" gap="0.5rem">
                <Flex justify="space-between">
                  <Text size="xs" color="muted">
                    Espace
                  </Text>
                  <Text size="sm" weight="semibold">
                    {preview.boardName}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text size="xs" color="muted">
                    Profil rattaché
                  </Text>
                  <Text size="sm" weight="semibold">
                    {preview.memberName}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text size="xs" color="muted">
                    Expire le
                  </Text>
                  <Text size="sm">
                    {new Date(preview.expiresAt).toLocaleDateString('fr-FR')}
                  </Text>
                </Flex>
              </Flex>

              <Divider margin="0.5rem 0" />

              {!preview.isUsable ? (
                <Alert variant="warning" title="Invitation expirée ou déjà utilisée">
                  Cette invitation n'est plus utilisable. Demandez un nouveau
                  lien au propriétaire du budget.
                </Alert>
              ) : isAuth ? (
                <Button
                  variant="primary"
                  fullWidth
                  loading={isAccepting}
                  onClick={handleAccept}
                >
                  <Icon name="check" size={18} />
                  <span>Accepter et rejoindre « {preview.boardName} »</span>
                </Button>
              ) : (
                <Flex direction="column" gap="0.75rem">
                  <Alert variant="info">
                    Connectez-vous ou créez un compte pour accepter cette
                    invitation.
                  </Alert>
                  <Button href={ROUTES.LOGIN} variant="primary" fullWidth>
                    Se connecter
                  </Button>
                  <Button
                    href={ROUTES.REGISTER}
                    variant="outline"
                    fullWidth
                  >
                    Créer un compte
                  </Button>
                </Flex>
              )}
            </>
          )}

          <Flex justify="center">
            <Button href={ROUTES.HOME} variant="ghost" size="sm">
              Retour à l'accueil
            </Button>
          </Flex>
        </Flex>
      </Card.Body>
    </Card>
  );
};
