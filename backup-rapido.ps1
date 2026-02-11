# Param block must be first to allow named params when script is run
Param(
    [switch]$Force,
    [switch]$DryRun
)

# Backup Rpido - 3 Cópias do Sistema Atual
# Versao: 3.1.0
# Data: 19/01/2026
# 
# IMPORTANTE: Antes de executar este backup, certifique-se de atualizar:
#   1. CHANGELOG.md (adicionar nova versao no topo)
#   2. README.md (atualizar versao e funcionalidades)
#   3. DOCUMENTACAO_COMPLETA.md (atualizar versao e novas secoes)
#
# Uso: .\backup-rapido.ps1

# Keep a DateTime for arithmetic and a formatted string for filenames
$ErrorActionPreference = 'Continue'
$Timestamp = Get-Date
$TimestampStr = $Timestamp.ToString('yyyyMMdd_HHmmss')
# Use the script directory when available, otherwise the current location
$Origem = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } elseif ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

# Ensure $Origem is a single string (sometimes becomes an array in some shells)
if ($Origem -is [System.Array]) { $Origem = $Origem[0] }
$Origem = [string]$Origem

$LogFile = Join-Path $Origem 'backup-rapido.log'
Write-Host "Using origin: $Origem" -ForegroundColor DarkCyan
Write-Log "Origin path: $Origem"

function Write-Log {
    param([string]$m)
    $ts = Get-Date -Format o
    $line = "[$ts] $m"
    Add-Content -Path $LogFile -Value $line
}

Write-Host "`nBACKUP RAPIDO - 3 COPIAS`n" -ForegroundColor Cyan
Write-Log "START backup. Force=$Force DryRun=$DryRun"

if (-not $Force) {
    $ans = Read-Host 'Continuar backup? (S/N)'
    if ($ans -ne 'S' -and $ans -ne 's') {
        Write-Host 'Backup cancelado pelo usuario.' -ForegroundColor Red
        Write-Log 'User cancelled.'
        exit 0
    }
} else {
    Write-Host 'Modo forcado: pulando confirmacao.' -ForegroundColor Yellow
}

# destinations
$Destinos = @(
    Join-Path $Origem "Backup_Sistema_${TimestampStr}",
    Join-Path $Origem "Backup_Sistema_${TimestampStr}_copia1",
    Join-Path $Origem "Backup_Sistema_${TimestampStr}_copia2"
)

# exclusions
$Excluir = @('node_modules','.git','Backups','Backup_*','_old_versions','old_versions')

Write-Host 'Iniciando processo de backup...' -ForegroundColor Cyan
Write-Log 'Starting copying loop.'

# --- Step: generate/update documentation before making backups
Write-Host 'Executando: npm run convert-docx (gerar/atualizar documentacao)...' -ForegroundColor Cyan
Write-Log 'Running npm run convert-docx before backup.'

# count json files before conversion (rough metric of generated docs)
$beforeJson = (Get-ChildItem -Path $Origem -Recurse -Include *.json -File -ErrorAction SilentlyContinue | Measure-Object).Count

Push-Location -Path $Origem
try {
    # Use cmd.exe to run npm on Windows (more reliable when npm is a cmd shim)
    $cmdLine = "/c npm run convert-docx"
    Write-Log "Running: cmd $cmdLine in $Origem"
    $npmOut = & $env:COMSPEC $cmdLine 2>&1
    $npmOut | ForEach-Object { Add-Content -Path $LogFile -Value "[npm] $_" }
    $npmExit = $LASTEXITCODE
} catch {
    Write-Log "convert-docx invocation failed: $_"
    $npmExit = 1
}
Pop-Location

$afterJson = (Get-ChildItem -Path $Origem -Recurse -Include *.json -File -ErrorAction SilentlyContinue | Measure-Object).Count
$deltaJson = $afterJson - $beforeJson
Write-Log "convert-docx exitcode=$npmExit json_before=$beforeJson json_after=$afterJson delta=$deltaJson"

if ($npmExit -ne 0) {
    Write-Host "Aviso: 'convert-docx' retornou codigo $npmExit. Prosseguindo (logs em $LogFile)." -ForegroundColor Yellow
    Write-Log "Warning: convert-docx returned $npmExit — continuing automatically"

    # fallback: if npm failed but a local node script exists, try running it directly
    $localScript = Join-Path $Origem 'scripts\convert-docx.js'
    if ((Test-Path $localScript) -and (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host 'Tentando executar node scripts/convert-docx.js como fallback...' -ForegroundColor Cyan
        Write-Log "Attempting fallback node $localScript"
        Push-Location -Path $Origem
        try {
            $nodeOut = & node $localScript 2>&1
            $nodeOut | ForEach-Object { Add-Content -Path $LogFile -Value "[node-convert] $_" }
            $npmExit = $LASTEXITCODE
            Write-Log "node convert-docx exitcode=$npmExit"
        } catch {
            Write-Log "node convert-docx failed: $_"
        }
        Pop-Location
    }
} else {
    Write-Host "convert-docx finalizado (delta json: $deltaJson)." -ForegroundColor Green
    Write-Log "convert-docx success. deltaJson=$deltaJson"
}


for ($i = 0; $i -lt $Destinos.Count; $i++) {
    $destino = $Destinos[$i]
    $numero = $i + 1
    Write-Host "Criando copia $numero de 3 -> $destino" -ForegroundColor Yellow
    Write-Log "Preparing destination: $destino"

    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $destino -Force | Out-Null
    } else {
        Write-Host "[DryRun] Criar pasta: $destino" -ForegroundColor DarkYellow
        Write-Log "DryRun: would create $destino"
    }

    $robocopyArgs = @($Origem, $destino, '/E', '/XD') + $Excluir + @('/XF','*.tmp','*.log','/NFL','/NDL','/NJH','/NJS','/NP','/R:0','/W:0')

    if ($DryRun) {
        $cmdLine = "robocopy $Origem $destino (dry-run)"
        Write-Host "[DryRun] $cmdLine" -ForegroundColor DarkYellow
        Write-Log "DryRun: $cmdLine"
        $LASTEXITCODE = 0
    } else {
        Write-Log "Executing: robocopy $Origem -> $destino"
        & robocopy @robocopyArgs | Out-Null
        Write-Log "robocopy exitcode: $LASTEXITCODE"
    }

    if ($LASTEXITCODE -le 7) {
        if (-not $DryRun) {
            $arquivos = (Get-ChildItem -Path $destino -File -Recurse -ErrorAction SilentlyContinue).Count
            $tamanho = [math]::Round(((Get-ChildItem -Path $destino -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum) / 1MB, 2)
            Write-Host "[OK] Copia $numero concluida! - Arquivos: $arquivos - Tamanho: $tamanho MB" -ForegroundColor Green
            Write-Log "Copy $numero ok. files=$arquivos sizeMB=$tamanho"
        } else {
            Write-Host "[DryRun] Copia $numero simulada." -ForegroundColor DarkYellow
        }
    } else {
        Write-Host "Aviso: cod de saida robocopy $LASTEXITCODE" -ForegroundColor Yellow
        Write-Log "robocopy exitcode non-success: $LASTEXITCODE"
    }
}

Write-Host '============================================' -ForegroundColor Cyan
Write-Host '[OK] Backup concluido.' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Cyan

Write-Log "Finished. Destinos: $($Destinos -join '; ')"
Write-Log 'END script'
exit 0
    
