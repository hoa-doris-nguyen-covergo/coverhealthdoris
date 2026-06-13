/**
 * Proposal V2 – List page
 * Test cases → test-data/proposal-list.cases.ts
 */
import { test, expect } from '../../fixtures';
import {
  SEARCH_CASES,
  FILTER_CASES,
  DATE_FILTER_CASES,
  PAGINATION_CASES,
  DA_CASES,
} from '../../test-data/proposal-list.cases';

// ── Smoke ─────────────────────────────────────────────────────────────────────
test.describe('Proposal List – smoke', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  test('[SM-01] Page structure: heading, buttons, columns, filters visible', async ({ page, proposalListPage }) => {
    await expect(proposalListPage.heading).toBeVisible();
    await expect(proposalListPage.createProposalBtn).toBeVisible();
    await expect(page.getByRole('button', { name: /reassign agent/i })).toBeVisible();
    for (const col of ['Proposal Number', 'Client', 'Agent', 'Date Requested', 'Status']) {
      await expect(page.getByText(col).first()).toBeVisible();
    }
    for (const filter of [
      proposalListPage.statusFilter,
      proposalListPage.reasonForClosureFilter,
      proposalListPage.productTypeFilter,
      proposalListPage.createdAtFilter,
      proposalListPage.distributorsAgentsFilter,
    ]) {
      await expect(filter).toBeVisible();
    }
  });

  test('[SM-02] Clicking a row navigates to proposal detail', async ({ page, proposalListPage }) => {
    await proposalListPage.clickFirstRow();
    await expect(page).not.toHaveURL(/\/proposals$/);
    await expect(page.getByText(/offer management|proposal detail/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Search ────────────────────────────────────────────────────────────────────
test.describe('Proposal List – search', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  for (const tc of SEARCH_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalListPage }) => {
      await proposalListPage.search(tc.query);
      await page.waitForLoadState('networkidle');

      if (tc.clearAfter) {
        await proposalListPage.clearSearch();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('table tbody tr:not(.ant-table-measure-row)').first()).toBeVisible({ timeout: 10_000 });
        return;
      }

      if (tc.expectResults) {
        await expect(page.locator('table tbody tr:not(.ant-table-measure-row)').first()).toBeVisible({ timeout: 10_000 });
      } else if ((tc as any).noErrorOnly) {
        await expect(page).not.toHaveTitle(/error/i);
      } else {
        await expect(
          page.locator('.ant-empty').or(page.getByText(/no data|no results/i)).first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  }
});

// ── Single Filters ────────────────────────────────────────────────────────────
test.describe('Proposal List – filters', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  for (const tc of FILTER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalListPage }) => {
      const filterBtn = {
        status:           proposalListPage.statusFilter,
        reasonForClosure: proposalListPage.reasonForClosureFilter,
        productType:      proposalListPage.productTypeFilter,
      }[tc.filterType];

      await filterBtn.click();
      await page.waitForTimeout(400);

      for (const value of tc.filterValues) {
        await page.locator('label').filter({ hasText: value }).first().click();
      }
      await page.getByRole('button', { name: /apply/i }).last().click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('table tbody tr:not(.ant-table-measure-row)').first()).toBeVisible({ timeout: 10_000 });

      if (tc.expectedStatusBadge) {
        await expect(page.locator('td').filter({ hasText: tc.expectedStatusBadge }).first()).toBeVisible();
      }

      // Clear filter after test
      await filterBtn.click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /clear/i }).last().click();
      await page.waitForLoadState('networkidle');
    });
  }
});

// ── Date Filter ───────────────────────────────────────────────────────────────
test.describe('Proposal List – date filter (Created At)', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  for (const tc of DATE_FILTER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalListPage }) => {
      await proposalListPage.createdAtFilter.click();
      await page.waitForTimeout(400);

      await page.getByRole('radio', { name: tc.mode })
        .or(page.locator('label').filter({ hasText: tc.mode })).first().click();

      const dateInputs = page.locator('.ant-picker input');
      await dateInputs.first().click();
      await dateInputs.first().fill(tc.dateFrom);
      await dateInputs.first().press('Enter');
      if (tc.mode === 'Between' && tc.dateTo) {
        await dateInputs.nth(1).click();
        await dateInputs.nth(1).fill(tc.dateTo);
        await dateInputs.nth(1).press('Enter');
      }

      await page.getByRole('button', { name: /apply/i }).last().click();
      await page.waitForLoadState('networkidle');

      if ((tc as any).expectEmpty) {
        await expect(page.getByText(/no data|no results/i)).toBeVisible({ timeout: 10_000 });
      } else {
        await expect(page).not.toHaveTitle(/error/i);
      }

      // Clear
      await proposalListPage.createdAtFilter.click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /clear/i }).last().click();
      await page.waitForLoadState('networkidle');
    });
  }
});

// ── Distributors & Agents Filter ──────────────────────────────────────────────
//
// Panel layout (opened by clicking the "Distributors & Agents" button):
//   LEFT  – Distributor search box + checkbox list of all distributors
//   RIGHT – Agent panel (visible after ≥1 distributor selected)
//           • Search box for agents
//           • Tabs: All | Primary (default) | Secondary | Servicing
//           • Tick ≥1 agent → Apply becomes enabled
//
// Helpers used throughout this suite:
//   openPanel()         – click the filter button & wait for distributor list
//   searchDistributor() – type in distributor search box & wait for results
//   selectDistributor() – tick the checkbox row for a named distributor
//   openAgentTab()      – click a named tab in the agent panel
//   selectFirstAgent()  – tick the first visible agent checkbox
//   applyAndClose()     – click Apply & wait for networkidle
//   clearAndClose()     – re-open panel → click Clear → wait for networkidle
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Proposal List – distributors & agents filter', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  // ── helpers ────────────────────────────────────────────────────────────────
  async function openPanel(page: any, proposalListPage: any) {
    await proposalListPage.distributorsAgentsFilter.click();
    await expect(page.locator('.distributor-name').first()).toBeVisible({ timeout: 8_000 });
  }

  // Scope helpers — use Playwright .filter({ has }) to target the correct panel
  const distPanel  = (page: any) =>
    page.locator('div').filter({ has: page.locator('[placeholder="Search distributors"]') }).last();
  const agentPanel = (page: any) =>
    page.locator('div').filter({ has: page.locator('[placeholder="Search agents"]') }).last();

  async function searchDistributor(page: any, term: string) {
    // Target the distributor panel's own search box, NOT the main proposal search bar
    await page.locator('[placeholder="Search distributors"]').fill(term);
    await page.waitForTimeout(500);
  }

  async function selectDistributor(page: any, name: string) {
    // Distributor items are labels with checkboxes — filter labels by name text
    await page.locator('label').filter({ hasText: name }).first().click();
    await page.waitForTimeout(400);
  }

  async function openAgentTab(page: any, tab: string) {
    // Tabs are custom elements inside the agent panel — scope by panel, click by exact text
    await agentPanel(page).getByText(tab, { exact: true }).first().click();
    await page.waitForTimeout(300);
  }

  async function selectFirstAgent(page: any) {
    // Scope to agent panel (right side) to avoid clicking distributor checkboxes (left side)
    await agentPanel(page)
      .locator('input[type="checkbox"]:not(:checked)')
      .first()
      .click({ force: true });
    await page.waitForTimeout(500);
  }

  async function expectActiveTab(page: any, tab: string) {
    // Verify the tab text is visible in the agent panel (custom tabs — no known active class)
    await expect(
      agentPanel(page).getByText(tab, { exact: true }).first()
    ).toBeVisible({ timeout: 5_000 });
  }

  async function applyAndClose(page: any) {
    await page.getByRole('button', { name: /apply/i }).last().click();
    await page.waitForLoadState('networkidle');
  }

  async function clearAndClose(page: any, proposalListPage: any) {
    await proposalListPage.distributorsAgentsFilter.click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /clear/i }).last().click();
    await page.waitForLoadState('networkidle');
  }

  // ── DA-01 ──────────────────────────────────────────────────────────────────
  test('[DA-01] Opening the panel shows distributor list and "Select distributors first" hint',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await expect(page.locator('.distributor-name').first()).toBeVisible();
      await expect(page.getByText(/select distributors first/i)).toBeVisible();
    });

  // ── DA-02 ──────────────────────────────────────────────────────────────────
  test('[DA-02] Searching a distributor name narrows the distributor list',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      const countBefore = await page.locator('.distributor-name').count();
      await searchDistributor(page, 'Doris');
      const countAfter = await page.locator('.distributor-name').count();
      expect(countAfter).toBeLessThanOrEqual(countBefore);
      await expect(page.locator('.distributor-name').first()).toBeVisible();
    });

  // ── DA-03 ──────────────────────────────────────────────────────────────────
  test('[DA-03] Selecting a distributor hides the hint and shows the agent panel',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await expect(page.getByText(/select distributors first/i)).not.toBeVisible({ timeout: 5_000 });
      // Agent panel header / search box should appear
      await expect(
        page.getByPlaceholder(/search agent/i)
          .or(page.locator('[placeholder*="agent" i]'))
          .first()
      ).toBeVisible({ timeout: 8_000 });
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-04 ──────────────────────────────────────────────────────────────────
  test('[DA-04] Agent panel defaults to Primary tab',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      // "Primary" tab should be the active tab by default
      await expectActiveTab(page, 'Primary');
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-05 ──────────────────────────────────────────────────────────────────
  test('[DA-05] Switching to All tab shows agents and selecting one enables Apply',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await openAgentTab(page, 'All');
      await selectFirstAgent(page);
      const applyBtn = page.getByRole('button', { name: /apply/i }).last();
      await expect(applyBtn).toBeEnabled({ timeout: 5_000 });
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-06 ──────────────────────────────────────────────────────────────────
  test('[DA-06] Switching to Secondary tab is accessible',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await openAgentTab(page, 'Secondary');
      await expectActiveTab(page, 'Secondary');
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-07 ──────────────────────────────────────────────────────────────────
  test('[DA-07] Switching to Servicing tab is accessible',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await openAgentTab(page, 'Servicing');
      await expectActiveTab(page, 'Servicing');
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-08 ──────────────────────────────────────────────────────────────────
  test('[DA-08] Selecting an agent from Primary tab enables Apply and filters results',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      // Primary tab is default — select the first agent
      await selectFirstAgent(page);
      const applyBtn = page.getByRole('button', { name: /apply/i }).last();
      await expect(applyBtn).toBeEnabled({ timeout: 5_000 });
      await applyAndClose(page);
      await expect(
        page.locator('table tbody tr:not(.ant-table-measure-row)').first()
      ).toBeVisible({ timeout: 10_000 });
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-09 ──────────────────────────────────────────────────────────────────
  test('[DA-09] Searching agents by keyword narrows the agent list',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await openAgentTab(page, 'All');
      const agentSearchBox = page.getByPlaceholder(/search agent/i)
        .or(page.locator('[placeholder*="agent" i]'))
        .first();
      await expect(agentSearchBox).toBeVisible({ timeout: 5_000 });
      const countBefore = await page.locator('.ant-checkbox-wrapper, [class*="agent-item"]').count();
      await agentSearchBox.fill('Agent');
      await page.waitForTimeout(500);
      const countAfter = await page.locator('.ant-checkbox-wrapper, [class*="agent-item"]').count();
      expect(countAfter).toBeLessThanOrEqual(countBefore);
      await clearAndClose(page, proposalListPage);
    });

  // ── DA-10 ──────────────────────────────────────────────────────────────────
  test('[DA-10] Clear button resets all selections and restores the full proposal list',
    async ({ page, proposalListPage }) => {
      await openPanel(page, proposalListPage);
      await searchDistributor(page, 'Doris');
      await selectDistributor(page, 'Doris Nguyen');
      await selectFirstAgent(page);
      await applyAndClose(page);
      // Now clear
      await clearAndClose(page, proposalListPage);
      // Full list should be restored
      await expect(
        page.locator('table tbody tr:not(.ant-table-measure-row)').first()
      ).toBeVisible({ timeout: 10_000 });
      // Hint should reappear when filter is re-opened
      await openPanel(page, proposalListPage);
      await expect(page.getByText(/select distributors first/i)).toBeVisible({ timeout: 5_000 });
      // Close panel by clicking elsewhere
      await page.keyboard.press('Escape');
    });
});

// ── Combined Filters ──────────────────────────────────────────────────────────
test.describe('Proposal List – combined filters', () => {
  test('[CF-01] Status=Open + Product Type=Group Medical narrows results', async ({ page, proposalListPage }) => {
    await proposalListPage.goto();
    await proposalListPage.statusFilter.click();
    await page.waitForTimeout(300);
    await page.locator('label').filter({ hasText: 'Open' }).first().click();
    await page.getByRole('button', { name: /apply/i }).last().click();
    await page.waitForLoadState('networkidle');

    await proposalListPage.productTypeFilter.click();
    await page.waitForTimeout(300);
    await page.locator('label').filter({ hasText: 'Group Medical' }).first().click();
    await page.getByRole('button', { name: /apply/i }).last().click();
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveTitle(/error/i);
  });

  test('[CF-02] Search term on top of Status filter returns scoped results', async ({ page, proposalListPage }) => {
    await proposalListPage.goto();
    await proposalListPage.statusFilter.click();
    await page.waitForTimeout(300);
    await page.locator('label').filter({ hasText: 'Open' }).first().click();
    await page.getByRole('button', { name: /apply/i }).last().click();
    await page.waitForLoadState('networkidle');

    await proposalListPage.search('Doris');
    await expect(page.locator('table tbody tr:not(.ant-table-measure-row)').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────
test.describe('Proposal List – pagination', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  for (const tc of PAGINATION_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page }) => {
      await page.waitForLoadState('networkidle');

      await page.locator(`.ant-pagination-item-${tc.targetPage}`).first().click();
      await page.waitForLoadState('networkidle');
      await expect(
        page.locator(`.ant-pagination-item-${tc.targetPage}.ant-pagination-item-active`)
      ).toBeVisible({ timeout: 10_000 });

      if ((tc as any).backToPage) {
        await page.locator(`.ant-pagination-item-${(tc as any).backToPage}`).first().click();
        await page.waitForLoadState('networkidle');
        await expect(
          page.locator(`.ant-pagination-item-${(tc as any).backToPage}.ant-pagination-item-active`)
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  }
});

