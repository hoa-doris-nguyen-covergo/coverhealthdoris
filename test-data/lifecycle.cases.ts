/**
 * Test cases for: tests/offer/06-lifecycle.spec.ts
 *
 * Covers status transitions on an offer:
 *   - Accept offer
 *   - Auto-reject remaining offers when one is accepted
 *   - Issue offer
 */

export const ACCEPT_OFFER_CASES = [
  {
    id: 'AC-01',
    description: 'Accept an offer and verify its status changes to Accepted',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',                    // leave '' to accept the first offer in the grid
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const AUTO_REJECT_CASES = [
  {
    id: 'AR-01',
    description: 'Accept one offer → remaining offers auto-change to Rejected',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerToAccept: '',                  // leave '' to accept first offer
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const ISSUE_OFFER_CASES = [
  {
    id: 'IO-01',
    description: 'Issue an offer and verify policy is created',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
  },
  // ── add more below ────────────────────────────────────────────────────────
];
