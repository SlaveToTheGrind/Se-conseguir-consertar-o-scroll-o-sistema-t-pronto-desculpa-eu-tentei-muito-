# Teste rápido de conectividade de rede
# NÃO PRECISA SER ADMINISTRADOR

Write-Host "🔍 DIAGNÓSTICO DE REDE - MacDavis Motos" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar IP local
Write-Host "1️⃣ Seu IP Local:" -ForegroundColor Yellow

$localIP = (Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and 
    $_.InterfaceAlias -notmatch 'Loopback' -and
    $_.IPAddress -notmatch '^169\.254\.'
} | Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Host "   IP: $localIP" -ForegroundColor Green
} else {
    Write-Host "   ❌ Não encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente: ipconfig" -ForegroundColor White
}

Write-Host ""

# 2. Verificar portas em uso
Write-Host "2️⃣ Verificando portas:" -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "   ✅ Porta 3000 (Cliente) está ABERTA e ESCUTANDO" -ForegroundColor Green
    Write-Host "      Processo: Node.js" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Porta 3000 (Cliente) não está em uso" -ForegroundColor Red
    Write-Host "      Execute: npm run client" -ForegroundColor Yellow
}

if ($port3001) {
    Write-Host "   ✅ Porta 3001 (Admin) está ABERTA e ESCUTANDO" -ForegroundColor Green
    Write-Host "      Processo: Node.js" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Porta 3001 (Admin) não está em uso" -ForegroundColor Red
    Write-Host "      Execute: npm run admin" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar regras de firewall (leitura não precisa de admin)
Write-Host "3️⃣ Verificando Firewall do Windows:" -ForegroundColor Yellow

try {
    $firewallRules = Get-NetFirewallRule -DisplayName "*MacDavis*" -ErrorAction SilentlyContinue
    
    if ($firewallRules) {
        Write-Host "   ✅ Regras de firewall encontradas:" -ForegroundColor Green
        foreach ($rule in $firewallRules) {
            $enabled = if ($rule.Enabled) { "✅" } else { "❌" }
            Write-Host "      $enabled $($rule.DisplayName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️ Nenhuma regra específica encontrada" -ForegroundColor Yellow
        Write-Host "      EXECUTE: fix-mobile-access.ps1 como ADMINISTRADOR" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️ Não foi possível verificar firewall" -ForegroundColor Yellow
    Write-Host "      Isso é normal sem permissões de administrador" -ForegroundColor Gray
}

Write-Host ""

# 4. Resumo e instruções
Write-Host "4️⃣ PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""

$allOk = $localIP -and $port3000 -and $port3001

if ($allOk) {
    Write-Host "   ✅ TUDO OK! Use estes endereços no celular:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   📱 Cliente: http://$localIP`:3000" -ForegroundColor Cyan
    Write-Host "   🔐 Admin:   http://$localIP`:3001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   🧪 Teste:   http://$localIP`:3000/test-mobile-connection.html" -ForegroundColor White
    Write-Host ""
} else {
    if (-not $localIP) {
        Write-Host "   ❌ IP não detectado - verifique sua conexão de rede" -ForegroundColor Red
    }
    
    if (-not $port3000 -or -not $port3001) {
        Write-Host "   ❌ Servidores não estão rodando" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Abra 2 terminais e execute:" -ForegroundColor White
        Write-Host "   Terminal 1: npm run client" -ForegroundColor Cyan
        Write-Host "   Terminal 2: npm run admin" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host "5️⃣ SE NÃO FUNCIONAR NO CELULAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Execute fix-mobile-access.ps1 como ADMINISTRADOR" -ForegroundColor White
Write-Host "   2. Reinicie os servidores (Ctrl+C e npm run client/admin)" -ForegroundColor White
Write-Host "   3. Certifique-se de estar na mesma rede Wi-Fi" -ForegroundColor White
Write-Host ""

Read-Host "Pressione ENTER para sair"
