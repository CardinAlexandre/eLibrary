# 🍓 Scripts Raspberry Pi - eLibrary

Scripts bash pour la gestion de eLibrary en production sur Raspberry Pi.

## 📁 Structure

```
raspberry-pi/scripts/
├── deploy.sh           # Script principal de déploiement
├── check-health.sh     # Vérification de la santé des services
├── validate-config.sh  # Validation de la configuration
└── pi-utils.sh         # Utilitaires divers
```

---

## 🚀 Scripts principaux

### 1. `deploy.sh` - Déploiement et gestion

Script principal pour gérer le cycle de vie de l'application.

#### Installation initiale

```bash
# Rendre le script exécutable
chmod +x raspberry-pi/scripts/deploy.sh

# Créer le fichier .env
cp raspberry-pi/env.example .env
nano .env  # Configurer les variables

# Démarrer l'application
cd raspberry-pi
./scripts/deploy.sh start
```

#### Commandes disponibles

```bash
./scripts/deploy.sh start      # Démarrer tous les services
./scripts/deploy.sh stop       # Arrêter tous les services
./scripts/deploy.sh restart    # Redémarrer tous les services
./scripts/deploy.sh update     # Mettre à jour les images et redémarrer
./scripts/deploy.sh status     # Afficher le statut des services
./scripts/deploy.sh logs       # Afficher les logs de tous les services
./scripts/deploy.sh logs gateway  # Logs d'un service spécifique
./scripts/deploy.sh version    # Afficher les versions des images
./scripts/deploy.sh cleanup    # Nettoyer les ressources Docker
```

#### Exemples

```bash
# Démarrage initial
./scripts/deploy.sh start

# Voir les logs du gateway
./scripts/deploy.sh logs gateway

# Mettre à jour après un nouveau déploiement
./scripts/deploy.sh update

# Vérifier le statut
./scripts/deploy.sh status
```

---

### 2. `check-health.sh` - Vérification de santé

Vérifie que tous les services fonctionnent correctement.

#### Utilisation

```bash
# Rendre exécutable
chmod +x raspberry-pi/scripts/check-health.sh

# Lancer la vérification
./raspberry-pi/scripts/check-health.sh
```

#### Ce qu'il vérifie

- ✅ Accessibilité de tous les endpoints HTTP
- ✅ Health checks Docker des conteneurs
- ✅ État des services (running/stopped)
- ✅ Utilisation des ressources (CPU, RAM)
- ✅ Tests API rapides
- ✅ Résolution DNS interne

#### Résultat

```
🏥 Vérification de la santé des services eLibrary...

🔍 Gateway (port 8080)... ✅ HEALTHY
🔍 Frontend React (port 3000)... ✅ ACCESSIBLE
🔍 Frontend Angular (port 4200)... ✅ ACCESSIBLE
...

✅ Tous les services sont opérationnels!
```

#### Code de sortie

- `0` : Tous les services sont sains
- `1` : Au moins un service a un problème

#### Utilisation dans un cron

```bash
# Vérifier la santé toutes les 5 minutes et logger
*/5 * * * * /path/to/raspberry-pi/scripts/check-health.sh >> /var/log/elibrary-health.log 2>&1
```

---

### 3. `validate-config.sh` - Validation de configuration

Valide que la configuration est correcte avant le déploiement.

#### Utilisation

```bash
# Rendre exécutable
chmod +x raspberry-pi/scripts/validate-config.sh

# Valider la configuration de production
./raspberry-pi/scripts/validate-config.sh

# Valider un fichier compose spécifique
./raspberry-pi/scripts/validate-config.sh docker-compose.postgres-local.yml
```

#### Ce qu'il vérifie

- ✅ Présence des fichiers requis
- ✅ Configuration YARP du gateway
- ✅ URLs React (pas de duplication `/api/api`)
- ✅ Configuration Nginx des frontends
- ✅ Variables d'environnement Docker Compose
- ✅ Présence du fichier `.env` (production)
- ✅ Docker et Docker Compose installés

#### Résultat

```
╔══════════════════════════════════════════╗
║  ✅ Tous les tests ont réussi !         ║
║     Configuration prête pour production ║
╚══════════════════════════════════════════╝
```

#### Code de sortie

- `0` : Configuration OK
- `1` : Erreurs détectées

---

### 4. `pi-utils.sh` - Utilitaires divers

Collection d'outils pour la gestion quotidienne.

#### Utilisation

```bash
# Rendre exécutable
chmod +x raspberry-pi/scripts/pi-utils.sh

# Afficher le menu
./raspberry-pi/scripts/pi-utils.sh
```

#### Commandes disponibles

##### Ressources système

```bash
./raspberry-pi/scripts/pi-utils.sh resources
```

Affiche :
- CPU et RAM système
- Température du Raspberry Pi
- Espace disque
- Ressources Docker par conteneur

##### Nettoyage Docker

```bash
./raspberry-pi/scripts/pi-utils.sh cleanup
```

Nettoie :
- Conteneurs arrêtés
- Images pendantes
- Réseaux non utilisés
- Cache de build

##### Sauvegarde de la base de données

```bash
./raspberry-pi/scripts/pi-utils.sh backup
```

Sauvegarde toutes les bases PostgreSQL :
- `CatalogDb`
- `AuthDb`
- `RecommenderDb`

Fichiers créés : `backups/backup_YYYYMMDD_HHMMSS.tar.gz`

##### Restauration de la base

```bash
./raspberry-pi/scripts/pi-utils.sh restore
```

Restaure une sauvegarde précédente (mode interactif).

##### Logs en temps réel

```bash
# Tous les services
./raspberry-pi/scripts/pi-utils.sh logs

# Un service spécifique
./raspberry-pi/scripts/pi-utils.sh logs gateway
```

##### Test réseau

```bash
./raspberry-pi/scripts/pi-utils.sh network
```

Vérifie :
- IP locale du Pi
- Ports ouverts
- Résolution DNS Docker interne

##### Mise à jour manuelle

```bash
./raspberry-pi/scripts/pi-utils.sh update
```

Effectue :
1. `git pull origin main`
2. `docker compose pull`
3. `docker compose up -d`

##### Statistiques complètes

```bash
./raspberry-pi/scripts/pi-utils.sh stats
```

Affiche toutes les informations système.

---

## 🔧 Configuration initiale

### 1. Rendre tous les scripts exécutables

```bash
cd raspberry-pi/scripts
chmod +x *.sh
```

### 2. Créer le fichier `.env`

```bash
cd /path/to/eLibrary
cp raspberry-pi/env.example .env
nano .env
```

Variables obligatoires :
```bash
GITHUB_REPOSITORY_OWNER=votre-username
DB_PASSWORD=VotreMotDePasse2025!
JWT_SECRET=VotreSuperSecretKey2025!
GRAFANA_PASSWORD=admin
```

### 3. Valider la configuration

```bash
./raspberry-pi/scripts/validate-config.sh
```

### 4. Démarrer l'application

```bash
./raspberry-pi/scripts/deploy.sh start
```

---

## 🔄 Workflow quotidien

### Démarrage matinal

```bash
# Vérifier l'état
cd raspberry-pi
./scripts/deploy.sh status

# Vérifier la santé
./scripts/check-health.sh

# Si tout va bien, afficher les métriques
./scripts/pi-utils.sh resources
```

### Mise à jour après un push

```bash
# Watchtower mettra à jour automatiquement après 5 minutes
# Ou forcer la mise à jour :
./scripts/deploy.sh update
```

### Problème détecté

```bash
# Voir les logs
./scripts/deploy.sh logs gateway

# Redémarrer le service
docker compose -f docker-compose.pi.yml restart gateway

# Vérifier la santé
./scripts/check-health.sh
```

### Sauvegarde hebdomadaire

```bash
# Créer une sauvegarde
./scripts/pi-utils.sh backup

# Copier la sauvegarde ailleurs (recommandé)
scp backups/backup_*.tar.gz user@backup-server:/backups/
```

### Nettoyage mensuel

```bash
# Nettoyer Docker
./scripts/pi-utils.sh cleanup

# Vérifier l'espace disque
df -h
```

---

## 🆘 Dépannage

### Script ne démarre pas

```bash
# Vérifier les permissions
ls -la raspberry-pi/scripts/*.sh

# Rendre exécutable si nécessaire
chmod +x raspberry-pi/scripts/*.sh
```

### Services ne démarrent pas

```bash
# Vérifier les logs
./scripts/deploy.sh logs

# Valider la configuration
./scripts/validate-config.sh

# Vérifier .env
cat .env | grep -v "^#"
```

### Problème de mémoire

```bash
# Vérifier les ressources
./scripts/pi-utils.sh resources

# Nettoyer Docker
./scripts/pi-utils.sh cleanup

# Redémarrer si nécessaire
./scripts/deploy.sh restart
```

---

## 📚 Ressources

- **Architecture réseau** : `docs/ARCHITECTURE-RESEAU.md`
- **Guide de dépannage** : `docs/TROUBLESHOOTING-PROD.md`
- **Changelog** : `CHANGELOG-PROD-FIXES.md`
- **Diagnostic Pi** : `raspberry-pi/DIAGNOSTIC.md`

---

## 🎯 Bonnes pratiques

1. **Toujours valider avant de déployer**
   ```bash
   ./scripts/validate-config.sh
   ```

2. **Sauvegarder régulièrement**
   ```bash
   ./scripts/pi-utils.sh backup
   ```

3. **Monitorer la santé**
   ```bash
   ./scripts/check-health.sh
   ```

4. **Surveiller les ressources**
   ```bash
   ./scripts/pi-utils.sh resources
   ```

5. **Nettoyer régulièrement**
   ```bash
   ./scripts/pi-utils.sh cleanup
   ```

---

## 🔐 Sécurité

- ❌ Ne jamais commiter le fichier `.env`
- ✅ Utiliser des mots de passe forts
- ✅ Changer les mots de passe par défaut (Grafana, RabbitMQ)
- ✅ Limiter l'accès SSH au Pi
- ✅ Mettre à jour régulièrement

---

## 📞 Support

En cas de problème :

1. Consulter les logs : `./scripts/deploy.sh logs`
2. Vérifier la santé : `./scripts/check-health.sh`
3. Consulter `docs/TROUBLESHOOTING-PROD.md`
4. Vérifier les issues GitHub du projet

---

**Bonne gestion ! 🚀🍓**

