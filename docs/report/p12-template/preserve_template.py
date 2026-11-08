"""Restore preserve-only reference parts after Word's field-update normalization."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
from build_report import REFERENCE_SHA


def restore(reference,docx,receipt):
    assert reference.resolve()!=docx.resolve()
    assert hashlib.sha256(reference.read_bytes()).hexdigest()==REFERENCE_SHA
    preserved=json.loads(receipt.read_text(encoding='utf-8'))['preserved_parts']
    with ZipFile(reference) as original,ZipFile(docx) as current:
        parts={n:current.read(n) for n in current.namelist() if not n.startswith('docProps/')}
        for record in preserved:parts[record['part']]=original.read(record['part'])
        ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
        document=E.fromstring(parts['word/document.xml']);body=document.find('w:body',ns)
        types=E.fromstring(parts['[Content_Types].xml'])
        for element in E.fromstring(original.read('[Content_Types].xml')):
            key='Extension' if E.QName(element).localname=='Default' else 'PartName'
            if key=='PartName' and element.get(key).lstrip('/') not in parts:continue
            if not any(e.tag==element.tag and e.get(key)==element.get(key) for e in types):types.append(copy.deepcopy(element))
        for element in list(types):
            if (element.get('PartName') or '').startswith('/docProps/'):types.remove(element)
        parts['[Content_Types].xml']=E.tostring(types,xml_declaration=True,encoding='UTF-8',standalone=True)
    temp=docx.with_suffix('.preserved.docx')
    with ZipFile(temp,'w',ZIP_DEFLATED) as archive:
        for name,data in parts.items():archive.writestr(name,data)
    temp.replace(docx)
    with ZipFile(docx) as archive:
        assert all(hashlib.sha256(archive.read(r['part'])).hexdigest()==r['sha256'] for r in preserved)
    print(f'Restored and checked {len(preserved)} preserve-only parts, excluding the replaced cover.')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--reference',type=Path,required=True);p.add_argument('--docx',type=Path,required=True);p.add_argument('--receipt',type=Path,required=True)
    a=p.parse_args();restore(a.reference,a.docx,a.receipt)
