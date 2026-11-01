import { getErrorMessage } from '@/services/apiError';
import { fetchEmailPreviewHtml, fetchEmailPreviews } from '@/services/emailPreview.api';
import { EmailAddress, EmailPreview } from '@/types/emailPreview.types';
import { Button } from '@/ui/components/Base/Button';
import { Card } from '@/ui/components/Content/Card';
import { EmptyState } from '@/ui/components/Content/EmptyState';
import { ListGroup } from '@/ui/components/Content/ListGroup';
import { Alert } from '@/ui/components/Feedback/Alert';
import { Loading } from '@/ui/components/Feedback/Loading';
import { Text } from '@/ui/components/Typo/Text';
import { Title } from '@/ui/components/Typo/Title';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[0.5]};
  text-align: left;
`;

// Couleur héritée de ListGroupItem (blanche quand l'élément est actif)
const ItemLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const ItemDescription = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  opacity: 0.75;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const EnvelopeGrid = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  column-gap: ${({ theme }) => theme.spacing[3]};
  row-gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const formatAddresses = (addresses: EmailAddress[] | undefined, fallback: string): string =>
  addresses?.length
    ? addresses.map(({ name, email }) => (name ? `${name} <${email}>` : email)).join(', ')
    : fallback;

const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 75vh;
  border: 0;
  background-color: #ffffff;
`;

const CenteredBox = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
`;

export const EmailPreviewPage = () => {
  const [previews, setPreviews] = useState<EmailPreview[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [html, setHtml] = useState<string>('');
  const [isListLoading, setIsListLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHtml = useCallback(async (slug: string) => {
    try {
      setIsPreviewLoading(true);
      setError(null);
      setHtml(await fetchEmailPreviewHtml(slug));
    } catch (err) {
      setHtml('');
      setError(getErrorMessage(err, 'Impossible de générer l\'aperçu de cet e-mail.'));
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  const selectPreview = (slug: string) => {
    setSelectedSlug(slug);
    loadHtml(slug);
  };

  useEffect(() => {
    const loadPreviews = async () => {
      try {
        const data = await fetchEmailPreviews();
        setPreviews(data);
        if (data[0]) {
          setSelectedSlug(data[0].slug);
          await loadHtml(data[0].slug);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Erreur lors de la récupération des e-mails.'));
      } finally {
        setIsListLoading(false);
      }
    };

    loadPreviews();
  }, [loadHtml]);

  const selected = previews.find((p) => p.slug === selectedSlug) ?? null;

  return (
    <Container>
      <div>
        <Title as="h2">Prévisualisation des e-mails</Title>
        <Text color="muted" size="sm">
          Rendu des templates d'e-mails avec des données factices (aucun envoi)
        </Text>
      </div>

      {isListLoading ? (
        <CenteredBox>
          <Loading size="lg" />
        </CenteredBox>
      ) : previews.length === 0 ? (
        <EmptyState icon="email-outline" title="Aucun e-mail" description="Aucun template n'est disponible." />
      ) : (
        <Layout>
          <ListGroup>
            {previews.map((preview) => (
              <ListGroup.Item
                key={preview.slug}
                active={preview.slug === selectedSlug}
                onClick={() => selectPreview(preview.slug)}
              >
                <ItemContent>
                  <ItemLabel>{preview.label}</ItemLabel>
                  <ItemDescription>{preview.description}</ItemDescription>
                </ItemContent>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <Card>
            <PreviewHeader>
              <EnvelopeGrid>
                <Text size="xs" color="muted">
                  De
                </Text>
                <Text size="sm">{formatAddresses(selected?.from, 'Expéditeur non configuré')}</Text>
                <Text size="xs" color="muted">
                  À
                </Text>
                <Text size="sm">{formatAddresses(selected?.to, '—')}</Text>
                <Text size="xs" color="muted">
                  Objet
                </Text>
                <Text weight="semibold" size="sm">
                  {selected?.subject ?? '—'}
                </Text>
              </EnvelopeGrid>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isPreviewLoading}
                disabled={!selectedSlug || isPreviewLoading}
                onClick={() => selectedSlug && loadHtml(selectedSlug)}
              >
                Recharger
              </Button>
            </PreviewHeader>

            {error && (
              <div style={{ padding: 16 }}>
                <Alert variant="danger">{error}</Alert>
              </div>
            )}

            {isPreviewLoading && !html ? (
              <CenteredBox>
                <Loading size="lg" />
              </CenteredBox>
            ) : (
              html && (
                // sandbox vide : aucun script ni navigation depuis le HTML de l'e-mail
                <PreviewFrame title={`Aperçu : ${selected?.label ?? ''}`} srcDoc={html} sandbox="" />
              )
            )}
          </Card>
        </Layout>
      )}
    </Container>
  );
};
