import { PeriodString } from '@/types/budget.types';
import { InsightsResponse } from '@/types/insights.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const INSIGHTS_BASE_URL = '/insights';

/** GET /api/insights?month=AAAA-MM : KPI du mois, alertes/suggestions, postes à venir et boards partagés */
export const fetchInsights = async (month?: PeriodString): Promise<InsightsResponse> => {
  const endpoint = month
    ? `${INSIGHTS_BASE_URL}?month=${encodeURIComponent(month)}`
    : INSIGHTS_BASE_URL;
  const res = await fetchAPI<InsightsResponse>(endpoint);

  if (!res.ok) {
    throw toApiError(res, "Erreur lors du chargement de la page d'accueil");
  }

  return res.data;
};
