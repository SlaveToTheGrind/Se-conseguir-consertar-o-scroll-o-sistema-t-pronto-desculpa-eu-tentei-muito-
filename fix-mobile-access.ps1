# Script para corrigir acesso mobile via rede
# Execute como ADMINISTRADOR

Write-Host "🔧 CORREÇÃO DE ACESSO MOBILE - MacDavis Motos" -ForegroundColor Cyan
Write-Host ""

# 1. Liberar portas no Firewall do Windows
Write-Host "1️⃣ Verificando regras do Firewall..." -ForegroundColor Yellow

$port3000 = Get-NetFirewallRule -DisplayName "MacDavis Cliente - Porta 3000" -ErrorAction SilentlyContinue
$port3001 = Get-NetFirewallRule -DisplayName "MacDavis Admin - Porta 3001" -ErrorAction SilentlyContinue

if (-not $port3000) {
    Write-Host "   ➕ Criando regra para porta 3000 (Cliente)..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "MacDavis Cliente - Porta 3000" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3000 `
        -Action Allow `
        -Profile Any `
        -Enabled True
    Write-Host "   ✅ Porta 3000 liberada!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Porta 3000 já está liberada" -ForegroundColor Green
}

if (-not $port3001) {
    Write-Host "   ➕ Criando regra para porta 3001 (Admin)..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "MacDavis Admin - Porta 3001" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3001 `
        -Action Allow `
        -Profile Any `
        -Enabled True
    Write-Host "   ✅ Porta 3001 liberada!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Porta 3001 já está liberada" -ForegroundColor Green
}

Write-Host ""

# 2. Mostrar IP local para acesso via celular
Write-Host "2️⃣ Encontrando seu IP local..." -ForegroundColor Yellow

$localIP = (Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and 
    $_.InterfaceAlias -notmatch 'Loopback' -and
    $_.IPAddress -notmatch '^169\.254\.'
} | Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Host ""
    Write-Host "📱 USE ESTES ENDEREÇOS NO CELULAR:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   🌐 Cliente (Catálogo):  http://$localIP`:3000" -ForegroundColor White
    Write-Host "   🔐 Admin:               http://$localIP`:3001" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "   ⚠️ Não foi possível detectar IP local automaticamente" -ForegroundColor Yellow
    Write-Host "   Execute: ipconfig" -ForegroundColor White
}

# 3. Verificar se os servidores estão rodando
Write-Host "3️⃣ Verificando servidores..." -ForegroundColor Yellow

$client = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    (Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 3000 -ErrorAction SilentlyContinue).Count -gt 0
}

$admin = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    (Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 3001 -ErrorAction SilentlyContinue).Count -gt 0
}

if ($client) {
    Write-Host "   ✅ Servidor Cliente (3000) está rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Servidor Cliente (3000) NÃO está rodando" -ForegroundColor Red
    Write-Host "      Execute: npm run client" -ForegroundColor Yellow
}

if ($admin) {
    Write-Host "   ✅ Servidor Admin (3001) está rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Servidor Admin (3001) NÃO está rodando" -ForegroundColor Red
    Write-Host "      Execute: npm run admin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4️⃣ PASSOS PARA TESTAR NO CELULAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Certifique-se de que PC e celular estão na MESMA rede Wi-Fi" -ForegroundColor White
Write-Host "   2. Abra o navegador do celular (Chrome, Safari, etc)" -ForegroundColor White
Write-Host "   3. Digite: http://$localIP`:3000" -ForegroundColor Cyan
Write-Host "   4. Se não funcionar, reinicie os servidores:" -ForegroundColor White
Write-Host "      - Pressione Ctrl+C nos terminais do Node" -ForegroundColor Gray
Write-Host "      - Execute novamente: npm run client e npm run admin" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣ TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Se ainda não funcionar:" -ForegroundColor White
Write-Host "   • Desative temporariamente antivírus de terceiros" -ForegroundColor Gray
Write-Host "   • Verifique se seu roteador não bloqueia comunicação entre dispositivos" -ForegroundColor Gray
Write-Host "   • Teste ping do celular para o PC" -ForegroundColor Gray
Write-Host ""

Read-Host "Pressione ENTER para sair"
