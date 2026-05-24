# =====================================================================
# xr - Even G2 dev launcher (PowerShell native, no Git Bash required)
# =====================================================================
# Mirrors the essential parts of even-dev/start-even.sh in pure
# PowerShell so it runs anywhere PowerShell + Node are available.
#
# Usage (typically via the `xr` function from $PROFILE):
#   xr                    Interactive app picker
#   xr <app>              Launch <app> (vite + Even Hub Simulator)
#   xr <app> -WebOnly     Vite only (skip simulator)
#   xr <app> -SimOnly     Simulator only (vite expected at $Url)
#   xr -List              List discovered apps
#   xr -Help              Show usage
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$App,

    [switch]$WebOnly,
    [switch]$SimOnly,
    [switch]$List,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# ---- paths / config ----
$Root     = 'Y:\xr_apps'
$EvenDev  = Join-Path $Root 'even-dev'
$AppsJson = Join-Path $EvenDev 'apps.json'
$AppsDir  = Join-Path $EvenDev 'apps'

$Port     = if ($env:PORT)      { $env:PORT }      else { '5173' }
$SimHost  = if ($env:SIM_HOST)  { $env:SIM_HOST }  else { '127.0.0.1' }
$ViteHost = if ($env:VITE_HOST) { $env:VITE_HOST } else { '0.0.0.0' }
$Url      = if ($env:URL)       { $env:URL }       else { "http://${SimHost}:${Port}" }

# ---- helpers ----
function Write-Issue {
    param([string]$Message)
    Write-Host "  - $Message" -ForegroundColor Yellow
}

function Test-EnvironmentBasics {
    # Checks that apply to every command (help/list/launch).
    # Returns an array of issue strings; empty array = all good.
    $issues = @()

    # Node.js present?
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        $issues += "Node.js not found in PATH. Install from https://nodejs.org/ (v20+ recommended)."
    } else {
        $verStr = (& node --version) -replace '^v', ''
        $major = 0
        [void][int]::TryParse($verStr.Split('.')[0], [ref]$major)
        if ($major -gt 0 -and $major -lt 20) {
            $issues += "Node.js v$verStr detected — Vite 7 needs v20+. Check 'where.exe node' for stale entries in PATH."
        }
    }

    # npx present?
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        $issues += "npx not found in PATH (normally bundled with npm)."
    }

    # even-dev present?
    if (-not (Test-Path $EvenDev)) {
        $issues += "even-dev not found at '$EvenDev'. If you moved the workspace, update `$Root in $PSCommandPath."
    }

    # apps.json present?
    if ((Test-Path $EvenDev) -and -not (Test-Path $AppsJson)) {
        $issues += "apps.json not found at '$AppsJson'. even-dev may be a partial clone."
    }

    return $issues
}

function Test-PortAvailable {
    param([int]$TargetPort)
    # Returns $null if free, otherwise a description of who's holding it.
    try {
        $conns = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
    } catch {
        return $null  # cmdlet unavailable — skip the check rather than fail
    }
    if (-not $conns) { return $null }

    $owners = foreach ($c in $conns) {
        $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) { "$($proc.ProcessName) (PID $($proc.Id))" } else { "PID $($c.OwningProcess)" }
    }
    return ($owners | Select-Object -Unique) -join ', '
}

function Assert-Environment {
    param([switch]$IncludePort)

    $issues = Test-EnvironmentBasics
    if ($IncludePort) {
        $holder = Test-PortAvailable -TargetPort ([int]$Port)
        if ($holder) {
            $issues += "Port $Port is already in use by: $holder. Free it, or run: `$env:PORT = 5180; xr <app>"
        }
    }

    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-Host "Environment check failed:" -ForegroundColor Red
        foreach ($i in $issues) { Write-Issue $i }
        Write-Host ""
        Write-Host "See Y:\xr_apps\README.md > Troubleshooting for details." -ForegroundColor DarkGray
        throw "Preflight failed ($($issues.Count) issue(s))."
    }
}

function Show-Help {
    Write-Host @"
xr - Even G2 dev launcher (PowerShell)

  xr                    Interactive app picker
  xr <app>              Launch <app> (vite + Even Hub Simulator)
  xr <app> -WebOnly     Vite only (skip simulator)
  xr <app> -SimOnly     Simulator only (expects vite at $Url)
  xr -List              List discovered apps
  xr -Help              Show this help

Apps are discovered from:
  - $AppsDir\<name>\        (built-in apps)
  - $AppsJson               (entries with local paths like "../name")

Env overrides: PORT, SIM_HOST, VITE_HOST, URL
"@
}

function Get-AppMap {
    $map = [ordered]@{}

    # Built-in apps under even-dev\apps\* (skip _shared, dotfiles)
    if (Test-Path $AppsDir) {
        Get-ChildItem $AppsDir -Directory -Force |
            Where-Object { $_.Name -notmatch '^[_.]' } |
            Sort-Object Name |
            ForEach-Object { $map[$_.Name] = $_.FullName }
    }

    # apps.json entries — only local paths (skip git URLs)
    if (Test-Path $AppsJson) {
        $registry = Get-Content $AppsJson -Raw | ConvertFrom-Json
        foreach ($prop in $registry.PSObject.Properties) {
            $val = [string]$prop.Value
            if ($val -match '^(https?|git)://' -or $val -match '^git@') { continue }
            $candidate = Join-Path $EvenDev $val
            if (Test-Path $candidate) {
                $map[$prop.Name] = (Resolve-Path $candidate).Path
            }
        }
    }

    return $map
}

function Select-AppInteractive {
    param([System.Collections.Specialized.OrderedDictionary]$Map)
    $names = @($Map.Keys)
    Write-Host ""
    Write-Host "Available apps:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $names.Count; $i++) {
        "{0,3}  {1,-20} {2}" -f ($i + 1), $names[$i], $Map[$names[$i]]
    }
    Write-Host ""
    $sel = Read-Host "Select [1-$($names.Count)] or name (default 1)"
    if (-not $sel) { return $names[0] }
    if ($sel -match '^\d+$') {
        $idx = [int]$sel - 1
        if ($idx -ge 0 -and $idx -lt $names.Count) { return $names[$idx] }
        throw "Selection out of range: $sel"
    }
    if ($Map.Contains($sel)) { return $sel }
    throw "Unknown app: $sel"
}

function Wait-Url {
    param([string]$TargetUrl, [int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $res = Invoke-WebRequest -Uri $TargetUrl -Method Head -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) { return $true }
        } catch {
            # not ready yet — keep polling
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Stop-ProcessTree {
    param([int]$ProcessId)
    if (-not $ProcessId) { return }
    try {
        & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
    } catch {
        # best-effort cleanup
    }
}

function Install-IfNeeded {
    param([string]$Dir, [string]$Label)
    if (-not (Test-Path (Join-Path $Dir 'package.json'))) { return }
    if (Test-Path (Join-Path $Dir 'node_modules')) { return }
    Write-Host "Installing $Label dependencies..." -ForegroundColor Yellow
    Push-Location $Dir
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed in $Dir (exit $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }
}

# ---- main ----
if ($Help) { Show-Help; return }

# Basic env checks for every command. Port check is added at launch time only.
Assert-Environment

$map = Get-AppMap

if ($List) {
    Write-Host "Discovered apps:" -ForegroundColor Cyan
    foreach ($k in $map.Keys) { "  {0,-20} {1}" -f $k, $map[$k] }
    return
}

if (-not $App) {
    $App = Select-AppInteractive -Map $map
}

if (-not $map.Contains($App)) {
    Write-Host "Unknown app '$App'." -ForegroundColor Red
    Write-Host "Available: $($map.Keys -join ', ')"
    throw "Unknown app: $App"
}

$AppDir = $map[$App]
Write-Host ""
Write-Host "Selected app: $App" -ForegroundColor Cyan
Write-Host "  -> $AppDir"
Write-Host ""

Install-IfNeeded -Dir $EvenDev -Label 'even-dev root'
Install-IfNeeded -Dir $AppDir  -Label $App

# Port check only matters when we're starting Vite ourselves (not SimOnly).
if (-not $SimOnly) {
    $holder = Test-PortAvailable -TargetPort ([int]$Port)
    if ($holder) {
        Write-Host ""
        Write-Host "Port $Port is already in use by: $holder" -ForegroundColor Red
        Write-Host "Free it, or relaunch with a different port:" -ForegroundColor DarkGray
        Write-Host "  `$env:PORT = 5180; xr $App" -ForegroundColor DarkGray
        throw "Port $Port unavailable."
    }
}

# ---- SimOnly: just launch the simulator pointing at an already-running vite
if ($SimOnly) {
    Write-Host "SIM_ONLY: launching simulator at $Url ..." -ForegroundColor Cyan
    & npx --yes '@evenrealities/evenhub-simulator@latest' $Url
    return
}

# ---- start vite in background ----
Write-Host "Starting Vite dev server in $EvenDev ..." -ForegroundColor Cyan
$env:VITE_APP_NAME = $App
$env:APP_NAME      = $App
$env:APP_PATH      = $AppDir

$viteProc = Start-Process -FilePath 'npx.cmd' `
    -ArgumentList @('vite', '--host', $ViteHost, '--port', $Port) `
    -WorkingDirectory $EvenDev `
    -NoNewWindow `
    -PassThru

try {
    Write-Host "Waiting for $Url ..." -NoNewline
    if (-not (Wait-Url -TargetUrl $Url -TimeoutSec 90)) {
        Write-Host " timeout." -ForegroundColor Red
        throw "Vite did not become ready at $Url within 90s."
    }
    Write-Host " ready." -ForegroundColor Green

    if ($WebOnly) {
        Write-Host ""
        Write-Host "WEB_ONLY: simulator skipped. Vite running at $Url" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop."
        $viteProc.WaitForExit()
        return
    }

    Write-Host "Launching Even Hub Simulator..." -ForegroundColor Cyan
    & npx --yes '@evenrealities/evenhub-simulator@latest' $Url
} finally {
    if ($viteProc -and -not $viteProc.HasExited) {
        Write-Host ""
        Write-Host "Stopping Vite (PID $($viteProc.Id))..." -ForegroundColor Yellow
        Stop-ProcessTree -ProcessId $viteProc.Id
    }
}
