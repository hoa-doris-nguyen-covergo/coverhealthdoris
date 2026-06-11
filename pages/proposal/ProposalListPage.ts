import { type Page, type Locator, expect } from '@playwright/test';

export class ProposalListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly createProposalBtn: Locator;
  readonly statusFilter: Locator;
  readonly reasonForClosureFilter: Locator;
  readonly productTypeFilter: Locator;
  readonly createdAtFilter: Locator;
  readonly distributorsAgentsFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Proposals' });
    this.searchInput = page.getByPlaceholder(/search by client name/i);
    this.createProposalBtn = page.getByRole('button', { name: /create proposal/i });
    this.statusFilter = page.getByRole('button', { name: /status/i });
    this.reasonForClosureFilter = page.getByRole('button', { name: /reason for closure/i });
    this.productTypeFilter = page.getByRole('button', { name: /product type/i });
    this.createdAtFilter = page.getByRole('button', { name: /created at/i });
    this.distributorsAgentsFilter = page.getByRole('button', { name: /distributors/i });
  }

  async goto() {
    await this.page.goto('/proposals');
    await expect(this.heading).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateProposal() {
    await this.createProposalBtn.click();
    await this.page.waitForURL(/quotation\/clients/);
  }

  async clickFirstRow() {
    await this.page.locator('table tbody tr').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickRowByProposalNumber(proposalNumber: string) {
    await this.page.getByText(proposalNumber).first().click();
    await this.page.waitForLoadState('networkidle');
  }
}
