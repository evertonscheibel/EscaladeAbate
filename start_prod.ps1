# Script de Inicialização em Produção
# Execute este script no servidor após rodar o build_prod.ps1

Write-Host "🚀 Iniciando Servidor em Modo Produção..." -ForegroundColor Cyan

# Definir variável de ambiente para produção
$env:NODE_ENV = "production"

# Navegar para o backend
Set-Location "$PSScriptRoot\backend"

# Iniciar servidor
# Usamos 'node src/server.js' diretamente para garantir que rode com Node
Write-Host "✅ Iniciando processo Node.js..." -ForegroundColor Green
node src/server.js
