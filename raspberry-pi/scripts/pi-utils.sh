#!/bin/bash

# Utilitaires pour la gestion de eLibrary sur Raspberry Pi
# Usage: ./raspberry-pi/scripts/pi-utils.sh <command>

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
failure() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
section() { 
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Remonter à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

COMPOSE_FILE="docker-compose.pi.yml"

# Banner
banner() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   🍓 eLibrary Pi Utils                  ║${NC}"
    echo -e "${BLUE}║   Outils de gestion Raspberry Pi        ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
    echo ""
}

# Fonction : Afficher l'utilisation des ressources
resources() {
    section "💾 Utilisation des ressources système"
    
    # CPU et RAM globale
    echo -e "${CYAN}Système:${NC}"
    free -h | head -2
    echo ""
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  CPU utilisé: " 100 - $1 "%"}'
    echo ""
    
    # Température du Pi
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp=$(cat /sys/class/thermal/thermal_zone0/temp)
        temp_c=$((temp/1000))
        
        if [ $temp_c -gt 70 ]; then
            echo -e "${RED}  🌡️  Température: ${temp_c}°C (ÉLEVÉE!)${NC}"
        elif [ $temp_c -gt 60 ]; then
            echo -e "${YELLOW}  🌡️  Température: ${temp_c}°C (Attention)${NC}"
        else
            echo -e "${GREEN}  🌡️  Température: ${temp_c}°C (Normal)${NC}"
        fi
        echo ""
    fi
    
    # Espace disque
    echo -e "${CYAN}Espace disque:${NC}"
    df -h / | tail -1 | awk '{print "  Utilisé: " $3 " / " $2 " (" $5 ")"}'
    echo ""
    
    # Ressources Docker
    section "🐳 Ressources Docker"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "NAME|elibrary"
}

# Fonction : Nettoyer Docker
cleanup() {
    section "🧹 Nettoyage Docker"
    
    warning "Cette opération va supprimer:"
    echo "  • Les conteneurs arrêtés"
    echo "  • Les réseaux non utilisés"
    echo "  • Les images pendantes"
    echo "  • Le cache de build"
    echo ""
    
    read -p "Continuer? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Nettoyage en cours..."
        
        # Supprimer les conteneurs arrêtés
        stopped=$(docker ps -aq -f status=exited 2>/dev/null | wc -l)
        if [ "$stopped" -gt 0 ]; then
            docker rm $(docker ps -aq -f status=exited) 2>/dev/null || true
            success "Supprimé $stopped conteneur(s) arrêté(s)"
        fi
        
        # Nettoyer les images pendantes
        docker image prune -f
        
        # Nettoyer les réseaux
        docker network prune -f
        
        # Nettoyer le cache de build
        docker builder prune -f
        
        success "Nettoyage terminé!"
        
        # Afficher l'espace libéré
        echo ""
        df -h / | tail -1 | awk '{print "Espace disque: " $3 " / " $2 " (" $5 " utilisé)"}'
    else
        info "Annulé"
    fi
}

# Fonction : Sauvegarder la base de données
backup_db() {
    section "💾 Sauvegarde de la base de données"
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="$PROJECT_ROOT/backups"
    mkdir -p "$backup_dir"
    
    info "Création des sauvegardes..."
    
    # Sauvegarder toutes les bases
    databases=("CatalogDb" "AuthDb" "RecommenderDb")
    
    for db in "${databases[@]}"; do
        backup_file="$backup_dir/${db}_${timestamp}.sql"
        
        if docker exec elibrary-postgres pg_dump -U elibrary "$db" > "$backup_file" 2>/dev/null; then
            size=$(du -h "$backup_file" | cut -f1)
            success "$db sauvegardé ($size) : $backup_file"
        else
            warning "$db : échec de la sauvegarde"
        fi
    done
    
    # Compresser les sauvegardes
    info "Compression des sauvegardes..."
    tar -czf "$backup_dir/backup_${timestamp}.tar.gz" "$backup_dir"/*_${timestamp}.sql 2>/dev/null || true
    rm -f "$backup_dir"/*_${timestamp}.sql
    
    success "Sauvegarde compressée : backup_${timestamp}.tar.gz"
    
    # Afficher les anciennes sauvegardes
    echo ""
    info "Sauvegardes existantes:"
    ls -lh "$backup_dir"/*.tar.gz 2>/dev/null | tail -5 || echo "  Aucune sauvegarde"
}

# Fonction : Restaurer la base de données
restore_db() {
    section "📥 Restauration de la base de données"
    
    backup_dir="$PROJECT_ROOT/backups"
    
    if [ ! -d "$backup_dir" ] || [ -z "$(ls -A $backup_dir/*.tar.gz 2>/dev/null)" ]; then
        warning "Aucune sauvegarde trouvée dans $backup_dir"
        exit 1
    fi
    
    # Lister les sauvegardes
    echo "Sauvegardes disponibles:"
    echo ""
    ls -lh "$backup_dir"/*.tar.gz | nl
    echo ""
    
    read -p "Numéro de la sauvegarde à restaurer (ou 'q' pour annuler): " choice
    
    if [ "$choice" = "q" ]; then
        info "Annulé"
        exit 0
    fi
    
    backup_file=$(ls "$backup_dir"/*.tar.gz | sed -n "${choice}p")
    
    if [ -z "$backup_file" ]; then
        failure "Choix invalide"
        exit 1
    fi
    
    warning "ATTENTION: Cette opération va ÉCRASER les données actuelles!"
    read -p "Continuer? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Annulé"
        exit 0
    fi
    
    # Décompresser
    temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restaurer chaque base
    for sql_file in "$temp_dir"/*.sql; do
        if [ -f "$sql_file" ]; then
            db_name=$(basename "$sql_file" | cut -d'_' -f1)
            info "Restoration de $db_name..."
            
            # Supprimer et recréer la base
            docker exec elibrary-postgres psql -U elibrary -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true
            docker exec elibrary-postgres psql -U elibrary -c "CREATE DATABASE $db_name;" 2>/dev/null || true
            
            # Restaurer
            docker exec -i elibrary-postgres psql -U elibrary "$db_name" < "$sql_file"
            success "$db_name restauré"
        fi
    done
    
    rm -rf "$temp_dir"
    success "Restauration terminée!"
}

# Fonction : Afficher les logs en temps réel
logs_live() {
    section "📜 Logs en temps réel"
    
    if [ -z "$1" ]; then
        info "Logs de tous les services (Ctrl+C pour quitter)"
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        info "Logs de $1 (Ctrl+C pour quitter)"
        docker compose -f "$COMPOSE_FILE" logs -f "$1"
    fi
}

# Fonction : Tester la connectivité réseau
network_test() {
    section "🌐 Test de connectivité réseau"
    
    # IP locale
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    info "IP locale: $LOCAL_IP"
    echo ""
    
    # Tester les ports ouverts
    echo -e "${CYAN}Ports ouverts:${NC}"
    
    ports=(3000 4200 8080 5432 6379 5672 15672 9090 3001)
    for port in "${ports[@]}"; do
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "  ${GREEN}✅ Port $port : OUVERT${NC}"
        else
            echo -e "  ${RED}❌ Port $port : FERMÉ${NC}"
        fi
    done
    
    echo ""
    
    # Tester la résolution DNS interne Docker
    echo -e "${CYAN}Résolution DNS Docker:${NC}"
    
    services=("gateway" "catalog-service" "auth-service" "postgres" "redis" "rabbitmq")
    for service in "${services[@]}"; do
        if docker exec elibrary-gateway getent hosts "$service" >/dev/null 2>&1; then
            ip=$(docker exec elibrary-gateway getent hosts "$service" | awk '{print $1}')
            echo -e "  ${GREEN}✅ $service : $ip${NC}"
        else
            echo -e "  ${RED}❌ $service : Non résolu${NC}"
        fi
    done
}

# Fonction : Mise à jour manuelle
update_manual() {
    section "⬇️  Mise à jour manuelle"
    
    info "Mise à jour du code source..."
    git pull origin main
    
    info "Téléchargement des nouvelles images..."
    docker compose -f "$COMPOSE_FILE" pull
    
    info "Redémarrage des services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    success "Mise à jour terminée!"
}

# Fonction : Statistiques système
stats() {
    section "📊 Statistiques système"
    
    # Uptime
    echo -e "${CYAN}Uptime:${NC}"
    uptime
    echo ""
    
    # Ressources globales
    resources
    
    # Nombre de conteneurs
    echo ""
    section "🐳 Conteneurs Docker"
    running=$(docker ps | grep elibrary | wc -l)
    total=$(docker ps -a | grep elibrary | wc -l)
    echo -e "  Conteneurs actifs: ${GREEN}$running${NC} / $total"
    echo ""
    
    # Volumes
    echo -e "${CYAN}Volumes Docker:${NC}"
    docker volume ls | grep elibrary
}

# Menu principal
show_menu() {
    banner
    
    echo "Commandes disponibles:"
    echo ""
    echo "  ${CYAN}resources${NC}     - Afficher l'utilisation des ressources"
    echo "  ${CYAN}cleanup${NC}       - Nettoyer Docker (images, conteneurs, cache)"
    echo "  ${CYAN}backup${NC}        - Sauvegarder les bases de données"
    echo "  ${CYAN}restore${NC}       - Restaurer une sauvegarde"
    echo "  ${CYAN}logs${NC} [svc]    - Afficher les logs (en temps réel)"
    echo "  ${CYAN}network${NC}       - Tester la connectivité réseau"
    echo "  ${CYAN}update${NC}        - Mettre à jour manuellement"
    echo "  ${CYAN}stats${NC}         - Statistiques système complètes"
    echo ""
    echo "Exemples:"
    echo "  $0 resources"
    echo "  $0 logs gateway"
    echo "  $0 backup"
    echo ""
}

# Main
case "${1:-}" in
    resources)
        banner
        resources
        ;;
    cleanup)
        banner
        cleanup
        ;;
    backup)
        banner
        backup_db
        ;;
    restore)
        banner
        restore_db
        ;;
    logs)
        banner
        logs_live "$2"
        ;;
    network)
        banner
        network_test
        ;;
    update)
        banner
        update_manual
        ;;
    stats)
        banner
        stats
        ;;
    *)
        show_menu
        exit 1
        ;;
esac

