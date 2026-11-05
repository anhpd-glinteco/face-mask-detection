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
  if (!await page.getByRole('button', {name: 'Xem dự đoán chưa chắc chắn (1)'}).getAttribute('aria-expanded').then(v=>v==='true')) {
      await page.getByRole('button', {name: 'Xem dự đoán chưa chắc chắn (1)'}).click();
    }
    await expect(page.locator('.detection-uncertain')).toContainText('Chưa chắc chắn');
  await expect(page.getByLabel('Thống kê detection')).toHaveText('1 phát hiện đạt ngưỡng trong frame · 1 chưa chắc chắn');
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

test('central picker, lower picker and keyboard activation', async ({page}) => {
  await page.route('**/api/v1/detect', route => route.fulfill({json:{
    schema_version:'1.0', image:{width:320,height:240}, model:{name:'fixture',version:'picker'},
    detections:[], timing_ms:{preprocess:0,inference:0,postprocess:0}
  }}));
  for (const activation of ['auto','lower','Enter','Space']) {
    await page.goto('/');
    await uploadImage(page, activation);
    await expect(page.getByText('Không phát hiện đối tượng', {exact:true})).toBeVisible();
  }
});

test('one hundred raw predictions show two accepted boxes until expanded', async ({page}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(...args) {
      const context = getContext.apply(this, args);
      if (args[0] === '2d' && context && !context.counted) {
        context.counted = true;
        const transform = context.setTransform;
        const stroke = context.strokeRect;
        context.setTransform = function(...values) { this.canvas.dataset.boxCount = '0'; return transform.apply(this, values); };
        context.strokeRect = function(...values) { this.canvas.dataset.boxCount = String(Number(this.canvas.dataset.boxCount || 0) + 1); return stroke.apply(this, values); };
      }
      return context;
    };
  });
  await page.route('**/api/v1/detect', route => route.fulfill({json:{
    schema_version:'1.0', image:{width:320,height:240}, model:{name:'fixture',version:'100'},
    detections:Array.from({length:100},(_,i)=>({class_id:1,label:'with_mask',confidence:i<2?.8:.01,bbox:{x1:10,y1:10,x2:100,y2:100}})),
    timing_ms:{preprocess:0,inference:0,postprocess:0}
  }}));
  await page.goto('/');
  await uploadImage(page);
  const canvas = page.locator('.detection-canvas');
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(canvas).toHaveAttribute('data-box-count','2');
  const toggle = page.getByRole('button',{name:'Xem dự đoán chưa chắc chắn (98)'});
  await toggle.click();
  await expect(page.getByRole('listitem')).toHaveCount(100);
  await expect(canvas).toHaveAttribute('data-box-count','100');
  await toggle.click();
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(canvas).toHaveAttribute('data-box-count','2');
});
