import { type Page, expect } from '@playwright/test';

/**
 * The LEFT panel: offer grid list + "Add Offer" button.
 * Lives on the Offer Management tab of Proposal Detail.
 */
export class OfferManagementPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────
  get addOfferBtn()    { return this.page.getByRole('button', { name: /^add offer$/i }); }
  get sendOffersBtn()  { return this.page.getByRole('button', { name: /send offers/i }); }

  // ── Add Offer modal options ───────────────────────────────────────────────
  get addFromAvailableProductOption()  { return this.page.getByText(/available product/i); }
  get addFromReleasedProductOption()   { return this.page.getByText(/released product/i); }
  get addByCustomizeProductOption()    { return this.page.getByText(/customize product/i); }

  // ── Offer grid cards (left panel) ─────────────────────────────────────────
  offerCard(offerNumber: string) {
    return this.page.locator('[class*="offer-card"], [class*="OfferCard"]')
      .filter({ hasText: offerNumber })
      .first()
      .or(this.page.getByText(offerNumber).locator('xpath=ancestor::*[contains(@class,"card") or contains(@class,"item")][1]'));
  }

  get allOfferCards() {
    return this.page.locator('[class*="offer-card"], [class*="OfferCard"], .offer-item');
  }

  get firstOfferCard() { return this.allOfferCards.first(); }

  // ── Actions ───────────────────────────────────────────────────────────────

  async clickAddOffer() {
    await this.addOfferBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addOfferFromAvailableProduct() {
    await this.clickAddOffer();
    await this.addFromAvailableProductOption.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addOfferFromReleasedProduct() {
    await this.clickAddOffer();
    await this.addFromReleasedProductOption.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addOfferByCustomizeProduct() {
    await this.clickAddOffer();
    await this.addByCustomizeProductOption.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectOfferFromGrid(offerNumber: string) {
    await this.offerCard(offerNumber).click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectFirstOffer() {
    await this.firstOfferCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getOfferCount(): Promise<number> {
    return this.allOfferCards.count();
  }

  /** Check that remaining offers switched to Rejected after one was accepted */
  async verifyRemainingOffersRejected(acceptedOfferNumber: string) {
    const cards = this.allOfferCards;
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent() ?? '';
      if (!text.includes(acceptedOfferNumber)) {
        await expect(card.getByText(/reject/i)).toBeVisible();
      }
    }
  }
}
