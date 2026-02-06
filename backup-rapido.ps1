# Backup Rápido - 3 Cópias do Sistema Atual
# Versao: 3.1.0
# Data: 19/01/2026
# 
# IMPORTANTE: Antes de executar este backup, certifique-se de atualizar:
#   1. CHANGELOG.md (adicionar nova versao no topo)
#   2. README.md (atualizar versao e funcionalidades)
#   3. DOCUMENTACAO_COMPLETA.md (atualizar versao e novas secoes)
#
# Uso: .\backup-rapido.ps1

$ErrorActionPreference = "Continue"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Origem = "C:\Users\W10\Documents\TCC - teste"

Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   BACKUP RAPIDO - 3 COPIAS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

# Verificar se documentacao foi atualizada recentemente
Write-Host "⚠️  LEMBRETE: Documentacao atualizada?" -ForegroundColor Yellow
Write-Host "    • CHANGELOG.md" -ForegroundColor Gray
Write-Host "    • README.md" -ForegroundColor Gray
Write-Host "    • DOCUMENTACAO_COMPLETA.md`n" -ForegroundColor Gray

# Perguntar se o usuário quer atualizar a documentação agora
$atualizar = Read-Host "Deseja atualizar a documentação agora antes do backup? (S/N)"
if ($atualizar -eq 'S' -or $atualizar -eq 's') {
    Write-Host "`n🔄 Atualizando documentação..." -ForegroundColor Cyan

    # Tentar executar vários comandos possíveis para gerar documentação
    $commands = @(
        'npm run convert-docx',
        'pnpm run convert-docx',
        'yarn run convert-docx',
        'node .\scripts\docx_to_json.js',
        'node .\scripts\convert-docx.js',
        'node .\scripts\generate-docs.js'
    )

    $updated = $false
    foreach ($cmd in $commands) {
        Write-Host "Tentando: $cmd" -ForegroundColor Gray
        try {
            $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $cmd" -NoNewWindow -Wait -PassThru -ErrorAction Stop
            if ($proc.ExitCode -eq 0) {
                Write-Host "✅ Comando '$cmd' executado com sucesso." -ForegroundColor Green
                $updated = $true
                break
            } else {
                Write-Host "   -> comando retornou código $($proc.ExitCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   -> falha ao executar '$cmd': $_" -ForegroundColor Yellow
        }
    }

    if (-not $updated) {
        Write-Host "⚠️ Falha ao atualizar documentação (nenhum comando funcionou). Deseja continuar com o backup? (S/N)" -ForegroundColor Yellow
        $cont = Read-Host
        if ($cont -ne 'S' -and $cont -ne 's') {
            Write-Host "`n❌ Backup cancelado pelo usuario." -ForegroundColor Red
            exit 0
        }
    } else {
        Write-Host "✅ Documentação atualizada com sucesso.`n" -ForegroundColor Green
    }
}

$resposta = Read-Host "Continuar backup? (S/N)"
if ($resposta -ne 'S' -and $resposta -ne 's') {
    Write-Host "`n❌ Backup cancelado pelo usuario." -ForegroundColor Red
    exit 0
}

Write-Host ""

# Criar 3 cópias
$Destinos = @(
    "C:\Users\W10\Documents\TCC - teste\Backup_Sistema_${Timestamp}",
    "C:\Users\W10\Documents\TCC - teste\Backup_Sistema_${Timestamp}_copia1",
    "C:\Users\W10\Documents\TCC - teste\Backup_Sistema_${Timestamp}_copia2"
)

# Pastas e arquivos a EXCLUIR do backup
$Excluir = @(
    'node_modules',
    'Backup_*',
    '.git',
    'Backups',
    'Pega ae Jack*',
    'teste-tcc',
    '_obsolete_*',
    '_old_versions',
    'old_versions'
)

Write-Host "📦 Iniciando processo de backup..." -ForegroundColor Cyan
Write-Host ""

for ($i = 0; $i -lt $Destinos.Count; $i++) {
    $destino = $Destinos[$i]
    $numero = $i + 1
    
    Write-Host "📦 Criando cópia $numero de 3..." -ForegroundColor Yellow
    Write-Host "   Destino: $destino" -ForegroundColor Gray
    
    # Criar pasta de destino
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
    
    # Usar robocopy para cópia rápida com exclusões
    $excludeDirs = $Excluir -join ' '
    $robocopyArgs = @(
        $Origem,
        $destino,
        '/E',           # Copiar subdiretórios incluindo vazios
        '/XD',          # Excluir diretórios
        $Excluir,
        '/XF',          # Excluir arquivos
        '*.tmp',
        '*.log',
        '/NFL',         # Não listar arquivos
        '/NDL',         # Não listar diretórios
        '/NJH',         # Sem cabeçalho
        '/NJS',         # Sem sumário
        '/NP',          # Sem progresso
        '/R:0',         # 0 tentativas em caso de erro
        '/W:0'          # 0 segundos de espera entre tentativas
    )
    
    $result = & robocopy @robocopyArgs
    
    # Robocopy retorna códigos 0-7 como sucesso
    if ($LASTEXITCODE -le 7) {
        # Contar arquivos copiados
        $arquivos = (Get-ChildItem -Path $destino -File -Recurse).Count
        $tamanho = [math]::Round((Get-ChildItem -Path $destino -File -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        
        Write-Host "   ✅ Cópia $numero concluída!" -ForegroundColor Green
        Write-Host "   • Arquivos: $arquivos" -ForegroundColor White
        Write-Host "   • Tamanho: $tamanho MB`n" -ForegroundColor White
    }
    else {
        Write-Host "   ⚠ Aviso: Código de saída $LASTEXITCODE" -ForegroundColor Yellow
    }
}

Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ 3 CÓPIAS CRIADAS COM SUCESSO!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 Backups criados:" -ForegroundColor Cyan
foreach ($destino in $Destinos) {
    if (Test-Path $destino) {
        Write-Host "   ✓ $destino" -ForegroundColor Green
    }
}

Write-Host ""
