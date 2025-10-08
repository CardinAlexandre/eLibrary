#!/bin/bash

# Script d'initialisation pour Raspberry Pi
# Rend tous les scripts exécutables et vérifie la configuration

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
failure() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🍓 Configuration initiale             ║${NC}"
echo -e "${BLUE}║   eLibrary pour Raspberry Pi            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Remonter à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

info "Dossier du projet: $PROJECT_ROOT"
echo ""

# Étape 1: Rendre les scripts exécutables
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  1️⃣  Permissions des scripts${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

scripts=(
    "raspberry-pi/scripts/deploy.sh"
    "raspberry-pi/scripts/check-health.sh"
    "raspberry-pi/scripts/validate-config.sh"
    "raspberry-pi/scripts/pi-utils.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        success "$(basename $script) est maintenant exécutable"
    else
        warning "$(basename $script) non trouvé"
    fi
done

echo ""

# Étape 2: Vérifier Docker
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  2️⃣  Vérification de Docker${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    success "Docker installé : $docker_version"
else
    failure "Docker n'est pas installé"
    echo ""
    info "Installation de Docker :"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
fi

if docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    success "Docker Compose installé : $compose_version"
else
    failure "Docker Compose n'est pas installé"
fi

echo ""

# Étape 3: Vérifier le fichier .env
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  3️⃣  Configuration (.env)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f ".env" ]; then
    success "Fichier .env trouvé"
    
    # Vérifier les variables critiques
    critical_vars=("GITHUB_REPOSITORY_OWNER" "DB_PASSWORD" "JWT_SECRET" "GRAFANA_PASSWORD")
    missing_vars=()
    
    for var in "${critical_vars[@]}"; do
        if grep -q "^${var}=" ".env" && ! grep -q "^${var}=$" ".env"; then
            success "Variable $var définie"
        else
            warning "Variable $var manquante ou vide"
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo ""
        warning "Variables manquantes détectées!"
        info "Éditez le fichier .env et définissez:"
        for var in "${missing_vars[@]}"; do
            echo "  • $var"
        done
    fi
else
    warning "Fichier .env non trouvé"
    echo ""
    info "Création du fichier .env..."
    
    if [ -f "raspberry-pi/env.example" ]; then
        cp raspberry-pi/env.example .env
        success "Fichier .env créé à partir de env.example"
        echo ""
        warning "⚠️  IMPORTANT: Éditez .env et configurez les variables!"
        echo ""
        echo "  nano .env"
        echo ""
        echo "Variables à configurer:"
        echo "  • GITHUB_REPOSITORY_OWNER=votre-username"
        echo "  • DB_PASSWORD=VotreMotDePasse2025!"
        echo "  • JWT_SECRET=VotreSuperSecretKey2025!"
        echo "  • GRAFANA_PASSWORD=admin"
    else
        failure "Fichier raspberry-pi/env.example non trouvé"
    fi
fi

echo ""

# Étape 4: Valider la configuration
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  4️⃣  Validation de la configuration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -x "raspberry-pi/scripts/validate-config.sh" ]; then
    if ./raspberry-pi/scripts/validate-config.sh; then
        success "Configuration valide!"
    else
        warning "Des problèmes de configuration ont été détectés"
        info "Consultez la sortie ci-dessus pour plus de détails"
    fi
else
    warning "Script de validation non disponible"
fi

echo ""

# Étape 5: Créer les dossiers nécessaires
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  5️⃣  Création des dossiers${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

directories=("backups" "logs")

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        success "Dossier '$dir' créé"
    else
        info "Dossier '$dir' existe déjà"
    fi
done

echo ""

# Résumé final
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📋 Résumé${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f ".env" ] && docker compose version &> /dev/null; then
    success "Configuration de base terminée!"
    echo ""
    echo -e "${GREEN}✨ Prochaines étapes:${NC}"
    echo ""
    echo "  1. Vérifiez et éditez le fichier .env:"
    echo -e "     ${YELLOW}nano .env${NC}"
    echo ""
    echo "  2. Authentifiez-vous au GitHub Container Registry (si repo privé):"
    echo -e "     ${YELLOW}echo \$GITHUB_TOKEN | docker login ghcr.io -u \$GITHUB_REPOSITORY_OWNER --password-stdin${NC}"
    echo ""
    echo "  3. Démarrez l'application:"
    echo -e "     ${YELLOW}cd raspberry-pi${NC}"
    echo -e "     ${YELLOW}./scripts/deploy.sh start${NC}"
    echo ""
    echo "  4. Vérifiez la santé des services:"
    echo -e "     ${YELLOW}./scripts/check-health.sh${NC}"
    echo ""
    echo -e "${CYAN}📚 Documentation complète:${NC}"
    echo "  • raspberry-pi/scripts/README.md"
    echo "  • docs/ARCHITECTURE-RESEAU.md"
    echo "  • docs/TROUBLESHOOTING-PROD.md"
    echo ""
else
    warning "Configuration incomplète"
    echo ""
    echo "Veuillez:"
    
    if [ ! -f ".env" ]; then
        echo "  • Créer et configurer le fichier .env"
    fi
    
    if ! docker compose version &> /dev/null; then
        echo "  • Installer Docker et Docker Compose"
    fi
    
    echo ""
    info "Relancez ce script après avoir résolu ces problèmes:"
    echo "  ./raspberry-pi/scripts/setup.sh"
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎉 Installation terminée !            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

