// P12 screenshots exercise UI with explicitly synthetic responses, never a physical camera.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const require=createRequire(path.join(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const out=path.resolve(process.argv[2] ?? 'D:/Codex/outputs/face-mask-detection/p12-report-slides/assets');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:960},deviceScaleFactor:1});
  await page.route('**/fixture.webm',r=>r.fulfill({path:path.join(root,'apps/web/e2e/fixtures/landscape.webm'),contentType:'video/webm'}));
  let requests=0;
  await page.route('**/api/v1/detect',r=>{
    requests++;
    return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({schema_version:'1.0',image:{width:320,height:240},model:{name:'P12 UI fixture',version:'synthetic-not-model'},detections:[{class_id:1,label:'with_mask',confidence:.98,bbox:{x1:20,y1:20,x2:110,y2:110}},{class_id:2,label:'without_mask',confidence:.15,bbox:{x1:200,y1:100,x2:300,y2:220}},{class_id:3,label:'mask_worn_incorrectly',confidence:.149,bbox:{x1:120,y1:130,x2:190,y2:220}}],timing_ms:{preprocess:1,inference:2,postprocess:1}})});
  });
  const flows=[];
  async function checkUncertainty(flow) {
    const counts=page.getByLabel('Thống kê detection',{exact:true});
    await counts.getByText('Tổng: 3 · Đạt ngưỡng: 2 · Chưa chắc chắn: 1',{exact:true}).waitFor();
    const rows=page.getByRole('list',{name:'Danh sách đối tượng phát hiện'}).getByRole('listitem');
    assert.equal(await rows.count(),3);
    assert.match(await rows.nth(1).innerText(),/Không có khẩu trang[\s\S]*15%/);
    assert.doesNotMatch(await rows.nth(1).innerText(),/Chưa chắc chắn/);
    assert.match(await rows.nth(2).innerText(),/Đeo sai[\s\S]*Chưa chắc chắn[\s\S]*15%/);
    flows.push({flow,counts:await counts.innerText(),confidence:[.98,.15,.149],boundaryAndRoundedScoreChecked:true});
  }
  await page.addInitScript(()=>{
    window.p12Streams=[];
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{
      const v=document.createElement('video');v.src='/fixture.webm';v.loop=true;v.muted=true;v.style.display='none';document.body.append(v);await v.play();
      const s=v.captureStream();window.p12Streams.push(s);return s;
    }}});
  });
  await page.goto(process.env.P12_WEB_URL ?? 'http://localhost:3212');
  const {uploadImage}=await import(pathToFileURL(path.join(root,'apps/web/e2e/image-fixture.js')).href);
  await uploadImage(page);
  await page.getByText('1. Có khẩu trang',{exact:true}).waitFor();
  await checkUncertainty('image');
  await page.screenshot({path:path.join(out,'image.png'),fullPage:true});
  await page.getByRole('button',{name:'Video',exact:true}).click();
  await page.locator('#video-input').setInputFiles(path.join(root,'apps/web/e2e/fixtures/landscape.webm'));
  await page.getByLabel('Video đã chọn',{exact:true}).evaluate(v=>{v.muted=true;v.loop=true;return v.play();});
  await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).waitFor();
  await page.waitForTimeout(500);
  await checkUncertainty('video');
  await page.screenshot({path:path.join(out,'video-full.png'),fullPage:true});
  await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).screenshot({path:path.join(out,'video.png')});
  await page.getByRole('button',{name:'Webcam',exact:true}).click();
  await page.getByRole('region',{name:'Phân tích webcam',exact:true}).getByRole('button',{name:'Bắt đầu',exact:true}).click();
  await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).waitFor();
  await page.waitForTimeout(500);
  await checkUncertainty('webcam');
  await page.screenshot({path:path.join(out,'webcam-full.png'),fullPage:true});
  await page.getByRole('region',{name:'Frame đã phân tích',exact:true}).screenshot({path:path.join(out,'webcam.png')});
  await page.getByRole('region',{name:'Phân tích webcam',exact:true}).getByRole('button',{name:'Dừng',exact:true}).click();
  if(!await page.evaluate(()=>window.p12Streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')))) throw Error('camera fixture tracks retained');
  if(requests<3) throw Error('missing fixture requests');
  await fs.writeFile(path.join(out,'capture.json'),JSON.stringify({source:'P12 synthetic UI response; face-free media; no real model or physical camera',uiRevision:'a341b6bdc101b09d89fddb713d1158bdf28ab32f',flows,requests,tracksEnded:true,date:new Date().toISOString()},null,2));
} finally {await browser.close();}
