# Script para Configurar Acesso na Rede Local
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "║   🌐 CONFIGURANDO ACESSO NA REDE LOCAL               ║" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Obter IP Local
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*vEthernet*" -and $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
}

Write-Host "📍 Seu IP Local detectado: $ip" -ForegroundColor Green
Write-Host ""

# 2. Configurar Firewall
Write-Host "🛡️ Configurando Firewall do Windows..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Gestao TI - Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Gestao TI - Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Regras de Firewall criadas com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Não foi possível criar regras de firewall automaticamente. Execute como Administrador." -ForegroundColor Red
}

# 3. Atualizar Backend .env
Write-Host "⚙️ Atualizando Backend (.env)..." -ForegroundColor Yellow
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    $content = Get-Content $backendEnvPath
    $newContent = $content -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://$($ip):5173"
    
    if ($content -notcontains "HOST=0.0.0.0") {
        $newContent += "`nHOST=0.0.0.0"
    }
    
    $newContent | Set-Content $backendEnvPath
    Write-Host "✅ Backend configurado!" -ForegroundColor Green
}

# 4. Atualizar Frontend .env
Write-Host "⚙️ Atualizando Frontend (.env)..." -ForegroundColor Yellow
$frontendEnvPath = "frontend\.env"
if (Test-Path $frontendEnvPath) {
    $content = Get-Content $frontendEnvPath
    $newContent = $content -replace "VITE_API_URL=.*", "VITE_API_URL=http://$($ip):3000/api"
    $newContent | Set-Content $frontendEnvPath
    Write-Host "✅ Frontend configurado!" -ForegroundColor Green
}
else {
    "VITE_API_URL=http://$($ip):3000/api" | Set-Content $frontendEnvPath
    Write-Host "✅ Frontend configurado (arquivo criado)!" -ForegroundColor Green
}

# 5. Atualizar vite.config.ts
Write-Host "⚙️ Verificando vite.config.ts..." -ForegroundColor Yellow
$viteConfigPath = "frontend\vite.config.ts"
if (Test-Path $viteConfigPath) {
    $viteContent = Get-Content $viteConfigPath -Raw
    if ($viteContent -notmatch "host: '0.0.0.0'") {
        $newViteContent = $viteContent -replace "server: \{", "server: {`n    host: '0.0.0.0',"
        if ($newViteContent -eq $viteContent) {
            # Se não achou server: {, tenta adicionar no final do plugins
            $newViteContent = $viteContent -replace "plugins: \[react\(\)\],", "plugins: [react()],`n  server: { host: '0.0.0.0', port: 5173 },"
        }
        $newViteContent | Set-Content $viteConfigPath
        Write-Host "✅ Vite configurado para acesso externo!" -ForegroundColor Green
    }
    else {
        Write-Host "✅ Vite já estava configurado." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Cyan
Write-Host ""
Write-Host "👉 Para acessar de outros dispositivos (celular, tablet, outro PC):" -ForegroundColor White
Write-Host "   http://$($ip):5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ IMPORTANTE: Reinicie os terminais do backend e frontend para aplicar as mudanças!" -ForegroundColor Red
Write-Host ""
