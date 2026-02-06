# Backup com Documentacao Atualizada
# Data: 19/01/2026 - Versao 3.1.0

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PastaBase = "C:\Users\W10\Documents\TCC - teste"
$PastaBackups = Join-Path $PastaBase "Backups"

# Criar pasta Backups se nao existir
if (-not (Test-Path $PastaBackups)) {
    New-Item -ItemType Directory -Path $PastaBackups -Force | Out-Null
}

Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   BACKUP v3.1.0 - DOCUMENTACAO ATUALIZADA" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Criar 3 backups
for ($i = 1; $i -le 3; $i++) {
    $NomeZip = "Backup_v3.1.0_Doc_${Timestamp}_copia${i}.zip"
    $CaminhoZip = Join-Path $PastaBackups $NomeZip
    
    Write-Host "[$i/3] Criando backup: " -NoNewline -ForegroundColor White
    Write-Host $NomeZip -ForegroundColor Green
    
    # Lista de itens para backup (excluindo pastas grandes)
    $Itens = Get-ChildItem -Path $PastaBase -Exclude @(
        'node_modules',
        'Backup_*',
        'Backups',
        '.git',
        'Pega ae Jack 1',
        'Pega ae Jack 2', 
        'Pega ae Jack 3',
        'Pega ae Jack 4',
        'Pega ae Jack 5',
        'Pega ae Jack 6',
        '_old_versions',
        'teste-tcc'
    )
    
    # Criar arquivo ZIP
    Compress-Archive -Path $Itens.FullName `
                    -DestinationPath $CaminhoZip `
                    -CompressionLevel Optimal `
                    -Force
    
    $Tamanho = [math]::Round((Get-Item $CaminhoZip).Length / 1MB, 2)
    Write-Host "      Tamanho: $Tamanho MB" -ForegroundColor Gray
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ 3 BACKUPS CRIADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📂 Localizacao: $PastaBackups" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Versao: 3.1.0" -ForegroundColor White
Write-Host "📅 Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host ""
Write-Host "Mudancas nesta versao:" -ForegroundColor Cyan
Write-Host "  ✅ Interface mobile aprimorada (modais)" -ForegroundColor Gray
Write-Host "  ✅ Notificacoes otimizadas (1 toast)" -ForegroundColor Gray
Write-Host "  ✅ Firewall auto-fix implementado" -ForegroundColor Gray
Write-Host "  ✅ Categorizacao Trail inteligente (NC)" -ForegroundColor Gray
Write-Host "  ✅ Filtros sem emojis" -ForegroundColor Gray
Write-Host "  ✅ Alta Cilindrada → Esportiva" -ForegroundColor Gray
Write-Host ""
