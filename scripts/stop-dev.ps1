$ErrorActionPreference = "Stop"

function Read-PidFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $content = (Get-Content -LiteralPath $Path -Raw).Trim()
  if (-not $content) {
    return $null
  }

  return [int]$content
}

function Stop-IfRunning {
  param(
    [string]$Label,
    [int]$Id
  )

  if (-not $Id) {
    return
  }

  try {
    $process = Get-Process -Id $Id -ErrorAction Stop
    cmd /c "taskkill /PID $($process.Id) /T /F" | Out-Null
    Write-Host "Stopped $Label (PID $Id)"
  } catch {
  }
}

function Get-ListeningProcessIds {
  param([int]$Port)

  $lines = cmd /c netstat -ano | Select-String "LISTENING"
  $ids = @()

  foreach ($line in $lines) {
    $lineText = $line.ToString()
    if (-not $lineText.Contains(":$Port")) {
      continue
    }

    $parts = ($lineText -replace "\s+", " ").Trim().Split(" ")
    if ($parts.Length -ge 5) {
      $ids += [int]$parts[-1]
    }
  }

  return $ids | Select-Object -Unique
}

function Stop-PortListeners {
  param(
    [string]$Label,
    [int]$Port
  )

  $ids = Get-ListeningProcessIds -Port $Port
  foreach ($id in $ids) {
    Stop-IfRunning -Label "$Label on port $Port" -Id $id
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $repoRoot ".runtime"
$backendRuntimeDir = Join-Path $repoRoot "backend/.runtime"

$frontendPid = Read-PidFile -Path (Join-Path $runtimeDir "frontend-dev.pid")
$backendPid = Read-PidFile -Path (Join-Path $runtimeDir "backend-dev.pid")
$mongoPid = Read-PidFile -Path (Join-Path $runtimeDir "mongo-dev.pid")

if (-not $mongoPid) {
  $mongoJson = Join-Path $backendRuntimeDir "mongo-dev.json"
  if (Test-Path -LiteralPath $mongoJson) {
    try {
      $mongoPid = [int](Get-Content -LiteralPath $mongoJson -Raw | ConvertFrom-Json).pid
    } catch {
      $mongoPid = $null
    }
  }
}

Stop-IfRunning -Label "Frontend" -Id $frontendPid
Stop-PortListeners -Label "Frontend" -Port 5173
Remove-Item -LiteralPath (Join-Path $runtimeDir "frontend-dev.pid") -Force -ErrorAction SilentlyContinue

Stop-IfRunning -Label "Backend" -Id $backendPid
Stop-PortListeners -Label "Backend" -Port 5000
Remove-Item -LiteralPath (Join-Path $runtimeDir "backend-dev.pid") -Force -ErrorAction SilentlyContinue

Stop-IfRunning -Label "MongoDB wrapper" -Id $mongoPid
Stop-PortListeners -Label "MongoDB" -Port 27017
Remove-Item -LiteralPath (Join-Path $runtimeDir "mongo-dev.pid") -Force -ErrorAction SilentlyContinue

Write-Host "Dev stack stop sequence finished."
