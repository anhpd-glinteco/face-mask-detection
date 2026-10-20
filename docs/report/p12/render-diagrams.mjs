import path from 'node:path';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const {chromium}=createRequire(path.join(root,'apps/web/package.json'))('@playwright/test');
const out=process.argv[2];
if(!out) throw Error('usage: render-diagrams.mjs ASSET_DIRECTORY');
await fs.mkdir(out,{recursive:true});
const b=await chromium.launch();
try { const p=await b.newPage();for(const name of ['architecture','sequence']) {
  await p.goto(pathToFileURL(path.join(here,`${name}-current.svg`)).href);
  await p.locator('svg').screenshot({path:path.join(out,`${name}.png`)});
}} finally {await b.close();}
