import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const output=path.resolve(process.argv[2] ?? 'D:/Codex/outputs/face-mask-detection/p12-report-slides');
const work=path.resolve(process.argv[3] ?? 'D:/Codex/work/face-mask-detection/p12-build');
const skill=process.env.P12_PRESENTATIONS_SKILL ?? 'C:/Users/ASUS/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations';
const runtime=process.env.P12_RUNTIME_PYTHON ?? 'C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const require=createRequire(path.join(work,'package.json'));
process.env.RUNTIME_NODE_MODULES ??= path.join(work,'node_modules');
const {Presentation,PresentationFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const deck=Presentation.create({slideSize:{width:1280,height:720}});
deck.theme.defaultFont='Arial';
const slides=JSON.parse(await fs.readFile(path.join(here,'slides.json'),'utf8'));
if(slides.length!==14 || slides.reduce((n,s)=>n+s.seconds,0)!==600) throw Error('slide count/timing mismatch');
await fs.mkdir(path.join(output,'qa/slides'),{recursive:true});
await fs.mkdir(work,{recursive:true});
function text(slide,value,left,top,width,height,size=29,color='#172B42',bold=false) {
 const s=slide.shapes.add({geometry:'textbox',position:{left,top,width,height},fill:'none',line:{fill:'none',width:0}});
 s.text=value;s.text.style={fontFamily:'Arial',fontSize:size,color,bold};s.text.insets=0;return s;
}
function table(slide,headers,rows,top=180,height=270) {
 const values=[headers,...rows];const t=slide.tables.add({rows:values.length,columns:headers.length,left:72,top,width:1136,height,values});
 t.borders.assign({style:'solid',fill:'#D9E1E8',width:1});
 for(let r=0;r<values.length;r++)for(let c=0;c<headers.length;c++) {
   const cell=t.getCell(r,c);cell.fill=r===0?'#172B42':r%2?'#FFFFFF':'#F0F4F7';
   cell.text.style={fontFamily:'Arial',fontSize:25,color:r===0?'#FFFFFF':'#172B42',bold:r===0};
 }
 return t;
}
for(const [i,data] of slides.entries()) {
 const s=deck.slides.add();s.background.fill=i===0?'#172B42':'#FFFFFF';
 const dark=i===0;const ink=dark?'#FFFFFF':'#172B42';
 text(s,'ĐỒ ÁN CHUYÊN NGÀNH  /  NHÓM 1',72,34,1000,25,16,dark?'#B9CDD8':'#526779');
 text(s,data.title,72,dark?140:89,1136,dark?160:78,dark?58:43,ink,true);
 text(s,`${String(i+1).padStart(2,'0')} / 14`,1120,670,90,25,16,dark?'#B9CDD8':'#526779');
 text(s,'P12 để review · Bằng chứng chốt 20/10/2026',72,670,1000,25,16,dark?'#B9CDD8':'#526779');
 if(data.kind==='cover') {
   text(s,data.subtitle,72,330,1080,70,32,'#DCE7EC');
   data.body.forEach((v,j)=>text(s,v,72,450+j*48,1100,40,25,'#FFFFFF'));
 } else if(data.kind==='table') {
   table(s,data.headers,data.rows,180,data.rows.length>4?330:280);
   data.body.forEach((v,j)=>text(s,v,72,535+j*50,1136,45,26));
 } else if(data.kind==='image') {
   const bytes=await fs.readFile(path.join(output,'assets',data.asset));
   s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt:'Ảnh giao diện dùng media synthetic không khuôn mặt và response fixture',fit:'contain',position:{left:650,top:180,width:558,height:450}});
   data.body.forEach((v,j)=>text(s,v,72,195+j*105,520,94,27));
 } else if(data.kind==='architecture') {
   const labels=['Browser\nCapture và sampler','FastAPI\nDecode và readiness','SSDLite adapter\nChecksum và CPU'];
   labels.forEach((v,j)=>{
     const box=s.shapes.add({geometry:'rect',position:{left:72+j*395,top:200,width:340,height:125},fill:'#EDF3F7',line:{fill:'#69859C',width:1}});
     box.text=v;box.text.style={fontFamily:'Arial',fontSize:28,color:'#172B42',bold:true};
     if(j<2)s.shapes.add({geometry:'rightArrow',position:{left:420+j*395,top:245,width:40,height:30},fill:'#69859C',line:{fill:'none',width:0}});
   });
   data.body.forEach((v,j)=>text(s,v,72,365+j*62,1136,55,27));
 } else if(data.kind==='quality') {
   s.charts.add('bar',{position:{left:72,top:190,width:560,height:360},categories:['Có khẩu trang','Không khẩu trang','Đeo sai'],series:[{name:'F1 test',values:[.4494,.0635,.1053],fill:'#2A6C86'}],hasLegend:false,dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.00%',textStyle:{fontSize:20}},xAxis:{textStyle:{fontSize:18}},yAxis:{min:0,max:1,numberFormatCode:'0%',textStyle:{fontSize:18}}});
   data.body.forEach((v,j)=>text(s,v,680,200+j*100,528,94,27));
   text(s,'F1 theo lớp tại confidence 0,15 và IoU 0,5',72,575,560,55,22);
 } else {
   data.body.forEach((v,j)=>{
     text(s,String(j+1).padStart(2,'0'),72,205+j*102,65,50,28,'#2A6C86',true);
     text(s,v,160,205+j*102,1040,90,30);
   });
 }
 s.speakerNotes.text=`Thời lượng gợi ý: ${data.seconds} giây.\n${data.notes}\nNguồn: ${data.source}\nSnapshot source P11: 88687c935f8cfe94036fb81bd4fb924fadd04776.`;
 await fs.writeFile(path.join(output,'qa/slides',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await (await deck.export({slide:s,format:'png',scale:1})).arrayBuffer()));
}
const candidate=path.join(work,'candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidate);
const finalPath=path.join(work,'final',String(Date.now()),'slide-thuyet-trinh.pptx');
const receiptPath=path.join(work,'qa',`${Date.now()}-validation.json`);
await fs.mkdir(path.dirname(finalPath),{recursive:true});
await fs.mkdir(path.dirname(receiptPath),{recursive:true});
await finalizePresentation({workspaceDir:work,candidatePath:candidate,finalPath,pythonExecutable:runtime,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...[5,11,12].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:14,requiredNativeTableOwnerSlides:[5,11,12],requiredNativeChartOwnerSlides:[10],
 fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,materializeLiteralChartWorkbooks:true,
 receiptPath});
await fs.copyFile(finalPath,path.join(output,'slide-thuyet-trinh.pptx'));
await fs.copyFile(receiptPath,path.join(output,'qa','slides-validation.json'));
console.log('Exported 14 editable slides with 600 seconds of speaker notes.');
