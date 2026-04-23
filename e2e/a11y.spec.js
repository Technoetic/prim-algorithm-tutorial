import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('접근성(axe-core)', () => {
  test('홈 페이지 위반 0', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    if (results.violations.length > 0) {
      console.log('VIOLATIONS', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
});
