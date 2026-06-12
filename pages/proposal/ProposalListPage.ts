import { type Page, type Locator, expect } from '@playwright/test';

export class ProposalListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly createProposalBtn: Locator;
  readonly reassignAgentBtn: Locator;
  readonly statusFilter: Locator;
  readonly reasonForClosureFilter: Locator;
  readonly productTypeFilter: Locator;
  readonly createdAtFilter: Locator;
  readonly distributorsAgentsFilter: Locator;

  // Reassign Agent modal elements
  readonly reassignModalHeading: Locator;
  readonly reassignDistributorDropdown: Locator;
  readonly reassignCancelBtn: Locator;
  readonly reassignNextBtn: Locator;
  readonly reassignConfirmBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Proposals' });
    this.searchInput = page.getByPlaceholder(/search by client name/i);
    this.createProposalBtn = page.getByRole('button', { name: /create proposal/i });
    this.reassignAgentBtn = page.getByRole('button', { name: /reassign agent/i });
    this.statusFilter = page.getByRole('button', { name: /status/i });
    this.reasonForClosureFilter = page.getByRole('button', { name: /reason for closure/i });
    this.productTypeFilter = page.getByRole('button', { name: /product type/i });
    this.createdAtFilter = page.getByRole('button', { name: /created at/i });
    this.distributorsAgentsFilter = page.getByRole('button', { name: /distributors/i });

    this.reassignModalHeading = page.getByText(/select proposals/i);
    this.reassignDistributorDropdown = page.getByRole('combobox').first();
    this.reassignCancelBtn = page.getByRole('button', { name: /cancel/i });
    this.reassignNextBtn = page.getByRole('button', { name: /next/i });
    this.reassignConfirmBtn = page.getByRole('button', { name: /confirm|save|reassign|submit/i }).last();
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

  /** Open the Reassign Agent modal. */
  async openReassignAgentModal() {
    await this.reassignAgentBtn.click();
    await expect(this.reassignModalHeading).toBeVisible({ timeout: 5_000 });
  }

  /** Step 1: select a distributor so the proposals panel populates. */
  async selectReassignDistributor(distributor: string) {
    await this.reassignDistributorDropdown.click();
    await this.page
      .getByRole('option', { name: distributor })
      .or(this.page.locator('[class*="option"]').filter({ hasText: distributor }))
      .first()
      .click();
    await this.page.waitForTimeout(800);
  }

  /** Step 1: select one or more proposals by proposal number. */
  async selectReassignProposals(proposalNumbers: string[]) {
    for (const pn of proposalNumbers) {
      await this.page
        .locator('label').filter({ hasText: pn })
        .or(this.page.locator('[class*="option"]').filter({ hasText: pn }))
        .first()
        .click();
    }
  }

  /** Step 2: after clicking Next, select the new agent to assign. */
  async selectNewAgent(agentName: string) {
    const agentDropdown = this.page.getByRole('combobox').first();
    await agentDropdown.click();
    await this.page
      .getByRole('option', { name: agentName })
      .or(this.page.locator('[class*="option"]').filter({ hasText: agentName }))
      .first()
      .click();
  }

  /**
   * Full reassign flow in one call.
   * Returns after the modal closes and the list reloads.
   */
  async reassignAgent(distributor: string, proposalNumbers: string[], newAgent: string) {
    await this.openReassignAgentModal();
    await this.selectReassignDistributor(distributor);
    await this.selectReassignProposals(proposalNumbers);
    await this.reassignNextBtn.click();
    await this.page.waitForTimeout(500);
    await this.selectNewAgent(newAgent);
    await this.reassignConfirmBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Find a row by proposal number and return the text in the Agent cell.
   * Useful for verifying the agent column updated after reassignment.
   */
  async getAgentForProposal(proposalNumber: string): Promise<string> {
    const row = this.page.locator('table tbody tr').filter({ hasText: proposalNumber });
    await expect(row).toBeVisible({ timeout: 8_000 });
    // Agent is the 3rd column (index 2)
    return (await row.locator('td').nth(2).textContent()) ?? '';
  }
}
