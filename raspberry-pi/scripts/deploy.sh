#!/bin/bash

# 🍓 Script de déploiement PRODUCTION pour Raspberry Pi avec PostgreSQL
# Utilise les images pré-buildées depuis GitHub Container Registry
# Auto-update via Watchtower
# Optimisé pour faible consommation de ressources

set -e

COMPOSE_FILE="docker-compose.pi.yml"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$PROJECT_ROOT"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; }
echo_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Banner
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🍓 eLibrary Production Deployment      ║${NC}"
echo -e "${GREEN}║   With GitHub Container Registry         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Vérifier les prérequis
if [ ! -f ".env" ]; then
    echo_error "Fichier .env manquant!"
    echo_info "Créez le fichier .env avec vos configurations"
    echo_info "Voir raspberry-pi/env.example pour un template"
    exit 1
fi

# Charger les variables d'environnement
source .env

# Vérifier les variables obligatoires
REQUIRED_VARS=("GITHUB_REPOSITORY_OWNER" "DB_PASSWORD" "GRAFANA_PASSWORD" "JWT_SECRET")
MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING+=("$var")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo_error "Variables d'environnement manquantes dans .env:"
    printf '   - %s\n' "${MISSING[@]}"
    exit 1
fi

echo_success "Variables d'environnement chargées"

# Configurer l'authentification GitHub Container Registry
echo_info "Configuration de l'accès au Container Registry..."

if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_REPOSITORY_OWNER" --password-stdin
    echo_success "Authentifié avec GitHub Container Registry"
else
    echo_warning "GITHUB_TOKEN non défini - seules les images publiques seront accessibles"
    echo_info "Pour accéder aux images privées, ajoutez GITHUB_TOKEN à .env"
fi

# Fonction principale
case "$1" in
    start)
        echo "🚀 Démarrage de l'application (mode production)..."
        echo_info "Les images seront téléchargées depuis GitHub Container Registry"
        echo_warning "Premier démarrage: peut prendre 5-10 minutes"
        
        docker compose -f "$COMPOSE_FILE" pull
        docker compose -f "$COMPOSE_FILE" up -d
        
        echo_success "Application démarrée!"
        echo ""
        echo "📍 Services disponibles:"
        echo "   - React Frontend:     http://$(hostname -I | awk '{print $1}'):3000"
        echo "   - Angular Frontend:   http://$(hostname -I | awk '{print $1}'):4200"
        echo "   - API Gateway:        http://$(hostname -I | awk '{print $1}'):8080"
        echo "   - RabbitMQ:           http://$(hostname -I | awk '{print $1}'):15672"
        echo "   - Grafana:            http://$(hostname -I | awk '{print $1}'):3001"
        echo "   - Prometheus:         http://$(hostname -I | awk '{print $1}'):9090"
        echo ""
        echo_info "🔄 Watchtower vérifiera les mises à jour toutes les 5 minutes"
        ;;
    
    stop)
        echo "🛑 Arrêt de l'application..."
        docker compose -f "$COMPOSE_FILE" down
        echo_success "Application arrêtée!"
        ;;
    
    restart)
        echo "🔄 Redémarrage de l'application..."
        docker compose -f "$COMPOSE_FILE" restart
        echo_success "Application redémarrée!"
        ;;
    
    update)
        echo "⬇️  Vérification des mises à jour..."
        docker compose -f "$COMPOSE_FILE" pull
        echo_success "Images mises à jour!"
        
        echo "🔄 Redémarrage avec les nouvelles images..."
        docker compose -f "$COMPOSE_FILE" up -d
        echo_success "Mise à jour terminée!"
        ;;
    
    status)
        echo "📊 Statut des services:"
        docker compose -f "$COMPOSE_FILE" ps
        echo ""
        echo "💾 Utilisation des ressources:"
        docker stats --no-stream
        ;;
    
    logs)
        if [ -z "$2" ]; then
            echo "📜 Logs de tous les services (Ctrl+C pour quitter):"
            docker compose -f "$COMPOSE_FILE" logs -f
        else
            echo "📜 Logs de $2 (Ctrl+C pour quitter):"
            docker compose -f "$COMPOSE_FILE" logs -f "$2"
        fi
        ;;
    
    version)
        echo "🏷️  Versions des images déployées:"
        docker compose -f "$COMPOSE_FILE" images
        ;;
    
    cleanup)
        echo "🧹 Nettoyage des ressources inutilisées..."
        docker system prune -f
        echo_success "Nettoyage terminé!"
        ;;
    
    *)
        echo "🍓🐘 Script de déploiement Production eLibrary avec PostgreSQL"
        echo ""
        echo "Usage: $0 {start|stop|restart|update|status|logs|version|cleanup}"
        echo ""
        echo "Commandes:"
        echo "  start    - Démarrer l'application (pull images depuis GitHub)"
        echo "  stop     - Arrêter l'application"
        echo "  restart  - Redémarrer l'application"
        echo "  update   - Mettre à jour vers les dernières images"
        echo "  status   - Afficher le statut des services"
        echo "  logs     - Afficher les logs (logs [service] pour un service spécifique)"
        echo "  version  - Afficher les versions des images"
        echo "  cleanup  - Nettoyer les ressources inutilisées"
        echo ""
        echo "Avantages PostgreSQL sur Raspberry Pi:"
        echo "  ❄️ Consommation minimale (100-300MB RAM vs 2-4GB)"
        echo "  ⚡ Démarrage ultra-rapide (2-5 secondes)"
        echo "  🔥 Température basse (40-50°C vs 70-80°C)"
        echo "  🔄 Auto-update via Watchtower toutes les 5 minutes"
        echo "  📦 Images légères (80MB vs 1.5GB)"
        echo "  🎯 Production-ready et optimisé pour ARM64"
        exit 1
        ;;
esac

