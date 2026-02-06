# ========================================
# SOLUÇÃO DEFINITIVA - FIREWALL
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
Write-Host "🔥 CONFIGURAÇÃO DEFINITIVA DO FIREWALL" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Remover regras antigas (se existirem)
Write-Host "1️⃣ Removendo regras antigas..." -ForegroundColor Yellow
$removed = 0
try {
    netsh advfirewall firewall delete rule name="MacDavis Motos - Cliente (TCP 3000)" 2>$null
    if ($LASTEXITCODE -eq 0) { $removed++ }
} catch {}

try {
    netsh advfirewall firewall delete rule name="MacDavis Motos - Admin (TCP 3001)" 2>$null
    if ($LASTEXITCODE -eq 0) { $removed++ }
} catch {}

Write-Host "   ✅ $removed regra(s) antiga(s) removida(s)" -ForegroundColor Green
Write-Host ""

# 2. Criar regras PERMANENTES com mais opções
Write-Host "2️⃣ Criando regras PERMANENTES..." -ForegroundColor Yellow

try {
    # Regra para porta 3000 (Cliente)
    $result3000 = netsh advfirewall firewall add rule `
        name="MacDavis Motos - Cliente (TCP 3000)" `
        dir=in `
        action=allow `
        protocol=TCP `
        localport=3000 `
        profile=any `
        enable=yes `
        description="MacDavis Motos - Catálogo Cliente"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Porta 3000 (Cliente) configurada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao configurar porta 3000" -ForegroundColor Red
        Write-Host "   Detalhes: $result3000" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Exceção ao configurar porta 3000: $_" -ForegroundColor Red
}

try {
    # Regra para porta 3001 (Admin)
    $result3001 = netsh advfirewall firewall add rule `
        name="MacDavis Motos - Admin (TCP 3001)" `
        dir=in `
        action=allow `
        protocol=TCP `
        localport=3001 `
        profile=any `
        enable=yes `
        description="MacDavis Motos - Painel Administrativo"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Porta 3001 (Admin) configurada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao configurar porta 3001" -ForegroundColor Red
        Write-Host "   Detalhes: $result3001" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Exceção ao configurar porta 3001: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar se as regras foram criadas
Write-Host "3️⃣ Verificando regras criadas..." -ForegroundColor Yellow
$rules = netsh advfirewall firewall show rule name=all | Select-String "MacDavis"
if ($rules) {
    Write-Host "   ✅ Regras encontradas no firewall:" -ForegroundColor Green
    $rules | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
} else {
    Write-Host "   ❌ Regras NÃO foram criadas!" -ForegroundColor Red
}
Write-Host ""

# 4. Mostrar IP para acesso
Write-Host "4️⃣ Informações de acesso..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" 
} | Select-Object -First 1).IPAddress

if ($ip) {
    Write-Host "   📡 IP Local: $ip" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   📱 ACESSE NO CELULAR:" -ForegroundColor Green
    Write-Host "      Cliente: http://$ip`:3000" -ForegroundColor White
    Write-Host "      Admin:   http://$ip`:3001/admin.html" -ForegroundColor White
} else {
    Write-Host "   ⚠️ IP local não detectado" -ForegroundColor Yellow
}
Write-Host ""

# 5. Testar conectividade
Write-Host "5️⃣ Testando conectividade..." -ForegroundColor Yellow
$serverRunning3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$serverRunning3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($serverRunning3000) {
    Write-Host "   ✅ Servidor Cliente (3000) rodando" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Servidor Cliente (3000) NÃO está rodando" -ForegroundColor Yellow
    Write-Host "      Inicie com: node server-client.js" -ForegroundColor Gray
}

if ($serverRunning3001) {
    Write-Host "   ✅ Servidor Admin (3001) rodando" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Servidor Admin (3001) NÃO está rodando" -ForegroundColor Yellow
    Write-Host "      Inicie com: node server-admin.js" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 DICA: Se as regras desaparecerem novamente," -ForegroundColor Yellow
Write-Host "   pode ser um antivírus ou política de grupo." -ForegroundColor Yellow
Write-Host "   Verifique software de segurança instalado." -ForegroundColor Yellow
Write-Host ""
Write-Host "⏸️ Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
