# Script para Reiniciar o Sistema - Sistema de Gestão de TI
# Execute com: .\restart.ps1

Write-Host "🔄 Reiniciando o sistema..." -ForegroundColor Yellow
Write-Host ""

# Chamar stop.ps1
# Usamos -File para garantir que o script seja executado corretamente
powershell -ExecutionPolicy Bypass -File ".\stop.ps1"

Write-Host ""
Write-Host "⏳ Aguardando 2 segundos antes de reiniciar..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Chamar start.ps1
powershell -ExecutionPolicy Bypass -File ".\start.ps1"
