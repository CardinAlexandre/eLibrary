# Script pour seeder la base de données avec les livres
# Usage: .\scripts\seed-database.ps1

Write-Host "📚 Seed de la base de données eLibrary..." -ForegroundColor Cyan
Write-Host ""

# Naviguer vers le dossier racine
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

# Vérifier que le fichier books.json existe
if (-not (Test-Path "data/books.json")) {
    Write-Host "❌ Erreur: Le fichier data/books.json n'existe pas!" -ForegroundColor Red
    exit 1
}

# Vérifier que le conteneur catalog-service est running
$containerStatus = docker ps --filter "name=elibrary-catalog" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ Erreur: Le conteneur catalog-service n'est pas démarré!" -ForegroundColor Red
    Write-Host "💡 Démarrez d'abord les services: .\scripts\start-services.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Catalog service est actif" -ForegroundColor Green
Write-Host ""

# Étape 1: Copier le fichier books.json dans le conteneur
Write-Host "📋 Étape 1/2 - Copie du fichier books.json dans le conteneur..." -ForegroundColor Yellow
docker-compose exec catalog-service mkdir -p /app/data 2>&1 | Out-Null
docker cp data/books.json elibrary-catalog:/app/data/books.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Fichier copié avec succès" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors de la copie" -ForegroundColor Red
    exit 1
}

# Étape 2: Exécuter le seed
Write-Host ""
Write-Host "🌱 Étape 2/2 - Exécution du seed (insertion des 52 livres)..." -ForegroundColor Yellow
docker-compose exec catalog-service dotnet CatalogService.dll seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✅ Base de données seedée avec succès!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 52 livres ont été insérés dans la base de données" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Tester maintenant:" -ForegroundColor Cyan
    Write-Host "   curl 'http://localhost:5000/api/catalog/books?page=1&pageSize=10'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Erreur lors du seed!" -ForegroundColor Red
    Write-Host "💡 Voir les logs: docker-compose logs catalog-service" -ForegroundColor Yellow
    exit 1
}

