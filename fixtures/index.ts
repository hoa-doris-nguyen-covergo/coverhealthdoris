/**
 * Playwright custom fixture that pre-wires all page objects.
 * Import `test` and `expect` from here instead of @playwright/test.
 */
import { test as base } from '@playwright/test';
import { ProposalListPage } from '../pages/proposal/ProposalListPage';
import { CreateProposalPage } from '../pages/proposal/CreateProposalPage';
import { ProposalDetailPage } from '../pages/proposal/ProposalDetailPage';
import { OfferManagementPage } from '../pages/offer/OfferManagementPage';
import { OfferDetailPage } from '../pages/offer/OfferDetailPage';
import { MemberDetailPage } from '../pages/offer/MemberDetailPage';

type Fixtures = {
  proposalListPage: ProposalListPage;
  createProposalPage: CreateProposalPage;
  proposalDetailPage: ProposalDetailPage;
  offerManagementPage: OfferManagementPage;
  offerDetailPage: OfferDetailPage;
  memberDetailPage: MemberDetailPage;
};

export const test = base.extend<Fixtures>({
  proposalListPage: async ({ page }, use) => use(new ProposalListPage(page)),
  createProposalPage: async ({ page }, use) => use(new CreateProposalPage(page)),
  proposalDetailPage: async ({ page }, use) => use(new ProposalDetailPage(page)),
  offerManagementPage: async ({ page }, use) => use(new OfferManagementPage(page)),
  offerDetailPage: async ({ page }, use) => use(new OfferDetailPage(page)),
  memberDetailPage: async ({ page }, use) => use(new MemberDetailPage(page)),
});

export { expect } from '@playwright/test';
