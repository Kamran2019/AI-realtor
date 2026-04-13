$ErrorActionPreference = "Stop"

function Ensure-Directory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Test-ProcessAlive {
  param([int]$Id)

  try {
    $null = Get-Process -Id $Id -ErrorAction Stop
    return $true
  } catch {
    return $false
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

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    if ((Get-ListeningProcessIds -Port $Port).Count -gt 0) {
      return $true
    }

    Start-Sleep -Seconds 2
  }

  throw "Timed out waiting for port $Port to open."
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
    }

    Start-Sleep -Seconds 2
  }

  throw "Timed out waiting for $Url."
}

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

function Start-ManagedProcess {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory,
    [string]$PidFile,
    [string]$StdOutLog,
    [string]$StdErrLog
  )

  $existingPid = Read-PidFile -Path $PidFile
  if ($existingPid -and (Test-ProcessAlive -Id $existingPid)) {
    Write-Host "$Name already running with PID $existingPid"
    return $existingPid
  }

  if ($existingPid -and -not (Test-ProcessAlive -Id $existingPid)) {
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
  }

  $process = Start-Process `
    -FilePath $FilePath `
    -ArgumentList $ArgumentList `
    -WorkingDirectory $WorkingDirectory `
    -RedirectStandardOutput $StdOutLog `
    -RedirectStandardError $StdErrLog `
    -PassThru `
    -WindowStyle Hidden

  Set-Content -LiteralPath $PidFile -Value $process.Id
  Write-Host "Started $Name with PID $($process.Id)"
  return $process.Id
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $repoRoot ".runtime"
$backendRuntimeDir = Join-Path $repoRoot "backend/.runtime"
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$mongoScript = "backend\src\scripts\startLocalMongo.js"
$backendNodemon = "..\node_modules\nodemon\bin\nodemon.js"
$frontendVite = "..\node_modules\vite\bin\vite.js"

Ensure-Directory -Path $runtimeDir
Ensure-Directory -Path $backendRuntimeDir

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "node_modules/nodemon/bin/nodemon.js"))) {
  throw "Missing node_modules. Run npm install first."
}

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "node_modules/vite/bin/vite.js"))) {
  throw "Missing Vite binary. Run npm install first."
}

$mongoPortBusy = (Get-ListeningProcessIds -Port 27017).Count -gt 0
if ($mongoPortBusy) {
  Write-Host "MongoDB already listening on port 27017"
} else {
  Start-ManagedProcess `
    -Name "MongoDB" `
    -FilePath $nodeExe `
    -ArgumentList @($mongoScript) `
    -WorkingDirectory $repoRoot `
    -PidFile (Join-Path $runtimeDir "mongo-dev.pid") `
    -StdOutLog (Join-Path $backendRuntimeDir "mongo-dev.log") `
    -StdErrLog (Join-Path $backendRuntimeDir "mongo-dev.err.log") | Out-Null

  Wait-ForPort -Port 27017 -TimeoutSeconds 600
}

$backendUp = $false
try {
  $health = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5000/api/health" -TimeoutSec 3
  $backendUp = $health.StatusCode -eq 200
} catch {
  $backendUp = $false
}

if ($backendUp) {
  Write-Host "Backend already responding on http://localhost:5000"
} else {
  Start-ManagedProcess `
    -Name "Backend" `
    -FilePath $nodeExe `
    -ArgumentList @($backendNodemon, "src/server.js") `
    -WorkingDirectory (Join-Path $repoRoot "backend") `
    -PidFile (Join-Path $runtimeDir "backend-dev.pid") `
    -StdOutLog (Join-Path $runtimeDir "backend-dev.log") `
    -StdErrLog (Join-Path $runtimeDir "backend-dev.err.log") | Out-Null

  Wait-ForHttp -Url "http://localhost:5000/api/health" -TimeoutSeconds 180
}

$frontendPortBusy = (Get-ListeningProcessIds -Port 5173).Count -gt 0
if ($frontendPortBusy) {
  Write-Host "Frontend already listening on http://localhost:5173"
} else {
  Start-ManagedProcess `
    -Name "Frontend" `
    -FilePath $nodeExe `
    -ArgumentList @($frontendVite) `
    -WorkingDirectory (Join-Path $repoRoot "frontend") `
    -PidFile (Join-Path $runtimeDir "frontend-dev.pid") `
    -StdOutLog (Join-Path $runtimeDir "frontend-dev.log") `
    -StdErrLog (Join-Path $runtimeDir "frontend-dev.err.log") | Out-Null

  Wait-ForPort -Port 5173 -TimeoutSeconds 120
}

Write-Host ""
Write-Host "Stack ready:"
Write-Host "  Backend:  http://localhost:5000"
Write-Host "  Frontend: http://localhost:5173"
Write-Host ""
Write-Host "Logs:"
Write-Host "  Mongo:    $((Join-Path $backendRuntimeDir 'mongo-dev.log'))"
Write-Host "  Backend:  $((Join-Path $runtimeDir 'backend-dev.log'))"
Write-Host "  Frontend: $((Join-Path $runtimeDir 'frontend-dev.log'))"
