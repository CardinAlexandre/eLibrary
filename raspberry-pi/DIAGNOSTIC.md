# 🔍 Guide de diagnostic Raspberry Pi

Guide rapide pour diagnostiquer les problèmes sur votre Raspberry Pi en production.

## 🚀 Commandes de diagnostic rapide

### 1. Vérifier l'état de tous les conteneurs

```bash
cd ~/eLibrary
docker compose -f docker-compose.pi.yml ps
```

**Résultat attendu** : Tous les conteneurs doivent être "Up" et "healthy"

### 2. Vérifier les logs du gateway

```bash
docker logs elibrary-gateway --tail 50
```

### 3. Tester le health check du gateway

```bash
curl http://localhost:8080/health
# Devrait retourner: Healthy
```

### 4. Tester l'endpoint catalog via le gateway

```bash
curl http://localhost:8080/api/catalog/books?page=1&pageSize=20
```

### 5. Tester directement le catalog-service (bypass gateway)

```bash
docker exec -it elibrary-catalog curl http://localhost:80/api/books?page=1&pageSize=20
```

## 🐛 Problèmes courants

### Problème : "Connection refused" port 5000

**Cause** : Le port du gateway a été changé de 5000 à 8080

**Solution** :
```bash
# Utiliser le port 8080 au lieu de 5000
curl http://192.168.1.11:8080/api/catalog/books
```

**Mettre à jour dans le frontend** :
```bash
# Dans .env sur le Pi
API_GATEWAY_URL=http://192.168.1.11:8080
```

### Problème : "404 Not Found" sur /api/catalog/books

**Cause** : YARP routing mal configuré ou service catalog non démarré

**Diagnostic** :
```bash
# 1. Vérifier que catalog-service tourne
docker ps | grep catalog

# 2. Vérifier les logs du gateway
docker logs elibrary-gateway | grep catalog

# 3. Tester directement catalog-service
curl http://192.168.1.11:5001/api/books
```

**Solution** :
```bash
# Redémarrer les services
./raspberry-pi/scripts/deploy.sh restart
```

### Problème : "CORS error" depuis le frontend

**Cause** : Le gateway bloque les requêtes cross-origin

**Vérifier** :
```bash
# Voir les logs du navigateur (F12 → Console)
# Chercher : "Access-Control-Allow-Origin"
```

**Solution** : Le gateway doit avoir CORS activé (normalement déjà configuré)

### Problème : Gateway healthy mais pas de réponse

**Diagnostic** :
```bash
# Voir toutes les routes configurées
docker exec -it elibrary-gateway cat /app/appsettings.json | grep -A 5 "catalog-route"

# Tester la connectivité réseau interne
docker exec -it elibrary-gateway curl http://catalog-service:80/health
```

## 📋 Checklist de vérification

Sur le Raspberry Pi `192.168.1.11` :

### Conteneurs

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Tous doivent être "Up" :
- [ ] elibrary-postgres
- [ ] elibrary-redis
- [ ] elibrary-rabbitmq
- [ ] elibrary-gateway (port 8080)
- [ ] elibrary-catalog
- [ ] elibrary-auth
- [ ] elibrary-importer
- [ ] elibrary-recommender
- [ ] elibrary-frontend-react (port 3000)
- [ ] elibrary-frontend-angular (port 4200)
- [ ] elibrary-watchtower

### Ports ouverts

```bash
# Vérifier les ports en écoute
netstat -tuln | grep -E ':(8080|3000|4200|5432|6379|15672)'
```

### URLs à tester

Depuis un navigateur :

- [ ] http://192.168.1.11:3000 → React Frontend
- [ ] http://192.168.1.11:4200 → Angular Frontend
- [ ] http://192.168.1.11:8080/health → Gateway health
- [ ] http://192.168.1.11:8080/api/catalog/books → Catalog API
- [ ] http://192.168.1.11:15672 → RabbitMQ Management

### Depuis le frontend

Vérifier que l'URL de l'API est correcte :

```bash
# Dans le navigateur (F12 → Network)
# Les requêtes doivent aller vers :
# http://192.168.1.11:8080/api/...
```

## 🔧 Solutions rapides

### Redémarrer tout proprement

```bash
cd ~/eLibrary
./raspberry-pi/scripts/deploy.sh stop
./raspberry-pi/scripts/deploy.sh start
```

### Mettre à jour les images

```bash
./raspberry-pi/scripts/deploy.sh update
```

### Voir les logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.pi.yml logs -f

# Gateway seulement
docker logs -f elibrary-gateway

# Catalog seulement
docker logs -f elibrary-catalog
```

### Tester la requête correcte

```bash
# Depuis le Raspberry Pi
curl 'http://localhost:8080/api/catalog/books?page=1&pageSize=20'

# Depuis ta machine Windows
curl 'http://192.168.1.11:8080/api/catalog/books?page=1&pageSize=20'
```

## 🌐 Configuration du frontend

Si le frontend utilise encore le mauvais port :

### Sur le Raspberry Pi, vérifier .env :

```bash
cat .env | grep API_GATEWAY_URL
```

**Devrait être** :
```
API_GATEWAY_URL=http://192.168.1.11:8080
```

**Si incorrect, modifier** :
```bash
nano .env
# Changer tous les 5000 en 8080
```

**Puis redémarrer les frontends** :
```bash
docker compose -f docker-compose.pi.yml restart frontend-react frontend-angular
```

## 🔍 Debug avancé

### Vérifier la configuration YARP du gateway

```bash
docker exec -it elibrary-gateway cat /app/appsettings.json
```

### Vérifier que les services peuvent se parler

```bash
# Depuis le gateway, tester catalog
docker exec -it elibrary-gateway curl http://catalog-service:80/health

# Devrait retourner: Healthy
```

### Vérifier PostgreSQL

```bash
# Se connecter à PostgreSQL
docker exec -it elibrary-postgres psql -U elibrary -d CatalogDb

# Lister les tables
\dt

# Compter les livres
SELECT COUNT(*) FROM "Books";

# Quitter
\q
```

## 📞 Si rien ne fonctionne

```bash
# 1. Sauvegarder les logs
docker compose -f docker-compose.pi.yml logs > ~/debug-logs.txt

# 2. Vérifier la configuration
cat .env

# 3. Redémarrer complètement
docker compose -f docker-compose.pi.yml down
docker compose -f docker-compose.pi.yml up -d

# 4. Attendre 1-2 minutes
sleep 120

# 5. Retester
curl http://localhost:8080/api/catalog/books
```

## ✅ Requête correcte pour ta Pi

Depuis ta machine Windows vers ta Pi `192.168.1.11` :

```bash
curl 'http://192.168.1.11:8080/api/catalog/books?page=1&pageSize=20' `
  -H 'Accept: application/json'
```

Note le port **8080** au lieu de 5000 !

