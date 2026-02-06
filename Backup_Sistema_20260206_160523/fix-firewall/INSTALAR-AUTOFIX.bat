@echo off
title Instalador Auto-Fix Firewall - MacDavis Motos
color 0A

echo ============================================
echo  INSTALADOR AUTO-FIX FIREWALL
echo  MacDavis Motos
echo ============================================
echo.

REM Verificar se está rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este script precisa ser executado como ADMINISTRADOR!
    echo.
    echo Clique com botao direito neste arquivo e escolha:
    echo "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [OK] Executando como administrador...
echo.

REM Executar o script PowerShell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR.ps1"

echo.
echo ============================================
echo.
pause
