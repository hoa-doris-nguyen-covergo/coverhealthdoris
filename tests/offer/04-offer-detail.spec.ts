/**
 * Offer Detail – right panel actions
 * Test cases → test-data/offer-detail.cases.ts
 */
import { test, expect } from '../../fixtures';
import {
  POLICY_DETAIL_CASES,
  OFFER_SETTINGS_CASES,
  CLASS_CASES,
  PREMIUM_CASES,
  DUPLICATE_OFFER_CASES,
} from '../../test-data/offer-detail.cases';

// ── Policy Details ────────────────────────────────────────────────────────────
test.describe('Offer Detail – Policy Details', () => {
  for (const tc of POLICY_DETAIL_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await offerDetailPage.editPolicyDetails(tc.startDate, tc.endDate);
      await expect(page.getByText(tc.startDate)).toBeVisible({ timeout: 8_000 });
    });
  }
});

// ── Offer Level Settings ──────────────────────────────────────────────────────
test.describe('Offer Detail – Offer Level Settings', () => {
  for (const tc of OFFER_SETTINGS_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await offerDetailPage.openOfferSettings();
      if (tc.enableClass)      await offerDetailPage.enableClassToggle();
      if (tc.enableMultiGroup) await offerDetailPage.enableMultiGroupToggle();
      await page.keyboard.press('Escape');
      await page.waitForLoadState('networkidle');
    });
  }
});

// ── Class & Benefits ──────────────────────────────────────────────────────────
test.describe('Offer Detail – Class & Benefits', () => {
  for (const tc of CLASS_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      if (tc.action === 'create') {
        await offerDetailPage.createClass({ name: tc.className, description: tc.classDescription });
        await expect(page.getByText(tc.className)).toBeVisible({ timeout: 8_000 });
      }
      if (tc.action === 'edit') {
        await offerDetailPage.editClass(tc.className);
        await page.getByLabel(/description/i).fill(tc.classDescription);
        await page.getByRole('button', { name: /save/i }).last().click();
        await page.waitForLoadState('networkidle');
      }
      if (tc.action === 'view') {
        await offerDetailPage.viewClass(tc.className);
        await expect(page.getByText(tc.className)).toBeVisible({ timeout: 8_000 });
      }
    });
  }
});

// ── Premium ───────────────────────────────────────────────────────────────────
test.describe('Offer Detail – Premium', () => {
  for (const tc of PREMIUM_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await offerDetailPage.selectBillingFrequency(tc.billingFrequency);
      await offerDetailPage.viewPremiumBreakdown();
      await expect(
        page.getByRole('dialog').or(page.locator('[class*="modal"], [class*="breakdown"]'))
      ).toBeVisible({ timeout: 8_000 });
      await page.keyboard.press('Escape');
    });
  }

  test('[PR-INSTALMENT] View instalment breakdown from offer', async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
    const tc = POLICY_DETAIL_CASES[0];
    if (!tc?.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
    await proposalDetailPage.goto(tc.proposalId);
    await offerManagementPage.selectFirstOffer();
    await offerDetailPage.viewInstalmentBreakdown();
    await expect(
      page.getByRole('dialog').or(page.locator('[class*="modal"], [class*="breakdown"]'))
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ── Duplicate Offer ───────────────────────────────────────────────────────────
test.describe('Offer Detail – Duplicate', () => {
  for (const tc of DUPLICATE_OFFER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in offer-detail.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      const countBefore = await offerManagementPage.getOfferCount();
      await offerDetailPage.duplicateOffer();
      const countAfter = await offerManagementPage.getOfferCount();
      expect(countAfter).toBeGreaterThan(countBefore);
    });
  }
});
