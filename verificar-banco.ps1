# Script de Teste - Verificar Banco de Dados

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "║   🔍 VERIFICAÇÃO DO BANCO DE DADOS                   ║" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se mongosh está instalado
Write-Host "🔍 Verificando MongoDB..." -ForegroundColor Yellow

try {
    $mongoVersion = mongosh --version
    Write-Host "✅ MongoDB Shell encontrado!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📊 Consultando banco de dados..." -ForegroundColor Yellow
    Write-Host ""
    
    # Executar comandos MongoDB
    $commands = @"
use gestao_ti
print('📦 Database: gestao_ti')
print('')
print('📋 Coleções:')
db.getCollectionNames().forEach(function(col) {
    var count = db[col].countDocuments();
    print('  ✅ ' + col + ': ' + count + ' documento(s)');
});
print('')
print('👥 Usuários cadastrados:')
db.users.find({}, {name: 1, email: 1, role: 1}).forEach(function(user) {
    print('  • ' + user.name + ' (' + user.email + ') - ' + user.role);
});
print('')
print('🎫 Tickets:')
db.tickets.find({}, {title: 1, status: 1, priority: 1}).forEach(function(ticket) {
    print('  • ' + ticket.title + ' - Status: ' + ticket.status + ' | Prioridade: ' + ticket.priority);
});
"@

    $commands | mongosh --quiet
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                       ║" -ForegroundColor Green
    Write-Host "║   ✅ BANCO DE DADOS FUNCIONANDO!                     ║" -ForegroundColor Green
    Write-Host "║                                                       ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
    
}
catch {
    Write-Host "❌ MongoDB Shell (mongosh) não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Opções:" -ForegroundColor Yellow
    Write-Host "1. Instalar MongoDB Compass (Interface Gráfica):" -ForegroundColor White
    Write-Host "   https://www.mongodb.com/try/download/compass" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Ou instalar mongosh:" -ForegroundColor White
    Write-Host "   https://www.mongodb.com/try/download/shell" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Ou verificar via API (com backend rodando):" -ForegroundColor White
    Write-Host "   curl http://localhost:3000/api/health" -ForegroundColor Cyan
}

Write-Host ""
