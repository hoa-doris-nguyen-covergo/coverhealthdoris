import { type Page, expect } from '@playwright/test';

export class ProposalDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────
  get offerManagementTab() { return this.page.getByRole('tab', { name: /offer management/i }); }
  get caseInfoTab()        { return this.page.getByRole('tab', { name: /case info/i }); }
  get proposalFlowTab()    { return this.page.getByRole('tab', { name: /proposal flow/i }); }
  get eSignatureTab()      { return this.page.getByRole('tab', { name: /e signature/i }); }

  // ── Header badges ─────────────────────────────────────────────────────────
  get clientBadge()      { return this.page.locator('text=Client:').locator('xpath=..'); }
  get productTypeBadge() { return this.page.locator('text=Product Type:').locator('xpath=..'); }
  get statusBadge()      { return this.page.locator('text=Status:').locator('xpath=..'); }

  async goto(proposalId: string) {
    await this.page.goto(`/proposals/${proposalId}/offers`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText('Proposal Detail')).toBeVisible();
  }

  async goToOfferManagement() {
    await this.offerManagementTab.click();
    await this.page.waitForLoadState('networkidle');
  }
}
