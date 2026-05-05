@echo off
setlocal
cd /d "%~dp0"

echo #######################################################
echo #                                                     #
echo #   🛑 PARANDO SISTEMA INTEGRADO DE GESTÃO           #
echo #                                                     #
echo #######################################################
echo.
echo Encerrando todos os processos e liberando portas...
echo.

powershell -ExecutionPolicy Bypass -File ".\stop.ps1"

echo.
echo #######################################################
echo #   ✅ SISTEMA ENCERRADO COM SUCESSO!                 #
echo #######################################################
echo.
pause
