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
    noErrorOnly: true,  // app may return results or empty — just assert no crash
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
// DISTRIBUTOR & AGENTS FILTER CASES
// UI flow:
//   1. Click "Distributors & Agents" button → panel opens
//   2. Left side: Distributor search box + checkbox list
//   3. Type distributor name → matching items appear → tick checkbox to select
//   4. Right side: Agent panel appears for selected distributor
//      - Search box for agents
//      - 4 tabs: All | Primary (default) | Secondary | Servicing
//   5. Select ≥1 agent from any tab → Apply button becomes enabled
//   6. Click Apply → list filters; Clear resets
// ─────────────────────────────────────────────────────────────────────────────
export const DISTRIBUTOR_SEARCH_TERM = 'Doris';
export const DISTRIBUTOR_NAME        = 'Doris Nguyen';  // exact match in checkbox list
export const AGENT_SEARCH_TERM       = '';              // leave blank to use default tab
export type AgentTab = 'All' | 'Primary' | 'Secondary' | 'Servicing';

export const DA_CASES = [
  {
    id: 'DA-01',
    description: 'Opening the panel shows distributor list and "Select distributors first" hint',
  },
  {
    id: 'DA-02',
    description: 'Searching a distributor name narrows the distributor list',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
  },
  {
    id: 'DA-03',
    description: 'Selecting a distributor hides the hint and shows the agent panel',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
  },
  {
    id: 'DA-04',
    description: 'Agent panel defaults to Primary tab and lists agents',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    expectAgentTab:    'Primary' as AgentTab,
  },
  {
    id: 'DA-05',
    description: 'Switching to All tab shows agents and selecting one enables Apply',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'All' as AgentTab,
    selectFirstAgent:  true,
  },
  {
    id: 'DA-06',
    description: 'Switching to Secondary tab is accessible',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'Secondary' as AgentTab,
  },
  {
    id: 'DA-07',
    description: 'Switching to Servicing tab is accessible',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'Servicing' as AgentTab,
  },
  {
    id: 'DA-08',
    description: 'Selecting an agent from Primary tab enables Apply and filters results',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'Primary' as AgentTab,
    selectFirstAgent:  true,
    applyFilter:       true,
  },
  {
    id: 'DA-09',
    description: 'Searching agents by keyword narrows the agent list',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'All' as AgentTab,
    agentSearch:       'Agent',
  },
  {
    id: 'DA-10',
    description: 'Clear button resets distributor & agent selections and restores full list',
    distributorSearch: DISTRIBUTOR_SEARCH_TERM,
    distributorName:   DISTRIBUTOR_NAME,
    agentTab:          'Primary' as AgentTab,
    selectFirstAgent:  true,
    applyFilter:       true,
    clearAfter:        true,
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
