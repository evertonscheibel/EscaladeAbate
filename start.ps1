# Script para Iniciar o Sistema - Sistema de Gestao de TI
# Versao Consolidada e Robusta v2

function Check-Port($port) {
    return netstat -ano | findstr ":$port" | findstr "LISTENING"
}

function Kill-PortProcess($port) {
    $process = netstat -ano | findstr ":$port" | findstr "LISTENING" | Select-Object -First 1
    if ($process) {
        $targetPid = ($process -split '\s+')[-1]
        Write-Host "Finalizando processo na porta $port (PID: $targetPid)..."
        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        return $true
    }
    return $false
}

Write-Host "--------------------------------------------------------"
Write-Host "   SISTEMA DE GESTÃO - INICIALIZAÇÃO"
Write-Host "--------------------------------------------------------"
Write-Host ""

$root = Get-Location

# 1. Limpeza de Portas
Write-Host "Verificando portas do sistema..."
if (Check-Port 5050) { Kill-PortProcess 5050 }
if (Check-Port 3030) { Kill-PortProcess 3030 }

# 2. Verificação de Dependências
if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "Instalando dependências do Backend (isso pode levar um minuto)..."
    npm install --prefix backend
}

if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "Instalando dependências do Frontend (isso pode levar um minuto)..."
    npm install --prefix frontend
}

# 3. Inicialização Unificada
Write-Host "Iniciando Backend e Frontend simultaneamente..."
Write-Host "   Backend: http://localhost:5050"
Write-Host "   Frontend: http://localhost:3030"
Write-Host ""

# Usamos npx para garantir que o concurrently funcione
npx concurrently "npm run dev --prefix backend" "npm run dev --prefix frontend" --names "BACKEND,FRONTEND" --prefix-colors "yellow,cyan"

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

