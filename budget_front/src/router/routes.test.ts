import { describe, expect, it } from 'vitest';
import { buildBoardPath, buildExpenseGroupPath, buildInvitationPath } from './routes';

describe('routes builders', () => {
  it('construit le chemin d’un board avec ou sans mois', () => {
    expect(buildBoardPath('01a17f6c-1234')).toBe('/boards/01a17f6c-1234');
    expect(buildBoardPath('01a17f6c-1234', '2026-10')).toBe('/boards/01a17f6c-1234?month=2026-10');
  });

  it('construit le chemin d’un groupe de dépenses et d’une invitation', () => {
    expect(buildExpenseGroupPath('grp-1')).toBe('/expense-groups/grp-1');
    expect(buildInvitationPath('invitation-camille-appartement')).toBe(
      '/invitations/invitation-camille-appartement'
    );
  });
});
