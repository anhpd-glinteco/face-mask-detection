"""Check P12 artifact consistency against original evidence, without running product tests."""
import argparse
import hashlib
import json
import re
import shutil
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile
from pypdf import PdfReader


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(output, evidence_root):
    source = Path(__file__).parent
    report = (source/'bao-cao.md').read_text(encoding='utf-8')
    slides = load(source/'slides.json')
    all_slides = json.dumps(slides, ensure_ascii=False)
    assert len(slides)==14 and sum(s['seconds'] for s in slides)==600
    test = load(evidence_root/'p4-evaluation/test/report.json')
    validation = load(evidence_root/'p4-evaluation/validation/report.json')
    api = load(evidence_root/'p11-internal-regression/real-model-run-3/api-summary.json')
    browser = load(evidence_root/'p11-internal-regression/real-model-run-3/browser-summary.json')
    def vi(value, places):
        return f'{value:,.{places}f}'.translate(str.maketrans({',':'.','.':','}))
    for dataset in [test,validation]:
        assert dataset['threshold']==.15 and dataset['p3_ready'] is False
        for value in dataset['operating']['macro'].values():
            if isinstance(value,(int,float)):assert vi(value,4) in report
        for key in ['ap50','map50_95']:assert vi(dataset['ap'][key],4) in report
    for label, data in test['operating']['per_class'].items():
        for key in ['precision','recall','f1']:assert vi(data[key],4) in report
        assert str(data['support']) in report
    for kind in ['cold','warm']:
        assert vi(api[kind]['p95_ms'],2) in report and vi(api[kind]['p95_ms'],2) in all_slides
        assert vi(api[kind]['p50_ms'],2) in report
    for kind in ['video','webcam']:
        assert browser[kind]['duration_s']>=60
        assert vi(browser[kind]['displayed_frames_per_s'],2) in report
        assert vi(browser[kind]['displayed_frames_per_s'],2) in all_slides
        assert vi(browser[kind]['p95_ms'],2) in report
        assert str(browser[kind]['display_samples']) in all_slides
    report_pdf=PdfReader(output/'bao-cao-do-an.pdf')
    slide_pdf=PdfReader(output/'slide-thuyet-trinh.pdf')
    pages=report.split('<!-- page -->')
    assert len(report_pdf.pages)==len(pages)==27
    assert len(slide_pdf.pages)==14
    for number,(page,expected) in enumerate(zip(report_pdf.pages,pages),1):
        text=page.extract_text()
        title=re.search(r'^# (.+)',expected.strip(),re.M).group(1)
        normalize=lambda s:re.sub(r'\s+','',s)
        assert normalize(title) in normalize(text),(number,title)
        assert len(text)>300,(number,'short or blank page')
    ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
    with ZipFile(output/'slide-thuyet-trinh.pptx') as archive:
        slide_files=[n for n in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)]
        assert len(slide_files)==14
        for i,slide in enumerate(slides,1):
            text=''.join(ET.fromstring(archive.read(f'ppt/slides/slide{i}.xml')).itertext())
            for line in slide['title'].splitlines():assert line in text
            notes=''.join(ET.fromstring(archive.read(f'ppt/notesSlides/notesSlide{i}.xml')).itertext())
            assert slide['source'] in notes
            assert str(slide['seconds']) in notes
        charts=[n for n in archive.namelist() if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml',n)]
        assert len(charts)==1
        chart=archive.read(charts[0]).decode()
        for value in ['0.4494','0.0635','0.1053']:assert value in chart
        assert any(n.endswith('.xlsx') for n in archive.namelist())
    with ZipFile(output/'bao-cao-do-an.docx') as archive:
        doc_ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        styles=ET.fromstring(archive.read('word/styles.xml'))
        assert not styles.findall(".//w:style[@w:styleId='Title']//w:pBdr",doc_ns),'unexpected title border'
        assert not ET.fromstring(archive.read('word/document.xml')).findall('.//w:pBdr',doc_ns)
    receipt=load(output/'qa/slides-validation.json')
    assert receipt['finalSha256']==sha(output/'slide-thuyet-trinh.pptx')
    assert receipt['packageIntegrity']['status']=='pass'
    assert receipt['presentationLayout']['finding_count']==0
    capture=load(output/'assets/capture.json')
    assert capture['tracksEnded'] and capture['requests']>=3
    # Verify local source references in notes while preserving cited historical artifact paths.
    root=source.parents[2]
    for slide in slides:
        for ref in slide['source'].split('; '):
            if ref.startswith(('docs/','apps/','services/','ml/')):
                filename=ref.split(',')[0]
                assert (root/filename).exists(),filename
    snapshot=load(output/'p11-remote-snapshot.json')
    assert snapshot['headRefOid'].startswith('88687c9')
    assert all(c['conclusion']=='SUCCESS' for c in snapshot['statusCheckRollup'])
    evidence_files={
        'E01':evidence_root/'p4-evaluation/validation/decision.json',
        'E02':evidence_root/'p4-evaluation/test/report.json',
        'E03':evidence_root/'p11-internal-regression/real-model-run-3/api-summary.json',
        'E04':evidence_root/'p11-internal-regression/real-model-run-3/browser-summary.json',
        'E05a':evidence_root/'p11-internal-regression/real-model-run-3/memory.json',
        'E05b':evidence_root/'p11-internal-regression/real-model-run-3/environment.json',
        'E06':output/'p11-remote-snapshot.json',
        'E07':output/'assets/capture.json',
    }
    records=[]
    small=output/'evidence';small.mkdir(exist_ok=True)
    for eid,p in evidence_files.items():
        destination=small/f'{eid}-{p.name}'
        shutil.copyfile(p,destination)
        records.append({'id':eid,'original':str(p),'copy':str(destination.relative_to(output)),'sha256':sha(p),'bytes':p.stat().st_size})
    for name in ['bao-cao-do-an.docx','bao-cao-do-an.pdf','slide-thuyet-trinh.pptx','slide-thuyet-trinh.pdf']:
        p=output/name;records.append({'deliverable':name,'sha256':sha(p),'bytes':p.stat().st_size})
    result={'timestamp_utc':datetime.now(timezone.utc).isoformat(),'source_p11':'88687c935f8cfe94036fb81bd4fb924fadd04776','report_pages':27,'slides':14,'speaker_seconds':600,'assertions':'passed','independent_review':False,'physical_camera':False,'deployment_gate':'CLOSED','records':records}
    (output/'evidence-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('PASS: 27 report pages, 14 slides, 600 seconds, original metric/notes/package checks and hashes.')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True)
    p.add_argument('--evidence-root',type=Path,default=Path('D:/Codex/outputs/face-mask-detection'))
    args=p.parse_args();main(args.output,args.evidence_root)
