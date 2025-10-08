#!/bin/bash

# 🍓 Script de déploiement automatique pour Raspberry Pi
# Usage: ./deploy.sh [build|start|stop|restart|status|logs]

set -e

COMPOSE_FILE="docker-compose.raspberry-pi.yml"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$PROJECT_ROOT"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Vérifier les prérequis
check_requirements() {
    echo "🔍 Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        echo_error "Docker n'est pas installé"
        exit 1
    fi
    echo_success "Docker est installé"
    
    if ! command -v docker compose &> /dev/null; then
        echo_error "Docker Compose n'est pas installé"
        exit 1
    fi
    echo_success "Docker Compose est installé"
    
    if [ ! -f ".env" ]; then
        echo_warning ".env n'existe pas, création depuis .env.example..."
        cp .env.example .env
        echo_warning "⚠️  N'oubliez pas de modifier .env avec vos propres valeurs!"
    fi
    echo_success "Fichier .env présent"
}

# Afficher les ressources système
show_system_info() {
    echo ""
    echo "📊 Informations système:"
    echo "  CPU: $(nproc) cores"
    echo "  RAM: $(free -h | awk '/^Mem:/ {print $2}') total, $(free -h | awk '/^Mem:/ {print $7}') disponible"
    echo "  Disque: $(df -h / | awk 'NR==2 {print $4}') libre"
    if command -v vcgencmd &> /dev/null; then
        echo "  Température: $(vcgencmd measure_temp | cut -d= -f2)"
    fi
    echo ""
}

# Build des images
build_images() {
    echo "🔨 Building des images Docker (cela peut prendre 30-60 minutes sur Raspberry Pi)..."
    echo_warning "Conseil: Allez prendre un café ☕"
    
    docker compose -f "$COMPOSE_FILE" build
    
    echo_success "Build terminé!"
}

# Démarrer l'application
start_app() {
    echo "🚀 Démarrage de l'application eLibrary..."
    
    docker compose -f "$COMPOSE_FILE" up -d
    
    echo_success "Application démarrée!"
    echo ""
    echo "📍 Services disponibles:"
    echo "  - React Frontend:     http://$(hostname -I | awk '{print $1}'):3000"
    echo "  - Angular Frontend:   http://$(hostname -I | awk '{print $1}'):4200"
    echo "  - API Gateway:        http://$(hostname -I | awk '{print $1}'):5000"
    echo "  - RabbitMQ:           http://$(hostname -I | awk '{print $1}'):15672"
    echo "  - Grafana:            http://$(hostname -I | awk '{print $1}'):3001"
    echo "  - Prometheus:         http://$(hostname -I | awk '{print $1}'):9090"
    echo ""
}

# Arrêter l'application
stop_app() {
    echo "🛑 Arrêt de l'application..."
    
    docker compose -f "$COMPOSE_FILE" down
    
    echo_success "Application arrêtée!"
}

# Redémarrer l'application
restart_app() {
    echo "🔄 Redémarrage de l'application..."
    
    docker compose -f "$COMPOSE_FILE" restart
    
    echo_success "Application redémarrée!"
}

# Afficher le statut
show_status() {
    echo "📊 Statut des services:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "💾 Utilisation des ressources:"
    docker stats --no-stream
}

# Afficher les logs
show_logs() {
    if [ -z "$2" ]; then
        echo "📜 Logs de tous les services (Ctrl+C pour quitter):"
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        echo "📜 Logs de $2 (Ctrl+C pour quitter):"
        docker compose -f "$COMPOSE_FILE" logs -f "$2"
    fi
}

# Nettoyer les ressources
cleanup() {
    echo "🧹 Nettoyage des ressources inutilisées..."
    echo_warning "⚠️  Cela va supprimer toutes les images et volumes non utilisés!"
    read -p "Continuer? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a --volumes
        echo_success "Nettoyage terminé!"
    else
        echo "Nettoyage annulé"
    fi
}

# Backup des données
backup_data() {
    echo "💾 Sauvegarde des données..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    docker compose -f "$COMPOSE_FILE" exec -T sqlserver /opt/mssql-tools/bin/sqlcmd \
        -S localhost -U sa -P "${DB_PASSWORD}" \
        -Q "BACKUP DATABASE CatalogDb TO DISK='/tmp/catalog.bak'"
    
    docker compose -f "$COMPOSE_FILE" exec -T sqlserver \
        cat /tmp/catalog.bak > "$BACKUP_FILE"
    
    echo_success "Backup sauvegardé: $BACKUP_FILE"
}

# Menu principal
case "$1" in
    build)
        check_requirements
        show_system_info
        build_images
        ;;
    start)
        check_requirements
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    cleanup)
        cleanup
        ;;
    backup)
        backup_data
        ;;
    *)
        echo "🍓 Script de déploiement eLibrary pour Raspberry Pi"
        echo ""
        echo "Usage: $0 {build|start|stop|restart|status|logs|cleanup|backup}"
        echo ""
        echo "Commandes:"
        echo "  build    - Builder toutes les images Docker"
        echo "  start    - Démarrer l'application"
        echo "  stop     - Arrêter l'application"
        echo "  restart  - Redémarrer l'application"
        echo "  status   - Afficher le statut des services"
        echo "  logs     - Afficher les logs (logs [service] pour un service spécifique)"
        echo "  cleanup  - Nettoyer les ressources inutilisées"
        echo "  backup   - Sauvegarder les données"
        echo ""
        echo "Exemples:"
        echo "  $0 build          # Builder les images"
        echo "  $0 start          # Démarrer l'app"
        echo "  $0 logs gateway   # Voir les logs du gateway"
        exit 1
        ;;
esac

