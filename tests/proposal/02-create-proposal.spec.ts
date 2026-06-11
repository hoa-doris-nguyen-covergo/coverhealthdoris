/**
 * Proposal V2 – Create Proposal wizard (2-step)
 * Test cases → test-data/proposal-cases.ts: CREATE_PROPOSAL_CASES
 */
import { test, expect } from '../../fixtures';
import { CREATE_PROPOSAL_CASES } from '../../test-data/create-proposal.cases';

test.describe('Create Proposal – structural checks', () => {
  test('Step 1 shows client tabs and search', async ({ page, proposalListPage }) => {
    await proposalListPage.goto();
    await proposalListPage.clickCreateProposal();
    await expect(page.getByText('Company Client')).toBeVisible();
    await expect(page.getByText('Individual Client')).toBeVisible();
  });

  test('Step 2 shows Channel / Distributor / Agent after selecting client', async ({ page, proposalListPage, createProposalPage }) => {
    await proposalListPage.goto();
    await proposalListPage.clickCreateProposal();
    await page.getByText('Select').first().click();
    await createProposalPage.proceedToProductStep();
    await expect(page.getByText('Select Channel')).toBeVisible();
    await expect(page.getByText('Select Agent')).toBeVisible();
  });
});

// ── Data-driven: create proposal cases ───────────────────────────────────────
//  ➜ Add cases in: test-data/proposal-cases.ts → CREATE_PROPOSAL_CASES
for (const tc of CREATE_PROPOSAL_CASES) {
  test(`[${tc.id}] ${tc.description}`, async ({ page, proposalListPage, createProposalPage }) => {
    await proposalListPage.goto();
    await proposalListPage.clickCreateProposal();

    // Step 1 — client
    if (tc.createNewClient && tc.newClient) {
      await page.getByRole('link', { name: /create new|add new/i }).click();
      await page.getByLabel(/company name|full name/i).fill(tc.newClient.companyName);
      await page.getByLabel(/email/i).fill(tc.newClient.email);
      if (tc.newClient.phone) await page.getByLabel(/phone/i).fill(tc.newClient.phone);
      await page.getByRole('button', { name: /save|create|submit/i }).click();
      await page.waitForLoadState('networkidle');
    } else {
      await createProposalPage.selectExistingClient(tc.clientType, tc.clientSearch);
    }

    // Step 2 — product
    await createProposalPage.proceedToProductStep();

    if (tc.channel) await createProposalPage.selectChannel(tc.channel);
    if (tc.distributor) await createProposalPage.selectDistributor(tc.distributor);
    if (tc.agent) await createProposalPage.selectAgent(tc.agent);
    if (tc.product) await createProposalPage.selectProduct(tc.product);
    else            await createProposalPage.selectFirstProduct();

    await createProposalPage.submitCreateProposal();

    // Should land on proposal detail
    await expect(page.getByText('Proposal Detail')).toBeVisible({ timeout: 15_000 });
  });
}
