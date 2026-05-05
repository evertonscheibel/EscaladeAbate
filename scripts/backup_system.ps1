# Script de Backup Diário - Sistema de Gestão de TI

$ErrorActionPreference = "Stop"

# --- CONFIGURAÇÕES ---
$ProjectRoot = "C:\Projetos\AntgravityProjeto"
$BackupRoot = "C:\Backups_GestaoTI"
$RetentionDays = 7
$DatabaseName = "gestao_ti"
$UploadsDir = "$ProjectRoot\backend\uploads"

# Tentar encontrar o mongodump em locais comuns
$MongoDumpPaths = @(
    "C:\Program Files\MongoDB\Tools\bin\mongodump.exe",
    "C:\Program Files\MongoDB\Database Tools\bin\mongodump.exe",
    "C:\MongoDB\bin\mongodump.exe"
)

$MongoDump = $null
foreach ($Path in $MongoDumpPaths) {
    if (Test-Path $Path) {
        $MongoDump = $Path
        break
    }
}

# --- INÍCIO DO BACKUP ---
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$CurrentBackupDir = Join-Path $BackupRoot "backup_$Timestamp"

Write-Host "🚀 Iniciando backup do sistema ($Timestamp)..." -ForegroundColor Cyan

# Criar pastas se não existirem
if (!(Test-Path $BackupRoot)) { New-Item -Path $BackupRoot -ItemType Directory | Out-Null }
New-Item -Path $CurrentBackupDir -ItemType Directory | Out-Null

try {
    # 1. Backup do Banco de Dados (se mongodump existir)
    if ($MongoDump) {
        Write-Host "📦 Exportando banco de dados '$DatabaseName'..." -ForegroundColor Yellow
        & $MongoDump --db $DatabaseName --out "$CurrentBackupDir\database"
        Write-Host "✅ Banco de dados exportado com sucesso." -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ mongodump.exe não encontrado. Pulando backup do banco." -ForegroundColor Red
        Write-Host "   Por favor, instale o 'MongoDB Database Tools' para habilitar o backup do banco." -ForegroundColor Gray
    }

    # 2. Backup da pasta Uploads (Arquivos)
    if (Test-Path $UploadsDir) {
        Write-Host "📂 Compactando pasta de uploads..." -ForegroundColor Yellow
        $UploadsZip = Join-Path $CurrentBackupDir "uploads.zip"
        Compress-Archive -Path "$UploadsDir\*" -DestinationPath $UploadsZip -Force
        Write-Host "✅ Uploads compactados com sucesso." -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Pasta de uploads não encontrada em $UploadsDir" -ForegroundColor Red
    }

    # 3. Limpeza de backups antigos (Retenção)
    Write-Host "🧹 Verificando retenção (manter últimos $RetentionDays dias)..." -ForegroundColor Yellow
    $OldBackups = Get-ChildItem -Path $BackupRoot -Directory | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) }
    
    foreach ($Old in $OldBackups) {
        Write-Host "   Removendo backup antigo: $($Old.Name)" -ForegroundColor Gray
        Remove-Item -Path $Old.FullName -Recurse -Force
    }

    Write-Host "✨ Backup concluído com sucesso em $CurrentBackupDir" -ForegroundColor Green

}
catch {
    Write-Host "❌ ERRO AO REALIZAR BACKUP: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
