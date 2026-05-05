Write-Host "=== Configuração do Ambiente Frizelo WhatsApp ===" -ForegroundColor Cyan

# 1. Verificar Node.js
Write-Host "`n[1/3] Verificando Node.js..."
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $ver = npm -v
    Write-Host "Node.js está instalado (npm v$ver)." -ForegroundColor Green
} else {
    Write-Host "ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "O comando 'npm' falhou. Isso significa que o Node.js não está instalado ou não está no PATH." -ForegroundColor Yellow
    Write-Host "1. Baixe e instale o Node.js (versão LTS) aqui: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Após instalar, FECHE todas as janelas do terminal/VS Code e abra novamente." -ForegroundColor White
    exit
}

# 2. Criar Pasta Server
Write-Host "`n[2/3] Verificando pasta 'server'..."
$serverPath = Join-Path $PSScriptRoot "server"
if (-not (Test-Path $serverPath)) {
    New-Item -ItemType Directory -Path $serverPath -Force | Out-Null
    Write-Host "Pasta 'server' criada." -ForegroundColor Green
} else {
    Write-Host "Pasta 'server' já existe." -ForegroundColor Yellow
}

# 3. Instalar Dependências
Write-Host "`n[3/3] Instalando dependências do projeto..."
if (Test-Path (Join-Path $serverPath "package.json")) {
    Push-Location $serverPath
    try {
        npm install
        Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao instalar dependências." -ForegroundColor Red
    }
    Pop-Location
} else {
    Write-Host "Arquivo package.json não encontrado em $serverPath. Certifique-se de que os arquivos foram criados." -ForegroundColor Red
}

Write-Host "`n=== Concluído! ===" -ForegroundColor Cyan
Write-Host "Para iniciar o servidor, execute: node server/index.js" -ForegroundColor Cyan
