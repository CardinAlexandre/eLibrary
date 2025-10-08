#!/bin/bash

# Script de validation de la configuration de production
# Vérifie que tous les services sont correctement configurés

set -e

COMPOSE_FILE="${1:-docker-compose.pi.yml}"
ERROR_COUNT=0
WARNING_COUNT=0

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
failure() { echo -e "${RED}❌ $1${NC}"; ((ERROR_COUNT++)); }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARNING_COUNT++)); }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
section() { 
    echo -e "\n${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔍 Validation de la configuration      ║${NC}"
echo -e "${BLUE}║     Production eLibrary                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Remonter à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Vérifier que le fichier docker-compose existe
section "1️⃣  Vérification des fichiers"

if [ -f "$COMPOSE_FILE" ]; then
    success "Fichier $COMPOSE_FILE trouvé"
else
    failure "Fichier $COMPOSE_FILE introuvable"
    exit 1
fi

# Vérifier appsettings.Production.json
if [ -f "services/gateway/appsettings.Production.json" ]; then
    success "Fichier appsettings.Production.json trouvé"
else
    failure "Fichier services/gateway/appsettings.Production.json introuvable"
fi

# 2. Vérifier la configuration YARP dans appsettings.Production.json
section "2️⃣  Vérification de la configuration YARP"

if [ -f "services/gateway/appsettings.Production.json" ]; then
    # Vérifier les clusters
    for cluster in catalog auth importer recommender; do
        if grep -q "\"$cluster\"" "services/gateway/appsettings.Production.json"; then
            # Extraire l'adresse
            address=$(grep -A 5 "\"$cluster\"" "services/gateway/appsettings.Production.json" | grep "Address" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
            if [[ "$address" =~ (catalog-service|auth-service|importer-service|recommender-service) ]]; then
                success "Cluster '$cluster' : $address"
            else
                failure "Cluster '$cluster' : utilise un nom incorrect : $address"
            fi
        else
            failure "Cluster '$cluster' : non trouvé dans la configuration"
        fi
    done
fi

# 3. Vérifier les URLs React
section "3️⃣  Vérification des URLs React"

react_files=(
    "frontend/react/src/store/slices/booksSlice.ts"
    "frontend/react/src/store/slices/loansSlice.ts"
    "frontend/react/src/store/slices/authSlice.ts"
)

for file in "${react_files[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "const API_URL = process.env.REACT_APP_API_URL || '';" "$file"; then
            success "$(basename $file) : API_URL correctement configuré (chaîne vide par défaut)"
        elif grep -q "const API_URL = process.env.REACT_APP_API_URL || '/api';" "$file"; then
            failure "$(basename $file) : API_URL utilise '/api' par défaut (causera duplication)"
        else
            warning "$(basename $file) : Pattern API_URL non trouvé ou format inattendu"
        fi
    else
        warning "$(basename $file) : fichier non trouvé"
    fi
done

# 4. Vérifier la configuration Nginx des frontends
section "4️⃣  Vérification de la configuration Nginx"

if [ -f "frontend/react/nginx.conf" ]; then
    if grep -q "proxy_pass.*http://gateway:80" "frontend/react/nginx.conf"; then
        success "React nginx.conf : proxy vers gateway:80 ✓"
    else
        failure "React nginx.conf : proxy_pass incorrect ou manquant"
    fi
else
    failure "React nginx.conf : fichier non trouvé"
fi

if [ -f "frontend/angular/nginx.conf" ]; then
    if grep -q "proxy_pass.*http://gateway:80" "frontend/angular/nginx.conf"; then
        success "Angular nginx.conf : proxy vers gateway:80 ✓"
    else
        failure "Angular nginx.conf : proxy_pass incorrect ou manquant"
    fi
else
    failure "Angular nginx.conf : fichier non trouvé"
fi

# 5. Vérifier la configuration Docker Compose
section "5️⃣  Vérification du Docker Compose"

# Vérifier que le gateway a les variables JWT
if grep -q "JwtSettings__Secret=" "$COMPOSE_FILE"; then
    success "Gateway : Variables JWT configurées"
else
    failure "Gateway : Variables JWT manquantes"
fi

# Vérifier les noms de services
required_services=("gateway" "catalog-service" "auth-service" "postgres" "redis" "rabbitmq")
for service in "${required_services[@]}"; do
    if grep -q "^[[:space:]]*$service:" "$COMPOSE_FILE"; then
        success "Service '$service' trouvé dans docker-compose"
    else
        failure "Service '$service' manquant dans docker-compose"
    fi
done

# 6. Vérifier si Docker est en cours d'exécution
section "6️⃣  Vérification de l'environnement Docker"

if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    success "Docker installé : $docker_version"
else
    failure "Docker non disponible"
fi

# Vérifier si docker compose est disponible
if docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    success "Docker Compose installé : $compose_version"
else
    failure "Docker Compose non disponible"
fi

# 7. Vérifier les services en cours d'exécution (si lancés)
section "7️⃣  Vérification des services en cours (optionnel)"

if command -v docker &> /dev/null; then
    running_containers=$(docker ps --filter "name=elibrary" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "$running_containers" ]; then
        info "Services en cours d'exécution :"
        echo "$running_containers" | while read -r container; do
            echo -e "   ${CYAN}• $container${NC}"
        done
    else
        info "Aucun service eLibrary en cours d'exécution (normal si pas encore démarré)"
    fi
fi

# 8. Tests de connectivité (si services lancés)
section "8️⃣  Tests de connectivité (si services démarrés)"

endpoints=(
    "http://localhost:8080/health|Gateway Health"
    "http://localhost:3000|Frontend React"
    "http://localhost:4200|Frontend Angular"
)

for endpoint in "${endpoints[@]}"; do
    IFS='|' read -r url name <<< "$endpoint"
    if curl -s -f -m 3 "$url" > /dev/null 2>&1; then
        success "$name : Accessible"
    else
        info "$name : Non accessible (normal si services non démarrés)"
    fi
done

# Vérifier le fichier .env
section "9️⃣  Vérification du fichier .env (production uniquement)"

if [ -f ".env" ]; then
    success "Fichier .env trouvé"
    
    # Vérifier les variables critiques
    critical_vars=("DB_PASSWORD" "JWT_SECRET" "GRAFANA_PASSWORD")
    for var in "${critical_vars[@]}"; do
        if grep -q "^${var}=" ".env" && ! grep -q "^${var}=$" ".env"; then
            success "Variable $var définie"
        else
            warning "Variable $var manquante ou vide dans .env"
        fi
    done
else
    warning "Fichier .env non trouvé (nécessaire pour la production)"
fi

# Résumé
section "📊 Résumé"

if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Tous les tests ont réussi !         ║${NC}"
    echo -e "${GREEN}║     Configuration prête pour production ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    exit 0
elif [ $ERROR_COUNT -eq 0 ]; then
    echo -e "Erreurs critiques : ${GREEN}$ERROR_COUNT${NC}"
    echo -e "Avertissements    : ${YELLOW}$WARNING_COUNT${NC}"
    echo ""
    echo -e "${YELLOW}╔══════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  Tests réussis avec avertissements  ║${NC}"
    echo -e "${YELLOW}║     Vérifiez les points ci-dessus       ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "Erreurs critiques : ${RED}$ERROR_COUNT${NC}"
    echo -e "Avertissements    : ${YELLOW}$WARNING_COUNT${NC}"
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Des erreurs ont été détectées        ║${NC}"
    echo -e "${RED}║     Corrigez-les avant de déployer      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
    exit 1
fi

