$ErrorActionPreference = "Stop"

$source = $PSScriptRoot
$output = Join-Path $source "cloudflare-pages"
$assets = @("index.html", "favicon.svg", "style.css", "anime.umd.min.js", "app.js", "_headers")

if (-not (Test-Path -LiteralPath $output)) {
    New-Item -ItemType Directory -Path $output | Out-Null
}

$existing = @(Get-ChildItem -Force -LiteralPath $output)
$unexpected = @($existing | Where-Object { $_.PSIsContainer -or $_.Name -notin $assets })
if ($unexpected.Count -gt 0) {
    $names = $unexpected | ForEach-Object Name
    throw "Staging folder contains items outside the approved static asset list: $($names -join ', '). Inspect $output before deploying."
}

foreach ($asset in $assets) {
    $sourcePath = Join-Path $source $asset
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Required Cloudflare Pages asset is missing: $sourcePath"
    }
    Copy-Item -LiteralPath $sourcePath -Destination $output -Force
}

$deployed = @(Get-ChildItem -Force -LiteralPath $output | ForEach-Object Name)
if (@(Compare-Object -ReferenceObject $assets -DifferenceObject $deployed).Count -gt 0) {
    throw "Staging folder does not contain exactly the approved static assets: $output"
}

Write-Output "Cloudflare Pages assets prepared in: $output"
