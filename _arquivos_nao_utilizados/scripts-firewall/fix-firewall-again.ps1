# ========================================
# FIX FIREWALL - MacDavis Motos
# Recriar regras de firewall
# ========================================

Write-Host "🔥 RECRIANDO REGRAS DE FIREWALL..." -ForegroundColor Yellow
Write-Host ""

# Remover regras antigas se existirem
Write-Host "🗑️ Removendo regras antigas..." -ForegroundColor Cyan
netsh advfirewall firewall delete rule name="MacDavis Motos - Cliente (TCP 3000)" 2>$null
netsh advfirewall firewall delete rule name="MacDavis Motos - Admin (TCP 3001)" 2>$null

# Criar novas regras
Write-Host "➕ Criando regra para porta 3000 (Cliente)..." -ForegroundColor Green
netsh advfirewall firewall add rule name="MacDavis Motos - Cliente (TCP 3000)" dir=in action=allow protocol=TCP localport=3000

Write-Host "➕ Criando regra para porta 3001 (Admin)..." -ForegroundColor Green
netsh advfirewall firewall add rule name="MacDavis Motos - Admin (TCP 3001)" dir=in action=allow protocol=TCP localport=3001

Write-Host ""
Write-Host "✅ REGRAS DE FIREWALL RECRIADAS!" -ForegroundColor Green
Write-Host ""

# Verificar IP
Write-Host "📡 SEU IP NA REDE:" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object IPAddress, InterfaceAlias

Write-Host ""
Write-Host "📱 ACESSE NO CELULAR:" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress
Write-Host "   Cliente: http://$ip`:3000" -ForegroundColor White
Write-Host "   Admin:   http://$ip`:3001/admin.html" -ForegroundColor White

Write-Host ""
Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
