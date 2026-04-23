import { test } from '@playwright/test';
import fs from 'node:fs';

const outDir = 'step_archive/screenshots/e2e';
fs.mkdirSync(outDir, { recursive: true });

test.describe('스크린샷 기반 E2E', () => {
  test('프리셋별 상태 캡처', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${outDir}/01-initial.png`, fullPage: false });

    // 3스텝 진행
    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="next"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/02-step3.png`, fullPage: false });

    // 빠르게 + 재생
    await page.locator('[data-action="speed"][data-speed="1.5"]').click();
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${outDir}/03-complete.png`, fullPage: false });

    // 프리셋 전환
    await page.locator('[data-action="preset"][data-preset="grid"]').click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/04-grid.png`, fullPage: false });

    await page.locator('[data-action="preset"][data-preset="maze"]').click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/05-maze.png`, fullPage: false });
  });
});
