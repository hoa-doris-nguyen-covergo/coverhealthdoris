import { type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput()    { return this.page.getByLabel(/email/i); }
  get passwordInput() { return this.page.getByLabel(/password/i); }
  get loginBtn()      { return this.page.locator('[data-test="buttonLogin"]'); }
  get errorMessage()  { return this.page.locator('[class*="error"], [class*="alert"], [role="alert"]'); }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible({ timeout: 15_000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    // Wait until the URL is no longer the login page
    await expect(this.page).not.toHaveURL(/login/, { timeout: 30_000 });
  }
}
