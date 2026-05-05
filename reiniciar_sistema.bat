@echo off
setlocal
cd /d "%~dp0"

echo #######################################################
echo #                                                     #
echo #   🔄 REINICIANDO SISTEMA INTEGRADO DE GESTÃO       #
echo #                                                     #
echo #######################################################
echo.
echo Parando servicos atuais e reiniciando o ambiente...
echo.

powershell -ExecutionPolicy Bypass -File ".\restart.ps1"

echo.
echo #######################################################
echo #   ✅ SISTEMA REINICIADO COM SUCESSO!                #
echo #######################################################
echo.
pause
