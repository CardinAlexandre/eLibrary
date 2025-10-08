# 🚀 Configuration CI/CD GitHub Actions vers Raspberry Pi

Guide complet pour configurer le déploiement automatique depuis GitHub Actions vers votre Raspberry Pi.

## 📋 Prérequis

- Un Raspberry Pi accessible via SSH
- Un compte GitHub avec accès au repository
- Docker et Docker Compose installés sur le Raspberry Pi

## 🔐 Étape 1 : Générer une clé SSH sur le Raspberry Pi

### 1.1 Créer un utilisateur dédié au déploiement (recommandé)

```bash
# Sur le Raspberry Pi
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy
```

### 1.2 Générer une clé SSH pour GitHub Actions

```bash
# Sur le Raspberry Pi (en tant que deploy ou votre utilisateur)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Afficher la clé publique
cat ~/.ssh/github_actions_deploy.pub

# Afficher la clé privée (à copier dans GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

### 1.3 Ajouter la clé publique aux clés autorisées

```bash
# Ajouter la clé publique dans authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Définir les permissions correctes
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 1.4 Tester la connexion SSH

```bash
# Depuis votre machine de développement
ssh -i ~/.ssh/github_actions_deploy deploy@RASPBERRY_PI_IP
```

## 🔧 Étape 2 : Configurer le Raspberry Pi

### 2.1 Créer le répertoire de déploiement

```bash
# Sur le Raspberry Pi
mkdir -p /home/deploy/eLibrary
cd /home/deploy/eLibrary

# Cloner le repository (première fois)
git clone https://github.com/VOTRE_USERNAME/eLibrary.git .
```

### 2.2 Installer Docker et Docker Compose (si pas déjà fait)

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Vérifier l'installation
docker --version
docker compose version
```

### 2.3 Configurer le pare-feu (optionnel mais recommandé)

```bash
# Installer UFW
sudo apt install ufw -y

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser les ports de l'application
sudo ufw allow 3000/tcp   # React
sudo ufw allow 4200/tcp   # Angular
sudo ufw allow 5000/tcp   # Gateway

# Activer le pare-feu
sudo ufw enable
```

### 2.4 Configurer l'IP statique (recommandé)

```bash
# Éditer la configuration réseau
sudo nano /etc/dhcpcd.conf

# Ajouter à la fin :
# interface eth0
# static ip_address=192.168.1.100/24
# static routers=192.168.1.1
# static domain_name_servers=192.168.1.1 8.8.8.8

# Redémarrer le réseau
sudo systemctl restart dhcpcd
```

## 🔑 Étape 3 : Configurer les GitHub Secrets

### 3.1 Accéder aux GitHub Secrets

1. Aller sur votre repository GitHub
2. Cliquer sur **Settings** → **Secrets and variables** → **Actions**
3. Cliquer sur **New repository secret**

### 3.2 Ajouter les secrets obligatoires

Créez les secrets suivants :

#### **RASPBERRY_PI_SSH_KEY** (obligatoire)
```
Contenu : La clé PRIVÉE complète (cat ~/.ssh/github_actions_deploy)
Format : 
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### **RASPBERRY_PI_HOST** (obligatoire)
```
Valeur : L'adresse IP ou hostname de votre Raspberry Pi
Exemple : 192.168.1.100
```

#### **RASPBERRY_PI_USER** (obligatoire)
```
Valeur : Le nom d'utilisateur SSH
Exemple : deploy
```

#### **DB_PASSWORD** (obligatoire)
```
Valeur : Mot de passe de la base de données
Exemple : eLibrary@2025!SecurePassword
```

#### **GRAFANA_PASSWORD** (obligatoire)
```
Valeur : Mot de passe Grafana
Exemple : admin123secure
```

#### **JWT_SECRET** (obligatoire)
```
Valeur : Clé secrète pour les tokens JWT
Exemple : SuperSecretKeyForJWTProductionRaspberryPi2025!
```

#### **GOOGLE_BOOKS_API_KEY** (optionnel)
```
Valeur : Votre clé API Google Books
Exemple : AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3.3 Vérifier les secrets configurés

Vérifiez que tous les secrets sont bien configurés dans :
**Settings** → **Secrets and variables** → **Actions**

## 🚀 Étape 4 : Tester le déploiement

### 4.1 Déploiement manuel (test)

1. Aller dans l'onglet **Actions** de votre repository
2. Sélectionner le workflow **Deploy to Raspberry Pi**
3. Cliquer sur **Run workflow**
4. Sélectionner la branche (main ou production)
5. Cliquer sur **Run workflow**

### 4.2 Surveiller le déploiement

- Les logs s'affichent en temps réel dans l'onglet Actions
- Le déploiement complet prend environ **5-15 minutes** (selon le nombre de modifications)

### 4.3 Vérifier le déploiement

Une fois le workflow terminé avec succès :

```bash
# Vérifier sur le Raspberry Pi
ssh deploy@RASPBERRY_PI_IP
cd /home/deploy/eLibrary
docker compose -f docker-compose.raspberry-pi.yml ps
```

Accéder aux services :
- React : http://RASPBERRY_PI_IP:3000
- Angular : http://RASPBERRY_PI_IP:4200
- API Gateway : http://RASPBERRY_PI_IP:5000
- Grafana : http://RASPBERRY_PI_IP:3001

## ⚙️ Étape 5 : Déploiement automatique

### 5.1 Configurer les branches de déploiement

Le workflow se déclenche automatiquement lors d'un push sur :
- `main` : Déploiement de développement
- `production` : Déploiement de production

Pour modifier les branches :
```yaml
# Dans .github/workflows/deploy-raspberry-pi.yml
on:
  push:
    branches:
      - main           # Modifier selon vos besoins
      - production
```

### 5.2 Workflow de déploiement typique

```bash
# 1. Développer localement
git checkout -b feature/nouvelle-fonctionnalite

# 2. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 3. Créer une PR vers main
# (via l'interface GitHub)

# 4. Merger la PR
# → Déclenche automatiquement le déploiement sur le Raspberry Pi !
```

## 🔄 Fonctionnalités avancées

### Rollback automatique en cas d'échec

Le workflow inclut un job de rollback qui s'exécute automatiquement si le déploiement échoue.

### Notifications personnalisées

Ajoutez des notifications Slack/Discord en modifiant la section `Send deployment notification` :

```yaml
- name: Send deployment notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    text: 'Deployment to Raspberry Pi: ${{ job.status }}'
```

### Déploiement multi-environnement

Créez des workflows séparés pour différents environnements :
- `deploy-raspberry-pi-dev.yml` → Pour le Pi de développement
- `deploy-raspberry-pi-prod.yml` → Pour le Pi de production

## 🐛 Dépannage

### Erreur : Permission denied (publickey)

```bash
# Vérifier que la clé SSH est correcte
cat ~/.ssh/github_actions_deploy

# Vérifier les permissions
ls -la ~/.ssh/
chmod 600 ~/.ssh/authorized_keys
```

### Erreur : Connection timeout

```bash
# Vérifier que le Raspberry Pi est accessible
ping RASPBERRY_PI_IP

# Vérifier que SSH est activé
sudo systemctl status ssh

# Vérifier le pare-feu
sudo ufw status
```

### Erreur : Docker permission denied

```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker deploy

# Se déconnecter et reconnecter
exit
ssh deploy@RASPBERRY_PI_IP
```

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs sur le Raspberry Pi
cd /home/deploy/eLibrary
docker compose -f docker-compose.raspberry-pi.yml logs

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

## 📊 Monitoring du déploiement

### Logs en temps réel

```bash
# Se connecter au Raspberry Pi
ssh deploy@RASPBERRY_PI_IP

# Voir les logs de tous les services
cd /home/deploy/eLibrary
docker compose -f docker-compose.raspberry-pi.yml logs -f

# Voir les logs d'un service spécifique
docker compose -f docker-compose.raspberry-pi.yml logs -f gateway
```

### Métriques système

```bash
# CPU et RAM
docker stats

# Température du CPU
vcgencmd measure_temp

# Espace disque
df -h
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Utiliser un utilisateur dédié** : Ne pas utiliser `pi` ou `root`
2. **Clé SSH dédiée** : Une clé différente pour GitHub Actions
3. **Secrets GitHub** : Ne jamais commiter les secrets dans le code
4. **Pare-feu** : Limiter les ports exposés
5. **Mots de passe forts** : Utiliser des générateurs de mots de passe
6. **HTTPS** : Configurer un reverse proxy avec Let's Encrypt (optionnel)
7. **Sauvegardes régulières** : Automatiser les backups

### Rotation des secrets

Changez régulièrement :
- Clé SSH GitHub Actions (tous les 6 mois)
- DB_PASSWORD (tous les 3 mois)
- JWT_SECRET (tous les 6 mois)

## 📚 Ressources supplémentaires

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [SSH Best Practices](https://infosec.mozilla.org/guidelines/openssh)

## ✅ Checklist de configuration

- [ ] Raspberry Pi configuré avec IP statique
- [ ] Docker et Docker Compose installés
- [ ] Utilisateur `deploy` créé avec accès Docker
- [ ] Clé SSH générée et testée
- [ ] Tous les GitHub Secrets configurés
- [ ] Premier déploiement manuel réussi
- [ ] Services accessibles via navigateur
- [ ] Monitoring configuré (Grafana)
- [ ] Pare-feu configuré
- [ ] Backup automatique configuré

Félicitations ! Votre pipeline CI/CD est maintenant opérationnel ! 🎉

