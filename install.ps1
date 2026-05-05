# Script de Instalação - Sistema de Gestão de TI
# Execute com: .\install.ps1

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "║   🚀 INSTALAÇÃO - Sistema de Gestão de TI            ║" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "⚠️  Reinicie o terminal após a instalação" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "🔍 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 INSTALANDO BACKEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Instalar dependências do backend
Set-Location backend
Write-Host "📥 Instalando dependências do backend..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências do backend instaladas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🗄️  CONFIGURANDO BANCO DE DADOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Escolha uma opção de banco de dados:" -ForegroundColor Yellow
Write-Host "1. MongoDB Local (localhost:27017)" -ForegroundColor White
Write-Host "2. MongoDB Atlas (Cloud - Gratuito)" -ForegroundColor White
Write-Host "3. Pular (já configurado)" -ForegroundColor White
$dbChoice = Read-Host "Digite sua escolha (1/2/3)"

if ($dbChoice -eq "2") {
    Write-Host ""
    Write-Host "📝 Configure o MongoDB Atlas:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
    Write-Host "2. Crie um cluster gratuito (M0)" -ForegroundColor White
    Write-Host "3. Configure usuário e senha" -ForegroundColor White
    Write-Host "4. Adicione seu IP na whitelist" -ForegroundColor White
    Write-Host "5. Copie a connection string" -ForegroundColor White
    Write-Host ""
    $mongoUri = Read-Host "Cole a connection string do MongoDB Atlas"
    
    if ($mongoUri) {
        (Get-Content .env) -replace 'MONGODB_URI=.*', "MONGODB_URI=$mongoUri" | Set-Content .env
        Write-Host "✅ MongoDB Atlas configurado!" -ForegroundColor Green
    }
}
elseif ($dbChoice -eq "1") {
    Write-Host "✅ Usando MongoDB Local (localhost:27017)" -ForegroundColor Green
    Write-Host "⚠️  Certifique-se de que o MongoDB está rodando!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌱 Deseja popular o banco com dados de exemplo?" -ForegroundColor Yellow
Write-Host "   (Cria usuários de teste, tickets, ativos, etc.)" -ForegroundColor White
$seedChoice = Read-Host "Digite S para sim ou N para não (S/N)"

if ($seedChoice -eq "S" -or $seedChoice -eq "s") {
    Write-Host "🌱 Populando banco de dados..." -ForegroundColor Yellow
    npm run seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados populado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "👥 Usuários criados:" -ForegroundColor Cyan
        Write-Host "   Admin:    admin@gestao.com    / admin123" -ForegroundColor White
        Write-Host "   Técnico:  joao@gestao.com     / tecnico123" -ForegroundColor White
        Write-Host "   Cliente:  maria@cliente.com   / cliente123" -ForegroundColor White
    }
    else {
        Write-Host "❌ Erro ao popular banco de dados" -ForegroundColor Red
        Write-Host "⚠️  Verifique se o MongoDB está rodando" -ForegroundColor Yellow
    }
}

Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎨 INSTALANDO FRONTEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Instalar dependências do frontend
Set-Location frontend
Write-Host "📥 Instalando dependências do frontend..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências do frontend instaladas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                       ║" -ForegroundColor Green
Write-Host "║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!               ║" -ForegroundColor Green
Write-Host "║                                                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Iniciar o BACKEND:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   (Backend rodará em http://localhost:3000)" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Em OUTRO TERMINAL, iniciar o FRONTEND:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   (Frontend rodará em http://localhost:5173)" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Acessar o sistema:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação completa: README.md" -ForegroundColor Cyan
Write-Host ""
