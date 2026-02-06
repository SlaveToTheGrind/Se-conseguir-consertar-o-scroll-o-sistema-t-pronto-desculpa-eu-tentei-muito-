# Script de Backup Otimizado - Sistema de Vendas de Motos
# Autor: GitHub Copilot
# Data: 11/01/2026

param(
    [int]$DiasParaManter = 7,
    [string]$DestinoBackup = "C:\Users\W10\Documents\TCC - teste\Backups"
)

# Configurações
$ProjetoPath = "C:\Users\W10\Documents\TCC - teste"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$NomeBackup = "Backup_TCC_$Timestamp.zip"
$CaminhoCompleto = Join-Path $DestinoBackup $NomeBackup

# Criar pasta de destino se não existir
if (-not (Test-Path $DestinoBackup)) {
    New-Item -ItemType Directory -Path $DestinoBackup -Force | Out-Null
    Write-Host "✓ Pasta de backups criada: $DestinoBackup" -ForegroundColor Green
}

Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   BACKUP OTIMIZADO - SISTEMA TCC" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

# Padrões de exclusão (não incluir no backup)
$ExcluirPastas = @(
    'node_modules',
    'Backup_*',
    'backup_*',
    '.git',
    '.vscode',
    'Backups'
)

$ExcluirExtensoes = @(
    '*.tmp',
    '*.log',
    '*.cache',
    'Thumbs.db',
    '.DS_Store'
)

Write-Host "📦 Preparando backup..." -ForegroundColor Yellow
Write-Host "   Origem: $ProjetoPath" -ForegroundColor Gray
Write-Host "   Destino: $CaminhoCompleto`n" -ForegroundColor Gray

# Contar arquivos antes (estimativa)
Write-Host "📊 Analisando projeto..." -ForegroundColor Yellow
$TodosArquivos = Get-ChildItem -Path $ProjetoPath -File -Recurse -ErrorAction SilentlyContinue
$ArquivosParaBackup = $TodosArquivos | Where-Object {
    $arquivo = $_
    $excluir = $false
    
    # Verificar se está em pasta excluída
    foreach ($pasta in $ExcluirPastas) {
        if ($arquivo.FullName -like "*\$pasta\*" -or $arquivo.FullName -like "*\$pasta") {
            $excluir = $true
            break
        }
    }
    
    # Verificar extensão
    foreach ($ext in $ExcluirExtensoes) {
        if ($arquivo.Name -like $ext) {
            $excluir = $true
            break
        }
    }
    
    -not $excluir
}

$TotalArquivos = $ArquivosParaBackup.Count
$TamanhoTotal = ($ArquivosParaBackup | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "   ✓ Arquivos a fazer backup: $TotalArquivos" -ForegroundColor Green
Write-Host "   ✓ Tamanho estimado: $([math]::Round($TamanhoTotal, 2)) MB`n" -ForegroundColor Green

# Criar arquivo temporário com lista de arquivos
$TempList = Join-Path $env:TEMP "backup_list_$Timestamp.txt"
$ArquivosParaBackup | ForEach-Object { 
    $_.FullName.Replace($ProjetoPath + '\', '')
} | Out-File -FilePath $TempList -Encoding UTF8

Write-Host "🔄 Compactando arquivos..." -ForegroundColor Yellow

try {
    # Criar ZIP usando .NET (mais rápido que Compress-Archive para muitos arquivos)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    
    $zip = [System.IO.Compression.ZipFile]::Open($CaminhoCompleto, 'Create')
    
    $contador = 0
    $percentualAnterior = -1
    
    foreach ($arquivo in $ArquivosParaBackup) {
        $contador++
        $percentual = [math]::Floor(($contador / $TotalArquivos) * 100)
        
        if ($percentual -ne $percentualAnterior -and $percentual % 5 -eq 0) {
            Write-Host "   Progresso: $percentual% ($contador/$TotalArquivos arquivos)" -ForegroundColor Cyan
            $percentualAnterior = $percentual
        }
        
        try {
            $caminhoRelativo = $arquivo.FullName.Replace($ProjetoPath + '\', '')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $arquivo.FullName, $caminhoRelativo, 'Optimal') | Out-Null
        }
        catch {
            Write-Host "   ⚠ Erro ao adicionar: $($arquivo.Name)" -ForegroundColor DarkYellow
        }
    }
    
    $zip.Dispose()
    
    Write-Host "`n✅ Backup concluído com sucesso!" -ForegroundColor Green
    
    # Informações do backup criado
    $BackupInfo = Get-Item $CaminhoCompleto
    $TamanhoCompactado = $BackupInfo.Length / 1MB
    $TaxaCompressao = [math]::Round((1 - ($TamanhoCompactado / $TamanhoTotal)) * 100, 1)
    
    Write-Host "`n📊 Estatísticas do Backup:" -ForegroundColor Cyan
    Write-Host "   • Arquivos incluídos: $TotalArquivos" -ForegroundColor White
    Write-Host "   • Tamanho original: $([math]::Round($TamanhoTotal, 2)) MB" -ForegroundColor White
    Write-Host "   • Tamanho compactado: $([math]::Round($TamanhoCompactado, 2)) MB" -ForegroundColor White
    Write-Host "   • Taxa de compressão: $TaxaCompressao%" -ForegroundColor White
    Write-Host "   • Local: $CaminhoCompleto`n" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Erro ao criar backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Limpar arquivo temporário
    if (Test-Path $TempList) {
        Remove-Item $TempList -Force
    }
}

# Limpeza de backups antigos
Write-Host "🧹 Limpando backups antigos (mantendo últimos $DiasParaManter dias)..." -ForegroundColor Yellow

$DataLimite = (Get-Date).AddDays(-$DiasParaManter)
$BackupsAntigos = Get-ChildItem -Path $DestinoBackup -Filter "Backup_TCC_*.zip" | 
    Where-Object { $_.CreationTime -lt $DataLimite }

if ($BackupsAntigos.Count -gt 0) {
    Write-Host "   Removendo $($BackupsAntigos.Count) backup(s) antigo(s)..." -ForegroundColor Gray
    $BackupsAntigos | ForEach-Object {
        Write-Host "   ✓ Removido: $($_.Name)" -ForegroundColor DarkGray
        Remove-Item $_.FullName -Force
    }
}
else {
    Write-Host "   ✓ Nenhum backup antigo para remover" -ForegroundColor Green
}

# Listar backups disponíveis
Write-Host "`n📋 Backups Disponíveis:" -ForegroundColor Cyan
$BackupsDisponiveis = Get-ChildItem -Path $DestinoBackup -Filter "Backup_TCC_*.zip" | 
    Sort-Object CreationTime -Descending

foreach ($backup in $BackupsDisponiveis) {
    $tamanho = [math]::Round($backup.Length / 1MB, 2)
    $data = $backup.CreationTime.ToString("dd/MM/yyyy HH:mm:ss")
    $icone = if ($backup.Name -eq $NomeBackup) { "→" } else { " " }
    Write-Host "   $icone $($backup.Name) - $tamanho MB - $data" -ForegroundColor $(if ($backup.Name -eq $NomeBackup) { "Green" } else { "Gray" })
}

Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan
