# Script d'arrêt des services eLibrary dans l'ordre
# Usage: .\scripts\stop-services.ps1 [-RemoveVolumes]

param(
    [switch]$RemoveVolumes = $false
)

Write-Host "🛑 Arrêt des services eLibrary..." -ForegroundColor Cyan
Write-Host ""

# Naviguer vers le dossier racine
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

Write-Host "📍 Dossier de travail: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Étape 1: Arrêter l'API Gateway (point d'entrée)
Write-Host "🌐 Étape 1/6 - Arrêt de l'API Gateway..." -ForegroundColor Yellow
docker-compose stop gateway
Start-Sleep -Seconds 2

# Étape 2: Arrêter les services métier
Write-Host "🎯 Étape 2/6 - Arrêt des services métier..." -ForegroundColor Yellow
Write-Host "   → Importer Service" -ForegroundColor Gray
Write-Host "   → Recommender Service" -ForegroundColor Gray
Write-Host "   → Analytics Service" -ForegroundColor Gray
docker-compose stop importer-service recommender-service analytics-service
Start-Sleep -Seconds 3

# Étape 3: Arrêter les services core (Auth et Catalog)
Write-Host "🔐 Étape 3/6 - Arrêt des services d'authentification et catalogue..." -ForegroundColor Yellow
Write-Host "   → Auth Service" -ForegroundColor Gray
Write-Host "   → Catalog Service" -ForegroundColor Gray
docker-compose stop auth-service catalog-service
Start-Sleep -Seconds 3

# Étape 4: Arrêter les services de monitoring
Write-Host "📊 Étape 4/6 - Arrêt du monitoring..." -ForegroundColor Yellow
Write-Host "   → Grafana" -ForegroundColor Gray
Write-Host "   → Prometheus" -ForegroundColor Gray
docker-compose stop grafana prometheus
Start-Sleep -Seconds 2

# Étape 5: Arrêter les services d'infrastructure
Write-Host "🗄️  Étape 5/6 - Arrêt de l'infrastructure..." -ForegroundColor Yellow
Write-Host "   → RabbitMQ" -ForegroundColor Gray
Write-Host "   → Redis" -ForegroundColor Gray
Write-Host "   → SQL Server" -ForegroundColor Gray
docker-compose stop rabbitmq redis sqlserver
Start-Sleep -Seconds 3

# Étape 6: Nettoyer les conteneurs
Write-Host "🧹 Étape 6/6 - Nettoyage des conteneurs..." -ForegroundColor Yellow

if ($RemoveVolumes) {
    Write-Host ""
    Write-Host "⚠️  ATTENTION: Suppression des volumes (données seront perdues)!" -ForegroundColor Red
    Write-Host "   Appuyez sur Ctrl+C dans les 5 secondes pour annuler..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    docker-compose down -v
    Write-Host "   ✅ Conteneurs et volumes supprimés" -ForegroundColor Green
} else {
    docker-compose down
    Write-Host "   ✅ Conteneurs arrêtés (volumes conservés)" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Tous les services ont été arrêtés proprement!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'il ne reste plus de conteneurs eLibrary
$remainingContainers = docker ps -a --filter "name=elibrary" --format "{{.Names}}"
if ($remainingContainers) {
    Write-Host "⚠️  Conteneurs restants:" -ForegroundColor Yellow
    $remainingContainers | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ Aucun conteneur eLibrary actif" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Pour redémarrer: .\scripts\start-services.ps1" -ForegroundColor Cyan

if (-not $RemoveVolumes) {
    Write-Host "💡 Pour supprimer aussi les volumes (données): .\scripts\stop-services.ps1 -RemoveVolumes" -ForegroundColor Cyan
}

Write-Host ""

