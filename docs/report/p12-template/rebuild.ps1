param([string]$Reference='D:/Nhom1_TTCSN - Copy.docx', [string]$Output='D:/Codex/outputs/face-mask-detection/p12-report-template', [string]$Work='D:/Codex/work/face-mask-detection/p12-template-build', [string]$Python='C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe')
$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
& $Python "$PSScriptRoot/build_report.py" --reference $Reference --output "$Output/bao-cao-do-an.docx" --work $Work
if ($LASTEXITCODE -ne 0) {throw 'Authoring failed'}
& "$PSScriptRoot/update_word.ps1" -Docx "$Output/bao-cao-do-an.docx" -Pdf "$Output/bao-cao-do-an.pdf" -Receipt "$Work/word-refresh.json"
& $Python "$PSScriptRoot/preserve_template.py" --reference $Reference --docx "$Output/bao-cao-do-an.docx" --receipt "$Work/authoring-receipt.json"
if ($LASTEXITCODE -ne 0) {throw 'Preservation failed'}
& "$PSScriptRoot/update_word.ps1" -Docx "$Output/bao-cao-do-an.docx" -Pdf "$Output/bao-cao-do-an.pdf" -Receipt "$Work/word-final.json" -ReadOnlyVerify
& $Python "$PSScriptRoot/verify_report.py" --reference $Reference --output $Output --work $Work
if ($LASTEXITCODE -ne 0) {throw 'Verification failed'}
