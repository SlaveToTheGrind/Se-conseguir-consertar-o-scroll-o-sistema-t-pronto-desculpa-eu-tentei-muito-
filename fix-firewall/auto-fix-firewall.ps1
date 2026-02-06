# AUTO-FIX FIREWALL - MacDavis Motos
# Executa automaticamente na inicializacao
# Silencioso - sem janelas

# Arquivo de log
$logFile = "$PSScriptRoot\firewall-auto-fix.log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
}

Write-Log "=== Verificacao Iniciada ==="

# Verificar se as regras existem
$rule3000 = Get-NetFirewallRule -DisplayName "MacDavis Motos - Cliente (TCP 3000)" -ErrorAction SilentlyContinue
$rule3001 = Get-NetFirewallRule -DisplayName "MacDavis Motos - Admin (TCP 3001)" -ErrorAction SilentlyContinue

$needsFix = $false

if (-not $rule3000) {
    Write-Log "Regra 3000 nao encontrada - criando..."
    try {
        netsh advfirewall firewall add rule name="MacDavis Motos - Cliente (TCP 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any enable=yes description="MacDavis Motos - Catalogo Cliente" | Out-Null
        Write-Log "OK Regra 3000 criada com sucesso"
        $needsFix = $true
    } catch {
        Write-Log "ERRO ao criar regra 3000: $_"
    }
} else {
    Write-Log "OK Regra 3000 existe"
}

if (-not $rule3001) {
    Write-Log "Regra 3001 nao encontrada - criando..."
    try {
        netsh advfirewall firewall add rule name="MacDavis Motos - Admin (TCP 3001)" dir=in action=allow protocol=TCP localport=3001 profile=any enable=yes description="MacDavis Motos - Painel Administrativo" | Out-Null
        Write-Log "OK Regra 3001 criada com sucesso"
        $needsFix = $true
    } catch {
        Write-Log "ERRO ao criar regra 3001: $_"
    }
} else {
    Write-Log "OK Regra 3001 existe"
}

if ($needsFix) {
    Write-Log "Regras de firewall foram recriadas automaticamente"
} else {
    Write-Log "Todas as regras estao presentes - nenhuma acao necessaria"
}

Write-Log "=== Verificacao Concluida ==="
Write-Log ""
