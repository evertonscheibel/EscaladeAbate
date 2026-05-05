# Script de Build para Produção
# Este script prepara o sistema para deploy

Write-Host "🚀 Iniciando processo de build para produção..." -ForegroundColor Cyan

# 1. Instalar dependências e Buildar Frontend
Write-Host "📦 Preparando Frontend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Falha no build do frontend"
    exit 1
}

# 2. Preparar pasta pública no Backend
Write-Host "📂 Movendo arquivos para o Backend..." -ForegroundColor Yellow
$backendPublic = "$PSScriptRoot\backend\public"

if (Test-Path $backendPublic) {
    Remove-Item $backendPublic -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $backendPublic | Out-Null

# Copiar build do frontend para backend/public
Copy-Item "$PSScriptRoot\frontend\dist\*" $backendPublic -Recurse

# 3. Instalar dependências do Backend
Write-Host "📦 Preparando Backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm install --omit=dev

Write-Host ""
Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host "   Os arquivos estáticos estão em: /backend/public" -ForegroundColor Gray
Write-Host "   Para testar, execute: .\start_prod.ps1" -ForegroundColor Gray
