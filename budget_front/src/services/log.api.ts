import { LogDate, LogEntry } from '@/types/log.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchLogTree = async (): Promise<LogDate[]> => {
  const res = await fetchAPI<LogDate[]>('/admin/logs');
  if (!res.ok) throw toApiError(res, 'Erreur lors de la récupération des logs.');
  return res.data ?? [];
};

export const fetchLogFile = async (date: string, path: string): Promise<LogEntry[]> => {
  const res = await fetchAPI<LogEntry[]>(`/admin/logs/${date}/${path}`);
  if (!res.ok) throw toApiError(res, 'Erreur lors de la lecture du fichier de log.');
  return res.data ?? [];
};
