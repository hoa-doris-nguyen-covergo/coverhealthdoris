/**
 * Test cases for: tests/proposal/01-list-search-filter.spec.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH CASES
// ─────────────────────────────────────────────────────────────────────────────
export const SEARCH_CASES = [
  {
    id: 'S-01',
    description: 'Search by client name returns matching rows',
    query: 'Doris',
    expectResults: true,
  },
  {
    id: 'S-02',
    description: 'Search by proposal number returns exact row',
    query: 'AFBC8D',
    expectResults: true,
  },
  {
    id: 'S-03',
    description: 'Search by agent name returns matching rows',
    query: 'Chinh',
    expectResults: true,
  },
  {
    id: 'S-04',
    description: 'Unknown search term shows empty state',
    query: 'zzz_nonexistent_xyz',
    expectResults: false,
  },
  {
    id: 'S-05',
    description: 'Special characters do not crash the page',
    query: '!@#$%^',
    expectResults: false,
  },
  {
    id: 'S-06',
    description: 'Clearing search restores full list',
    query: 'AFBC8D',
    clearAfter: true,
    expectResults: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CASES  (one per filter type, covers each dropdown)
// ─────────────────────────────────────────────────────────────────────────────
export type FilterType = 'status' | 'reasonForClosure' | 'productType';

export const FILTER_CASES = [
  {
    id: 'F-01',
    description: 'Filter by Status = Open shows only open proposals',
    filterType: 'status' as FilterType,
    filterValues: ['Open'],
    expectedStatusBadge: 'Open',
  },
  {
    id: 'F-02',
    description: 'Filter by Status = Closed shows only closed proposals',
    filterType: 'status' as FilterType,
    filterValues: ['Closed'],
    expectedStatusBadge: 'Closed',
  },
  {
    id: 'F-03',
    description: 'Filter by Reason for Closure = Policy Issued',
    filterType: 'reasonForClosure' as FilterType,
    filterValues: ['Policy Issued'],
    expectedStatusBadge: null,
  },
  {
    id: 'F-04',
    description: 'Filter by Product Type = Group Medical',
    filterType: 'productType' as FilterType,
    filterValues: ['Group Medical'],
    expectedStatusBadge: null,
  },
  {
    id: 'F-05',
    description: 'Filter by multiple Product Types returns union of results',
    filterType: 'productType' as FilterType,
    filterValues: ['Group Medical', 'Travel'],
    expectedStatusBadge: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATE FILTER CASES  (Created At — one per mode)
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_FILTER_CASES = [
  {
    id: 'DF-01',
    description: 'Created At = On specific date returns same-day proposals',
    mode: 'On' as const,
    dateFrom: '2026-06-11',
    dateTo: null,
  },
  {
    id: 'DF-02',
    description: 'Created At = Between two dates returns proposals in range',
    mode: 'Between' as const,
    dateFrom: '2026-06-01',
    dateTo: '2026-06-11',
  },
  {
    id: 'DF-03',
    description: 'Created At = After a date returns newer proposals',
    mode: 'After' as const,
    dateFrom: '2026-06-01',
    dateTo: null,
  },
  {
    id: 'DF-04',
    description: 'Created At = On future date returns no results (edge)',
    mode: 'On' as const,
    dateFrom: '2099-12-31',
    dateTo: null,
    expectEmpty: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION CASES
// ─────────────────────────────────────────────────────────────────────────────
export const PAGINATION_CASES = [
  {
    id: 'PG-01',
    description: 'Navigating to page 2 loads a different set of rows',
    targetPage: 2,
  },
  {
    id: 'PG-02',
    description: 'Going back to page 1 restores the original first-page rows',
    targetPage: 2,
    backToPage: 1,
  },
];
