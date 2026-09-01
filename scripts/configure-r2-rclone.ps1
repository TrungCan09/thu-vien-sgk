$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $projectRoot ".tools"
$rclone = Get-ChildItem -LiteralPath $toolsDir -Recurse -Filter "rclone.exe" -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $rclone) {
  throw "rclone.exe was not found in .tools. Download rclone before running this script."
}

$accountId = "da70a6be6fcb6d5ddcfd2f287058c5ad"
$configPath = Join-Path $toolsDir "rclone-r2.conf"

Write-Host "Paste Access Key ID, then press Enter:"
$accessKeyId = Read-Host

Write-Host "Paste Secret Access Key, then press Enter:"
$secretAccessKey = Read-Host -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey)

try {
  $plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  & $rclone config create r2 s3 `
    provider Cloudflare `
    account $accountId `
    access_key_id $accessKeyId `
    secret_access_key $plainSecret `
    endpoint "https://$accountId.r2.cloudflarestorage.com" `
    --config $configPath
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

& $rclone lsf r2:thu-vien-sgk --config $configPath --max-depth 1 | Select-Object -First 5
Write-Host "Rclone R2 config is ready at $configPath"
