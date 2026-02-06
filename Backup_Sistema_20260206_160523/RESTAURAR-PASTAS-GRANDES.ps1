# 🔄 Script de Restauração de Pastas Grandes
# MacDavis Motos - Reverter Movimentação
# Data: 25/01/2026

$ErrorActionPreference = "Continue"
$baseDir = $PSScriptRoot
$origem = Join-Path $baseDir "_pastas_antigas"
$logFile = Join-Path $origem "LOG-RESTAURACAO-PASTAS.txt"

Write-Host "🔄 RESTAURAÇÃO DE PASTAS GRANDES" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path $origem)) {
    Write-Host "❌ ERRO: Pasta _pastas_antigas não encontrada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "⚠️  ATENÇÃO: Este script irá RESTAURAR todas as pastas movidas." -ForegroundColor Yellow
Write-Host "   Isso pode demorar alguns minutos (14 GB)..." -ForegroundColor Yellow
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
Write-Host "📂 Restaurando pastas..." -ForegroundColor Cyan
Write-Host ""

# Iniciar log
"=" * 80 | Out-File $logFile
"RESTAURAÇÃO DE PASTAS - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"" | Out-File $logFile -Append

$totalRestaurados = 0
$totalErros = 0

# Função para restaurar pasta
function Restaurar-PastaGrande {
    param($caminhoOrigem)
    
    if (Test-Path $caminhoOrigem) {
        try {
            $nomePasta = Split-Path $caminhoOrigem -Leaf
            $destinoFinal = Join-Path $baseDir $nomePasta
            
            # Verificar se já existe no destino
            if (Test-Path $destinoFinal) {
                Write-Host "   ⚠️  JÁ EXISTE: $nomePasta\ (pulando)" -ForegroundColor Yellow
                "⚠️  JÁ EXISTE: $nomePasta\" | Out-File $logFile -Append
                return 0
            }
            
            Write-Host "   🔄 Restaurando: $nomePasta\ (pode demorar...)" -ForegroundColor Yellow
            
            # Usar robocopy para mover de volta
            $robocopyArgs = @(
                $caminhoOrigem,
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
                # Remover pasta vazia
                if (Test-Path $caminhoOrigem) {
                    Remove-Item $caminhoOrigem -Force -ErrorAction SilentlyContinue
                }
                
                Write-Host "   ✅ Restaurada: $nomePasta\" -ForegroundColor Green
                "✅ $nomePasta\" | Out-File $logFile -Append
                return 1
            } else {
                Write-Host "   ❌ ERRO: $nomePasta\ - Robocopy código $LASTEXITCODE" -ForegroundColor Red
                "❌ ERRO: $nomePasta\ - Código $LASTEXITCODE" | Out-File $logFile -Append
                return 0
            }
        }
        catch {
            Write-Host "   ❌ ERRO: $nomePasta\ - $($_.Exception.Message)" -ForegroundColor Red
            "❌ ERRO: $nomePasta\ - $($_.Exception.Message)" | Out-File $logFile -Append
            return 0
        }
    }
    return 0
}

# Restaurar todas as pastas
$pastas = Get-ChildItem -Path $origem -Directory

foreach ($pasta in $pastas) {
    $totalRestaurados += Restaurar-PastaGrande $pasta.FullName
}

# Resumo
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 RESUMO DA RESTAURAÇÃO" -ForegroundColor Green
Write-Host "   Total de pastas restauradas: $totalRestaurados" -ForegroundColor White
Write-Host "   Erros encontrados: $totalErros" -ForegroundColor $(if($totalErros -gt 0){"Red"}else{"Green"})
Write-Host ""
Write-Host "📄 Log detalhado: $logFile" -ForegroundColor Yellow
Write-Host ""

if ($totalRestaurados -gt 0) {
    Write-Host "✅ Pastas restauradas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 A pasta _pastas_antigas foi mantida." -ForegroundColor Cyan
    Write-Host "   Você pode excluí-la manualmente se desejar." -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Nenhuma pasta foi restaurada." -ForegroundColor Yellow
}

Write-Host ""

# Salvar resumo no log
"" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"RESUMO FINAL" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"Total de pastas restauradas: $totalRestaurados" | Out-File $logFile -Append
"Erros: $totalErros" | Out-File $logFile -Append
"Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File $logFile -Append

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
