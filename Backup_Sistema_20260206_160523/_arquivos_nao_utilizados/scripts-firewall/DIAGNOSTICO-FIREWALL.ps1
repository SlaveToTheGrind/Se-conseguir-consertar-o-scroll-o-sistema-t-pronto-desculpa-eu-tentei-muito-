# ========================================
# DIAGNÓSTICO COMPLETO DO FIREWALL
# MacDavis Motos
# ========================================

Write-Host "🔍 DIAGNÓSTICO DO FIREWALL - MacDavis Motos" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se há regras existentes
Write-Host "1️⃣ Verificando regras existentes..." -ForegroundColor Yellow
$existingRules = Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*MacDavis*" -or 
    $_.DisplayName -like "*3000*" -or 
    $_.DisplayName -like "*3001*"
}

if ($existingRules) {
    Write-Host "   ✅ Regras encontradas:" -ForegroundColor Green
    $existingRules | ForEach-Object {
        Write-Host "      - $($_.DisplayName) | Enabled: $($_.Enabled) | Action: $($_.Action)" -ForegroundColor White
    }
} else {
    Write-Host "   ❌ Nenhuma regra MacDavis encontrada" -ForegroundColor Red
}
Write-Host ""

# 2. Verificar portas em uso
Write-Host "2️⃣ Verificando portas 3000 e 3001..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "   ✅ Porta 3000 está ATIVA (PID: $($port3000[0].OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta 3000 NÃO está em uso" -ForegroundColor Red
}

if ($port3001) {
    Write-Host "   ✅ Porta 3001 está ATIVA (PID: $($port3001[0].OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta 3001 NÃO está em uso" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar status do firewall
Write-Host "3️⃣ Status dos perfis de firewall..." -ForegroundColor Yellow
Get-NetFirewallProfile | ForEach-Object {
    $status = if ($_.Enabled) { "✅ ATIVO" } else { "❌ DESATIVADO" }
    Write-Host "   $($_.Name): $status" -ForegroundColor White
}
Write-Host ""

# 4. Verificar IP local
Write-Host "4️⃣ Endereço IP da rede local..." -ForegroundColor Yellow
$localIP = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" 
} | Select-Object -First 1

if ($localIP) {
    Write-Host "   📡 IP: $($localIP.IPAddress)" -ForegroundColor Green
    Write-Host "   🌐 Interface: $($localIP.InterfaceAlias)" -ForegroundColor White
} else {
    Write-Host "   ❌ IP local não encontrado" -ForegroundColor Red
}
Write-Host ""

# 5. Testar conectividade local
Write-Host "5️⃣ Testando conectividade local..." -ForegroundColor Yellow
$test3000 = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet
$test3001 = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($test3000) {
    Write-Host "   ✅ Porta 3000: Acessível localmente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta 3000: NÃO acessível" -ForegroundColor Red
}

if ($test3001) {
    Write-Host "   ✅ Porta 3001: Acessível localmente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta 3001: NÃO acessível" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar processos Node.js
Write-Host "6️⃣ Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ✅ Node.js rodando ($($nodeProcesses.Count) processo(s))" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "      - PID: $($_.Id) | Memória: $([math]::Round($_.WorkingSet64/1MB, 2)) MB" -ForegroundColor White
    }
} else {
    Write-Host "   ❌ Nenhum processo Node.js encontrado" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
