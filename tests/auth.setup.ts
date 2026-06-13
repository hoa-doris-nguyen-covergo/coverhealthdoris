import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login/LoginPage';

const EMAIL    = 'hoa.nguyen@covergo.com';
const PASSWORD = 'FBU0naw@fuv0xmg_kme';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.loginAndWaitForDashboard(EMAIL, PASSWORD);

  // Verify we actually landed on the app (not an error or back on /login)
  await expect(page).not.toHaveURL(/login/, { timeout: 30_000 });
  await expect(page.locator('body')).not.toContainText(/invalid.*credentials|incorrect.*password|login.*failed/i);

  // Save the authenticated session for all other tests
  await page.context().storageState({ path: 'auth.json' });
});
