import { test } from '@playwright/test';
import fs from 'node:fs';

const outDir = 'step_archive/screenshots/mouse';
fs.mkdirSync(outDir, { recursive: true });

test.describe('마우스 인터랙션', () => {
  test('버튼 호버 시각 효과', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-action="play"]');
    await btn.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outDir}/hover-before.png`, fullPage: false });
    await btn.hover();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/hover-after.png`, fullPage: false });
  });

  test('정점 클릭으로 시작 정점 변경', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outDir}/node-click-before.png`, fullPage: false });
    await page.locator('[data-role="main-svg"] .node').nth(2).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/node-click-after.png`, fullPage: false });
  });

  test('프리셋 탭 클릭', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: `${outDir}/preset-before.png`, fullPage: false });
    await page.locator('[data-action="preset"][data-preset="grid"]').click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/preset-after.png`, fullPage: false });
  });
});
