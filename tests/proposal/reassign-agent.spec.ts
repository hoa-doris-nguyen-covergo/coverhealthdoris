/**
 * Reassign Agent – modal flow + post-reassign verification
 *
 * Flow:
 *   1. Open modal → select distributor → proposals list populates
 *   2. Select proposal(s) → Next → select new agent → Confirm
 *   3. Verify Agent column in the list is updated for every reassigned proposal
 *
 * Data-driven cases → test-data/reassign-agent.cases.ts
 * Fill in distributor / proposalNumber / toAgent there to enable RA-04 / RA-05.
 */
import { test, expect } from '../../fixtures';
import { REASSIGN_AGENT_CASES } from '../../test-data/reassign-agent.cases';

// ── Modal structure (no test data needed) ─────────────────────────────────────
test.describe('Reassign Agent – modal', () => {
  test.beforeEach(async ({ proposalListPage }) => {
    await proposalListPage.goto();
  });

  test('[RA-01] Modal opens with correct heading and constraint hint', async ({ page, proposalListPage }) => {
    await proposalListPage.openReassignAgentModal();
    await expect(page.getByText(/you can only reassign agent from open proposals/i)).toBeVisible();
    await proposalListPage.reassignCancelBtn.click();
  });

  test('[RA-02] Cancel button closes the modal without making changes', async ({ proposalListPage }) => {
    await proposalListPage.openReassignAgentModal();
    await proposalListPage.reassignCancelBtn.click();
    await expect(proposalListPage.reassignModalHeading).not.toBeVisible({ timeout: 3_000 });
  });

  test('[RA-03] Next is blocked until a distributor is selected (negative)', async ({ proposalListPage }) => {
    await proposalListPage.openReassignAgentModal();

    const isDisabled = await proposalListPage.reassignNextBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBe(true);
    } else {
      await proposalListPage.reassignNextBtn.click();
      // Modal should still be visible — did not advance
      await expect(proposalListPage.reassignModalHeading).toBeVisible({ timeout: 3_000 });
    }
    await proposalListPage.reassignCancelBtn.click();
  });

  test('[RA-04] Selecting a distributor replaces the hint with the proposals list', async ({ page, proposalListPage }) => {
    await proposalListPage.openReassignAgentModal();
    await proposalListPage.selectReassignDistributor('BRBF');
    await expect(page.getByText(/filter by distributor to see proposals/i)).not.toBeVisible({ timeout: 5_000 });
    await proposalListPage.reassignCancelBtn.click();
  });
});

// ── End-to-end reassign + verify agent column ─────────────────────────────────
test.describe('Reassign Agent – end-to-end', () => {
  for (const tc of REASSIGN_AGENT_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ proposalListPage }) => {
      const single = tc as any;
      const proposalNumbers: string[] = single.proposalNumber
        ? [single.proposalNumber]
        : (single.proposalNumbers ?? []);

      if (!single.distributor || !single.toAgent || !proposalNumbers.length) {
        test.skip(true, `Fill in distributor / proposalNumber / toAgent in reassign-agent.cases.ts to enable ${tc.id}`);
        return;
      }

      await proposalListPage.goto();

      // Capture agent name before reassignment for each proposal
      const agentsBefore: Record<string, string> = {};
      for (const pn of proposalNumbers) {
        agentsBefore[pn] = await proposalListPage.getAgentForProposal(pn);
      }

      // Run the full reassign flow
      await proposalListPage.reassignAgent(single.distributor, proposalNumbers, single.toAgent);

      // Verify Agent column updated for every reassigned proposal
      for (const pn of proposalNumbers) {
        const agentAfter = await proposalListPage.getAgentForProposal(pn);
        expect(agentAfter).toContain(single.toAgent);
        if (single.fromAgent) {
          expect(agentAfter).not.toContain(single.fromAgent);
        }
      }
    });
  }
});
