# 🍓 Déploiement eLibrary sur Raspberry Pi

Guide complet pour déployer l'application eLibrary sur un Raspberry Pi 4/5.

## 📋 Prérequis

### Matériel recommandé
- **Raspberry Pi 4 (4GB RAM minimum)** ou **Raspberry Pi 5**
- Carte SD 32GB minimum (64GB recommandé)
- Alimentation officielle
- Connexion Ethernet (recommandé pour la stabilité)

### Logiciels
- **Raspberry Pi OS 64-bit** (Bookworm ou plus récent)
- **Docker** et **Docker Compose**
- Au moins **10GB d'espace disque libre**

## 🔧 Installation initiale

### 1. Mettre à jour le système

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 2. Installer Docker

```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Se déconnecter et reconnecter pour appliquer les changements
exit
```

### 3. Installer Docker Compose

```bash
sudo apt install docker-compose-plugin -y
```

### 4. Vérifier l'installation

```bash
docker --version
docker compose version
```

## 🚀 Déploiement de l'application

### 1. Cloner le projet

```bash
cd ~
git clone <votre-repo-url> eLibrary
cd eLibrary
```

### 2. Configuration des variables d'environnement

```bash
# Créer le fichier .env à partir du template
cp .env.example .env

# Éditer le fichier avec vos paramètres
nano .env
```

Exemple de configuration `.env` :
```env
DB_PASSWORD=VotreMotDePasseSecurise123!
GRAFANA_PASSWORD=admin123
JWT_SECRET=SuperSecretKeyForProduction2025!
```

### 3. Build des images (première fois)

⚠️ **Attention** : Le build peut prendre **30-60 minutes** sur Raspberry Pi !

```bash
# Builder toutes les images
docker compose -f docker-compose.raspberry-pi.yml build

# Ou builder en parallèle (plus rapide mais plus gourmand en RAM)
docker compose -f docker-compose.raspberry-pi.yml build --parallel
```

### 4. Démarrer l'application

```bash
# Démarrer en mode détaché
docker compose -f docker-compose.raspberry-pi.yml up -d

# Voir les logs
docker compose -f docker-compose.raspberry-pi.yml logs -f
```

### 5. Vérifier le statut

```bash
# Voir tous les conteneurs
docker compose -f docker-compose.raspberry-pi.yml ps

# Vérifier la santé
docker compose -f docker-compose.raspberry-pi.yml exec gateway curl http://localhost/health
```

## 🌐 Accès aux services

Une fois démarré, les services sont accessibles :

| Service | URL | Authentification |
|---------|-----|------------------|
| **React Frontend** | http://raspberry-pi-ip:3000 | - |
| **Angular Frontend** | http://raspberry-pi-ip:4200 | - |
| **API Gateway** | http://raspberry-pi-ip:5000 | JWT Token |
| **RabbitMQ Management** | http://raspberry-pi-ip:15672 | guest / guest |
| **Grafana** | http://raspberry-pi-ip:3001 | admin / [GRAFANA_PASSWORD] |
| **Prometheus** | http://raspberry-pi-ip:9090 | - |

## 📊 Monitoring des ressources

### Surveiller l'utilisation

```bash
# CPU et RAM en temps réel
docker stats

# Espace disque
df -h

# Température du CPU
vcgencmd measure_temp
```

### Optimisations pour Raspberry Pi

Si vous manquez de ressources, désactivez certains services non critiques :

```bash
# Arrêter Grafana et Prometheus
docker compose -f docker-compose.raspberry-pi.yml stop grafana prometheus

# Ou ne démarrer que les services essentiels
docker compose -f docker-compose.raspberry-pi.yml up -d sqlserver redis rabbitmq gateway catalog-service auth-service frontend-react
```

## 🔄 Gestion quotidienne

### Arrêter l'application

```bash
docker compose -f docker-compose.raspberry-pi.yml down
```

### Redémarrer un service spécifique

```bash
docker compose -f docker-compose.raspberry-pi.yml restart catalog-service
```

### Voir les logs d'un service

```bash
docker compose -f docker-compose.raspberry-pi.yml logs -f catalog-service
```

### Mettre à jour l'application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Rebuilder les images modifiées
docker compose -f docker-compose.raspberry-pi.yml build

# 3. Redémarrer avec les nouvelles images
docker compose -f docker-compose.raspberry-pi.yml up -d
```

### Nettoyer les ressources inutilisées

```bash
# Nettoyer les images, conteneurs et volumes non utilisés
docker system prune -a --volumes

# ⚠️ Attention : cela supprime TOUTES les données non utilisées
```

## 🔒 Sécurité

### Recommandations de production

1. **Changer tous les mots de passe par défaut**
```bash
nano .env
# Modifier DB_PASSWORD, GRAFANA_PASSWORD, JWT_SECRET
```

2. **Configurer le pare-feu**
```bash
sudo apt install ufw -y
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # React
sudo ufw allow 4200/tcp  # Angular
sudo ufw enable
```

3. **Activer HTTPS avec Let's Encrypt** (optionnel)
```bash
# À configurer avec un reverse proxy nginx
```

4. **Sauvegardes automatiques**
```bash
# Créer un script de backup des volumes Docker
./raspberry-pi/scripts/backup.sh
```

## 🐛 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker compose -f docker-compose.raspberry-pi.yml logs

# Vérifier l'espace disque
df -h

# Redémarrer Docker
sudo systemctl restart docker
```

### Problème de mémoire

```bash
# Augmenter le swap (temporaire)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Modifier CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Base de données ne démarre pas

```bash
# SQL Server peut nécessiter plus de mémoire
# Vérifier les logs
docker compose -f docker-compose.raspberry-pi.yml logs sqlserver

# Augmenter les limites mémoire si nécessaire
```

### Performance lente

1. Utiliser une carte SD rapide (Classe 10, A2)
2. Utiliser un SSD USB pour les volumes Docker
3. Réduire le nombre de services actifs
4. Overclock le Raspberry Pi (prudence !)

## 📈 Métriques de performance attendues

Sur un Raspberry Pi 4 (4GB) :
- **Temps de démarrage complet** : 2-3 minutes
- **Utilisation RAM** : 2.5-3GB
- **Utilisation CPU idle** : 5-10%
- **Utilisation CPU sous charge** : 40-70%
- **Temps de build initial** : 30-60 minutes

## 🔗 Ressources utiles

- [Docker on Raspberry Pi](https://docs.docker.com/engine/install/debian/)
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 💡 Astuces

### Démarrage automatique au boot

```bash
# Activer le démarrage automatique de Docker
sudo systemctl enable docker

# Créer un service systemd pour l'application
sudo nano /etc/systemd/system/elibrary.service
```

Contenu du service :
```ini
[Unit]
Description=eLibrary Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/eLibrary
ExecStart=/usr/bin/docker compose -f docker-compose.raspberry-pi.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.raspberry-pi.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Activer le service :
```bash
sudo systemctl enable elibrary.service
sudo systemctl start elibrary.service
```

### Accès distant sécurisé

Utilisez SSH avec authentification par clé :
```bash
ssh-copy-id pi@raspberry-pi-ip
```

### Surveillance à distance

Installez Portainer pour gérer Docker depuis un navigateur :
```bash
docker run -d -p 9000:9000 --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Accès : http://raspberry-pi-ip:9000

