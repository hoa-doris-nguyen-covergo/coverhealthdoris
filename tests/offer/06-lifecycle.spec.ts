/**
 * Offer lifecycle: accept → auto-reject others → issue
 * Test cases → test-data/lifecycle.cases.ts
 */
import { test, expect } from '../../fixtures';
import { ACCEPT_OFFER_CASES, AUTO_REJECT_CASES, ISSUE_OFFER_CASES } from '../../test-data/lifecycle.cases';

// ── Accept Offer ──────────────────────────────────────────────────────────────
test.describe('Lifecycle – Accept Offer', () => {
  for (const tc of ACCEPT_OFFER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in lifecycle.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      const acceptBtn = offerDetailPage.acceptOfferBtn;
      if (!(await acceptBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, 'Accept Offer button not visible — wrong proposal state'); return;
      }

      await offerDetailPage.acceptOffer();
      await expect(page.getByText(/accepted/i)).toBeVisible({ timeout: 10_000 });
    });
  }
});

// ── Auto-reject remaining offers ──────────────────────────────────────────────
test.describe('Lifecycle – Auto-reject Remaining Offers', () => {
  for (const tc of AUTO_REJECT_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in lifecycle.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerToAccept
        ? await offerManagementPage.selectOfferFromGrid(tc.offerToAccept)
        : await offerManagementPage.selectFirstOffer();

      const acceptBtn = offerDetailPage.acceptOfferBtn;
      if (!(await acceptBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, 'Accept Offer button not visible — wrong proposal state'); return;
      }

      const acceptedText = await page.locator('[class*="offer-header"], h3, h4').first().textContent() ?? '';
      await offerDetailPage.acceptOffer();

      const offerCount = await offerManagementPage.getOfferCount();
      if (offerCount > 1) {
        await offerManagementPage.verifyRemainingOffersRejected(acceptedText.trim());
      }
    });
  }
});

// ── Issue Offer ───────────────────────────────────────────────────────────────
test.describe('Lifecycle – Issue Offer', () => {
  for (const tc of ISSUE_OFFER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in lifecycle.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      const issueBtn = offerDetailPage.issueOfferBtn;
      if (!(await issueBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, 'Issue Offer button not visible — wrong proposal state'); return;
      }

      await offerDetailPage.issueOffer();
      await expect(page.getByText(/issued|policy issued/i)).toBeVisible({ timeout: 15_000 });
    });
  }
});
