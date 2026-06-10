@echo off
:: Encerra instâncias anteriores do Node para evitar duplicidade
taskkill /f /im node.exe >nul 2>&1

:: Inicia o servidor Node.js em modo totalmente oculto
powershell -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'js/server.js' -WindowStyle Hidden"

:: Aguarda 2 segundos para o banco de dados inicializar
timeout /t 2 /nobreak > nul

:: Abre o navegador e fecha o terminal
start chrome --start-fullscreen "http://localhost:3000"
exit
