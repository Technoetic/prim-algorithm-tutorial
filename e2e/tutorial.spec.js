import { expect, test } from '@playwright/test';

test.describe('Prim 튜토리얼 E2E', () => {
  test('홈 로드 시 챕터 3와 프리셋 탭이 모두 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#chapter-3')).toBeVisible();
    await expect(page.locator('h2')).toContainText('단계별');
    await expect(page.locator('[data-action="preset"][data-preset="cable"]')).toBeVisible();
    await expect(page.locator('[data-action="preset"][data-preset="grid"]')).toBeVisible();
    await expect(page.locator('[data-action="preset"][data-preset="maze"]')).toBeVisible();
  });

  test('재생 버튼 클릭 시 스텝이 진행되고 총 비용이 변한다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    const progress = page.locator('[data-role="progress"]');
    const initial = await progress.textContent();
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(2500);
    const later = await progress.textContent();
    expect(later).not.toBe(initial);
  });

  test('다음/이전 버튼이 수동 스텝 이동을 한다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    const progress = page.locator('[data-role="progress"]');
    const first = await progress.textContent();
    await page.locator('[data-action="next"]').click();
    const second = await progress.textContent();
    expect(first).not.toBe(second);
    await page.locator('[data-action="prev"]').click();
    const third = await progress.textContent();
    expect(third).toBe(first);
  });

  test('프리셋 전환 시 시각화가 재렌더된다', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-action="preset"][data-preset="grid"]').click();
    await page.waitForTimeout(800);
    const nodes = page.locator('[data-role="main-svg"] .node');
    await expect(nodes).toHaveCount(7);
    await page.locator('[data-action="preset"][data-preset="maze"]').click();
    await page.waitForTimeout(800);
    await expect(nodes).toHaveCount(12);
  });

  test('키보드 Space로 재생/일시정지 토글', async ({ page }) => {
    await page.goto('/');
    const playBtn = page.locator('[data-action="play"]');
    const initialText = await playBtn.textContent();
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    const playingText = await playBtn.textContent();
    expect(playingText).not.toBe(initialText);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test('리셋 버튼으로 0스텝으로 복귀', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();
    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="reset"]').click();
    const progress = await page.locator('[data-role="progress"]').textContent();
    expect(progress?.trim().startsWith('1')).toBe(true);
  });
});
