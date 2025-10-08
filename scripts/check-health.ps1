# Script pour vérifier la santé de tous les services
# Usage: .\scripts\check-health.ps1

Write-Host "🏥 Vérification de la santé des services eLibrary..." -ForegroundColor Cyan
Write-Host ""

# Naviguer vers le dossier racine
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

$services = @(
    @{Name="Gateway"; Port=5000; Health="/health"},
    @{Name="Catalog"; Port=5001; Health="/health"},
    @{Name="Auth"; Port=5002; Health="/health"},
    @{Name="Importer"; Port=5003; Health="/health"},
    @{Name="Recommender"; Port=5004; Health="/health"},
    @{Name="Analytics"; Port=5005; Health="/health"}
)

$allHealthy = $true

foreach ($service in $services) {
    Write-Host "🔍 $($service.Name) (port $($service.Port))... " -NoNewline -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Health)" -TimeoutSec 5 -UseBasicParsing 2>$null
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            if ($content -eq "Healthy") {
                Write-Host "✅ HEALTHY" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $content" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ INACCESSIBLE" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Vérifier l'état Docker
Write-Host ""
Write-Host "🐳 État des conteneurs Docker:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
if ($allHealthy) {
    Write-Host "✅ Tous les services sont opérationnels!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certains services ont des problèmes. Voir les logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f <service-name>" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🌐 URLs d'accès:" -ForegroundColor Cyan
Write-Host "   • API Gateway:     http://localhost:5000" -ForegroundColor White
Write-Host "   • Swagger Catalog: http://localhost:5001/swagger" -ForegroundColor White
Write-Host "   • Grafana:         http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "   • Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "   • RabbitMQ:        http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host ""

