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
    await expect(page.getByText(/offer management|proposal detail/i)).toBeVisible({ timeout: 10_000 });
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
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
        return;
      }

      if (tc.expectResults) {
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
      } else {
        await expect(page.getByText(/no data|no results/i)).toBeVisible({ timeout: 10_000 });
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

      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });

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

      const dateInputs = page.locator('input[type="date"], input[placeholder*="yyyy" i]');
      await dateInputs.first().fill(tc.dateFrom);
      if (tc.mode === 'Between' && tc.dateTo) {
        await dateInputs.nth(1).fill(tc.dateTo);
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
test.describe('Proposal List – distributors & agents filter', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  test('[DA-01] Opening filter shows distributor list and "Select distributors first" hint', async ({ page, proposalListPage }) => {
    await proposalListPage.distributorsAgentsFilter.click();
    await page.waitForTimeout(400);
    await expect(page.getByText(/BRBF|SH Distributor/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/select distributors first/i)).toBeVisible();
  });

  test('[DA-02] Selecting a distributor hides the hint and loads agents', async ({ page, proposalListPage }) => {
    await proposalListPage.distributorsAgentsFilter.click();
    await page.waitForTimeout(400);
    await page.locator('label').filter({ hasText: 'BRBF' }).first().click();
    await expect(page.getByText(/select distributors first/i)).not.toBeVisible({ timeout: 5_000 });
    // Clear
    await page.getByRole('button', { name: /clear/i }).last().click();
    await page.waitForLoadState('networkidle');
  });

  test('[DA-03] Applying a distributor filter returns filtered results', async ({ page, proposalListPage }) => {
    await proposalListPage.distributorsAgentsFilter.click();
    await page.waitForTimeout(400);
    await page.locator('label').filter({ hasText: 'BRBF' }).first().click();
    await page.getByRole('button', { name: /apply/i }).last().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
    // Clear
    await proposalListPage.distributorsAgentsFilter.click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /clear/i }).last().click();
    await page.waitForLoadState('networkidle');
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
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
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
      const firstRowBefore = await page.locator('table tbody tr').first().textContent();

      await page.getByRole('button', { name: String(tc.targetPage) }).first().click();
      await page.waitForLoadState('networkidle');

      const firstRowAfter = await page.locator('table tbody tr').first().textContent();
      expect(firstRowAfter).not.toBe(firstRowBefore);

      if ((tc as any).backToPage) {
        await page.getByRole('button', { name: String((tc as any).backToPage) }).first().click();
        await page.waitForLoadState('networkidle');
        const restored = await page.locator('table tbody tr').first().textContent();
        expect(restored).toBe(firstRowBefore);
      }
    });
  }
});

