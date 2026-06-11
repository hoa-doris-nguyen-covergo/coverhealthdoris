/**
 * Test cases for: tests/offer/04-offer-detail.spec.ts
 *
 * Covers actions on the RIGHT panel of a selected offer:
 *   - Edit policy details
 *   - Offer Level Settings (class / multi-group toggles)
 *   - Create / edit / view class
 *   - Select billing frequency → get premium
 *   - View premium breakdown
 *   - View instalment breakdown
 *   - Duplicate offer
 */

export const POLICY_DETAIL_CASES = [
  {
    id: 'PD-01',
    description: 'Edit policy start and end date',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',                    // leave '' to use first offer in grid
    startDate: '01/01/2027',
    endDate: '31/12/2027',
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const OFFER_SETTINGS_CASES = [
  {
    id: 'OS-01',
    description: 'Enable Class toggle via Offer Level Settings',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    enableClass: true,
    enableMultiGroup: false,
  },
  {
    id: 'OS-02',
    description: 'Enable both Class and Multi-Group toggles',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    enableClass: true,
    enableMultiGroup: true,
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const CLASS_CASES = [
  {
    id: 'CL-01',
    description: 'Create a class',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    action: 'create' as const,          // 'create' | 'edit' | 'view'
    className: 'Class A',
    classDescription: 'Standard coverage',
  },
  {
    id: 'CL-02',
    description: 'Edit an existing class',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    action: 'edit' as const,
    className: 'Class A',               // must already exist in the offer
    classDescription: 'Updated description',
  },
  {
    id: 'CL-03',
    description: 'View a class',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    action: 'view' as const,
    className: 'Class A',
    classDescription: '',
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const PREMIUM_CASES = [
  {
    id: 'PR-01',
    description: 'Select billing frequency Monthly and view premium',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    billingFrequency: 'Monthly',        // must match option label in dev
  },
  {
    id: 'PR-02',
    description: 'Select billing frequency Annual and view premium breakdown',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    billingFrequency: 'Annual',
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const DUPLICATE_OFFER_CASES = [
  {
    id: 'DO-01',
    description: 'Duplicate offer and verify a new offer card appears in grid',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
  },
  // ── add more below ────────────────────────────────────────────────────────
];
