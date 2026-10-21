import { test, expect } from '@playwright/test';
import { LABELS } from '../lib/detection-labels';
import { uploadImage } from './image-fixture';

test('real checkpoint image response, labels and resized overlay', async ({ page, request }, testInfo) => {
  const checksum = process.env.MODEL_SHA256;
  expect(checksum, 'Set MODEL_SHA256 to the expected local checkpoint checksum').toMatch(/^[a-f0-9]{64}$/);
  expect((await request.get('http://localhost:8000/api/v1/ready')).status()).toBe(200);
  await page.goto('/');
  const pending = page.waitForResponse('http://localhost:8000/api/v1/detect');
  await uploadImage(page);
  const response = await pending;
  expect(response.status()).toBe(200);
  expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:3109');
  const body = await response.json();
  expect(body.schema_version).toBe('1.0');
  expect(body.model.version).toBe(checksum);
  expect(body.image).toEqual({ width: 320, height: 240 });
  // The pinned internal checkpoint produces boxes on this synthetic image; this is not an accuracy assertion.
  expect(body.detections.length).toBeGreaterThan(0);
  for (const [index, detection] of body.detections.entries()) {
    expect(detection.label).toBe([undefined, 'with_mask', 'without_mask', 'mask_worn_incorrectly'][detection.class_id]);
    expect(Number.isFinite(detection.confidence)).toBe(true);
    expect(detection.confidence).toBeGreaterThanOrEqual(0);
    expect(detection.confidence).toBeLessThanOrEqual(1);
    const { x1, y1, x2, y2 } = detection.bbox;
    expect([x1, y1, x2, y2].every(Number.isFinite)).toBe(true);
    expect(x1).toBeGreaterThanOrEqual(0);
    expect(y1).toBeGreaterThanOrEqual(0);
    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBeGreaterThan(y1);
    expect(x2).toBeLessThanOrEqual(320);
    expect(y2).toBeLessThanOrEqual(240);
    const row = page.getByRole('list', { name: 'Danh sách đối tượng phát hiện' }).getByRole('listitem').nth(index);
    await expect(row).toContainText(`${index + 1}. ${LABELS[detection.label]}`);
    if (detection.confidence < .15) await expect(row).toContainText('Chưa chắc chắn');
    else await expect(row).not.toContainText('Chưa chắc chắn');
    await expect(row).toContainText(`${Math.round(detection.confidence * 100)}%`);
  }
  for (const value of Object.values(body.timing_ms)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
  await expect(page.getByRole('list', { name: 'Danh sách đối tượng phát hiện' }).getByRole('listitem')).toHaveCount(body.detections.length);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => {
      const image = document.querySelector('.preview-canvas img').getBoundingClientRect();
      const canvas = document.querySelector('.preview-canvas canvas').getBoundingClientRect();
      return Math.max(...['x', 'y', 'width', 'height'].map(key => Math.abs(image[key] - canvas[key])));
    })).toBeLessThan(1);
    await expect.poll(() => page.locator('.preview-canvas canvas').evaluate(canvas =>
      canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)
    )).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await testInfo.attach('real-model-response', { body: JSON.stringify(body), contentType: 'application/json' });
});
