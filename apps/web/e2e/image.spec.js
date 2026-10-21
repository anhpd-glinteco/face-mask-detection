import { test, expect } from '@playwright/test';
import { uploadImage } from './image-fixture';

test('image overlay, resize, empty, invalid response and 503 retry', async ({ page }) => {
  let scenario = 'success';
  const response = {
    schema_version: '1.0', image: { width: 320, height: 240 },
    model: { name: 'synthetic-fixture', version: 'p9' },
    detections: [{ class_id: 1, label: 'with_mask', confidence: .98,
      bbox: { x1: 0, y1: 0, x2: 100, y2: 80 } },
      { class_id: 2, label: 'without_mask', confidence: .1499, bbox: { x1: 120, y1: 20, x2: 200, y2: 120 } }],
    timing_ms: { preprocess: 1, inference: 2, postprocess: 1 },
  };
  await page.route('**/api/v1/detect', route => route.fulfill({
    status: scenario === '503' ? 503 : 200,
    contentType: 'application/json',
    body: JSON.stringify(scenario === 'invalid' ? {} : scenario === 'empty'
      ? { ...response, detections: [] } : response),
  }));
  await page.goto('/');
  await uploadImage(page);
  await expect(page.getByText('1. Có khẩu trang', { exact: true })).toBeVisible();
  await expect(page.locator('.detection-uncertain')).toContainText('Chưa chắc chắn');
  await expect(page.getByLabel('Thống kê detection')).toHaveText('Tổng: 2 · Đạt ngưỡng: 1 · Chưa chắc chắn: 1');
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => {
      const a = document.querySelector('.preview-canvas img').getBoundingClientRect();
      const b = document.querySelector('.preview-canvas canvas').getBoundingClientRect();
      return Math.max(...['x', 'y', 'width', 'height'].map(k => Math.abs(a[k] - b[k])));
    })).toBeLessThan(1);
    await expect(page.locator('.detection-uncertain')).toBeVisible();
    await page.screenshot({ path: `test-results/uncertainty-${viewport.width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  scenario = 'empty';
  await uploadImage(page);
  await expect(page.getByText('Không phát hiện đối tượng', { exact: false })).toBeVisible();
  scenario = 'invalid';
  await uploadImage(page);
  await expect(page.getByRole('alert').filter({ hasText: 'Dữ liệu trả về từ dịch vụ không hợp lệ' })).toBeVisible();
  scenario = '503';
  await uploadImage(page);
  await expect(page.getByRole('alert').filter({ hasText: 'Mô hình chưa sẵn sàng' })).toBeVisible();
  scenario = 'success';
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('1. Có khẩu trang', { exact: true })).toBeVisible();
});
