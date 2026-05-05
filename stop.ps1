function Kill-PortProcess($port, $name) {
    Write-Host "Searching $name on port $port..." -ForegroundColor Yellow
    $processList = netstat -ano | findstr ":$port" | findstr "LISTENING"
    
    if ($processList) {
        $pids = @()
        foreach ($line in ($processList -split "`n")) {
            if ($line -match '(\d+)$') {
                $pids += $matches[1]
            }
        }
        
        foreach ($targetPid in ($pids | Select-Object -Unique)) {
            if ($targetPid -gt 0) {
                Write-Host "Found process PID: $targetPid" -ForegroundColor Cyan
                try {
                    Stop-Process -Id $targetPid -Force -ErrorAction Stop
                    Write-Host "Successfully stopped $name (PID $targetPid)" -ForegroundColor Green
                }
                catch {
                    Write-Host "Error stopping $name (PID $targetPid): $_" -ForegroundColor Red
                }
            }
        }
    }
    else {
        Write-Host "Port $port ($name) is already free." -ForegroundColor Green
    }
}

Write-Host "--- Parando Sistema de Gestão ---" -ForegroundColor Cyan

# Parar Backend
Kill-PortProcess 5050 "Backend"

# Parar Frontend
Kill-PortProcess 3030 "Frontend"

Write-Host "--- Tudo encerrado com sucesso ---" -ForegroundColor Green
Start-Sleep -Seconds 1

