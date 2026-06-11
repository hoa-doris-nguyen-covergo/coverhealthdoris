/**
 * Helpers for interacting with React-Select / Ant Design Select dropdowns.
 * The portal renders options outside the parent, so we always wait for
 * the option list to appear before clicking.
 */
import { type Page } from '@playwright/test';

const OPTION_SELECTOR = '[class*="select__option"], .ant-select-option, [role="option"]';

export async function selectDropdownByIndex(page: Page, dropdownIndex: number, optionIndex = 0) {
  const controls = page.locator('[class*="select__control"], .ant-select-selector');
  await controls.nth(dropdownIndex).click();
  await page.waitForSelector(OPTION_SELECTOR);
  await page.locator(OPTION_SELECTOR).nth(optionIndex).click();
  await page.waitForLoadState('networkidle');
}

export async function selectDropdownByLabel(page: Page, dropdownIndex: number, label: string) {
  const controls = page.locator('[class*="select__control"], .ant-select-selector');
  await controls.nth(dropdownIndex).click();
  await page.waitForSelector(OPTION_SELECTOR);
  const option = page
    .getByRole('option', { name: label })
    .or(page.locator(OPTION_SELECTOR).filter({ hasText: label }))
    .first();
  await option.waitFor({ timeout: 6_000 });
  await option.click();
  await page.waitForLoadState('networkidle');
}

export async function confirmDialog(page: Page) {
  const dialog = page.getByRole('dialog').or(page.locator('[class*="modal"]'));
  if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dialog.getByRole('button', { name: /confirm|yes|ok/i }).click();
    await page.waitForLoadState('networkidle');
  }
}
