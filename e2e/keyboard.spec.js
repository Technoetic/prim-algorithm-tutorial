import { test } from '@playwright/test';
import fs from 'node:fs';

const outDir = 'step_archive/screenshots/keyboard';
fs.mkdirSync(outDir, { recursive: true });

test.describe('키보드 인터랙션 시각 검증', () => {
  test('Tab 포커스 순환', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: `${outDir}/tab-before.png`, fullPage: false });
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('Tab');
    }
    await page.screenshot({ path: `${outDir}/tab-after.png`, fullPage: false });
  });

  test('Enter 버튼 활성화', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    await page.locator('[data-action="play"]').focus();
    await page.screenshot({ path: `${outDir}/enter-before.png`, fullPage: false });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/enter-after.png`, fullPage: false });
  });

  test('화살표/Space 단축키', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outDir}/arrows-before.png`, fullPage: false });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/arrows-after.png`, fullPage: false });
  });

  test('R 키로 리셋', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.screenshot({ path: `${outDir}/reset-before.png`, fullPage: false });
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/reset-after.png`, fullPage: false });
  });
});
