# 🗂️ Script de Movimentação de Pastas Grandes
# MacDavis Motos - Limpeza de Backups e Versões Antigas
# Data: 25/01/2026

$ErrorActionPreference = "Continue"
$baseDir = $PSScriptRoot
$destino = Join-Path $baseDir "_pastas_antigas"
$logFile = Join-Path $destino "LOG-PASTAS-MOVIDAS.txt"

Write-Host "🗂️  MOVIMENTAÇÃO DE PASTAS GRANDES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Isso moverá aproximadamente 14 GB de dados" -ForegroundColor Yellow
Write-Host ""

# Criar pasta destino
if (!(Test-Path $destino)) {
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
}

# Iniciar log
"=" * 80 | Out-File $logFile
"PASTAS MOVIDAS - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"" | Out-File $logFile -Append

$totalMovidos = 0
$totalErros = 0

# Função para mover pasta com barra de progresso
function Mover-PastaGrande {
    param($origem, $categoria, $indice, $total)
    
    if (Test-Path $origem) {
        try {
            $nomePasta = Split-Path $origem -Leaf
            $destinoFinal = Join-Path $destino $nomePasta
            
            # Calcular porcentagem e barra visual
            $percentual = [math]::Round(($indice / $total) * 100)
            $barraTotal = 30
            $barraPreenchida = [math]::Floor(($percentual / 100) * $barraTotal)
            $barraVazia = $barraTotal - $barraPreenchida
            $barra = ("█" * $barraPreenchida) + ("░" * $barraVazia)
            
            Write-Host ""
            Write-Host "   [$barra] $percentual%" -ForegroundColor Cyan
            Write-Host "   🔄 [$indice/$total] Movendo: $nomePasta\" -ForegroundColor Yellow
            
            # Usar robocopy para mover (mais confiável)
            $robocopyArgs = @(
                $origem,
                $destinoFinal,
                '/E',
                '/MOVE',
                '/NFL',
                '/NDL',
                '/NJH',
                '/NJS',
                '/NC',
                '/NS',
                '/NP'
            )
            
            $result = & robocopy @robocopyArgs
            
            if ($LASTEXITCODE -lt 8) {
                if (Test-Path $origem) {
                    Remove-Item $origem -Force -ErrorAction SilentlyContinue
                }
                
                Write-Host "   ✅ Movida: $nomePasta\" -ForegroundColor Green
                "✅ [$categoria] PASTA: $nomePasta\" | Out-File $logFile -Append
                return 1
            } else {
                Write-Host "   ❌ ERRO: $nomePasta\ - Código $LASTEXITCODE" -ForegroundColor Red
                "❌ ERRO [$categoria] PASTA: $nomePasta\ - Código $LASTEXITCODE" | Out-File $logFile -Append
                return 0
            }
        }
        catch {
            Write-Host "   ❌ ERRO: $nomePasta\ - $($_.Exception.Message)" -ForegroundColor Red
            "❌ ERRO [$categoria] PASTA: $nomePasta\ - $($_.Exception.Message)" | Out-File $logFile -Append
            return 0
        }
    }
    return 0
}

Write-Host "📂 CATEGORIA 1: Pastas Pega ae Jack" -ForegroundColor Cyan
"CATEGORIA 1: PEGA AE JACK" | Out-File $logFile -Append

$pegaJack = @(
    "Pega ae Jack 4",
    "Pega ae Jack 5",
    "Pega ae Jack 6"
)

$indice = 0
foreach ($pasta in $pegaJack) {
    $indice++
    $totalMovidos += Mover-PastaGrande (Join-Path $baseDir $pasta) "Pega ae Jack" $indice $pegaJack.Count
}

Write-Host ""
Write-Host "📂 CATEGORIA 2: Cache/Versões Antigas" -ForegroundColor Cyan
"CATEGORIA 2: CACHE E OLD VERSIONS" | Out-File $logFile -Append

$pastasCache = @(
    "arquivos-cache-problemas",
    "_old_versions",
    "_obsolete_word_import",
    "old_versions"
)

$indice = 0
foreach ($pasta in $pastasCache) {
    $indice++
    $totalMovidos += Mover-PastaGrande (Join-Path $baseDir $pasta) "Cache/Old" $indice $pastasCache.Count
}

Write-Host ""
Write-Host "💾 CATEGORIA 3: Backups Duplicados" -ForegroundColor Cyan
Write-Host "   ⏳ Pode demorar alguns minutos (12 GB)..." -ForegroundColor Yellow
"CATEGORIA 3: BACKUPS DUPLICADOS" | Out-File $logFile -Append

$backupsAntigos = @(
    "Backup_Sistema_20260119_101718",
    "Backup_Sistema_20260119_101718_copia1",
    "Backup_Sistema_20260119_101718_copia2",
    "Backup_Sistema_20260119_111625",
    "Backup_Sistema_20260119_111625_copia1",
    "Backup_Sistema_20260119_111625_copia2",
    "Backup_Sistema_20260119_171549",
    "Backup_Sistema_20260119_171549_copia1",
    "Backup_Sistema_20260119_171549_copia2",
    "Backup_Sistema_20260120_122813",
    "Backup_Sistema_20260120_122813_copia1",
    "Backup_Sistema_20260120_122813_copia2",
    "Backup_Sistema_20260121_111043",
    "Backup_Sistema_20260121_111043_copia1",
    "Backup_Sistema_20260121_111043_copia2",
    "Backup_Sistema_20260122_232256",
    "Backup_Sistema_20260122_232256_copia1",
    "Backup_Sistema_20260122_232256_copia2",
    "Backup_Sistema_20260123_120026",
    "Backup_Sistema_20260123_120026_copia1",
    "Backup_Sistema_20260123_120026_copia2",
    "Backup_Sistema_20260123_155257",
    "Backup_Sistema_20260123_155257_copia1",
    "Backup_Sistema_20260123_155257_copia2",
    "Backup_Sistema_20260124_094105",
    "Backup_Sistema_20260124_094105_copia1",
    "Backup_Sistema_20260124_094105_copia2",
    "Backup_Sistema_20260124_100401",
    "Backup_Sistema_20260124_100401_copia1",
    "Backup_Sistema_20260124_100401_copia2"
)

$indice = 0
foreach ($pasta in $backupsAntigos) {
    $indice++
    $totalMovidos += Mover-PastaGrande (Join-Path $baseDir $pasta) "Backup Antigo" $indice $backupsAntigos.Count
}

# Resumo
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RESUMO" -ForegroundColor Green
Write-Host "   Pastas movidas: $totalMovidos" -ForegroundColor White
Write-Host ""
Write-Host "📁 Localização: $destino" -ForegroundColor Yellow
Write-Host "📄 Log: $logFile" -ForegroundColor Yellow
Write-Host ""

if ($totalMovidos -gt 0) {
    Write-Host "✅ Concluído! ~14 GB liberados" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "   1. Teste o sistema" -ForegroundColor White
    Write-Host "   2. Se OK: Remove-Item '_pastas_antigas' -Recurse -Force" -ForegroundColor White
    Write-Host "   3. Se erro: .\RESTAURAR-PASTAS-GRANDES.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  Nenhuma pasta movida" -ForegroundColor Yellow
}

"Total: $totalMovidos | $(Get-Date -Format 'HH:mm:ss')" | Out-File $logFile -Append

Write-Host ""
Write-Host "Pressione qualquer tecla..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
