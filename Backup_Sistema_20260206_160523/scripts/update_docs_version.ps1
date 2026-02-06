param(
    [string]$Version = (Get-Date -Format yyyyMMdd),
    [switch]$Force,
    [string]$Root = ".",
    [string[]]$ExcludeDirs = @('Backup_Sistema','_pastas_antigas','backup','node_modules')
)

# Finds all .md files under $Root (excluding .git) and inserts/updates a "Versão: {YYYYMMDD}" line at top.
# By default runs in dry-run (no files modified). Pass -Force to apply changes.

Write-Host "Scanning folder: $Root`nUsing version: $Version`nForce mode: $Force`n"


$mdFiles = Get-ChildItem -Path $Root -Recurse -File -Filter "*.md" | Where-Object { $_.FullName -notmatch "\\\.git\\" }

# If exclude patterns provided, filter out matching files (case-insensitive substring match)
if ($ExcludeDirs -and $ExcludeDirs.Count -gt 0) {
    $excludeLower = $ExcludeDirs | ForEach-Object { $_.ToLower() }
    $mdFiles = $mdFiles | Where-Object {
        $full = $_.FullName.ToLower()
        $isEx = $false
        foreach ($p in $excludeLower) {
            if ($full -like "*" + $p + "*") { $isEx = $true; break }
        }
        -not $isEx
    }
}

$changed = 0

foreach ($file in $mdFiles) {
    $path = $file.FullName
    $content = Get-Content -Raw -LiteralPath $path

    $updated = $false

    # Try to replace an existing 'Versão: YYYYMMDD' or 'Version: YYYYMMDD' at the top or anywhere
    if ($content -match "(?m)^(Vers[aã]o:\s*)\d{6,8}") {
        $newContent = $content -replace "(?m)^(Vers[aã]o:\s*)\d{6,8}", "${1}$Version"
        $updated = $true
    }
    elseif ($content -match "(?m)^(Version:\s*)\d{6,8}") {
        $newContent = $content -replace "(?m)^(Version:\s*)\d{6,8}", "${1}$Version"
        $updated = $true
    }
    else {
        # No existing version line found — insert at top after optional BOM
        $bom = ""
        if ($content.StartsWith([char]0xFEFF)) {
            $bom = [char]0xFEFF
            $content = $content.Substring(1)
        }
        $newContent = "$bom`nVersão: $Version`n$content"
        $updated = $true
    }

    if ($updated) {
        if ($Force) {
            # write file
            try {
                Set-Content -LiteralPath $path -Value $newContent -Encoding UTF8
                Write-Host "Updated $path"
            }
            catch {
                Write-Warning ("Failed to write {0}: {1}" -f $path, $_)
            }
        }
        else {
            Write-Host "Would update: $path"
        }
        $changed++
    }
}

Write-Host "`nDone. Files found: $($mdFiles.Count). Files updated/would-update: $changed."