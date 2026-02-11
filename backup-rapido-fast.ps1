<#
  backup-rapido-fast.ps1
  Fast backup: update documentation (targeted), then create 3 backups (original + 2 copies).
  Designed to run quickly by converting only docs in a single documentation folder.

  Usage:
    .\backup-rapido-fast.ps1 -Force            # non-interactive
    .\backup-rapido-fast.ps1                  # asks confirmation

#>

Param(
    [switch]$Force,
    [switch]$DryRun,
    [switch]$NoDocs
)

$ErrorActionPreference = 'Continue'
$Timestamp = Get-Date
$TimestampStr = $Timestamp.ToString('yyyyMMdd_HHmmss')

# Resolve origin directory (script folder or current)
$Origem = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } elseif ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if ($Origem -is [System.Array]) { $Origem = $Origem[0] }
$Origem = [string]$Origem

$LogFile = Join-Path $Origem "backup-rapido-fast.log"
function Write-Log { param([string]$m); $ts = Get-Date -Format o; Add-Content -Path $LogFile -Value "[$ts] $m" }

Write-Host "`nBACKUP RAPIDO FAST - 3 COPIAS (docs target + 2 copias) `n" -ForegroundColor Cyan
Write-Log "START fast backup. Force=$Force DryRun=$DryRun NoDocs=$NoDocs"
Write-Host "Using origin: $Origem" -ForegroundColor DarkCyan
Write-Log "Origin: $Origem"

# Ask specifically whether to update docs before creating backups (user requested)
if (-not $Force) {
    $ansDocs = Read-Host 'Atualizar documentacao antes do backup? (S/N)'
    $DoDocs = ($ansDocs -eq 'S' -or $ansDocs -eq 's')
    Write-Log "User chose to update docs before backup: $DoDocs"
} else {
    Write-Host 'Modo forcado: pulando prompt e atualizando documentacao automaticamente.' -ForegroundColor Yellow
    $DoDocs = $true
}

# --- Update workspace documentation BEFORE copying so backups include updated docs
if (-not $NoDocs -and $DoDocs) {
    Write-Log "Starting pre-copy doc conversion in workspace"
    # Prefer a known docs folder to avoid scanning whole repo
    $candidates = @('DOCUMENTACAO','docs','documents','DOCS','DOCUMENTACAO_COMPLETA')
    $docRoot = $null
    foreach ($cand in $candidates) {
        $p = Join-Path $Origem $cand
        if (Test-Path $p -PathType Container) { $docRoot = $p; break }
    }

    if ($docRoot) {
        Write-Host "Atualizando docs em: $docRoot" -ForegroundColor Cyan
        Write-Log "Docs root (pre-copy): $docRoot"

        # Find .docx files but avoid scanning backups or old versions
        $excludePatterns = @('_pastas_antigas','old_versions','Backup_Sistema_')
        $docxFiles = Get-ChildItem -Path $docRoot -Filter *.docx -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $full = $_.FullName; -not ($excludePatterns | ForEach-Object { $full -like "*$_*" } | Where-Object { $_ }) }

        if ($docxFiles.Count -gt 0) {
            Write-Log "Found $($docxFiles.Count) docx in $docRoot; converting with node script"
            foreach ($f in $docxFiles) {
                Write-Host "Convertendo: $($f.FullName)" -ForegroundColor DarkYellow
                Write-Log "Converting: $($f.FullName)"
                if ($DryRun) {
                    Write-Log "DryRun: would convert $($f.FullName)"
                } else {
                    if (Get-Command node -ErrorAction SilentlyContinue) {
                        try {
                            $converter = Join-Path $Origem 'scripts\docx_to_json.js'
                            $out = & node $converter $f.FullName 2>&1
                            $out | ForEach-Object { Add-Content -Path $LogFile -Value "[node-convert] $_" }
                            Write-Log "node convert exitcode: $LASTEXITCODE"
                        } catch {
                            Write-Log "node convert failed: $_"
                        }
                    } else {
                        Write-Log "node not found; skipping convert of $($f.FullName)"
                    }
                }
            }
        } else {
            Write-Log "No docx files found in $docRoot (pre-copy)"
        }
    } else {
        Write-Log "No documentation folder found in workspace; skipping pre-copy conversion"
    }
} else {
    Write-Log "NoDocs flag set; skipping pre-copy conversions"
}

# --- Update metadata in key markdown files so backups clearly show current date/version
function Update-DocMetadata {
    param([string]$file)
    if (-not (Test-Path $file)) { return }
    try {
        $raw = Get-Content -Raw -LiteralPath $file
        $todayDate = Get-Date -Format 'dd/MM/yyyy'
        $ts = Get-Date -Format o

        # Update '**Data:**' line if present
        if ($raw -match '\*\*Data:\*\*') {
            $raw = [regex]::Replace($raw, '(\*\*Data:\*\*)(.*)', "`$1 $todayDate  ")
        }

        # Update '**Última Atualização:**' line if present; otherwise insert after heading
        if ($raw -match '\*\*Última Atualização:\*\*') {
            $raw = [regex]::Replace($raw, '(\*\*Última Atualização:\*\*)(.*)', "`$1 Backup automático: $ts")
        } else {
            # try to insert after the first heading
            $raw = $raw -replace '(^# .*?\r?\n)', "`$1`n**Última Atualização:** Backup automático: $ts`n"
        }

        Set-Content -LiteralPath $file -Value $raw -Encoding UTF8
        Write-Log "Updated metadata in $file"
    } catch {
        Write-Log ([string]::Format('Failed updating metadata in {0}: {1}', $file, $_))
    }
}

# Update primary doc files
$primaryDocs = @('DOCUMENTACAO_COMPLETA.md','DOCUMENTACAO.md','README.md','CHANGELOG.md')
foreach ($d in $primaryDocs) {
    $p = Join-Path $Origem $d
    Update-DocMetadata -file $p
}

# --- Create base + 2 copies quickly using multithreaded robocopy
$base = Join-Path $Origem "Backup_Sistema_${TimestampStr}"
$Destinos = @($base, "${base}_copia1", "${base}_copia2")

$Excluir = @('node_modules','.git','Backups','Backup_*','_pastas_antigas','old_versions')

Write-Host 'Iniciando processo de backup (robocopy multithread)...' -ForegroundColor Cyan
Write-Log 'Starting copying loop.'

foreach ($idx in 0..($Destinos.Count-1)) {
    $dest = $Destinos[$idx]
    $num = $idx + 1
    Write-Host "Criando copia $num -> $dest" -ForegroundColor Yellow
    Write-Log "Preparing destination: $dest"
    if (-not $DryRun) { New-Item -ItemType Directory -Path $dest -Force | Out-Null } else { Write-Log "DryRun would create $dest" }

    # Build robocopy args: use /E and /MT for speed; minimal retries
    $robocopyArgs = @($Origem, $dest, '/E', '/MT:16', '/XD') + $Excluir + @('/R:1','/W:1','/NFL','/NDL','/NJH','/NJS','/NP')

    if ($DryRun) {
        Write-Log "DryRun: robocopy $Origem -> $dest"
        $LASTEXITCODE = 0
    } else {
        Write-Log "Executing: robocopy $Origem -> $dest"
        & robocopy @robocopyArgs | Out-Null
        Write-Log "robocopy exitcode: $LASTEXITCODE"
    }

    if ($LASTEXITCODE -le 7) {
        if (-not $DryRun) {
            $count = (Get-ChildItem -Path $dest -File -Recurse -ErrorAction SilentlyContinue).Count
            Write-Host "[OK] Copia $num concluida - arquivos: $count" -ForegroundColor Green
            Write-Log "Copy $num ok. files=$count"
        } else { Write-Host "[DryRun] Copia $num simulada." -ForegroundColor DarkYellow }
    } else {
        Write-Host "Aviso: robocopy exitcode $LASTEXITCODE" -ForegroundColor Yellow
        Write-Log "robocopy non-success exitcode: $LASTEXITCODE"
    }
}

# No post-copy conversions: pre-copy conversion was performed above so backups already include updated docs
Write-Log "Skipped post-copy conversions because pre-copy update is used"

Write-Host '============================================' -ForegroundColor Cyan
Write-Host '[OK] Backup FAST concluido.' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Cyan

Write-Log "Finished. Destinos: $($Destinos -join '; ')"
Write-Log 'END script'
# After backup: validate that primary docs in backups match workspace copies
Write-Log 'Validating documentation copies in backups'
$primaryDocs = @('DOCUMENTACAO_COMPLETA.md','DOCUMENTACAO.md','README.md','CHANGELOG.md')
foreach ($d in $primaryDocs) {
    $src = Join-Path $Origem $d
    foreach ($dest in $Destinos) {
        $destf = Join-Path $dest $d
        if ((Test-Path $src) -and (Test-Path $destf)) {
            $a = Get-Content -Raw -LiteralPath $src -ErrorAction SilentlyContinue
            $b = Get-Content -Raw -LiteralPath $destf -ErrorAction SilentlyContinue
            if ($a -eq $b) {
                Write-Log "OK: $d identical in $dest"
            } else {
                Write-Log "MISMATCH: $d differs in $dest"
            }
        } else {
            Write-Log "MISSING: $d not found in src or $dest"
        }
    }
}

# Summarize results for interactive use so user doesn't need extra commands
$endTime = Get-Date
$duration = $endTime - $Timestamp
Write-Host "\nBackup finished in $([math]::Round($duration.TotalSeconds,2)) seconds." -ForegroundColor Cyan

# List created backup folders (relative names)
$created = Get-ChildItem -Directory -Path $Origem -Filter 'Backup_Sistema_*' -ErrorAction SilentlyContinue | Sort-Object -Property Name -Descending
if ($created.Count -gt 0) {
    Write-Host 'Pastas criadas:' -ForegroundColor Green
    foreach ($c in $created) { Write-Host " - $($c.Name)" }
} else {
    Write-Host 'Nenhuma pasta de backup encontrada.' -ForegroundColor Yellow
}

# Show tail of log for quick feedback
if (Test-Path $LogFile) {
    Write-Host "\nÚltimas linhas do log ($LogFile):" -ForegroundColor Cyan
    Get-Content $LogFile -Tail 60 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "Log não encontrado: $LogFile" -ForegroundColor Yellow
}

exit 0
