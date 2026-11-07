from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE
import re
import argparse

parser = argparse.ArgumentParser(description='Build the local program instructions from program-link.md.')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
work = args.output
work.mkdir(parents=True, exist_ok=True)
text = (root / 'docs/report/program-link.md').read_text(encoding='utf-8')
document = Document()
for section in document.sections:
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.top_margin = section.bottom_margin = Cm(2.54)
    section.left_margin = section.right_margin = Cm(2.54)
for name in ('Normal', 'Title', 'Heading 1'):
    style = document.styles[name]
    style.font.name = 'Times New Roman'
    style.font.color.rgb = RGBColor(0, 0, 0)
document.styles['Normal'].font.size = Pt(12)
document.styles['Normal'].paragraph_format.space_after = Pt(6)
document.styles['Normal'].paragraph_format.line_spacing = 1.15
document.styles['Title'].font.size = Pt(20)
document.styles['Heading 1'].font.size = Pt(14)
for node in document.styles.element.xpath('.//w:pBdr'):
    node.getparent().remove(node)
code = False
for line in text.splitlines():
    if line.startswith('```'):
        code = not code
        continue
    if not line:
        continue
    style = 'Title' if line.startswith('# ') else 'Heading 1' if line.startswith('## ') else 'Normal'
    content = line.lstrip('# ').replace('`', '')
    paragraph = document.add_paragraph(style=style)
    for part in re.split(r'(https?://[^\s]+)', content) if not code else [content]:
        if part.startswith(('https://', 'http://')) and not code:
            link = OxmlElement('w:hyperlink')
            link.set(qn('r:id'), document.part.relate_to(part, RELATIONSHIP_TYPE.HYPERLINK, is_external=True))
            run = OxmlElement('w:r')
            properties = OxmlElement('w:rPr')
            color = OxmlElement('w:color')
            color.set(qn('w:val'), '2457D6')
            properties.append(color)
            run.append(properties)
            text_node = OxmlElement('w:t')
            text_node.text = part
            run.append(text_node)
            link.append(run)
            paragraph._p.append(link)
        else:
            paragraph.add_run(part)
    if code:
        paragraph.paragraph_format.line_spacing = 1
        paragraph.paragraph_format.space_after = Pt(2)
        for run in paragraph.runs:
            run.font.name = 'Consolas'
            run.font.size = Pt(9)
document.core_properties.author = ''
document.core_properties.last_modified_by = ''
target = work / 'DACN_1_ChuongTrinh.docx'
document.save(target)
roundtrip = '\n'.join(''.join(p._p.itertext()) for p in Document(target).paragraphs)
assert '84758d86d9fc7046abf17708e551242e33f1e723' in roundtrip
assert '7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e' in roundtrip
assert 'localhost:3111' in roundtrip and 'Codex' not in roundtrip
print('Program document roundtrip PASS')
