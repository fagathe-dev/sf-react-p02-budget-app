import { LogException, LogStackFrame } from '@/types/log.types';
import { Button } from '@/ui/components/Base/Button';
import { useState } from 'react';
import styled, { css } from 'styled-components';
import { isAppFrame } from './logFormat';

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.danger.subtle};
  border: 1px solid ${({ theme }) => theme.colors.danger.base}40;
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.danger.emphasis};
  overflow-wrap: anywhere;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
`;

const ClassName = styled(Mono)`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const Message = styled.span`
  white-space: pre-wrap;
`;

const TraceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const TraceTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const FrameList = styled.ul`
  list-style: none;
  margin: ${({ theme }) => `${theme.spacing[2]} 0 0`};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  max-height: 360px;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.background.body};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
`;

const Frame = styled.li<{ $app: boolean }>`
  padding: ${({ theme }) => `${theme.spacing[1]} 0`};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  overflow-wrap: anywhere;

  ${({ $app, theme }) =>
    $app
      ? css`
          color: ${theme.colors.text.heading};
          font-weight: ${theme.typography.weights.semibold};
        `
      : css`
          color: ${theme.colors.text.muted};
        `}
`;

const FrameIndex = styled.span`
  display: inline-block;
  min-width: 2.5em;
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const FrameLocation = styled.span`
  padding-left: 2.5em;
  display: block;
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const CausedBy = styled.p`
  margin: ${({ theme }) => `${theme.spacing[3]} 0 ${theme.spacing[1]}`};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const formatCall = (frame: LogStackFrame): string => `${frame.class ?? ''}${frame.type ?? ''}${frame.function}()`;

interface LogExceptionDetailsProps {
  exception: LogException;
}

export const LogExceptionDetails = ({ exception }: LogExceptionDetailsProps) => {
  const [showVendor, setShowVendor] = useState(false);

  const appFrameCount = exception.trace.filter(isAppFrame).length;
  const vendorFrameCount = exception.trace.length - appFrameCount;
  // Index d'origine conservé ; sans frame applicative (erreur interne à une dépendance), on affiche tout
  const visibleFrames = exception.trace
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame }) => showVendor || appFrameCount === 0 || isAppFrame(frame));

  return (
    <div>
      <Summary>
        <ClassName>{exception.class}</ClassName>
        <Message>{exception.message}</Message>
        <Mono>
          {exception.file}:{exception.line}
        </Mono>
      </Summary>

      {exception.trace.length > 0 && (
        <>
          <TraceHeader>
            <TraceTitle>
              Stack trace : {exception.trace.length} appel(s)
              {exception.truncated_frames ? ` (+${exception.truncated_frames} non conservés)` : ''}
            </TraceTitle>
            {appFrameCount > 0 && vendorFrameCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowVendor((value) => !value)}>
                {showVendor ? 'Masquer vendor' : `Afficher vendor (${vendorFrameCount})`}
              </Button>
            )}
          </TraceHeader>

          <FrameList>
            {visibleFrames.map(({ frame, index }) => (
              <Frame key={index} $app={isAppFrame(frame)}>
                <FrameIndex>#{index}</FrameIndex>
                {formatCall(frame)}
                <FrameLocation>{frame.file ? `${frame.file}:${frame.line ?? '?'}` : '[interne]'}</FrameLocation>
              </Frame>
            ))}
          </FrameList>
        </>
      )}

      {exception.previous && (
        <>
          <CausedBy>Causée par :</CausedBy>
          <LogExceptionDetails exception={exception.previous} />
        </>
      )}
    </div>
  );
};
