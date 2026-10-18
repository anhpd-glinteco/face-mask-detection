import { test, expect } from '@playwright/test';
import { uploadImage } from './image-fixture';

test('Compose web, real API, CORS and missing-model readiness', async ({ page, request }, testInfo) => {
  const api = 'http://localhost:8000/api/v1';
  const web = await request.get('http://localhost:3000');
  const health = await request.get(`${api}/health`);
  const ready = await request.get(`${api}/ready`);
  expect(web.status()).toBe(200);
  expect(health.status()).toBe(200);
  expect(ready.status()).toBe(503);
  for (const origin of ['http://localhost:3000', 'https://untrusted.invalid']) {
    const response = await request.fetch(`${api}/detect`, { method: 'OPTIONS', headers: {
      Origin: origin, 'Access-Control-Request-Method': 'POST',
    } });
    expect(response.headers()['access-control-allow-origin']).toBe(
      origin === 'http://localhost:3000' ? origin : undefined);
  }
  await page.goto('/');
  const detection = page.waitForResponse(`${api}/detect`);
  await uploadImage(page);
  const response = await detection;
  expect(response.status()).toBe(503);
  expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:3000');
  await expect(page.getByRole('alert').filter({ hasText: 'Mô hình chưa sẵn sàng' })).toBeVisible();
  await testInfo.attach('http-statuses', { body: JSON.stringify({
    web: web.status(), health: health.status(), ready: ready.status(), detect: response.status(),
  }), contentType: 'application/json' });
});
