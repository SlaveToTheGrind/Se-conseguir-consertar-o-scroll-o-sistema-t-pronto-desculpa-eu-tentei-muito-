# ========================================
# DESINSTALADOR - Auto-Fix Firewall
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
Write-Host "🗑️ DESINSTALADOR - Auto-Fix Firewall MacDavis" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se a tarefa existe
$task = Get-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall" -ErrorAction SilentlyContinue

if ($task) {
    Write-Host "Tarefa encontrada!" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Deseja remover a tarefa agendada? (S/N)"
    
    if ($confirm -eq 'S' -or $confirm -eq 's') {
        try {
            Unregister-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall" -Confirm:$false
            Write-Host ""
            Write-Host "✅ Tarefa removida com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "As regras de firewall NÃO foram removidas." -ForegroundColor Yellow
            Write-Host "Se quiser removê-las também, execute:" -ForegroundColor Yellow
            Write-Host "netsh advfirewall firewall delete rule name=`"MacDavis Motos - Cliente (TCP 3000)`"" -ForegroundColor Gray
            Write-Host "netsh advfirewall firewall delete rule name=`"MacDavis Motos - Admin (TCP 3001)`"" -ForegroundColor Gray
        } catch {
            Write-Host ""
            Write-Host "❌ Erro ao remover tarefa: $_" -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "ℹ️ Operação cancelada" -ForegroundColor Gray
    }
} else {
    Write-Host "ℹ️ Tarefa não encontrada" -ForegroundColor Gray
    Write-Host "   Nada para desinstalar" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
