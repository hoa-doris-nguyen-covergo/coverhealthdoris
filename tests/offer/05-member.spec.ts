/**
 * Member management – add / edit / view / upload / UW / documents
 * Test cases → test-data/member.cases.ts
 */
import { test, expect } from '../../fixtures';
import {
  ADD_MEMBER_CASES,
  UPLOAD_MEMBER_CASES,
  EDIT_MEMBER_CASES,
  DOCUMENT_UPLOAD_CASES,
  UW_QUESTIONNAIRE_CASES,
} from '../../test-data/member.cases';

// ── Add member manually ───────────────────────────────────────────────────────
test.describe('Member – Add manually', () => {
  for (const tc of ADD_MEMBER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage, memberDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await offerDetailPage.addMemberManually();
      await page.waitForLoadState('networkidle');

      const m = tc.member;
      await memberDetailPage.fillMemberForm({
        firstName:  m.firstName,
        lastName:   m.lastName,
        dob:        m.dob,
        gender:     m.gender,
        email:      (m as any).email,
        idNumber:   (m as any).idNumber,
        memberType: tc.memberType === 'dependent' ? 'Dependent' : 'Employee',
        className:  (m as any).className,
      });

      if (tc.memberType === 'dependent' && (m as any).relationship) {
        const relField = page.getByLabel(/relationship/i);
        await relField.selectOption((m as any).relationship).catch(async () => {
          await relField.click();
          await page.getByRole('option', { name: (m as any).relationship }).click();
        });
      }

      await memberDetailPage.saveMember();
      await expect(page.getByText(m.firstName).or(page.getByText(m.lastName))).toBeVisible({ timeout: 8_000 });
    });
  }
});

// ── Upload members ────────────────────────────────────────────────────────────
test.describe('Member – Upload CSV / Excel', () => {
  for (const tc of UPLOAD_MEMBER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, offerDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
      if (!tc.filePath)   { test.skip(true, 'Set filePath in member.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await offerDetailPage.uploadCensusFile(tc.filePath);
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    });
  }
});

// ── Edit member ───────────────────────────────────────────────────────────────
test.describe('Member – Edit', () => {
  for (const tc of EDIT_MEMBER_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, memberDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      // Find the member row
      await page.getByText(tc.memberName).first().click();
      await page.waitForLoadState('networkidle');

      await memberDetailPage.editBtn.click();
      await memberDetailPage.fillMemberForm(tc.updatedFields);
      await memberDetailPage.saveMember();

      if (tc.updatedFields.email) {
        await expect(page.getByText(tc.updatedFields.email)).toBeVisible({ timeout: 8_000 });
      }
    });
  }
});

// ── View member ───────────────────────────────────────────────────────────────
test.describe('Member – View', () => {
  test('[MV-01] View member details by clicking a member row', async ({ page, proposalDetailPage, offerManagementPage }) => {
    const tc = ADD_MEMBER_CASES[0];
    if (!tc?.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
    await proposalDetailPage.goto(tc.proposalId);
    await offerManagementPage.selectFirstOffer();

    const row = page.locator('table tbody tr').first();
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No members in this offer yet'); return;
    }
    await row.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/first name|member details/i)).toBeVisible();
  });

  test('[MV-PREMIUM] View premium breakdown from member details', async ({ page, proposalDetailPage, offerManagementPage, memberDetailPage }) => {
    const tc = ADD_MEMBER_CASES[0];
    if (!tc?.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
    await proposalDetailPage.goto(tc.proposalId);
    await offerManagementPage.selectFirstOffer();

    const row = page.locator('table tbody tr').first();
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No members in this offer yet'); return;
    }
    await row.click();
    await memberDetailPage.viewPremiumBreakdown();
    await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible({ timeout: 8_000 });
  });

  test('[MV-INSTALMENT] View instalment breakdown from member billing plan tab', async ({ page, proposalDetailPage, offerManagementPage, memberDetailPage }) => {
    const tc = ADD_MEMBER_CASES[0];
    if (!tc?.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
    await proposalDetailPage.goto(tc.proposalId);
    await offerManagementPage.selectFirstOffer();

    const row = page.locator('table tbody tr').first();
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No members in this offer yet'); return;
    }
    await row.click();
    await memberDetailPage.viewInstalmentBreakdown();
    await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible({ timeout: 8_000 });
  });
});

// ── Documents ─────────────────────────────────────────────────────────────────
test.describe('Member – Upload Document', () => {
  for (const tc of DOCUMENT_UPLOAD_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, memberDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
      if (!tc.filePath)   { test.skip(true, 'Set filePath in member.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await page.getByText(tc.memberName).first().click();
      await page.waitForLoadState('networkidle');
      await memberDetailPage.uploadDocument(tc.filePath);
      await expect(page.getByText(/uploaded|document/i)).toBeVisible({ timeout: 8_000 });
    });
  }
});

// ── UW / Health Questionnaire ─────────────────────────────────────────────────
test.describe('Member – UW Health Questionnaire', () => {
  for (const tc of UW_QUESTIONNAIRE_CASES) {
    test(`[${tc.id}] ${tc.description}`, async ({ page, proposalDetailPage, offerManagementPage, memberDetailPage }) => {
      if (!tc.proposalId) { test.skip(true, 'Set proposalId in member.cases.ts'); return; }
      await proposalDetailPage.goto(tc.proposalId);
      tc.offerNumber
        ? await offerManagementPage.selectOfferFromGrid(tc.offerNumber)
        : await offerManagementPage.selectFirstOffer();

      await page.getByText(tc.memberName).first().click();
      await page.waitForLoadState('networkidle');

      const uwTab = memberDetailPage.uwTab;
      if (!(await uwTab.isVisible({ timeout: 3_000 }).catch(() => false))) {
        test.skip(true, 'UW tab not available (not configured for this product)'); return;
      }

      if (tc.action === 'add')  await memberDetailPage.addHealthQuestionnaire();
      if (tc.action === 'edit') await memberDetailPage.editHealthQuestionnaire();
      await expect(page.getByText(/health questionnaire|question/i)).toBeVisible({ timeout: 8_000 });
    });
  }
});
