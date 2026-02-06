@echo off
cd /d "%~dp0"
echo Iniciando AMBOS os servidores...
start "MacDavis Admin (3001)" cmd /k "node server-admin.js"
start "MacDavis Client (3000)" cmd /k "node server-client.js"
echo.
echo ✅ Servidores iniciados em janelas separadas!
echo Admin: http://localhost:3001/admin.html
echo Cliente: http://localhost:3000/catalog.html
pause
