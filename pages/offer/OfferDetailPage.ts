import { type Page, expect } from '@playwright/test';
import { confirmDialog } from '../../helpers/select';

/**
 * The RIGHT panel of the Offer Management tab:
 * Offer header, Policy Details, Class & Benefits, Census Summary, Premium.
 */
export class OfferDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Header actions ────────────────────────────────────────────────────────
  get duplicateBtn()       { return this.page.getByRole('button', { name: /duplicate/i }); }
  get offerSettingsBtn()   { return this.page.locator('button[aria-label*="setting"], button svg[class*="setting"]').first().or(this.page.getByRole('button').filter({ has: this.page.locator('svg[class*="cog"], svg[class*="setting"]') }).first()); }
  get acceptOfferBtn()     { return this.page.getByRole('button', { name: /accept offer/i }); }
  get issueOfferBtn()      { return this.page.getByRole('button', { name: /issue.*offer|issue/i }); }
  get productBenefitsLink(){ return this.page.getByText('Product Benefits'); }
  get viewTOBLink()        { return this.page.getByText('View TOB'); }

  // ── Offer Level Settings (gear icon modal) ────────────────────────────────
  get offerSettingsModal()   { return this.page.getByRole('dialog').or(this.page.locator('[class*="drawer"], [class*="modal"]')); }
  get classToggle()          { return this.offerSettingsModal.getByText(/class/i).locator('xpath=..').locator('[role="switch"], input[type="checkbox"]'); }
  get multiGroupToggle()     { return this.offerSettingsModal.getByText(/multi.?group/i).locator('xpath=..').locator('[role="switch"], input[type="checkbox"]'); }

  // ── Policy Details ────────────────────────────────────────────────────────
  get policyDetailsEditBtn()  { return this.page.getByRole('button', { name: /^edit$/i }).first().or(this.page.locator('text=Policy Details').locator('xpath=../..').getByRole('button', { name: /edit/i })); }
  get policyStartDateInput()  { return this.page.getByLabel(/start date/i).or(this.page.getByPlaceholder(/start date/i)); }
  get policyEndDateInput()    { return this.page.getByLabel(/end date/i).or(this.page.getByPlaceholder(/end date/i)); }
  get policySaveBtn()         { return this.page.getByRole('button', { name: /save/i }).first(); }

  // ── Class & Benefits ─────────────────────────────────────────────────────
  get createClassBtn()    { return this.page.getByRole('button', { name: /create class/i }); }
  classRow(className: string) {
    return this.page.getByText(className).locator('xpath=ancestor::tr, xpath=ancestor::*[contains(@class,"row")]').first();
  }

  // ── Census Summary ────────────────────────────────────────────────────────
  get inputHeadcountBtn()  { return this.page.getByRole('button', { name: /input headcount/i }); }
  get uploadCensusBtn()    { return this.page.getByRole('button', { name: /upload census/i }); }
  get addMembersBtn()      { return this.page.getByRole('button', { name: /add members/i }); }

  // ── Premium section ───────────────────────────────────────────────────────
  get viewRatesBtn()          { return this.page.getByRole('button', { name: /view rates/i }); }
  get updateFactorsBtn()      { return this.page.getByRole('button', { name: /update factors/i }); }
  get premiumBreakdownBtn()   { return this.page.getByRole('button', { name: /premium breakdown/i }); }
  get billingFrequencySelect(){ return this.page.locator('[class*="select__control"], .ant-select-selector').last(); }

  // ── Actions ───────────────────────────────────────────────────────────────

  async duplicateOffer() {
    await this.duplicateBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openOfferSettings() {
    await this.offerSettingsBtn.click();
    await expect(this.offerSettingsModal).toBeVisible({ timeout: 5_000 });
  }

  async enableClassToggle() {
    const toggle = this.classToggle;
    const isChecked = await toggle.isChecked().catch(() => false);
    if (!isChecked) await toggle.click();
  }

  async enableMultiGroupToggle() {
    const toggle = this.multiGroupToggle;
    const isChecked = await toggle.isChecked().catch(() => false);
    if (!isChecked) await toggle.click();
  }

  async editPolicyDetails(startDate: string, endDate: string) {
    await this.policyDetailsEditBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.policyStartDateInput.fill(startDate);
    await this.policyEndDateInput.fill(endDate);
    await this.policySaveBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async createClass(classData: { name: string; description?: string }) {
    await this.createClassBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByLabel(/class name|name/i).fill(classData.name);
    if (classData.description) {
      await this.page.getByLabel(/description/i).fill(classData.description);
    }
    await this.page.getByRole('button', { name: /save|create|submit/i }).last().click();
    await this.page.waitForLoadState('networkidle');
  }

  async editClass(className: string) {
    await this.classRow(className).getByRole('button', { name: /edit/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async viewClass(className: string) {
    await this.classRow(className).getByRole('button', { name: /view/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectBillingFrequency(frequency: string) {
    await this.billingFrequencySelect.click();
    const option = this.page
      .getByRole('option', { name: frequency })
      .or(this.page.locator('[class*="select__option"]').filter({ hasText: frequency }))
      .first();
    await option.waitFor({ timeout: 5_000 });
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }

  async viewPremiumBreakdown() {
    await this.premiumBreakdownBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async viewInstalmentBreakdown() {
    // "Details" link inside Premium → Billing Plan section
    const detailsLink = this.page.getByText(/billing plan/i).locator('xpath=../..').getByRole('link', { name: /details/i }).first().or(
      this.page.getByRole('button', { name: /details/i }).first()
    );
    await detailsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async uploadCensusFile(filePath: string) {
    await this.uploadCensusBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: /upload|submit/i }).last().click();
    await this.page.waitForLoadState('networkidle');
  }

  async addMemberManually() {
    await this.addMembersBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async acceptOffer() {
    await this.acceptOfferBtn.click();
    await confirmDialog(this.page);
    await this.page.waitForLoadState('networkidle');
  }

  async issueOffer() {
    await this.issueOfferBtn.click();
    await confirmDialog(this.page);
    await this.page.waitForLoadState('networkidle');
  }
}
