@echo off
:: Inicia o servidor Node.js em modo totalmente oculto
powershell -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'js/server.js' -WindowStyle Hidden"

:: Aguarda 2 segundos para o banco de dados inicializar
timeout /t 2 /nobreak > nul

:: Abre o navegador e fecha o terminal
start http://localhost:3000
exit
