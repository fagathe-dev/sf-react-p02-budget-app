import { LogException, LogLevel, LogStackFrame } from '@/types/log.types';
import { BadgeVariant } from '@/ui/components/Base/Badge';

export const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'notice', 'warning', 'error', 'critical'];

/** Équivalent de LoggerLevelEnum::getColor() côté API */
export const LEVEL_VARIANTS: Record<LogLevel, BadgeVariant> = {
  debug: 'neutral',
  info: 'info',
  notice: 'primary',
  warning: 'warning',
  error: 'danger',
  critical: 'danger',
};

/** Équivalent de LoggerLevelEnum::getIcon() (icônes MDI) */
export const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: 'information-outline',
  info: 'information-outline',
  notice: 'book-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  critical: 'alert-circle-outline',
};

export const formatLogTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('fr-FR');
};

/** dd-mm-yyyy → libellé lisible (ex: lundi 26 octobre 2026) */
export const formatLogDate = (date: string): string => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
  if (!match) return date;
  const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const getDeviceIcon = (device: string): string => {
  const value = device.toLowerCase();
  if (value.includes('mobile') || value.includes('phone')) return 'cellphone';
  if (value.includes('tablet')) return 'tablet';
  if (value.includes('cli') || value.includes('terminal') || value.includes('console')) return 'console';
  return 'monitor';
};

/** Valeur de contexte exploitable (les placeholders "unknown" sont ignorés) */
export const contextValue = (context: Record<string, unknown>, key: string): string | null => {
  const value = context[key];
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' || /^unknown/i.test(text) ? null : text;
};

export const toPrettyText = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

/** Exception enregistrée avec sa stack trace (et non un simple message, format historique) */
export const isLogException = (value: unknown): value is LogException => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.class === 'string' && typeof candidate.message === 'string' && Array.isArray(candidate.trace);
};

/** Frame de l'application (hors dépendances vendor/) */
export const isAppFrame = (frame: LogStackFrame): boolean =>
  frame.file !== null && !frame.file.replaceAll('\\', '/').includes('vendor/');
