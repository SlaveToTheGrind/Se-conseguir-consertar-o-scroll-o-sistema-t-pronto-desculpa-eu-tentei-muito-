# 🔄 Script de Restauração de Arquivos
# MacDavis Motos - Reverter Movimentação
# Data: 25/01/2026

$ErrorActionPreference = "Continue"
$baseDir = $PSScriptRoot
$origem = Join-Path $baseDir "_arquivos_nao_utilizados"
$logFile = Join-Path $origem "LOG-RESTAURACAO.txt"

Write-Host "🔄 RESTAURAÇÃO DE ARQUIVOS" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path $origem)) {
    Write-Host "❌ ERRO: Pasta _arquivos_nao_utilizados não encontrada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "⚠️  ATENÇÃO: Este script irá RESTAURAR todos os arquivos movidos." -ForegroundColor Yellow
Write-Host ""
Write-Host "Deseja continuar? (S/N): " -ForegroundColor Cyan -NoNewline
$confirmacao = Read-Host

if ($confirmacao -ne 'S' -and $confirmacao -ne 's') {
    Write-Host ""
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""
Write-Host "📂 Restaurando arquivos..." -ForegroundColor Cyan
Write-Host ""

# Iniciar log
"=" * 80 | Out-File $logFile
"RESTAURAÇÃO DE ARQUIVOS - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"" | Out-File $logFile -Append

$totalRestaurados = 0
$totalErros = 0

# Função para restaurar item
function Restaurar-Item {
    param($caminhoOrigem, $categoria)
    
    if (Test-Path $caminhoOrigem) {
        try {
            $nomeItem = Split-Path $caminhoOrigem -Leaf
            $destinoFinal = Join-Path $baseDir $nomeItem
            
            # Verificar se já existe no destino
            if (Test-Path $destinoFinal) {
                Write-Host "   ⚠️  JÁ EXISTE: $nomeItem (pulando)" -ForegroundColor Yellow
                "⚠️  [$categoria] JÁ EXISTE: $nomeItem" | Out-File $logFile -Append
                return 0
            }
            
            Move-Item -Path $caminhoOrigem -Destination $destinoFinal -Force -Recurse
            Write-Host "   ✅ Restaurado: $nomeItem" -ForegroundColor Green
            "✅ [$categoria] $nomeItem" | Out-File $logFile -Append
            return 1
        }
        catch {
            Write-Host "   ❌ ERRO: $nomeItem - $($_.Exception.Message)" -ForegroundColor Red
            "❌ ERRO [$categoria] $nomeItem - $($_.Exception.Message)" | Out-File $logFile -Append
            return 0
        }
    }
    return 0
}

# Restaurar por categoria
$categorias = @{
    "backups-json" = "Backup JSON"
    "scripts-mobile-nao-usados" = "Mobile Não Usado"
    "scripts-fix-obsoletos" = "Fix Obsoleto"
    "demos-testes" = "Demo/Teste"
    "pastas-versoes-antigas" = "Versão Antiga"
    "backups-duplicados" = "Backup Duplicado"
    "scripts-firewall" = "Firewall Script"
    "imagens-nao-usadas" = "Imagem"
}

foreach ($categoria in $categorias.Keys) {
    $pastaCategoria = Join-Path $origem $categoria
    
    if (Test-Path $pastaCategoria) {
        Write-Host "📁 Restaurando: $($categorias[$categoria])" -ForegroundColor Cyan
        
        $itens = Get-ChildItem -Path $pastaCategoria -Force
        foreach ($item in $itens) {
            $totalRestaurados += Restaurar-Item $item.FullName $categorias[$categoria]
        }
        
        Write-Host ""
    }
}

# Resumo
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 RESUMO DA RESTAURAÇÃO" -ForegroundColor Green
Write-Host "   Total de itens restaurados: $totalRestaurados" -ForegroundColor White
Write-Host "   Erros encontrados: $totalErros" -ForegroundColor $(if($totalErros -gt 0){"Red"}else{"Green"})
Write-Host ""
Write-Host "📄 Log detalhado: $logFile" -ForegroundColor Yellow
Write-Host ""

if ($totalRestaurados -gt 0) {
    Write-Host "✅ Arquivos restaurados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 A pasta _arquivos_nao_utilizados foi mantida." -ForegroundColor Cyan
    Write-Host "   Você pode excluí-la manualmente se desejar." -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Nenhum arquivo foi restaurado." -ForegroundColor Yellow
}

Write-Host ""

# Salvar resumo no log
"" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"RESUMO FINAL" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"Total de itens restaurados: $totalRestaurados" | Out-File $logFile -Append
"Erros: $totalErros" | Out-File $logFile -Append
"Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
