import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('hoa.nguyen@covergo.com');
  await page.getByLabel(/password/i).fill('FBU0naw@fuv0xmg_kme');
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.context().storageState({ path: 'auth.json' });
});
