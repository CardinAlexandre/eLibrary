# 🚀 Déploiement Production sur Raspberry Pi

Guide complet pour le déploiement en production avec images pré-buildées depuis GitHub Container Registry.

## 🎯 Architecture

```
┌─────────────────────────────────────────────────┐
│         GitHub Actions (Runners Cloud)          │
│  ┌──────────────────────────────────────────┐  │
│  │ 1. Build multi-arch images (ARM64/ARMv7)│  │
│  │    ⚡ Rapide sur runners GitHub (~5 min) │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼──────────────────────────────┘
                  │ Push
                  ↓
┌─────────────────────────────────────────────────┐
│     GitHub Container Registry (ghcr.io)         │
│  📦 Images versionnées et testées               │
│     - elibrary-gateway:latest                   │
│     - elibrary-catalog-service:latest           │
│     - elibrary-auth-service:latest              │
│     - elibrary-frontend-react:latest            │
│     - ...                                       │
└─────────────────┬───────────────────────────────┘
                  │ Pull (toutes les 5 min)
                  ↓
┌─────────────────────────────────────────────────┐
│         Raspberry Pi (Chez vous)                │
│  ┌──────────────────────────────────────────┐  │
│  │ Watchtower (Auto-update)                 │  │
│  │  🔄 Vérifie les nouvelles images         │  │
│  │  ⬇️  Pull automatiquement                 │  │
│  │  🔄 Redémarre les conteneurs             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Docker Compose                           │  │
│  │  🐳 Gère tous les services               │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## ⚡ Avantages vs Build Local

| Aspect | Build Local | Build GitHub (Production) |
|--------|-------------|---------------------------|
| **Temps démarrage** | 30-60 min ⏱️ | 2-3 min ⚡ |
| **CPU Pi pendant build** | 100% 🔥 | 0% ❄️ |
| **RAM utilisée** | 3GB+ 💾 | 500MB 💾 |
| **Température Pi** | 70-80°C 🌡️ | 40-50°C 🌡️ |
| **Auto-update** | ❌ Manuel | ✅ Automatique |
| **Versioning** | ❌ Non | ✅ Oui (tags) |
| **Rollback** | ❌ Difficile | ✅ Facile |
| **Multi-Pi** | ❌ Non | ✅ Oui |
| **Production-ready** | ⚠️ Non | ✅ Oui |

## 📋 Prérequis

### Sur le Raspberry Pi
- Raspberry Pi 4+ (4GB RAM recommandé) ou Pi 3B+ minimum
- Raspberry Pi OS 64-bit
- Docker et Docker Compose installés
- Connexion Internet stable
- 10GB d'espace disque libre

### Sur GitHub
- Repository public OU token d'accès pour images privées
- Workflow "Build & Publish Docker Images" activé

## 🔧 Installation

### Étape 1 : Cloner le projet sur le Raspberry Pi

```bash
# Se connecter au Raspberry Pi
ssh pi@RASPBERRY_PI_IP

# Cloner le repository
cd ~
git clone https://github.com/VOTRE_USERNAME/eLibrary.git
cd eLibrary
```

### Étape 2 : Configurer les variables d'environnement

```bash
# Copier le template
cp raspberry-pi/env.example .env

# Éditer avec vos paramètres
nano .env
```

**Variables obligatoires dans .env :**

```bash
# GitHub Container Registry
GITHUB_REPOSITORY_OWNER=votre-username-github  # ⚠️ IMPORTANT

# Base de données
DB_PASSWORD=VotreMotDePasseSecurise123!

# Grafana
GRAFANA_PASSWORD=AdminSecure123!

# JWT
JWT_SECRET=SuperSecretJWTKeyForProduction2025WithRandomChars!

# Optionnel : Token pour images privées
GITHUB_TOKEN=ghp_votre_token_github  # Seulement si repo privé

# Optionnel : Google Books API
GOOGLE_BOOKS_API_KEY=AIzaSy...

# Tag des images (latest par défaut)
IMAGE_TAG=latest
```

### Étape 3 : Configurer l'accès au Container Registry (si repo privé)

```bash
# Créer un Personal Access Token sur GitHub:
# GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Cocher: read:packages

# Se connecter au registry
echo "VOTRE_GITHUB_TOKEN" | docker login ghcr.io -u VOTRE_USERNAME --password-stdin
```

### Étape 4 : Rendre le script exécutable

```bash
chmod +x raspberry-pi/scripts/deploy-prod.sh
```

### Étape 5 : Démarrer l'application

```bash
./raspberry-pi/scripts/deploy-prod.sh start
```

**Première fois** : Téléchargement des images (~5-10 minutes selon connexion)

## 🔄 Workflow de mise à jour automatique

### Comment ça marche ?

1. **Vous pushez du code** sur `main` branch
   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   git push origin main
   ```

2. **GitHub Actions build les images** (~5 minutes)
   - Build pour ARM64 et ARMv7
   - Tests automatiques
   - Push vers ghcr.io

3. **Watchtower détecte la nouvelle image** (toutes les 5 min)
   - Pull la nouvelle image
   - Arrête l'ancien conteneur
   - Démarre le nouveau
   - Supprime l'ancienne image

4. **Votre Pi est à jour** automatiquement ! 🎉

### Timeline

```
00:00 - Push code sur main
00:01 - GitHub Actions démarre
00:05 - Build terminé, images publiées
00:10 - Watchtower détecte (prochain cycle de 5 min)
00:11 - Raspberry Pi pull et redémarre
00:12 - ✅ Application mise à jour!
```

**Total : ~12 minutes** vs 30-60 minutes avec build local

## 🎛️ Gestion quotidienne

### Voir le statut

```bash
./raspberry-pi/scripts/deploy-prod.sh status
```

### Voir les logs

```bash
# Tous les services
./raspberry-pi/scripts/deploy-prod.sh logs

# Un service spécifique
./raspberry-pi/scripts/deploy-prod.sh logs catalog-service
```

### Forcer une mise à jour

```bash
# Pull les dernières images et redémarre
./raspberry-pi/scripts/deploy-prod.sh update
```

### Voir les versions déployées

```bash
./raspberry-pi/scripts/deploy-prod.sh version
```

### Redémarrer un service

```bash
docker compose -f docker-compose.pi-prod.yml restart catalog-service
```

## 🔄 Rollback vers une version précédente

### Méthode 1 : Utiliser un tag spécifique

```bash
# Dans .env, changer IMAGE_TAG
nano .env
# IMAGE_TAG=v1.2.0  # Au lieu de latest

# Redémarrer
./raspberry-pi/scripts/deploy-prod.sh update
```

### Méthode 2 : Rollback rapide

```bash
# Lister les images disponibles
docker images | grep elibrary

# Utiliser une ancienne image
docker tag ghcr.io/user/elibrary-catalog-service:sha-abc123 \
           ghcr.io/user/elibrary-catalog-service:latest

# Redémarrer le service
docker compose -f docker-compose.pi-prod.yml up -d catalog-service
```

## 📊 Monitoring

### Logs de Watchtower

```bash
docker logs elibrary-watchtower -f
```

Vous verrez :
```
time="..." level=info msg="Found new image for elibrary-catalog"
time="..." level=info msg="Stopping container elibrary-catalog"
time="..." level=info msg="Starting container elibrary-catalog"
time="..." level=info msg="Session done"
```

### Notifications Watchtower (optionnel)

Ajoutez dans `.env` pour recevoir des notifications :

```bash
# Slack
WATCHTOWER_NOTIFICATION_URL=slack://TOKEN@CHANNEL

# Discord
WATCHTOWER_NOTIFICATION_URL=discord://TOKEN@CHANNEL

# Email
WATCHTOWER_NOTIFICATION_URL=smtp://username:password@host:port/?from=FROM&to=TO
```

## 🔒 Sécurité Production

### Bonnes pratiques implémentées

✅ **Images signées** : Proviennent de votre registry officiel  
✅ **Pas de build sur le Pi** : Moins de surface d'attaque  
✅ **Secrets externalisés** : Dans fichier .env non commité  
✅ **Health checks** : Vérification automatique des services  
✅ **Auto-update** : Patches de sécurité appliqués rapidement  
✅ **Logs centralisés** : Via Grafana/Prometheus  
✅ **Network isolation** : Services dans un réseau Docker dédié  

### Recommandations supplémentaires

1. **HTTPS avec Let's Encrypt**
   ```bash
   # Installer Caddy comme reverse proxy
   # Configuration automatique HTTPS
   ```

2. **Fail2ban pour SSH**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

3. **Sauvegardes automatiques**
   ```bash
   # Cron job quotidien
   0 2 * * * /home/pi/eLibrary/raspberry-pi/scripts/backup.sh
   ```

## 🎓 Pour les recruteurs

Cette approche démontre :

✅ **Connaissance CI/CD** : Pipeline GitHub Actions professionnel  
✅ **Container orchestration** : Docker multi-stage, registry, Watchtower  
✅ **DevOps best practices** : GitOps, Infrastructure as Code  
✅ **Production mindset** : Monitoring, logging, auto-update  
✅ **Security awareness** : Secrets management, network isolation  
✅ **Scalabilité** : Architecture microservices prête pour le cloud  

## 🆚 Comparaison avec l'approche précédente

### Approche précédente (Build sur Pi)
```bash
git push → GitHub Actions → SSH → Transfer → Build (30-60min) 🐢 → Deploy
```

### Approche Production (Option A)
```bash
git push → GitHub Build (5min) ⚡ → Registry → Pi Pull (2min) ⚡ → Deploy
```

**Gain de temps : 85% plus rapide!** 🚀

## 📚 Ressources

- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Watchtower Documentation](https://containrrr.dev/watchtower/)
- [Docker Multi-platform builds](https://docs.docker.com/build/building/multi-platform/)

## ✅ Checklist de déploiement

- [ ] Docker et Docker Compose installés sur le Pi
- [ ] Repository cloné sur le Pi
- [ ] Fichier .env créé et configuré
- [ ] GITHUB_REPOSITORY_OWNER correctement défini
- [ ] Accès au Container Registry configuré (si privé)
- [ ] Premier démarrage réussi
- [ ] Watchtower fonctionne (vérifier les logs)
- [ ] Services accessibles depuis le navigateur
- [ ] Auto-update testé (push un commit, attendre 10-15 min)

Félicitations ! Vous avez une infrastructure de production professionnelle ! 🎉

