#!/bin/bash

# 🍓 Script de configuration initiale du Raspberry Pi pour CI/CD
# À exécuter sur le Raspberry Pi

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Banner
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🍓 eLibrary Raspberry Pi Setup         ║${NC}"
echo -e "${GREEN}║   Configuration CI/CD GitHub Actions     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Vérifier si le script est exécuté en tant que root
if [ "$EUID" -eq 0 ]; then 
    echo_error "Ne pas exécuter ce script en tant que root!"
    echo_info "Exécutez: bash setup-pi.sh"
    exit 1
fi

# 1. Mise à jour du système
echo_info "Étape 1/7 - Mise à jour du système..."
sudo apt update && sudo apt upgrade -y
echo_success "Système mis à jour"

# 2. Installation de Docker
echo_info "Étape 2/7 - Installation de Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo_success "Docker installé"
else
    echo_warning "Docker déjà installé"
fi

# 3. Installation de Docker Compose
echo_info "Étape 3/7 - Vérification de Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo_error "Docker Compose n'est pas installé"
    echo_info "Installation..."
    sudo apt install docker-compose-plugin -y
    echo_success "Docker Compose installé"
else
    echo_success "Docker Compose déjà installé"
fi

# 4. Création de l'utilisateur deploy
echo_info "Étape 4/7 - Configuration de l'utilisateur deploy..."
if id "deploy" &>/dev/null; then
    echo_warning "L'utilisateur 'deploy' existe déjà"
else
    sudo adduser --disabled-password --gecos "" deploy
    echo_success "Utilisateur 'deploy' créé"
fi

# Ajouter au groupe docker
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy
echo_success "Utilisateur 'deploy' ajouté aux groupes docker et sudo"

# 5. Configuration SSH
echo_info "Étape 5/7 - Configuration SSH pour GitHub Actions..."

# Passer à l'utilisateur deploy pour générer la clé
sudo -u deploy bash << 'DEPLOY_SCRIPT'
    set -e
    
    # Créer le répertoire .ssh s'il n'existe pas
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Générer la clé SSH si elle n'existe pas
    if [ ! -f ~/.ssh/github_actions_deploy ]; then
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
        echo "✓ Clé SSH générée"
    else
        echo "⚠ Clé SSH existe déjà"
    fi
    
    # Ajouter la clé publique aux authorized_keys
    cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    
    # Afficher la clé publique
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "📋 CLÉ PUBLIQUE (pour info seulement) :"
    echo "═══════════════════════════════════════════════"
    cat ~/.ssh/github_actions_deploy.pub
    echo ""
    
    # Afficher la clé privée
    echo "═══════════════════════════════════════════════"
    echo "🔑 CLÉ PRIVÉE (à copier dans GitHub Secrets) :"
    echo "Secret Name: RASPBERRY_PI_SSH_KEY"
    echo "═══════════════════════════════════════════════"
    cat ~/.ssh/github_actions_deploy
    echo "═══════════════════════════════════════════════"
    echo ""
DEPLOY_SCRIPT

echo_success "Configuration SSH terminée"

# 6. Créer le répertoire de déploiement
echo_info "Étape 6/7 - Création du répertoire de déploiement..."
sudo -u deploy mkdir -p /home/deploy/eLibrary
sudo chown -R deploy:deploy /home/deploy/eLibrary
echo_success "Répertoire /home/deploy/eLibrary créé"

# 7. Configuration du pare-feu (optionnel)
echo_info "Étape 7/7 - Configuration du pare-feu..."
read -p "Voulez-vous configurer le pare-feu UFW? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install ufw -y
    
    # Autoriser SSH
    sudo ufw allow 22/tcp
    echo_success "Port SSH (22) autorisé"
    
    # Autoriser les ports de l'application
    sudo ufw allow 3000/tcp    # React
    sudo ufw allow 4200/tcp    # Angular
    sudo ufw allow 5000/tcp    # Gateway
    sudo ufw allow 3001/tcp    # Grafana
    
    echo_success "Ports de l'application autorisés"
    
    # Activer UFW
    sudo ufw --force enable
    echo_success "Pare-feu UFW activé"
    
    # Afficher le statut
    sudo ufw status
else
    echo_info "Configuration du pare-feu ignorée"
fi

# Résumé
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Configuration terminée avec succès!  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo_info "Informations importantes:"
echo ""
echo "🔑 Secrets GitHub à configurer:"
echo "   RASPBERRY_PI_SSH_KEY   → Copié ci-dessus (clé privée)"
echo "   RASPBERRY_PI_HOST      → $(hostname -I | awk '{print $1}')"
echo "   RASPBERRY_PI_USER      → deploy"
echo "   DB_PASSWORD            → À définir"
echo "   GRAFANA_PASSWORD       → À définir"
echo "   JWT_SECRET             → À générer"
echo ""
echo "📍 IP du Raspberry Pi:"
echo "   $(hostname -I | awk '{print $1}')"
echo ""
echo "🔗 Services (après déploiement):"
echo "   React:     http://$(hostname -I | awk '{print $1}'):3000"
echo "   Angular:   http://$(hostname -I | awk '{print $1}'):4200"
echo "   Gateway:   http://$(hostname -I | awk '{print $1}'):5000"
echo "   Grafana:   http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo_warning "⚠️  IMPORTANT: Sauvegardez la clé privée affichée ci-dessus!"
echo_warning "⚠️  Elle est nécessaire pour configurer GitHub Secrets"
echo ""
echo_info "Prochaines étapes:"
echo "   1. Copiez la clé privée dans GitHub Secrets"
echo "   2. Configurez tous les autres secrets GitHub"
echo "   3. Déclenchez un déploiement via GitHub Actions"
echo ""
echo_info "Pour tester la connexion SSH:"
echo "   ssh -i ~/.ssh/github_actions_deploy deploy@$(hostname -I | awk '{print $1}')"
echo ""

# Optionnel: Redémarrer
read -p "Voulez-vous redémarrer le Raspberry Pi maintenant? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Redémarrage dans 5 secondes..."
    sleep 5
    sudo reboot
else
    echo_success "Configuration terminée! Vous pouvez maintenant configurer GitHub Actions."
fi

