/**
 * Offer Management – left-panel grid actions
 * Test cases → test-data/proposal-cases.ts: OFFER_MANAGEMENT_CASES
 */
import { test, expect } from '../../fixtures';
import { OFFER_MANAGEMENT_CASES } from '../../test-data/offer-management.cases';

for (const tc of OFFER_MANAGEMENT_CASES) {
  test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage }) => {
    if (!tc.proposalId) { test.skip(true, 'Set proposalId in test-data/proposal-cases.ts'); return; }

    await proposalDetailPage.goto(tc.proposalId);
    const countBefore = await offerManagementPage.getOfferCount();

    const addCount = (tc as any).addCount ?? 1;

    for (let i = 0; i < addCount; i++) {
      if (tc.addMethod === 'available')  await offerManagementPage.addOfferFromAvailableProduct();
      if (tc.addMethod === 'released')   await offerManagementPage.addOfferFromReleasedProduct();
      if (tc.addMethod === 'customize')  await offerManagementPage.addOfferByCustomizeProduct();

      // Select product in the add-offer modal if a specific product is named
      if (tc.product) {
        await page.getByText(tc.product).first().click();
        await page.getByRole('button', { name: /add|confirm|select/i }).last().click();
        await page.waitForLoadState('networkidle');
      } else {
        // Pick first available product
        await page.locator('[class*="product-card"], [class*="product-item"]').first().click();
        await page.getByRole('button', { name: /add|confirm|select/i }).last().click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Verify offer count increased
    const countAfter = await offerManagementPage.getOfferCount();
    expect(countAfter).toBeGreaterThan(countBefore);
  });
}

test('Selecting an offer from grid loads its detail in the right panel', async ({ proposalDetailPage, offerManagementPage, page }) => {
  const firstCase = OFFER_MANAGEMENT_CASES[0];
  if (!firstCase?.proposalId) { test.skip(true, 'Set proposalId in OFFER_MANAGEMENT_CASES'); return; }

  await proposalDetailPage.goto(firstCase.proposalId);
  await offerManagementPage.selectFirstOffer();
  await expect(page.getByText(/policy details/i)).toBeVisible();
});
