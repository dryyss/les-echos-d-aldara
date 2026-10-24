import { expect, test } from '@playwright/test';

test('l’écran titre s’affiche avec un zoom entier', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width % 400).toBe(0);
    expect(box.height % 240).toBe(0);
    expect(box.width / 400).toBe(box.height / 240);
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'e2e/screenshots/titre.png' });
  expect(errors).toEqual([]);
});
