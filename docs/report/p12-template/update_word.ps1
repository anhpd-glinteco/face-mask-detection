param([Parameter(Mandatory=$true)][string]$Docx,[Parameter(Mandatory=$true)][string]$Pdf,[Parameter(Mandatory=$true)][string]$Receipt,[switch]$ReadOnlyVerify)
$ErrorActionPreference='Stop'
$word=$null
$document=$null
try {
  $word=New-Object -ComObject Word.Application
  $word.Visible=$false
  $word.DisplayAlerts=0
  $word.AutomationSecurity=3
  $document=$word.Documents.Open([System.IO.Path]::GetFullPath($Docx),$false,[bool]$ReadOnlyVerify)
  if (!$ReadOnlyVerify) {
  $null=$document.Fields.Update()
  foreach ($toc in $document.TablesOfContents) {$toc.Update()}
  # Word creates its built-in TOC styles when fields first expand.
  foreach ($styleId in @(-20,-21,-22)) {
    $tocStyle=$document.Styles.Item($styleId)
    $tocStyle.Font.Name='Times New Roman'
    $tocStyle.Font.Size=11
    $tocStyle.ParagraphFormat.LineSpacingRule=0
    $tocStyle.ParagraphFormat.SpaceBefore=0
    $tocStyle.ParagraphFormat.SpaceAfter=0
    $tocStyle.ParagraphFormat.KeepWithNext=0
  }
  $document.Repaginate()
  foreach ($toc in $document.TablesOfContents) {$toc.Update()}
  $document.Repaginate()
  $document.Save()
  }
  $document.Repaginate()
  $document.ExportAsFixedFormat([System.IO.Path]::GetFullPath($Pdf),17)
  $entries=@()
  foreach ($paragraph in $document.Paragraphs) {
    $style=[string]$paragraph.Style.NameLocal
    if ($style -match 'Heading [12]|FrontHeading|FigureCaption|TableCaption') {
      $entries+=@{text=$paragraph.Range.Text.Trim();style=$style;section_page=$paragraph.Range.Information(1);physical_page=$paragraph.Range.Information(3)}
    }
  }
  @{word_version=$word.Version;read_only=[bool]$ReadOnlyVerify;pages=$document.ComputeStatistics(2);toc_count=$document.TablesOfContents.Count;entries=$entries} | ConvertTo-Json -Depth 7 | Set-Content -Encoding utf8 $Receipt
  Write-Output "Word refreshed fields and exported PDF: $($document.ComputeStatistics(2)) pages"
} finally {
  if ($document) {$document.Close($false);[void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)}
  if ($word) {$word.Quit();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)}
  [GC]::Collect();[GC]::WaitForPendingFinalizers()
}
