import { type Page, expect } from '@playwright/test';

/**
 * Member detail page / drawer — reached by clicking a member row
 * from the Census Summary section of an offer.
 */
export class MemberDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  get overviewTab()    { return this.page.getByRole('tab', { name: /overview|details/i }); }
  get billingPlanTab() { return this.page.getByRole('tab', { name: /billing plan/i }); }
  get documentsTab()   { return this.page.getByRole('tab', { name: /documents/i }); }
  get uwTab()          { return this.page.getByRole('tab', { name: /uw|underwriting/i }); }

  // ── Overview / member form ────────────────────────────────────────────────
  get firstNameInput()  { return this.page.getByLabel(/first name/i); }
  get lastNameInput()   { return this.page.getByLabel(/last name/i); }
  get dobInput()        { return this.page.getByLabel(/date of birth|dob/i); }
  get genderSelect()    { return this.page.getByLabel(/gender/i); }
  get emailInput()      { return this.page.getByLabel(/email/i); }
  get idNumberInput()   { return this.page.getByLabel(/id number|passport/i); }
  get memberTypeSelect(){ return this.page.getByLabel(/member type|type/i); }
  get classSelect()     { return this.page.getByLabel(/class/i); }
  get saveBtn()         { return this.page.getByRole('button', { name: /save/i }).last(); }
  get editBtn()         { return this.page.getByRole('button', { name: /edit/i }).first(); }

  // ── Billing Plan tab ──────────────────────────────────────────────────────
  get instalmentDetailsLink() {
    return this.page.getByRole('button', { name: /details/i }).or(
      this.page.getByRole('link', { name: /details/i })
    ).first();
  }

  // ── Documents tab ─────────────────────────────────────────────────────────
  get uploadDocumentBtn() { return this.page.getByRole('button', { name: /upload/i }); }
  get fileInput()         { return this.page.locator('input[type="file"]'); }

  // ── UW tab ────────────────────────────────────────────────────────────────
  get addHealthQuestionnaireBtn() {
    return this.page.getByRole('button', { name: /add.*health|health.*questionnaire/i });
  }
  get editHealthQuestionnaireBtn() {
    return this.page.getByRole('button', { name: /edit.*health|health.*questionnaire/i });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillMemberForm(data: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    email?: string;
    idNumber?: string;
    memberType?: string;
    className?: string;
  }) {
    if (data.firstName)  await this.firstNameInput.fill(data.firstName);
    if (data.lastName)   await this.lastNameInput.fill(data.lastName);
    if (data.dob)        await this.dobInput.fill(data.dob);
    if (data.email)      await this.emailInput.fill(data.email);
    if (data.idNumber)   await this.idNumberInput.fill(data.idNumber);

    if (data.gender) {
      await this.genderSelect.selectOption(data.gender).catch(async () => {
        await this.genderSelect.click();
        await this.page.getByRole('option', { name: data.gender! }).click();
      });
    }
    if (data.memberType) {
      await this.memberTypeSelect.selectOption(data.memberType).catch(async () => {
        await this.memberTypeSelect.click();
        await this.page.getByRole('option', { name: data.memberType! }).click();
      });
    }
    if (data.className) {
      await this.classSelect.selectOption(data.className).catch(async () => {
        await this.classSelect.click();
        await this.page.getByRole('option', { name: data.className! }).click();
      });
    }
  }

  async saveMember() {
    await this.saveBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async viewPremiumBreakdown() {
    // Premium breakdown button inside member detail
    await this.page.getByRole('button', { name: /premium breakdown/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async viewInstalmentBreakdown() {
    await this.billingPlanTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.instalmentDetailsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async uploadDocument(filePath: string) {
    await this.documentsTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.uploadDocumentBtn.click();
    await this.fileInput.setInputFiles(filePath);
    await this.page.getByRole('button', { name: /upload|confirm|submit/i }).last().click();
    await this.page.waitForLoadState('networkidle');
  }

  async addHealthQuestionnaire() {
    await this.uwTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.addHealthQuestionnaireBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async editHealthQuestionnaire() {
    await this.uwTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.editHealthQuestionnaireBtn.click();
    await this.page.waitForLoadState('networkidle');
  }
}
