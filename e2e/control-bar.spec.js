import { expect, test } from '@playwright/test';

const CONTROL = '.play-layout__control';

test.describe('컨트롤 바 통합 E2E', () => {
  test('컨트롤 바에 4그룹이 모두 존재한다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const bar = page.locator(CONTROL);
    await expect(bar).toBeVisible();

    // 재생 그룹 4개
    await expect(bar.locator('[data-action="prev"]')).toBeVisible();
    await expect(bar.locator('[data-action="play"]')).toBeVisible();
    await expect(bar.locator('[data-action="next"]')).toBeVisible();
    await expect(bar.locator('[data-action="reset"]')).toBeVisible();

    // 속도 3개
    await expect(bar.locator('[data-action="speed"][data-speed="0.5"]')).toBeVisible();
    await expect(bar.locator('[data-action="speed"][data-speed="1"]')).toBeVisible();
    await expect(bar.locator('[data-action="speed"][data-speed="1.5"]')).toBeVisible();

    // 프리셋 3개
    await expect(bar.locator('[data-action="preset"][data-preset="cable"]')).toBeVisible();
    await expect(bar.locator('[data-action="preset"][data-preset="grid"]')).toBeVisible();
    await expect(bar.locator('[data-action="preset"][data-preset="maze"]')).toBeVisible();

    // 진행도
    await expect(bar.locator('[data-role="progress"]')).toBeVisible();
  });

  test('컨트롤 바의 모든 .btn이 터치 타겟 44×44 이상', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const buttons = await page.locator(`${CONTROL} .btn`).all();
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test('속도 버튼 클릭 시 active 토글', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const slow = page.locator(`${CONTROL} [data-action="speed"][data-speed="0.5"]`);
    const normal = page.locator(`${CONTROL} [data-action="speed"][data-speed="1"]`);

    // 초기 '보통' 활성
    await expect(normal).toHaveClass(/active/);
    await slow.click();
    await expect(slow).toHaveClass(/active/);
    await expect(normal).not.toHaveClass(/active/);
  });

  test('프리셋 버튼 클릭 시 active 토글 + 정점 수 변화', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const cable = page.locator(`${CONTROL} [data-action="preset"][data-preset="cable"]`);
    const grid = page.locator(`${CONTROL} [data-action="preset"][data-preset="grid"]`);
    const maze = page.locator(`${CONTROL} [data-action="preset"][data-preset="maze"]`);

    await expect(cable).toHaveClass(/active/);
    const nodes = page.locator('[data-role="main-svg"] .node');
    await expect(nodes).toHaveCount(6);

    await grid.click();
    await page.waitForTimeout(500);
    await expect(grid).toHaveClass(/active/);
    await expect(cable).not.toHaveClass(/active/);
    await expect(nodes).toHaveCount(7);

    await maze.click();
    await page.waitForTimeout(500);
    await expect(maze).toHaveClass(/active/);
    await expect(nodes).toHaveCount(12);
  });

  test('프리셋 전환 시 SVG 컨테이너 높이 420px 유지', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const viz = page.locator('.play-layout__viz');
    const heightOf = async () => (await viz.boundingBox())?.height;

    const h1 = await heightOf();
    await page.locator(`${CONTROL} [data-action="preset"][data-preset="grid"]`).click();
    await page.waitForTimeout(500);
    const h2 = await heightOf();
    await page.locator(`${CONTROL} [data-action="preset"][data-preset="maze"]`).click();
    await page.waitForTimeout(500);
    const h3 = await heightOf();

    expect(h1).toBe(420);
    expect(h2).toBe(420);
    expect(h3).toBe(420);
  });

  test('재생→일시정지→리셋 흐름', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const play = page.locator(`${CONTROL} [data-action="play"]`);
    const reset = page.locator(`${CONTROL} [data-action="reset"]`);
    const progress = page.locator(`${CONTROL} [data-role="progress"]`);

    const initial = (await progress.textContent())?.trim();
    expect(initial).toMatch(/^1\s*\/\s*\d+$/);

    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(1800);

    // 한 번 더 클릭 = 일시정지
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    const mid = (await progress.textContent())?.trim();
    expect(mid).not.toBe(initial);

    await reset.click();
    await page.waitForTimeout(300);
    const after = (await progress.textContent())?.trim();
    expect(after).toMatch(/^1\s*\/\s*\d+$/);
  });

  test('Next 버튼 연속 클릭 시 progress가 단조 증가', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    const next = page.locator(`${CONTROL} [data-action="next"]`);
    const progress = page.locator(`${CONTROL} [data-role="progress"]`);

    const readIdx = async () => {
      const t = (await progress.textContent())?.trim() ?? '0/0';
      return Number.parseInt(t.split('/')[0], 10);
    };
    const first = await readIdx();
    await next.click();
    await next.click();
    await next.click();
    const later = await readIdx();
    expect(later).toBeGreaterThan(first);
    expect(later - first).toBe(3);
  });

  test('프리셋 전환 후에도 재생 동작이 정상', async ({ page }) => {
    await page.goto('/');
    await page.locator('#chapter-3').scrollIntoViewIfNeeded();

    await page.locator(`${CONTROL} [data-action="preset"][data-preset="grid"]`).click();
    await page.waitForTimeout(500);

    const play = page.locator(`${CONTROL} [data-action="play"]`);
    const progress = page.locator(`${CONTROL} [data-role="progress"]`);

    const before = (await progress.textContent())?.trim();
    await play.click();
    await page.waitForTimeout(1800);
    await play.click(); // pause
    const after = (await progress.textContent())?.trim();
    expect(after).not.toBe(before);
  });
});
