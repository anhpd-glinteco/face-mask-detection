"""Rasterize the authoritative Word PDF for page-by-page visual inspection."""
import argparse
import json
import os
from pathlib import Path
from pdf2image import convert_from_path

p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--bin',type=Path,required=True)
a=p.parse_args();os.environ['PATH']=str(a.bin/'override')+os.pathsep+str(a.bin/'fallback')+os.pathsep+os.environ['PATH']
target=a.output/'qa/word-final';target.mkdir(parents=True,exist_ok=True)
pages=convert_from_path(a.output/'bao-cao-do-an.pdf',dpi=110)
assert len(pages)==json.loads((a.output/'manifest.json').read_text(encoding='utf-8'))['pages']
for i,page in enumerate(pages,1):page.save(target/f'page-{i}.png')
print(f'Rendered all {len(pages)} final PDF pages.')
