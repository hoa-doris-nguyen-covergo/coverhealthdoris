import { type Page, expect } from '@playwright/test';
import { selectDropdownByIndex, selectDropdownByLabel } from '../../helpers/select';

export class CreateProposalPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  get companyClientTab() { return this.page.getByText('Company Client').first(); }
  get individualClientTab() { return this.page.getByText('Individual Client').first(); }
  get clientSearchInput() { return this.page.getByPlaceholder(/search by company name or id|search by name/i); }
  get clientSearchBtn() { return this.page.getByRole('button', { name: /^search$/i }); }
  get nextBtn() { return this.page.getByRole('button', { name: /^next$/i }); }
  get reSelectLink() { return this.page.getByText('Re-select'); }

  async selectExistingClient(type: 'company' | 'individual', searchTerm: string) {
    if (type === 'company') await this.companyClientTab.click();
    else await this.individualClientTab.click();

    await this.clientSearchInput.fill(searchTerm);
    await this.clientSearchBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByText('Select').first().click();
    await expect(this.page.getByText(/wrong client\?/i)).toBeVisible({ timeout: 10_000 });
  }

  async proceedToProductStep() {
    await this.nextBtn.scrollIntoViewIfNeeded();
    await this.nextBtn.click();
    await this.page.waitForURL(/products/);
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  async selectChannel(label: string) {
    await selectDropdownByLabel(this.page, 0, label);
  }

  async selectDistributor(label: string) {
    await selectDropdownByLabel(this.page, 1, label);
  }

  async selectAgent(label: string) {
    await selectDropdownByLabel(this.page, 2, label);
  }

  async selectFirstChannel() { await selectDropdownByIndex(this.page, 0, 0); }
  async selectFirstAgent()   { await selectDropdownByIndex(this.page, 2, 0); }

  async selectProduct(productName: string) {
    const card = this.page
      .locator('[class*="product-card"], [class*="product-item"], [class*="ProductCard"]')
      .filter({ hasText: productName })
      .first()
      .or(this.page.getByText(productName).first());
    await card.waitFor({ timeout: 15_000 });
    await card.click();
  }

  async selectFirstProduct() {
    const card = this.page
      .locator('[class*="product-card"], [class*="product-item"], [class*="ProductCard"]')
      .first();
    await card.waitFor({ timeout: 15_000 });
    await card.click();
  }

  async submitCreateProposal() {
    await this.page.getByRole('button', { name: /create proposal/i }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
