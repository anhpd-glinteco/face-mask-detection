/* Local real-API benchmark; only the media source is synthetic. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

async function main() {
  const [output, checksum] = process.argv.slice(2);
  assert(output && checksum, 'usage: node benchmark.mjs OUTPUT CHECKSUM');
  const result = { requests: [], samples: [], errors: [], phases: [] };
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let phase = 'image';
  const pending = new Set();
  const starts = new Map();
  page.on('pageerror', error => result.errors.push({ phase, error: error.message }));
  page.on('request', request => {
    if (request.url().endsWith('/api/v1/detect')) starts.set(request, { phase, started: performance.now() });
  });
  page.on('requestfailed', request => {
    if (starts.has(request)) result.requests.push({ phase: starts.get(request).phase,
      ok: false, failure: request.failure(), latency_ms: performance.now() - starts.get(request).started });
  });
  page.on('requestfinished', request => {
    if (!starts.has(request)) return;
    const meta = starts.get(request);
    const latency_ms = performance.now() - meta.started;
    const work = (async () => {
      const response = await request.response();
      const row = { phase: meta.phase, latency_ms, status: response.status(), ok: false };
      result.requests.push(row);
      try {
        row.body = await response.json();
        assert.equal(response.status(), 200);
        assert.equal(row.body.model.version, checksum);
        assert.equal(row.body.schema_version, '1.0');
        row.ok = true;
      } catch (error) { row.error = error.message; }
    })();
    pending.add(work);
    work.finally(() => pending.delete(work));
  });
  await page.route('**/fixture.webm', route => route.fulfill({
    path: path.resolve('e2e/fixtures/landscape.webm'), contentType: 'video/webm' }));
  await page.addInitScript(() => {
    window.benchmarkDisplay = [];
    let captured = null;
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      captured = performance.now();
      return original.apply(this, args);
    };
    // Image load plus a paint opportunity approximates snapshot display, not physical screen scanout.
    document.addEventListener('load', event => {
      if (event.target instanceof HTMLImageElement && event.target.closest('.video-workspace') && captured !== null) {
        const start = captured;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.benchmarkDisplay.push({ capture_to_display_ms: performance.now() - start });
        }));
      }
    }, true);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: async () => {
        const source = document.createElement('video');
        source.src = '/fixture.webm'; source.muted = true; source.loop = true;
        source.style.display = 'none'; document.body.append(source);
        await source.play();
        window.benchmarkStream = source.captureStream();
        return window.benchmarkStream;
      }
    }});
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  async function sample(region) {
    const statistics = region ? await region.getByRole('region', { name: 'Thống kê lấy mẫu' }).locator('dd').allTextContents() : [];
    const metrics = (await cdp.send('Performance.getMetrics')).metrics;
    result.samples.push({ phase, time: Date.now(), statistics,
      js_heap_bytes: metrics.find(m => m.name === 'JSHeapUsedSize')?.value });
  }
  try {
    await page.goto('http://localhost:3110');
    await page.locator('#image-input').evaluate(async input => {
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 240;
      const context = canvas.getContext('2d'); context.fillStyle = '#338855'; context.fillRect(0, 0, 320, 240);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const files = new DataTransfer(); files.items.add(new File([blob], 'synthetic.png', { type: 'image/png' }));
      input.files = files.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForResponse(response => response.url().endsWith('/api/v1/detect') && response.status() === 200);
    await page.locator('.result-content, .success-empty').first().waitFor();
    await sample();
    for (phase of ['video', 'webcam']) {
      await page.getByRole('button', { name: phase === 'video' ? 'Video' : 'Webcam', exact: true }).click();
      const region = page.getByRole('region', { name: phase === 'video' ? 'Phân tích video' : 'Phân tích webcam', exact: true });
      await page.evaluate(() => { window.benchmarkDisplay = []; });
      if (phase === 'video') {
        await page.locator('#video-input').setInputFiles(path.resolve('e2e/fixtures/landscape.webm'));
        await region.locator('video').evaluate(async video => { video.loop = true; video.muted = true; await video.play(); });
      } else await region.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
      const started = performance.now();
      while (performance.now() - started < 60000) {
        await page.waitForTimeout(1000);
        await sample(region);
      }
      const duration_s = (performance.now() - started) / 1000;
      const display = await page.evaluate(() => window.benchmarkDisplay);
      assert(display.length > 0, `no displayed ${phase} snapshots`);
      if (phase === 'video') await region.locator('video').evaluate(video => video.pause());
      else {
        await region.getByRole('button', { name: 'Dừng', exact: true }).click();
        assert(await page.evaluate(() => window.benchmarkStream.getTracks().every(t => t.readyState === 'ended')));
      }
      result.phases.push({ phase, duration_s, display,
        final_statistics: await region.getByRole('region', { name: 'Thống kê lấy mẫu' }).locator('dd').allTextContents() });
      await page.waitForTimeout(500);
    }
    await Promise.all(pending);
    assert.equal(result.errors.length, 0, 'browser errors');
    for (const name of ['image', 'video', 'webcam']) {
      const rows = result.requests.filter(r => r.phase === name && !r.failure?.errorText?.includes('ERR_ABORTED'));
      assert(rows.some(r => r.ok), `no successful ${name} requests`);
      assert(rows.every(r => r.ok), `failed ${name} request`);
    }
    result.complete = true;
  } finally {
    await Promise.allSettled(pending);
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify(result, null, 2));
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
