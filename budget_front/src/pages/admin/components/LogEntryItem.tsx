import { LogEntry } from '@/types/log.types';
import { Badge } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { Accordion } from '@/ui/components/Content/Accordion';
import styled, { css } from 'styled-components';
import { LogExceptionDetails } from './LogExceptionDetails';
import {
  contextValue,
  formatLogTimestamp,
  getDeviceIcon,
  isLogException,
  LEVEL_ICONS,
  LEVEL_VARIANTS,
  toPrettyText,
} from './logFormat';

const HeaderLine = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.colors.text.body};
`;

const StaticHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing[3]} 0`};
`;

const Separator = styled.span`
  opacity: 0.4;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
`;

const Meta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const HeaderMessage = styled.span`
  flex-basis: 100%;
  color: ${({ theme }) => theme.colors.text.heading};
  overflow-wrap: anywhere;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const SectionTitle = styled.p`
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.primary.base};
`;

const Box = styled.div<{ $tone?: 'danger' | 'info' }>`
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.body};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  ${({ $tone, theme }) =>
    $tone &&
    css`
      background-color: ${theme.colors[$tone].subtle};
      border-color: ${theme.colors[$tone].base}40;
      color: ${theme.colors[$tone].emphasis};
    `}
`;

const Code = styled.pre`
  margin: 0;
  max-height: 300px;
  overflow: auto;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const InfoGrid = styled.dl`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  margin: 0;

  dt {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const METHOD_VARIANTS: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

/** Clés de contenu affichées dans des sections dédiées (Log::CONTENT_KEYS) */
const CODE_SECTIONS: Array<{ key: string; title: string; tone?: 'danger' | 'info' }> = [
  { key: 'data', title: 'Données' },
  { key: 'request', title: 'Requête' },
  { key: 'response', title: 'Réponse' },
  { key: 'sql', title: 'SQL', tone: 'info' },
];

const KNOWN_CONTENT_KEYS = new Set(['message', 'exception', ...CODE_SECTIONS.map(({ key }) => key)]);

interface LogEntryItemProps {
  log: LogEntry;
  itemKey: string;
}

export const LogEntryItem = ({ log, itemKey }: LogEntryItemProps) => {
  const { content, context } = log;
  const level = log.level;

  const uid = contextValue(context, 'uid');
  const action = contextValue(context, 'action');
  const device = contextValue(context, 'device');
  const browser = contextValue(context, 'browser');
  const ip = contextValue(context, 'ip');
  const method = contextValue(context, 'method');
  const url = contextValue(context, 'url');
  const referer = contextValue(context, 'referer');
  const userAgent = contextValue(context, 'user_agent');
  const origin = contextValue(context, 'origin');
  const exception = content.exception;
  const structuredException = isLogException(exception) ? exception : null;
  const message =
    typeof content.message === 'string' ? content.message : (structuredException?.message ?? null);

  // Clés libres passées par les services (ex: user_id, error) : regroupées pour rester visibles
  const extraContent = Object.fromEntries(
    Object.entries(content).filter(([key, value]) => !KNOWN_CONTENT_KEYS.has(key) && value !== null && value !== undefined)
  );

  const hasTechnicalInfo = Boolean(device || browser || ip || method || url || userAgent || origin);
  const hasContent = Boolean(uid || action || Object.keys(content).length > 0 || hasTechnicalInfo);

  const header = (
    <HeaderLine>
      <Badge variant={level ? LEVEL_VARIANTS[level] : 'neutral'}>
        <Icon name={level ? LEVEL_ICONS[level] : 'help-circle-outline'} size={14} />
        {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Inconnu'}
      </Badge>
      <Mono>{formatLogTimestamp(log.timestamp)}</Mono>
      {device && (
        <>
          <Separator>|</Separator>
          <Meta>
            <Icon name={getDeviceIcon(device)} size={15} />
            {browser ?? device}
          </Meta>
        </>
      )}
      {ip && (
        <>
          <Separator>|</Separator>
          <Meta>
            <Icon name="web" size={15} />
            <Mono>{ip}</Mono>
          </Meta>
        </>
      )}
      {action && (
        <>
          <Separator>|</Separator>
          <Mono>{action}</Mono>
        </>
      )}
      {message && <HeaderMessage>{message}</HeaderMessage>}
    </HeaderLine>
  );

  if (!hasContent) {
    return (
      <Accordion.Item itemKey={itemKey}>
        <StaticHeader>{header}</StaticHeader>
      </Accordion.Item>
    );
  }

  return (
    <Accordion.Item itemKey={itemKey}>
      <Accordion.Trigger>{header}</Accordion.Trigger>
      <Accordion.Content>
        {uid && (
          <Section>
            <SectionTitle>Utilisateur</SectionTitle>
            <span>{uid}</span>
          </Section>
        )}

        {action && (
          <Section>
            <SectionTitle>Action</SectionTitle>
            <Mono>{action}</Mono>
          </Section>
        )}

        {message && (
          <Section>
            <SectionTitle>Message</SectionTitle>
            <Box>{message}</Box>
          </Section>
        )}

        {exception !== undefined && exception !== null && (
          <Section>
            <SectionTitle>Exception</SectionTitle>
            {structuredException ? (
              <LogExceptionDetails exception={structuredException} />
            ) : (
              <Box $tone="danger">
                <Code>{toPrettyText(exception)}</Code>
              </Box>
            )}
          </Section>
        )}

        {CODE_SECTIONS.filter(({ key }) => content[key] !== undefined && content[key] !== null).map(
          ({ key, title, tone }) => (
            <Section key={key}>
              <SectionTitle>{title}</SectionTitle>
              <Box $tone={tone}>
                <Code>{toPrettyText(content[key])}</Code>
              </Box>
            </Section>
          )
        )}

        {Object.keys(extraContent).length > 0 && (
          <Section>
            <SectionTitle>Autres données</SectionTitle>
            <Box>
              <Code>{toPrettyText(extraContent)}</Code>
            </Box>
          </Section>
        )}

        {hasTechnicalInfo && (
          <Section>
            <SectionTitle>Informations techniques</SectionTitle>
            <Box>
              <InfoGrid>
                {(device || browser) && (
                  <>
                    <dt>Appareil</dt>
                    <dd>{[device, browser].filter(Boolean).join(' - ')}</dd>
                  </>
                )}
                {ip && (
                  <>
                    <dt>Réseau</dt>
                    <dd>
                      <Mono>{ip}</Mono>
                    </dd>
                  </>
                )}
                {(method || url) && (
                  <>
                    <dt>Requête</dt>
                    <dd>
                      {method && (
                        <Badge variant={METHOD_VARIANTS[method.toUpperCase()] ?? 'neutral'} style={{ marginRight: 8 }}>
                          {method}
                        </Badge>
                      )}
                      {url && <Mono>{url}</Mono>}
                      {referer && (
                        <>
                          <br />
                          <Meta>Ref : {referer}</Meta>
                        </>
                      )}
                    </dd>
                  </>
                )}
                {origin && (
                  <>
                    <dt>Fichier</dt>
                    <dd>
                      <Mono>{origin}</Mono>
                    </dd>
                  </>
                )}
                {userAgent && (
                  <>
                    <dt>User Agent</dt>
                    <dd>
                      <Mono>{userAgent}</Mono>
                    </dd>
                  </>
                )}
              </InfoGrid>
            </Box>
          </Section>
        )}
      </Accordion.Content>
    </Accordion.Item>
  );
};
