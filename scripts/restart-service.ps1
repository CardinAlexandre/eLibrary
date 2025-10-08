# Script pour redémarrer un service spécifique
# Usage: .\scripts\restart-service.ps1 -ServiceName <nom-du-service>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet(
        "gateway",
        "catalog-service",
        "auth-service",
        "importer-service",
        "recommender-service",
        "analytics-service",
        "sqlserver",
        "redis",
        "rabbitmq",
        "prometheus",
        "grafana"
    )]
    [string]$ServiceName,
    
    [switch]$Rebuild = $false
)

# Naviguer vers le dossier racine
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

Write-Host "🔄 Redémarrage de $ServiceName..." -ForegroundColor Cyan
Write-Host ""

if ($Rebuild) {
    Write-Host "🔨 Rebuild de l'image..." -ForegroundColor Yellow
    docker-compose build $ServiceName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du build!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Build réussi!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🔄 Redémarrage du service..." -ForegroundColor Yellow
docker-compose up -d $ServiceName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service redémarré avec succès!" -ForegroundColor Green
    Write-Host ""
    
    # Attendre un peu
    Write-Host "⏳ Attente de l'initialisation (10 secondes)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Afficher le status
    Write-Host ""
    Write-Host "📋 Status du service:" -ForegroundColor Cyan
    docker-compose ps $ServiceName
    
    Write-Host ""
    Write-Host "💡 Pour voir les logs: docker-compose logs -f $ServiceName" -ForegroundColor Yellow
} else {
    Write-Host "❌ Erreur lors du redémarrage!" -ForegroundColor Red
    exit 1
}

Write-Host ""

