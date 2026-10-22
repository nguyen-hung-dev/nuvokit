param([Parameter(Mandatory=$true)][string]$RunId, [ValidateSet('online','offline')][string]$Mode = 'online')
$ErrorActionPreference = 'Stop'
# This file can only install/remove NuvoKit inside a disposable WDAG guest.
if ($env:USERNAME -ne 'WDAGUtilityAccount' -or $RunId -notmatch '^[a-f0-9]{32}$') {
  throw 'This worker is restricted to an identified disposable Windows Sandbox run.'
}
$resultRoot = 'C:\NuvoKitQAResults'
if (-not (Test-Path -LiteralPath $resultRoot -PathType Container)) { throw 'Mapped QA output is missing.' }
$reportPath = Join-Path $resultRoot 'result.json'
$report = [ordered]@{ runId=$RunId; mode=$Mode; success=$false; startedAt=[DateTime]::UtcNow.ToString('o') }
@{runId=$RunId;mode=$Mode;started=$true} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'started.json') -Encoding UTF8
try {
  $tools = @(foreach ($tool in @('git','node','npm','rustc','cargo','cl')) { if (Get-Command $tool -ErrorAction SilentlyContinue) { $tool } })
  $report.toolchainCommandsPresent = $tools
  $report.noDevelopmentToolchain = ($tools.Count -eq 0)
  $report.windowsBuild = (Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').CurrentBuildNumber
  $env:NUVOKIT_SANDBOX_QA = '1'
  $helper = 'C:\NuvoKitSetup\nuvokit-setup-tests.exe'
  $detail = Join-Path $resultRoot 'integration.json'
  $target = Join-Path $env:LOCALAPPDATA 'NuvoKit'
  $arguments = if ($Mode -eq 'offline') { '--integration-offline' } else { '--integration' }
  & $helper $arguments $target $detail
  $code = $LASTEXITCODE
  if (-not (Test-Path -LiteralPath $detail -PathType Leaf)) { throw 'Guest helper did not produce a report.' }
  $integration = Get-Content -LiteralPath $detail -Raw -Encoding UTF8 | ConvertFrom-Json
  $report.integration = $integration
  $installedApp = Join-Path $target 'nuvokit.exe'
  if (Test-Path -LiteralPath $installedApp -PathType Leaf) {
    $report.installedApplicationHash = (Get-FileHash -LiteralPath $installedApp -Algorithm SHA256).Hash.ToLowerInvariant()
    $expected = Get-Content -LiteralPath 'C:\NuvoKitSetup\expected.json' -Raw | ConvertFrom-Json
    $report.expectedApplicationHash = $expected.applicationHash
    if (-not $integration.success) { Copy-Item -LiteralPath $installedApp -Destination (Join-Path $resultRoot 'installed-nuvokit.exe') }
  }
  $report.success = ($code -eq 0 -and $integration.success -eq $true -and $report.noDevelopmentToolchain)
  if (-not $report.success) { $report.failure = 'Integration failed or this guest contains a development toolchain.' }
} catch {
  $report.failure = $_.Exception.Message
} finally {
  $report.finishedAt = [DateTime]::UtcNow.ToString('o')
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding UTF8
}
