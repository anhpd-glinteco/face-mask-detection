import { test, expect } from '@playwright/test';
import path from 'node:path';
import { uploadImage } from './image-fixture';

// Synthetic face-free video, reused from the P8 fixture checks.
test('video and webcam sampling, errors, stale results and cleanup', async ({ page }, testInfo) => {
  const fixtureRoot = path.resolve('e2e/fixtures');
  const results = [], errors = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  page.on('pageerror', e => errors.push(e.message));
  let width=320,height=240,scenario='success',requests=0,pending=null;
  const response = () => ({schema_version:'1.0',image:{width,height},model:{name:'synthetic-fixture',version:'p8-v1'},
    detections:[{class_id:1,label:'with_mask',confidence:.98,bbox:{x1:0,y1:0,x2:width/3,y2:height/3}},
    {class_id:2,label:'without_mask',confidence:.9,bbox:{x1:width-30,y1:height-30,x2:width,y2:height}}],
    timing_ms:{preprocess:1,inference:2,postprocess:1}});
  const fulfill = (route,body=response(),status=200) => route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
  await page.route('**/fixture.webm', route=>route.fulfill({path:fixtureRoot+'/landscape.webm',contentType:'video/webm'}));
  await page.route('**/api/v1/detect', async route=>{
    requests++;
    const payload=route.request().postDataBuffer().toString('latin1');
    assert(payload.includes('Content-Type: image/jpeg') || payload.includes('Content-Type: image/png'),'unexpected uploaded MIME');
    assert(!payload.includes('Content-Type: video/'),'full video uploaded');
    if(await page.getByRole('region',{name:'Phân tích webcam',exact:true}).count()) assert(payload.includes('filename="webcam-frame.jpg"'),'camera payload not JPEG frame');
    if(scenario==='delayed'){pending={route,body:response()};return;}
    if(scenario==='503') return fulfill(route,{detail:'Model not ready'},503);
    return fulfill(route);
  });
  await page.addInitScript(() => {
    window.fixtureStreams=[]; window.cameraRequests=0; window.cameraMode='success';
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{
      window.cameraRequests++;
      if(constraints.audio!==false || constraints.video!==true) throw new Error('unexpected constraints');
      if(window.cameraMode==='denied') throw new DOMException('fixture','NotAllowedError');
      const source=document.createElement('video');
      source.src='/fixture.webm';source.muted=true;source.loop=true;source.playsInline=true;
      source.style.display='none';document.body.append(source);
      await source.play();
      const stream=source.captureStream();
      window.fixtureStreams.push(stream);
      return stream;
    }}});
  });
  const camera=()=>page.getByRole('region',{name:'Phân tích webcam',exact:true});
  async function snapshot() {
    await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).waitFor();
    await page.waitForFunction(()=>{
      const image=[...document.querySelectorAll('.video-workspace img')].find(e=>e.getBoundingClientRect().width>0);
      const c=[...document.querySelectorAll('.video-workspace .detection-canvas')].find(e=>e.getBoundingClientRect().width>0);
      return image?.complete&&image.naturalWidth>0&&c?.width>0&&Math.abs(image.getBoundingClientRect().width-c.getBoundingClientRect().width)<1;
    });
  }
  async function tracksEnded() {
    assert(await page.evaluate(()=>window.fixtureStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),'camera track retained');
  }
  try {
    await page.goto('/');
    await uploadImage(page);
    await page.getByText('1. Có khẩu trang',{exact:true}).waitFor();
    results.push({name:'image-regression',status:'PASS'});
    await page.getByRole('button',{name:'Webcam',exact:true}).click();
    assert(await page.evaluate(()=>window.cameraRequests===0),'camera requested without click');
    for(const mobile of [testInfo.project.name === 'mobile']) {
      await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
      await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click(); await snapshot();
      await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="Thống kê lấy mẫu"]')].some(e=>e.getBoundingClientRect().width>0&&Number(e.querySelector('dd')?.textContent)>=3));
      let geometry;
      // Snapshots are replaced while sampling; wait for decode and ResizeObserver.
      await expect.poll(async () => {
        geometry=await page.evaluate(()=>{
        const image=[...document.querySelectorAll('.video-workspace img')].find(e=>e.getBoundingClientRect().width>0);
        const canvas=[...document.querySelectorAll('.video-workspace .detection-canvas')].find(e=>e.getBoundingClientRect().width>0);
        const a=image.getBoundingClientRect(),b=canvas.getBoundingClientRect();
        return {decoded:image.complete && image.naturalWidth > 0,dpr:devicePixelRatio,deltas:['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])),overflow:document.documentElement.scrollWidth>innerWidth,
          mirrored:getComputedStyle(document.querySelector('[aria-label="Camera trực tiếp"]')).transform!=='none'};
      });
        return geometry.decoded&&geometry.dpr===1&&geometry.deltas.every(d=>d<1)&&!geometry.overflow&&!geometry.mirrored;
      }, { message: 'decoded snapshot overlay must align within 1 CSS px' }).toBe(true);
      const statistics=await camera().getByRole('region',{name:'Thống kê lấy mẫu'}).innerText();
      assert(statistics.includes('Latency frame gần nhất')&&statistics.includes('ms'),'latency missing');
      await page.screenshot({path:testInfo.outputPath('webcam.png'),fullPage:true});
      await camera().getByRole('button',{name:'Dừng',exact:true}).click();
      await tracksEnded();
      const frozen=await camera().getByRole('region',{name:'Thống kê lấy mẫu'}).innerText();
      const count=requests; await page.waitForTimeout(450);
      assert(requests===count,'requests after stop');
      assert(await camera().getByRole('region',{name:'Thống kê lấy mẫu'}).innerText()===frozen,'statistics not frozen');
      results.push({name:'webcam-'+(mobile?'mobile':'desktop'),status:'PASS',geometry,statistics});
    }
    await page.evaluate(()=>window.cameraMode='denied');
    await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'từ chối'}).waitFor();
    await page.evaluate(()=>window.cameraMode='success');
    await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click(); await snapshot();
    results.push({name:'permission-denied-explicit-retry',status:'PASS'});
    await page.evaluate(()=>window.fixtureStreams.at(-1).getVideoTracks()[0].dispatchEvent(new Event('ended')));
    await page.getByRole('alert').filter({hasText:'ngắt kết nối'}).waitFor(); await tracksEnded();
    results.push({name:'track-ended-cleanup',status:'PASS'});
    scenario='503'; await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Mô hình chưa sẵn sàng'}).waitFor(); await tracksEnded();
    const failureCount=requests; await page.waitForTimeout(450);assert(requests===failureCount,'automatic retry');
    scenario='success';await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click();await snapshot();
    results.push({name:'api-error-release-explicit-retry',status:'PASS'});
    await camera().getByRole('button',{name:'Dừng',exact:true}).click();
    scenario='delayed';pending=null;
    await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click();
    await page.waitForFunction(()=>Number([...document.querySelectorAll('[aria-label="Phân tích webcam"] dd')][1]?.textContent)>=3);
    assert(pending,'missing pending request');
    const before=requests; const old=pending; await page.waitForTimeout(450);
    assert(requests===before,'overlapping camera request');
    await page.getByRole('button',{name:'Video',exact:true}).click();await tracksEnded();
    await fulfill(old.route,old.body).catch(()=>{});
    await page.waitForTimeout(250);
    assert(await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).count()===0,'stale camera snapshot');
    results.push({name:'slow-api-skipped-opportunities-mode-switch-stale',status:'PASS'});
    scenario='success';width=320;height=240;
    await page.getByLabel('Video đầu vào',{exact:true}).setInputFiles(fixtureRoot+'/landscape.webm');
    await page.locator('video[controls]').evaluate(v=>v.play());await snapshot();
    const videoStats=await page.getByRole('region',{name:'Phân tích video'}).getByRole('region',{name:'Thống kê lấy mẫu'}).innerText();
    assert(videoStats.includes('Latency frame gần nhất'),'video statistics missing');
    await page.locator('video[controls]').evaluate(v=>v.pause());
    results.push({name:'video-regression-with-statistics',status:'PASS'});
    scenario='delayed';pending=null;
    await page.locator('video[controls]').evaluate(v=>v.play());
    await page.waitForFunction(()=>Number([...document.querySelectorAll('[aria-label="Phân tích video"] dd')][1]?.textContent)>=3);
    assert(pending,'missing pending video request');
    const videoCount=requests;const videoPending=pending;
    await page.waitForTimeout(450);
    assert(requests===videoCount,'overlapping video request');
    await page.locator('video[controls]').evaluate(v=>v.pause());
    await fulfill(videoPending.route,videoPending.body).catch(()=>{});
    await page.waitForTimeout(250);
    assert(requests===videoCount,'request after video pause');
    assert(await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).count()===0,'stale video snapshot');
    results.push({name:'video-backpressure-pause-stale',status:'PASS'});
    scenario='success';
    await page.getByRole('button',{name:'Webcam',exact:true}).click();
    await camera().getByRole('button',{name:'Bắt đầu',exact:true}).click();await snapshot();
    await page.getByRole('button',{name:'Ảnh',exact:true}).click();await tracksEnded();
    results.push({name:'camera-to-image-cleanup',status:'PASS'});
    assert(errors.length===0,'JavaScript errors: '+errors.join(';'));
  } finally {
    await testInfo.attach('fixture-results', {body: JSON.stringify({results, requests, errors}, null, 2), contentType:'application/json'});
  }
});
