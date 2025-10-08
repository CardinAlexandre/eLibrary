# Script de démarrage des services eLibrary dans l'ordre
# Usage: .\scripts\start-services.ps1

Write-Host "🚀 Démarrage des services eLibrary..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker n'est pas démarré"
    }
} catch {
    Write-Host "❌ Erreur: Docker Desktop n'est pas démarré." -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Yellow
    exit 1
}

# Naviguer vers le dossier racine
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

Write-Host "📍 Dossier de travail: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Étape 1: Nettoyer les anciens conteneurs si nécessaire
Write-Host "🧹 Étape 1/6 - Nettoyage des anciens conteneurs..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Étape 2: Démarrer l'infrastructure de base (SQL Server, Redis, RabbitMQ)
Write-Host "🗄️  Étape 2/6 - Démarrage de l'infrastructure de base..." -ForegroundColor Yellow
Write-Host "   → SQL Server (port 1434)" -ForegroundColor Gray
Write-Host "   → Redis (port 6379)" -ForegroundColor Gray
Write-Host "   → RabbitMQ (ports 5672, 15672)" -ForegroundColor Gray
docker-compose up -d sqlserver redis rabbitmq

# Attendre que les services d'infrastructure soient healthy
Write-Host ""
Write-Host "⏳ Attente que l'infrastructure soit prête (60 secondes)..." -ForegroundColor Yellow
Write-Host "   → SQL Server nécessite environ 40-60 secondes pour être opérationnel" -ForegroundColor Gray
Start-Sleep -Seconds 15

for ($i = 1; $i -le 9; $i++) {
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
Write-Host ""

# Vérifier la santé de SQL Server
Write-Host "🔍 Vérification de SQL Server..." -ForegroundColor Yellow
$sqlHealthy = $false
for ($i = 1; $i -le 10; $i++) {
    $status = docker inspect elibrary-sqlserver --format='{{.State.Health.Status}}' 2>$null
    if ($status -eq "healthy") {
        Write-Host "   ✅ SQL Server est prêt!" -ForegroundColor Green
        $sqlHealthy = $true
        break
    }
    Write-Host "   ⏳ Tentative $i/10... Status: $status" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

if (-not $sqlHealthy) {
    Write-Host "   ⚠️  SQL Server n'est pas encore healthy, mais on continue..." -ForegroundColor Yellow
}

# Étape 3: Démarrer les services de monitoring
Write-Host ""
Write-Host "📊 Étape 3/6 - Démarrage du monitoring..." -ForegroundColor Yellow
Write-Host "   → Prometheus (port 9090)" -ForegroundColor Gray
Write-Host "   → Grafana (port 3001)" -ForegroundColor Gray
docker-compose up -d prometheus grafana

Start-Sleep -Seconds 5

# Étape 4: Démarrer les services applicatifs (Auth et Catalog en premier)
Write-Host ""
Write-Host "🔐 Étape 4/6 - Démarrage des services d'authentification et catalogue..." -ForegroundColor Yellow
Write-Host "   → Auth Service (port 5002)" -ForegroundColor Gray
Write-Host "   → Catalog Service (port 5001)" -ForegroundColor Gray
docker-compose up -d auth-service catalog-service

Write-Host "   ⏳ Attente de l'initialisation (30 secondes)..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Étape 5: Démarrer les services dépendants
Write-Host ""
Write-Host "🎯 Étape 5/6 - Démarrage des services métier..." -ForegroundColor Yellow
Write-Host "   → Importer Service (port 5003)" -ForegroundColor Gray
Write-Host "   → Recommender Service (port 5004)" -ForegroundColor Gray
Write-Host "   → Analytics Service (port 5005)" -ForegroundColor Gray
docker-compose up -d importer-service recommender-service analytics-service

Start-Sleep -Seconds 15

# Étape 6: Démarrer l'API Gateway
Write-Host ""
Write-Host "🌐 Étape 6/6 - Démarrage de l'API Gateway..." -ForegroundColor Yellow
Write-Host "   → Gateway (port 5000)" -ForegroundColor Gray
docker-compose up -d gateway

Start-Sleep -Seconds 10

# Afficher le statut final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Tous les services ont été démarrés!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Afficher l'état des conteneurs
Write-Host "📋 État des services:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 URLs d'accès:" -ForegroundColor Cyan
Write-Host "   • API Gateway:     http://localhost:5000" -ForegroundColor White
Write-Host "   • Catalog API:     http://localhost:5001/swagger" -ForegroundColor White
Write-Host "   • Auth API:        http://localhost:5002/swagger" -ForegroundColor White
Write-Host "   • Grafana:         http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "   • Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "   • RabbitMQ:        http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host ""

Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Attendre 2-3 minutes que tous les services soient healthy" -ForegroundColor White
Write-Host "   2. Tester l'API: curl 'http://localhost:5000/api/catalog/books'" -ForegroundColor White
Write-Host "   3. Si la base est vide, seedez les données:" -ForegroundColor White
Write-Host "      docker cp data/books.json elibrary-catalog:/app/data/" -ForegroundColor Gray
Write-Host "      docker-compose exec catalog-service dotnet CatalogService.dll seed" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Astuce: Utilisez 'docker-compose logs -f <service>' pour voir les logs" -ForegroundColor Yellow
Write-Host ""

