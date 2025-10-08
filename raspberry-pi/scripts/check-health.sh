#!/bin/bash

# Script pour vérifier la santé de tous les services en production
# Usage: ./raspberry-pi/scripts/check-health.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

# Banner
echo ""
echo -e "${CYAN}🏥 Vérification de la santé des services eLibrary...${NC}"
echo ""

# Remonter à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Services à vérifier (production)
declare -A services=(
    ["Gateway"]="8080:/health"
    ["Frontend React"]="3000:"
    ["Frontend Angular"]="4200:"
    ["RabbitMQ"]="15672:"
    ["Prometheus"]="9090:"
    ["Grafana"]="3001:"
)

all_healthy=true

# Obtenir l'IP locale
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP="localhost"
fi

# Vérifier chaque service
for service in "${!services[@]}"; do
    IFS=':' read -r port path <<< "${services[$service]}"
    
    echo -ne "${YELLOW}🔍 $service (port $port)... ${NC}"
    
    # Tester la connexion
    if timeout 5 curl -s -f "http://localhost:${port}${path}" > /dev/null 2>&1; then
        # Vérifier le contenu pour les endpoints health
        if [ -n "$path" ] && [ "$path" = "/health" ]; then
            response=$(timeout 5 curl -s "http://localhost:${port}${path}" 2>/dev/null || echo "")
            if [ "$response" = "Healthy" ]; then
                echo -e "${GREEN}✅ HEALTHY${NC}"
            else
                echo -e "${YELLOW}⚠️  $response${NC}"
            fi
        else
            echo -e "${GREEN}✅ ACCESSIBLE${NC}"
        fi
    else
        echo -e "${RED}❌ INACCESSIBLE${NC}"
        all_healthy=false
    fi
done

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Vérifier l'état des conteneurs Docker
echo ""
echo -e "${CYAN}🐳 État des conteneurs Docker:${NC}"
docker compose -f docker-compose.pi.yml ps

# Vérifier les health checks Docker
echo ""
echo -e "${CYAN}🔍 Health checks Docker:${NC}"

containers=$(docker ps --filter "name=elibrary" --format "{{.Names}}")

if [ -n "$containers" ]; then
    while IFS= read -r container; do
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
        
        case $health in
            healthy)
                echo -e "   ${GREEN}✅ $container : Healthy${NC}"
                ;;
            unhealthy)
                echo -e "   ${RED}❌ $container : Unhealthy${NC}"
                all_healthy=false
                ;;
            starting)
                echo -e "   ${YELLOW}⏳ $container : Starting...${NC}"
                ;;
            no-healthcheck)
                status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
                if [ "$status" = "running" ]; then
                    echo -e "   ${GRAY}ℹ️  $container : Running (no healthcheck)${NC}"
                else
                    echo -e "   ${RED}❌ $container : $status${NC}"
                    all_healthy=false
                fi
                ;;
            *)
                echo -e "   ${YELLOW}⚠️  $container : $health${NC}"
                ;;
        esac
    done <<< "$containers"
fi

# Statistiques Docker
echo ""
echo -e "${CYAN}💾 Utilisation des ressources:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep elibrary || echo "Aucun conteneur eLibrary en cours"

# Résumé
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}✅ Tous les services sont opérationnels!${NC}"
else
    echo -e "${YELLOW}⚠️  Certains services ont des problèmes. Voir les logs:${NC}"
    echo -e "${GRAY}   cd raspberry-pi && ./scripts/deploy.sh logs <service-name>${NC}"
fi

# URLs d'accès
echo ""
echo -e "${CYAN}🌐 URLs d'accès (depuis votre réseau local):${NC}"
echo -e "   ${NC}• Frontend React:  http://${LOCAL_IP}:3000${NC}"
echo -e "   ${NC}• Frontend Angular: http://${LOCAL_IP}:4200${NC}"
echo -e "   ${NC}• API Gateway:     http://${LOCAL_IP}:8080${NC}"
echo -e "   ${NC}• RabbitMQ:        http://${LOCAL_IP}:15672 (guest/guest)${NC}"
echo -e "   ${NC}• Grafana:         http://${LOCAL_IP}:3001 (admin/...)${NC}"
echo -e "   ${NC}• Prometheus:      http://${LOCAL_IP}:9090${NC}"
echo ""

# Tests API rapides
echo -e "${CYAN}🧪 Tests API rapides:${NC}"

# Test Gateway Health
if timeout 3 curl -s -f "http://localhost:8080/health" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Gateway health check${NC}"
else
    echo -e "   ${RED}❌ Gateway health check${NC}"
fi

# Test API Catalog
if timeout 3 curl -s -f "http://localhost:8080/api/catalog/books?page=1&pageSize=5" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Catalog API accessible${NC}"
else
    echo -e "   ${YELLOW}⚠️  Catalog API non accessible ou vide${NC}"
fi

echo ""
echo -e "${CYAN}💡 Commandes utiles:${NC}"
echo -e "   ${GRAY}• Voir les logs:        ./raspberry-pi/scripts/deploy.sh logs [service]${NC}"
echo -e "   ${GRAY}• Redémarrer un service: docker compose -f docker-compose.pi.yml restart <service>${NC}"
echo -e "   ${GRAY}• Voir les métriques:   http://${LOCAL_IP}:3001 (Grafana)${NC}"
echo ""

# Code de sortie
if [ "$all_healthy" = true ]; then
    exit 0
else
    exit 1
fi

