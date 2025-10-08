#!/usr/bin/env pwsh
# Script de validation de la configuration de production
# Vérifie que tous les services sont correctement configurés

param(
    [string]$ComposeFile = "docker-compose.pi.yml"
)

$ErrorCount = 0
$WarningCount = 0

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:ErrorCount++
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:WarningCount++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "  $Title" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Magenta
}

# Banner
Write-Host "`n"
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║  🔍 Validation de la configuration      ║" -ForegroundColor Blue
Write-Host "║     Production eLibrary                  ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host "`n"

# 1. Vérifier que le fichier docker-compose existe
Write-Section "1️⃣  Vérification des fichiers"

if (Test-Path $ComposeFile) {
    Write-Success "Fichier $ComposeFile trouvé"
} else {
    Write-Failure "Fichier $ComposeFile introuvable"
    exit 1
}

# Vérifier appsettings.Production.json
if (Test-Path "services/gateway/appsettings.Production.json") {
    Write-Success "Fichier appsettings.Production.json trouvé"
} else {
    Write-Failure "Fichier services/gateway/appsettings.Production.json introuvable"
}

# 2. Vérifier la configuration YARP dans appsettings.Production.json
Write-Section "2️⃣  Vérification de la configuration YARP"

if (Test-Path "services/gateway/appsettings.Production.json") {
    $appsettings = Get-Content "services/gateway/appsettings.Production.json" | ConvertFrom-Json
    
    # Vérifier les clusters
    $clusters = @("catalog", "auth", "importer", "recommender")
    foreach ($cluster in $clusters) {
        $destination = $appsettings.ReverseProxy.Clusters.$cluster.Destinations.destination1.Address
        if ($destination) {
            # Vérifier que l'adresse utilise le nom du service, pas du conteneur
            if ($destination -match "catalog-service|auth-service|importer-service|recommender-service") {
                Write-Success "Cluster '$cluster' : $destination"
            } else {
                Write-Failure "Cluster '$cluster' : utilise un nom incorrect : $destination"
            }
        } else {
            Write-Failure "Cluster '$cluster' : destination non définie"
        }
    }
}

# 3. Vérifier les URLs React
Write-Section "3️⃣  Vérification des URLs React"

$reactFiles = @(
    "frontend/react/src/store/slices/booksSlice.ts",
    "frontend/react/src/store/slices/loansSlice.ts",
    "frontend/react/src/store/slices/authSlice.ts"
)

foreach ($file in $reactFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "const API_URL = process\.env\.REACT_APP_API_URL \|\| '';") {
            Write-Success "$file : API_URL correctement configuré (chaîne vide par défaut)"
        } elseif ($content -match "const API_URL = process\.env\.REACT_APP_API_URL \|\| '/api';") {
            Write-Failure "$file : API_URL utilise '/api' par défaut (causera duplication)"
        } else {
            Write-WarningMessage "$file : Pattern API_URL non trouvé ou format inattendu"
        }
    } else {
        Write-WarningMessage "$file : fichier non trouvé"
    }
}

# 4. Vérifier la configuration Nginx des frontends
Write-Section "4️⃣  Vérification de la configuration Nginx"

$nginxFiles = @(
    @{Path="frontend/react/nginx.conf"; Name="React"},
    @{Path="frontend/angular/nginx.conf"; Name="Angular"}
)

foreach ($item in $nginxFiles) {
    if (Test-Path $item.Path) {
        $content = Get-Content $item.Path -Raw
        if ($content -match "proxy_pass\s+http://gateway:80") {
            Write-Success "$($item.Name) nginx.conf : proxy vers gateway:80 ✓"
        } else {
            Write-Failure "$($item.Name) nginx.conf : proxy_pass incorrect ou manquant"
        }
    } else {
        Write-Failure "$($item.Name) nginx.conf : fichier non trouvé"
    }
}

# 5. Vérifier la configuration Docker Compose
Write-Section "5️⃣  Vérification du Docker Compose"

$composeContent = Get-Content $ComposeFile -Raw

# Vérifier que le gateway a les variables JWT
if ($composeContent -match "JwtSettings__Secret=") {
    Write-Success "Gateway : Variables JWT configurées"
} else {
    Write-Failure "Gateway : Variables JWT manquantes"
}

# Vérifier les noms de services
$requiredServices = @("gateway", "catalog-service", "auth-service", "postgres", "redis", "rabbitmq")
foreach ($service in $requiredServices) {
    if ($composeContent -match "(?m)^\s+$service\s*:") {
        Write-Success "Service '$service' trouvé dans docker-compose"
    } else {
        Write-Failure "Service '$service' manquant dans docker-compose"
    }
}

# 6. Vérifier si Docker est en cours d'exécution
Write-Section "6️⃣  Vérification de l'environnement Docker"

try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker installé : $dockerVersion"
    } else {
        Write-Failure "Docker non disponible"
    }
} catch {
    Write-Failure "Docker non disponible"
}

# Vérifier si docker compose est disponible
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker Compose installé : $composeVersion"
    } else {
        Write-Failure "Docker Compose non disponible"
    }
} catch {
    Write-Failure "Docker Compose non disponible"
}

# 7. Vérifier les services en cours d'exécution (si lancés)
Write-Section "7️⃣  Vérification des services en cours (optionnel)"

try {
    $runningContainers = docker ps --filter "name=elibrary" --format "{{.Names}}" 2>&1
    if ($LASTEXITCODE -eq 0 -and $runningContainers) {
        Write-Info "Services en cours d'exécution :"
        $runningContainers | ForEach-Object {
            Write-Host "   • $_" -ForegroundColor Cyan
        }
    } else {
        Write-Info "Aucun service eLibrary en cours d'exécution (normal si pas encore démarré)"
    }
} catch {
    Write-Info "Impossible de vérifier les conteneurs en cours"
}

# 8. Tests de connectivité (si services lancés)
Write-Section "8️⃣  Tests de connectivité (si services démarrés)"

$endpoints = @(
    @{Url="http://localhost:8080/health"; Name="Gateway Health"},
    @{Url="http://localhost:3000"; Name="Frontend React"},
    @{Url="http://localhost:4200"; Name="Frontend Angular"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "$($endpoint.Name) : Accessible"
        } else {
            Write-WarningMessage "$($endpoint.Name) : Code $($response.StatusCode)"
        }
    } catch {
        Write-Info "$($endpoint.Name) : Non accessible (normal si services non démarrés)"
    }
}

# Résumé
Write-Section "📊 Résumé"

$totalTests = $ErrorCount + $WarningCount
$successTests = $totalTests - $ErrorCount - $WarningCount

Write-Host "Erreurs critiques : $ErrorCount" -ForegroundColor $(if ($ErrorCount -eq 0) { "Green" } else { "Red" })
Write-Host "Avertissements    : $WarningCount" -ForegroundColor $(if ($WarningCount -eq 0) { "Green" } else { "Yellow" })

Write-Host "`n"

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ Tous les tests ont réussi !         ║" -ForegroundColor Green
    Write-Host "║     Configuration prête pour production ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  ⚠️  Tests réussis avec avertissements  ║" -ForegroundColor Yellow
    Write-Host "║     Vérifiez les points ci-dessus       ║" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ Des erreurs ont été détectées        ║" -ForegroundColor Red
    Write-Host "║     Corrigez-les avant de déployer      ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}

