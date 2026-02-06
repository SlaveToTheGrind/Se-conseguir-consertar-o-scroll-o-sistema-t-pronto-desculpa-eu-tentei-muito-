# ========================================
# INSTALADOR - Auto-Fix Firewall
# MacDavis Motos
# Execute como ADMINISTRADOR
# ========================================

# Verificar se é admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "❌ ERRO: Execute como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no arquivo e escolha:" -ForegroundColor Yellow
    Write-Host "'Executar com PowerShell como Administrador'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "⚙️ INSTALADOR - Auto-Fix Firewall MacDavis" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ Verificando arquivos necessários..." -ForegroundColor Yellow

# Caminho do script
$scriptPath = "$PSScriptRoot\auto-fix-firewall.ps1"

# Verificar se o script auto-fix existe
Write-Host "   📂 Pasta atual: $PSScriptRoot" -ForegroundColor Cyan
Write-Host "   🔍 Procurando auto-fix-firewall.ps1..." -ForegroundColor Cyan

if (Test-Path $scriptPath) {
    Write-Host "   ✅ Script encontrado!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Script NÃO encontrado em:" -ForegroundColor Red
    Write-Host "      $scriptPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📋 Arquivos na pasta atual:" -ForegroundColor Yellow
    Get-ChildItem -Path $PSScriptRoot -File | ForEach-Object {
        Write-Host "      - $($_.Name)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
    Write-Host "   ✅ Script encontrado!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Script NÃO encontrado em:" -ForegroundColor Red
    Write-Host "      $PSScriptRoot\auto-fix-firewall.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📋 Arquivos na pasta atual:" -ForegroundColor Yellow
    Get-ChildItem -Path $PSScriptRoot -File | ForEach-Object {
        Write-Host "      - $($_.Name)" -ForegroundColor White
    }
}
Write-Host ""

Write-Host "2️⃣ Verificando tarefa existente..." -ForegroundColor Yellow

# Remover tarefa antiga se existir
$existingTask = Get-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall" -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "   🗑️ Removendo tarefa antiga..." -ForegroundColor Cyan
    Unregister-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall" -Confirm:$false
    Write-Host "   ✅ Tarefa antiga removida" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Nenhuma tarefa anterior encontrada" -ForegroundColor Gray
}
Write-Host ""

Write-Host "3️⃣ Criando nova tarefa agendada..." -ForegroundColor Yellow

# Criar ação (executar o script)
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

# Criar gatilho (ao iniciar o Windows)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Criar configurações
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# Criar principal (executar como SYSTEM com privilégios máximos)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Registrar tarefa
try {
    Register-ScheduledTask `
        -TaskName "MacDavis Motos - Auto-Fix Firewall" `
        -Description "Verifica e recria automaticamente as regras de firewall para MacDavis Motos" `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null
    
    Write-Host "   ✅ Tarefa criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao criar tarefa: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host ""

Write-Host "4️⃣ Testando a tarefa agora..." -ForegroundColor Yellow
try {
    Start-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall"
    Start-Sleep -Seconds 2
    
    # Verificar se o log foi criado
    $logPath = "$PSScriptRoot\firewall-auto-fix.log"
    if (Test-Path $logPath) {
        Write-Host "   ✅ Teste executado com sucesso!" -ForegroundColor Green
        Write-Host "   📄 Log criado em: $logPath" -ForegroundColor Cyan
        
        # Mostrar últimas linhas do log
        Write-Host ""
        Write-Host "   📋 Últimas linhas do log:" -ForegroundColor Cyan
        Get-Content $logPath -Tail 5 | ForEach-Object {
            Write-Host "      $_" -ForegroundColor White
        }
    } else {
        Write-Host "   ⚠️ Teste executado mas log não foi criado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Não foi possível executar teste: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ INSTALAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 O que foi instalado:" -ForegroundColor Cyan
Write-Host "   • Tarefa agendada no Windows Task Scheduler" -ForegroundColor White
Write-Host "   • Executa automaticamente ao iniciar o Windows" -ForegroundColor White
Write-Host "   • Verifica e recria regras de firewall se necessário" -ForegroundColor White
Write-Host "   • Totalmente silencioso (sem janelas)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Como verificar:" -ForegroundColor Cyan
Write-Host "   1. Abra o 'Agendador de Tarefas' do Windows" -ForegroundColor White
Write-Host "   2. Procure por 'MacDavis Motos - Auto-Fix Firewall'" -ForegroundColor White
Write-Host "   3. Veja o log em: firewall-auto-fix.log" -ForegroundColor White
Write-Host ""
Write-Host "🗑️ Para desinstalar:" -ForegroundColor Cyan
Write-Host "   Execute o script: DESINSTALAR-AUTO-FIX.ps1" -ForegroundColor White
Write-Host ""
Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
