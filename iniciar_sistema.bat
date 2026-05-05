@echo off
setlocal
cd /d "%~dp0"

echo #######################################################
echo #                                                     #
echo #   🚀 INICIANDO SISTEMA INTEGRADO DE GESTÃO         #
echo #                                                     #
echo #######################################################
echo.
echo Verificando ambiente e iniciando servicos...
echo.

powershell -ExecutionPolicy Bypass -File ".\start.ps1"

echo.
echo #######################################################
echo #   ✅ SISTEMA PRONTO PARA USO!                       #
echo #######################################################
echo.
pause
