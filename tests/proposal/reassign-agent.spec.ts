/**
 * Reassign Agent – modal flow + post-reassign verification
 *
 * Flow:
 *   1. Open Reassign Agent modal
 *   2. Select distributor (proposals list populates)
 *   3. Select proposal(s)
 *   4. Click Next → select new agent
 *   5. Confirm → verify Agent column in the list is updated
 *
 * Data-driven cases → test-data/reassign-agent.cases.ts
 * Fill in distributor / proposalNumber / toAgent there to enable RA-04 / RA-05.
 */
import { test, expect } from '../../fixtures';
import { REASSIGN_AGENT_CASES } from '../../test-data/reassign-agent.cases';

// ── Modal structure (always run, no test data needed) ─────────────────────────
test.describe('Reassign Agent – modal', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  test('[RA-01] Modal opens with correct heading and constraint hint', async ({ page }) => {
    await page.getByRole('button', { name: /reassign agent/i }).click();
    await expect(page.getByText(/select proposals/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/you can only reassign agent from open proposals/i)).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('[RA-02] Cancel button closes the modal without making changes', async ({ page }) => {
    await page.getByRole('button', { name: /reassign agent/i }).click();
    await expect(page.getByText(/select proposals/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByText(/select proposals/i)).not.toBeVisible({ timeout: 3_000 });
  });

  test('[RA-03] Next is blocked until a distributor is selected (negative)', async ({ page }) => {
    await page.getByRole('button', { name: /reassign agent/i }).click();
    await expect(page.getByText(/select proposals/i)).toBeVisible({ timeout: 5_000 });

    const nextBtn = page.getByRole('button', { name: /next/i });
    const isDisabled = await nextBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBe(true);
    } else {
      // If not visually disabled, clicking Next should not advance the modal
      await nextBtn.click();
      await expect(page.getByText(/select proposals|distributor/i)).toBeVisible({ timeout: 3_000 });
    }
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('[RA-PRE] Selecting a distributor replaces the "select distributors first" hint with proposals list', async ({ page }) => {
    await page.getByRole('button', { name: /reassign agent/i }).click();
    await expect(page.getByText(/select proposals/i)).toBeVisible({ timeout: 5_000 });

    // Pick the first distributor in the dropdown
    const distDropdown = page.getByRole('combobox').first();
    await distDropdown.click();
    await page.locator('[class*="option"]').first().click();
    await page.waitForTimeout(800);

    await expect(page.getByText(/filter by distributor to see proposals/i)).not.toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /cancel/i }).click();
  });
});

// ── End-to-end reassign flow ──────────────────────────────────────────────────
test.describe('Reassign Agent – end-to-end', () => {
  for (const tc of REASSIGN_AGENT_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalListPage }) => {
      const single = tc as any;
      const hasRequiredData = single.distributor && single.toAgent &&
        (single.proposalNumber || single.proposalNumbers?.length);
      if (!hasRequiredData) {
        test.skip(true, `Fill in distributor / proposalNumber / toAgent in reassign-agent.cases.ts to enable ${tc.id}`);
        return;
      }

      await proposalListPage.goto();

      // ── Step 1: open modal ──────────────────────────────────────────────────
      await page.getByRole('button', { name: /reassign agent/i }).click();
      await expect(page.getByText(/select proposals/i)).toBeVisible({ timeout: 5_000 });

      // ── Step 2: select distributor ──────────────────────────────────────────
      const distDropdown = page.getByRole('combobox').first();
      await distDropdown.click();
      await page.getByRole('option', { name: single.distributor })
        .or(page.locator('[class*="option"]').filter({ hasText: single.distributor }))
        .first().click();
      await page.waitForTimeout(800);

      // ── Step 3: select proposal(s) ──────────────────────────────────────────
      const proposalNumbers: string[] = single.proposalNumber
        ? [single.proposalNumber]
        : single.proposalNumbers;

      for (const pn of proposalNumbers) {
        await page.locator('label').filter({ hasText: pn })
          .or(page.locator('[class*="option"]').filter({ hasText: pn }))
          .first().click();
      }

      // ── Step 4: Next ────────────────────────────────────────────────────────
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(500);

      // ── Step 5: select new agent ────────────────────────────────────────────
      const agentDropdown = page.getByRole('combobox').first();
      await agentDropdown.click();
      await page.getByRole('option', { name: single.toAgent })
        .or(page.locator('[class*="option"]').filter({ hasText: single.toAgent }))
        .first().click();

      // ── Step 6: confirm ─────────────────────────────────────────────────────
      await page.getByRole('button', { name: /confirm|save|reassign|submit/i }).last().click();
      await page.waitForLoadState('networkidle');

      // ── Step 7: verify Agent column is updated in the list ──────────────────
      for (const pn of proposalNumbers) {
        const row = page.locator('table tbody tr').filter({ hasText: pn });
        await expect(row).toBeVisible({ timeout: 10_000 });
        await expect(row.getByText(single.toAgent)).toBeVisible({ timeout: 8_000 });

        if (single.fromAgent) {
          await expect(row.getByText(single.fromAgent)).not.toBeVisible();
        }
      }
    });
  }
});
