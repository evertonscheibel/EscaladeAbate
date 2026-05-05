# Script para matar processo na porta 3000
Write-Host "🔍 Procurando processo na porta 3000..." -ForegroundColor Yellow

$process = netstat -ano | findstr :3000 | Select-Object -First 1

if ($process) {
    $pid = ($process -split '\s+')[-1]
    Write-Host "📍 Processo encontrado: PID $pid" -ForegroundColor Cyan
    
    try {
        taskkill /PID $pid /F
        Write-Host "✅ Processo finalizado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao finalizar processo" -ForegroundColor Red
    }
}
else {
    Write-Host "✅ Porta 3000 está livre!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Agora você pode executar: npm run dev" -ForegroundColor Cyan
