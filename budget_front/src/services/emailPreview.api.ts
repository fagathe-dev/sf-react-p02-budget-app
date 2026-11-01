import { EmailPreview } from '@/types/emailPreview.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchEmailPreviews = async (): Promise<EmailPreview[]> => {
  const res = await fetchAPI<EmailPreview[]>('/admin/emails');
  if (!res.ok) throw toApiError(res, 'Erreur lors de la récupération des e-mails.');
  return res.data ?? [];
};

/** Retourne le HTML rendu du template d'e-mail (données factices côté API) */
export const fetchEmailPreviewHtml = async (slug: string): Promise<string> => {
  const res = await fetchAPI(`/admin/emails/${slug}`, { responseType: 'text' });
  if (!res.ok) throw toApiError({ status: res.status, data: null }, 'Impossible de générer l\'aperçu de cet e-mail.');
  return res.text;
};
