/**
 * Test cases for: tests/offer/03-offer-management.spec.ts
 *
 * Covers: add offer (available / released / customize),
 *         view offer grid, multiple offers, send offers.
 */

export const OFFER_MANAGEMENT_CASES = [
  {
    id: 'OM-01',
    description: 'Add one offer from available product',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b', // paste real proposal UUID
    addMethod: 'available' as const,    // 'available' | 'released' | 'customize'
    product: '',                        // leave '' to pick first in the list
    addCount: 1,
  },
  {
    id: 'OM-02',
    description: 'Add two offers and verify both appear in the grid',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    addMethod: 'available' as const,
    product: '',
    addCount: 2,
  },
  // {
  //   id: 'OM-03',
  //   description: 'Add offer from released product',
  //   proposalId: 'YOUR_UUID',
  //   addMethod: 'released' as const,
  //   product: 'Product Name Here',
  //   addCount: 1,
  // },
  // {
  //   id: 'OM-04',
  //   description: 'Add offer by customize product',
  //   proposalId: 'YOUR_UUID',
  //   addMethod: 'customize' as const,
  //   product: '',
  //   addCount: 1,
  // },
];
