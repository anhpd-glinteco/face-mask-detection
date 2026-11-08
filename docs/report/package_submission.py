"""Prepare clean publication copies, then verify and package the rendered PDFs."""
import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import shutil
from xml.etree import ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

from pypdf import PdfReader, PdfWriter

FORBIDDEN = re.compile(r'codex|chatgpt|openai|\b[A-Za-z]:[/\\]|file:///', re.I)
VERSION = 'local-final-2026-11-08'
FILES = ['DACN_1_BaoCao_v1.docx', 'DACN_1_BaoCao_v1.pdf',
         'DACN_1_ThuyetTrinh.pptx', 'DACN_1_ThuyetTrinh.pdf',
         'DACN_1_ChuongTrinh.docx', 'DACN_1_ChuongTrinh.pdf', 'DACN_1_ChuongTrinh.txt']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean_office(source, target):
    # Publication properties and theme display names change; report template parts stay intact.
    with ZipFile(source) as original, ZipFile(target, 'w', ZIP_DEFLATED) as output:
        for info in original.infolist():
            data = original.read(info.filename)
            if info.filename.startswith('docProps/') and info.filename.endswith('.xml'):
                root = ET.fromstring(data)
                for child in root:
                    name = child.tag.rsplit('}', 1)[-1]
                    if name in ('creator', 'lastModifiedBy', 'description', 'keywords', 'subject',
                                'Company', 'Manager', 'Application', 'Template'):
                        child.text = ''
                data = ET.tostring(root, encoding='utf-8', xml_declaration=True)
            if '/theme/' in info.filename and info.filename.endswith('.xml'):
                data = data.replace(b'name="ChatGPT"', b'name="Local"')
            output.writestr(info, data)
    with ZipFile(source) as original, ZipFile(target) as output:
        assert original.namelist() == output.namelist()
        assert all(original.read(n).replace(b'name="ChatGPT"', b'name="Local"') == output.read(n)
                   if '/theme/' in n else original.read(n) == output.read(n) for n in original.namelist()
                   if not n.startswith('docProps/'))


def check_office(path):
    def check_xml(name, data):
        root = ET.fromstring(data)
        content = ' '.join(root.itertext()) + ' '.join(
            value for node in root.iter() for value in node.attrib.values())
        assert not FORBIDDEN.search(content), f'{path.name}: {name}: {FORBIDDEN.search(content)}'

    with ZipFile(path) as package:
        assert package.testzip() is None
        for name in package.namelist():
            assert not re.search(r'(?:^|/)(?:comments\d*|commentAuthors)\.xml$', name), name
            if name.endswith(('.xml', '.rels')):
                check_xml(name, package.read(name))
            elif name.endswith('.xlsx'):
                with ZipFile(BytesIO(package.read(name))) as nested:
                    assert nested.testzip() is None
                    for item in nested.namelist():
                        if item.endswith(('.xml', '.rels')):
                            check_xml(name + '/' + item, nested.read(item))


def clean_pdf(path):
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.metadata = None
    if '/Metadata' in writer._root_object:
        del writer._root_object['/Metadata']
    temporary = path.with_suffix('.clean.pdf')
    writer.write(temporary)
    temporary.replace(path)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('stage', choices=['prepare', 'finalize'])
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--reuse-from', type=Path, help='Reuse the five published slide/program files unchanged')
args = parser.parse_args()
work, output = args.work, args.output
output.mkdir(parents=True, exist_ok=True)

if args.stage == 'prepare':
    for source, name in [
        (work / 'report/bao-cao-do-an.docx', FILES[0]),
        (work / 'slides-output/slide-thuyet-trinh.pptx', FILES[2]),
        (work / 'program/DACN_1_ChuongTrinh.docx', FILES[4]),
    ]:
        if args.reuse_from and name != FILES[0]:
            shutil.copyfile(args.reuse_from / name, output / name)
        else:
            clean_office(source, output / name)
        check_office(output / name)
    shutil.copyfile(work / 'report/bao-cao-do-an.pdf', output / FILES[1])
    shutil.copyfile(work / 'program/DACN_1_ChuongTrinh.pdf', output / FILES[5])
    source = Path(__file__).with_name('program-link.md').read_text(encoding='utf-8')
    (output / FILES[6]).write_text(source, encoding='utf-8')
    if args.reuse_from:
        for name in FILES[2:]:shutil.copyfile(args.reuse_from / name, output / name)
    print('Publication copies prepared; export the presentation PDF before finalize.')
else:
    receipts = {}
    for name in FILES:
        path = output / name
        assert path.is_file(), name
        if path.suffix in ('.docx', '.pptx'):
            check_office(path)
        elif path.suffix == '.pdf':
            if not args.reuse_from or name==FILES[1]:clean_pdf(path)
            reader = PdfReader(path)
            text = '\n'.join(page.extract_text() for page in reader.pages)
            links = [str(annotation.get_object().get('/A', {}).get('/URI', ''))
                     for page in reader.pages for annotation in page.get('/Annots', [])]
            assert not FORBIDDEN.search(text + '\n'.join(links)), name
            assert '\ufffd' not in text and 'Error! Reference' not in text, name
            expected = {'DACN_1_BaoCao_v1.pdf': json.loads((work / 'report-work/word-final.json').read_text(encoding='utf-8-sig'))['pages'], 'DACN_1_ThuyetTrinh.pdf': 14,
                        'DACN_1_ChuongTrinh.pdf': 2}[name]
            assert len(reader.pages) == expected, (name, len(reader.pages))
            if name == 'DACN_1_ChuongTrinh.pdf':
                assert any('84758d86d9fc7046abf17708e551242e33f1e723' in link for link in links)
            receipts[name] = {'pages': len(reader.pages), 'links': len(links)}
        else:
            assert not FORBIDDEN.search(path.read_text(encoding='utf-8'))
    if args.reuse_from:
        assert all((args.reuse_from/name).read_bytes()==(output/name).read_bytes() for name in FILES[2:]), 'reused files changed'
    records = [{'file': name, 'version': VERSION, 'bytes': (output / name).stat().st_size,
                'sha256': sha(output / name)} for name in FILES]
    manifest = {'version': VERSION, 'results_date': '2026-11-05', 'export_date': '2026-11-08',
                'frontend_commit': '84758d86d9fc7046abf17708e551242e33f1e723',
                'files': records, 'pdf_checks': receipts, 'reused_from': ({name: json.loads((args.reuse_from / 'manifest-delivery.json').read_text(encoding='utf-8'))['version'] for name in FILES[2:]} if args.reuse_from else {})}
    (output / 'manifest-delivery.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    checklist = '# Bộ nộp đồ án nhóm 1\n\nPhiên bản ' + VERSION + '. Xuất ngày 08/11/2026, tổng hợp kết quả đến 05/11/2026.\n\n'
    checklist += f"Báo cáo {receipts['DACN_1_BaoCao_v1.pdf']['pages']} trang; slide 14 trang; hướng dẫn chương trình 2 trang. Các bản PDF là bản xem cố định. DOCX/PPTX dùng để chỉnh sửa.\n\n"
    checklist += 'Checkpoint được nhóm chuẩn bị riêng theo checksum trong hướng dẫn, không nằm trong ZIP. Nhóm 1, khóa K18, lớp học phần 20261IT6150003; phân công đã cập nhật theo xác nhận và GitHub. Quyền dữ liệu và điều kiện triển khai công khai chưa đạt.\n\n'
    checklist += '## Danh sách và SHA-256\n\n' + '\n'.join(f"- `{r['file']}` · {VERSION} · `{r['sha256']}`" for r in records)
    checklist += '\n\nManifest liệt kê checksum của bảy tài liệu. README và manifest không tự băm chính chúng. ZIP chỉ chứa bộ nộp; hồ sơ kiểm chứng kỹ thuật lưu riêng.\n'
    (output / 'README-GIAO-NHAN.md').write_text(checklist, encoding='utf-8')
    archive = output / 'DACN_1_BanGiao_local.zip'
    members = FILES + ['README-GIAO-NHAN.md', 'manifest-delivery.json']
    with ZipFile(archive, 'w', ZIP_DEFLATED) as package:
        for name in members:
            package.write(output / name, name)
    with ZipFile(archive) as package:
        assert package.testzip() is None
        assert set(package.namelist()) == set(members)
        assert all(package.read(name) == (output / name).read_bytes() for name in members)
        package.extractall(work / 'zip-roundtrip')
    (work / 'package-verification.json').write_text(json.dumps(
        {'status': 'PASS', 'zip_sha256': sha(archive), 'members': members,
         'metadata_content_links_scan': 'PASS', 'pdf_checks': receipts}, indent=2), encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'zip_sha256': sha(archive), 'pdf_checks': receipts}))
