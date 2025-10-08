# Scripts de Gestion eLibrary

## 📜 Scripts Disponibles

### ✅ `start-services.ps1`

Démarre tous les services eLibrary dans le bon ordre avec attentes appropriées.

**Usage:**
```powershell
.\scripts\start-services.ps1
```

**Ordre de démarrage:**
1. Infrastructure de base (SQL Server, Redis, RabbitMQ) - 60s
2. Monitoring (Prometheus, Grafana) - 5s
3. Services Auth & Catalog - 30s
4. Services métier (Importer, Recommender, Analytics) - 15s
5. API Gateway - 10s

**Durée totale:** ~2 minutes

### 🛑 `stop-services.ps1`

Arrête tous les services eLibrary dans l'ordre inverse.

**Usage:**
```powershell
# Arrêter les services (conserver les données)
.\scripts\stop-services.ps1

# Arrêter ET supprimer les volumes (⚠️ perte de données)
.\scripts\stop-services.ps1 -RemoveVolumes
```

**Ordre d'arrêt:**
1. API Gateway
2. Services métier (Importer, Recommender, Analytics)
3. Services Auth & Catalog
4. Monitoring (Grafana, Prometheus)
5. Infrastructure (RabbitMQ, Redis, SQL Server)
6. Nettoyage des conteneurs

### 🔄 `restart-service.ps1` (bonus)

Redémarre un service spécifique.

**Usage:**
```powershell
.\scripts\restart-service.ps1 -ServiceName catalog-service
.\scripts\restart-service.ps1 -ServiceName gateway
```

## 🎯 Exemples d'utilisation

### Démarrage standard

```powershell
# Démarrer tous les services
.\scripts\start-services.ps1

# Attendre la fin du script (affiche les URLs)
# Puis tester l'API
curl "http://localhost:5000/api/catalog/books"
```

### Arrêt propre

```powershell
# Arrêter en conservant les données
.\scripts\stop-services.ps1

# Redémarrer plus tard
.\scripts\start-services.ps1
# Les données (livres, users) seront toujours là ✅
```

### Reset complet

```powershell
# Arrêter ET supprimer toutes les données
.\scripts\stop-services.ps1 -RemoveVolumes

# Redémarrer from scratch
.\scripts\start-services.ps1

# Seed à nouveau
docker cp data/books.json elibrary-catalog:/app/data/
docker-compose exec catalog-service dotnet CatalogService.dll seed
```

## 🐛 Troubleshooting

### SQL Server ne démarre pas

```powershell
# Voir les logs
docker-compose logs sqlserver

# Si port 1433 déjà utilisé, vérifier docker-compose.yml
# Port mappé: 1434:1433
```

### Service en erreur

```powershell
# Voir les logs
docker-compose logs <service-name>

# Redémarrer un service spécifique
docker-compose restart <service-name>

# Rebuild si modification de code
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### Healthcheck "unhealthy"

C'est souvent normal pendant les 40 premières secondes (start_period).

```powershell
# Vérifier après 1-2 minutes
docker-compose ps

# Si toujours unhealthy, voir les logs
docker-compose logs <service-name>
```

## 📊 Commandes Utiles

```powershell
# État de tous les services
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f catalog-service

# Redémarrer un service
docker-compose restart gateway

# Exécuter une commande dans un conteneur
docker-compose exec catalog-service dotnet --version

# Voir les ressources utilisées
docker stats
```

## 🎨 Codes Couleur

Les scripts utilisent des couleurs pour faciliter la lecture :

- 🔵 **Cyan** : Titres et sections
- 🟢 **Green** : Succès
- 🟡 **Yellow** : En cours / Avertissements
- 🔴 **Red** : Erreurs
- ⚪ **Gray** : Détails/informations

## ⚙️ Configuration

Les scripts lisent la configuration depuis `docker-compose.yml`.

Pour modifier les ports ou les paramètres, éditez `docker-compose.yml`.

## 🔐 Sécurité

**Ne jamais committer** le fichier `.env` qui contient les mots de passe réels.

Utiliser `.env.example` comme template.

## 📝 Notes

- Les scripts vérifient que Docker est démarré
- Les attentes sont calibrées pour éviter les erreurs de démarrage
- L'ordre est important pour respecter les dépendances
- Les healthchecks ont 40-60s de grace period (start_period)
- Le restart automatique (restart: on-failure) aide en cas d'échec temporaire

## 🚀 Workflow Complet

```powershell
# 1. Démarrer
.\scripts\start-services.ps1

# 2. Travailler...
# Développer, tester, etc.

# 3. Arrêter proprement
.\scripts\stop-services.ps1

# 4. Redémarrer le lendemain
.\scripts\start-services.ps1
# Vos données sont toujours là! 🎉
```

