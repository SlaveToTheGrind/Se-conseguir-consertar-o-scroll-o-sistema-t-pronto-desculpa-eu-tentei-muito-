# 🗂️ Script de Movimentação Segura de Arquivos Não Utilizados
# MacDavis Motos - Sistema de Limpeza Reversível
# Data: 25/01/2026

$ErrorActionPreference = "Continue"
$baseDir = $PSScriptRoot
$destino = Join-Path $baseDir "_arquivos_nao_utilizados"
$logFile = Join-Path $destino "LOG-ARQUIVOS-MOVIDOS.txt"

Write-Host "🗂️  MOVIMENTAÇÃO SEGURA DE ARQUIVOS NÃO UTILIZADOS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Criar estrutura de pastas
Write-Host "📁 Criando estrutura de pastas..." -ForegroundColor Yellow
$pastas = @(
    "$destino\backups-json",
    "$destino\scripts-mobile-nao-usados",
    "$destino\scripts-fix-obsoletos",
    "$destino\demos-testes",
    "$destino\pastas-versoes-antigas",
    "$destino\backups-duplicados",
    "$destino\scripts-firewall",
    "$destino\imagens-nao-usadas",
    "$destino\docs-obsoletos"
)

foreach ($pasta in $pastas) {
    if (!(Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta -Force | Out-Null
        Write-Host "   ✅ Criado: $pasta" -ForegroundColor Green
    }
}

# Iniciar log
"=" * 80 | Out-File $logFile
"ARQUIVOS MOVIDOS - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"" | Out-File $logFile -Append

$totalMovidos = 0
$totalErros = 0

# Função para mover arquivo
function Mover-Arquivo {
    param($origem, $destinoPasta, $categoria)
    
    if (Test-Path $origem) {
        try {
            $nomeArquivo = Split-Path $origem -Leaf
            $destinoFinal = Join-Path $destinoPasta $nomeArquivo
            Move-Item -Path $origem -Destination $destinoFinal -Force
            Write-Host "   ✅ Movido: $nomeArquivo" -ForegroundColor Green
            "✅ [$categoria] $nomeArquivo" | Out-File $logFile -Append
            return 1
        }
        catch {
            Write-Host "   ❌ ERRO: $nomeArquivo - $($_.Exception.Message)" -ForegroundColor Red
            "❌ ERRO [$categoria] $nomeArquivo - $($_.Exception.Message)" | Out-File $logFile -Append
            return 0
        }
    }
    return 0
}

# Função para mover pasta
function Mover-Pasta {
    param($origem, $destinoPasta, $categoria)
    
    if (Test-Path $origem) {
        try {
            $nomePasta = Split-Path $origem -Leaf
            $destinoFinal = Join-Path $destinoPasta $nomePasta
            Move-Item -Path $origem -Destination $destinoFinal -Force -Recurse
            Write-Host "   ✅ Movida: $nomePasta\" -ForegroundColor Green
            "✅ [$categoria] PASTA: $nomePasta\" | Out-File $logFile -Append
            return 1
        }
        catch {
            Write-Host "   ❌ ERRO: $nomePasta\ - $($_.Exception.Message)" -ForegroundColor Red
            "❌ ERRO [$categoria] PASTA: $nomePasta\ - $($_.Exception.Message)" | Out-File $logFile -Append
            return 0
        }
    }
    return 0
}

Write-Host ""
Write-Host "🗑️  CATEGORIA 1: Backups JSON Antigos" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 1: BACKUPS JSON" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$backupsJson = @(
    "motorcycles.json.backup-1765975851067",
    "motorcycles.json.backup-1765975898525",
    "motorcycles.json.backup-before-restore-1767036197639",
    "motorcycles.json.backup-deep-restore-1767036430920",
    "motorcycles.json.backup-before-plate-removal-1767036924009",
    "motorcycles.json.backup-before-plate-fix-1767036615297",
    "meus-agendamentos.js.backup-20260119-180300"
)

foreach ($arquivo in $backupsJson) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\backups-json" "Backup JSON"
}

Write-Host ""
Write-Host "📱 CATEGORIA 2: Scripts Mobile Não Usados" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 2: SCRIPTS MOBILE NÃO USADOS" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$mobileNaoUsados = @(
    "mobile-catalog-optimizer.js",
    "mobile-catalog-optimizer.css",
    "mobile-bottom-sheet-force.js",
    "mobile-ux-backup.js",
    "mobile-portrait-force.css",
    "mobile-fix-urgent.css",
    "mobile-redesign.css",
    "mobile-cards-squared.css",
    "mobile-master.css"
)

foreach ($arquivo in $mobileNaoUsados) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\scripts-mobile-nao-usados" "Mobile Não Usado"
}

Write-Host ""
Write-Host "🔧 CATEGORIA 3: Scripts de Fix Obsoletos" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 3: SCRIPTS FIX OBSOLETOS" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$fixObsoletos = @(
    "DIAGNOSTICO-NUCLEAR.js",
    "DIAGNOSTICO-FILTROS.js",
    "FIX-TOUCH-SCROLL.js",
    "EMERGENCIA-SCROLL-MOBILE.js",
    "FORCE-SCROLL-ULTIMATE.js",
    "force-scroll-touch.js",
    "SCROLL-MANUAL-FORCADO.js",
    "mobile-scroll-diagnostic.js"
)

foreach ($arquivo in $fixObsoletos) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\scripts-fix-obsoletos" "Fix Obsoleto"
}

Write-Host ""
Write-Host "🧪 CATEGORIA 4: Demos e Testes" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 4: DEMOS E TESTES" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$demos = @(
    "demo-loading-motos.html",
    "demo-notificacoes.html",
    "limpar-cache.html",
    "limpar-cache-catalog.html",
    "clear-cache.html",
    "diagnostico-cache.html",
    "diagnostico-horarios.html",
    "test-mobile-connection.html",
    "test-toast.html",
    "teste-cascata.html",
    "teste-loading-motos.html",
    "visualizacao-motos.html",
    "images_report.html"
)

foreach ($arquivo in $demos) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\demos-testes" "Demo/Teste"
}

Write-Host ""
Write-Host "📂 CATEGORIA 5: Pastas de Versões Antigas" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 5: PASTAS VERSÕES ANTIGAS" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$pastasAntigas = @(
    "Pega ae Jack 4",
    "Pega ae Jack 5",
    "Pega ae Jack 6",
    "arquivos-cache-problemas",
    "_old_versions",
    "_obsolete_word_import",
    "old_versions"
)

foreach ($pasta in $pastasAntigas) {
    $totalMovidos += Mover-Pasta (Join-Path $baseDir $pasta) "$destino\pastas-versoes-antigas" "Versão Antiga"
}

Write-Host ""
Write-Host "💾 CATEGORIA 6: Backups Duplicados (mantendo apenas o mais recente)" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 6: BACKUPS DUPLICADOS" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$backupsDuplicados = @(
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

foreach ($pasta in $backupsDuplicados) {
    $totalMovidos += Mover-Pasta (Join-Path $baseDir $pasta) "$destino\backups-duplicados" "Backup Duplicado"
}

Write-Host ""
Write-Host "🔥 CATEGORIA 7: Scripts PowerShell de Firewall Antigos" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 7: SCRIPTS FIREWALL" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$firewallScripts = @(
    "fix-firewall-again.ps1",
    "FIX-FIREWALL-DEFINITIVO.ps1",
    "DIAGNOSTICO-FIREWALL.ps1",
    "DESINSTALAR-AUTO-FIX.ps1"
)

foreach ($arquivo in $firewallScripts) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\scripts-firewall" "Firewall Script"
}

Write-Host ""
Write-Host "🖼️  CATEGORIA 8: Imagens Não Usadas" -ForegroundColor Cyan
"" | Out-File $logFile -Append
"CATEGORIA 8: IMAGENS NÃO USADAS" | Out-File $logFile -Append
"-" * 80 | Out-File $logFile -Append

$imagensNaoUsadas = @(
    "img_resp.jpg",
    "silhouette of a spor.png",
    "silhouette of an adv.png",
    "silhueta de uma moto.png",
    "Silhueta esportiva sem fundo.png",
    "Silhueta esportiva.png",
    "Cruiser-Custom sem fundo.png",
    "Trail sem fundo.png"
)

foreach ($arquivo in $imagensNaoUsadas) {
    $totalMovidos += Mover-Arquivo (Join-Path $baseDir $arquivo) "$destino\imagens-nao-usadas" "Imagem"
}

# Resumo
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RESUMO DA OPERAÇÃO" -ForegroundColor Green
Write-Host "   Total de arquivos/pastas movidos: $totalMovidos" -ForegroundColor White
Write-Host "   Erros encontrados: $totalErros" -ForegroundColor $(if($totalErros -gt 0){"Red"}else{"Green"})
Write-Host ""
Write-Host "📁 Localização: $destino" -ForegroundColor Yellow
Write-Host "📄 Log detalhado: $logFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Arquivos movidos com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Para RESTAURAR todos os arquivos, execute:" -ForegroundColor Cyan
Write-Host "   .\RESTAURAR-ARQUIVOS.ps1" -ForegroundColor White
Write-Host ""

# Salvar resumo no log
"" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"RESUMO FINAL" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"Total de arquivos/pastas movidos: $totalMovidos" | Out-File $logFile -Append
"Erros: $totalErros" | Out-File $logFile -Append
"Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append
"" | Out-File $logFile -Append
"PRÓXIMOS PASSOS:" | Out-File $logFile -Append
"1. Teste o sistema completamente (scroll mobile, admin, contratos, etc)" | Out-File $logFile -Append
"2. Se tudo funcionar OK, pode excluir a pasta _arquivos_nao_utilizados/" | Out-File $logFile -Append
"3. Se algo quebrar, execute .\RESTAURAR-ARQUIVOS.ps1" | Out-File $logFile -Append

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
