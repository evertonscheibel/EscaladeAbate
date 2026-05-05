# Script de Migração Simplificado
$origem = "C:\Users\evert\OneDrive\Documentos\Everton\Pessoal\V0"
$destino = "C:\Projetos\V0"

Write-Host "MIGRANDO PROJETO PARA $destino"

# 1. Criar diretorio
if (-not (Test-Path $destino)) {
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    Write-Host "Pasta criada."
}

# 2. Copiar arquivos
Write-Host "Copiando arquivos..."
$exclude = @("node_modules", "dist", "build", ".git")
robocopy $origem $destino /E /XD $exclude /R:1 /W:1 /NFL /NDL /NJH /NJS

# Copiar .git
Write-Host "Copiando Git..."
robocopy "$origem\.git" "$destino\.git" /E /IS /IT /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null

# 3. Instalar dependencias
Write-Host "Instalando Backend..."
Set-Location "$destino\backend"
npm install

Write-Host "Instalando Frontend..."
Set-Location "$destino\frontend"
npm install

Write-Host "CONCLUIDO! Abra a pasta $destino no VS Code."
