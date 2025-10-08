# 🔧 Guide de dépannage - Production eLibrary

## 🚨 Problèmes de résolution DNS et ports

### Symptômes courants

1. **Gateway ne peut pas atteindre les services backend**
   - Erreur : `Connection refused` ou `Name resolution failure`
   - Log : `Failed to connect to catalog-service`

2. **Erreur 404 sur les requêtes API**
   - URL : `/api/api/catalog/books` (double `/api`)
   - Erreur : `Route not found`

3. **Frontend ne peut pas atteindre le gateway**
   - Erreur : `Network Error` ou `ERR_CONNECTION_REFUSED`
   - Requête : `http://localhost:8080/api/...`

---

## ✅ Solutions

### 1️⃣ Vérifier les noms DNS Docker

**Commande** :
```bash
# Lister tous les services en cours
docker compose -f docker-compose.pi.yml ps

# Vérifier les noms de services dans le réseau
docker network inspect elibrary_elibrary-network | grep Name
```

**Vérification** :
- ✅ Utiliser `catalog-service`, pas `elibrary-catalog`
- ✅ Utiliser `auth-service`, pas `elibrary-auth`
- ✅ Utiliser `gateway`, pas `elibrary-gateway`

**Fichiers concernés** :
- `services/gateway/appsettings.Production.json` → Configuration YARP
- `frontend/*/nginx.conf` → Proxy pass vers gateway

---

### 2️⃣ Tester la connectivité entre conteneurs

**Depuis le conteneur gateway** :
```bash
# Se connecter au conteneur
docker exec -it elibrary-gateway sh

# Installer wget si nécessaire
apk add --no-cache wget

# Tester catalog-service
wget -O- http://catalog-service:80/health

# Tester auth-service
wget -O- http://auth-service:80/health
```

**Résultats attendus** :
```
HTTP/1.1 200 OK
Healthy
```

---

### 3️⃣ Vérifier les logs du gateway

```bash
# Logs en temps réel
docker logs -f elibrary-gateway

# Filtrer les erreurs YARP
docker logs elibrary-gateway 2>&1 | grep -i "yarp\|error\|failed"
```

**Logs normaux** :
```
[INFO] Yarp.ReverseProxy: Proxy started
[INFO] Loaded cluster 'catalog' with destination http://catalog-service:80
```

**Logs d'erreur** :
```
[ERROR] Failed to proxy request to http://catalog-service:80
[ERROR] No healthy destinations available for cluster 'catalog'
```

---

### 4️⃣ Vérifier la configuration YARP

**Fichier** : `services/gateway/appsettings.Production.json`

**Configuration correcte** :
```json
{
  "ReverseProxy": {
    "Clusters": {
      "catalog": {
        "Destinations": {
          "destination1": {
            "Address": "http://catalog-service:80"
          }
        }
      }
    }
  }
}
```

**Variables d'environnement** (si override nécessaire) :
```yaml
gateway:
  environment:
    # Format : ReverseProxy__Clusters__<nom>__Destinations__<dest>__Address
    - ReverseProxy__Clusters__catalog__Destinations__destination1__Address=http://catalog-service:80
```

---

### 5️⃣ Vérifier les routes YARP

**Commande** :
```bash
# Tester une route directement
curl -v http://localhost:8080/api/catalog/books
```

**Réponse attendue** :
```
< HTTP/1.1 200 OK
< Content-Type: application/json
{
  "items": [...],
  "totalCount": 42
}
```

**En cas d'erreur 404** :
- Vérifier que le path dans `appsettings.json` correspond : `/api/catalog/{**catch-all}`
- Vérifier les Transform si présents

---

### 6️⃣ Vérifier les frontends

**Test nginx.conf** :
```bash
# Se connecter au conteneur frontend
docker exec -it elibrary-frontend-react sh

# Tester la configuration nginx
nginx -t

# Vérifier le proxy_pass
cat /etc/nginx/conf.d/default.conf | grep proxy_pass
```

**Configuration attendue** :
```nginx
location /api {
    proxy_pass http://gateway:80;
}
```

**Test de connectivité** :
```bash
# Depuis le conteneur frontend
wget -O- http://gateway:80/health
```

---

### 7️⃣ Vérifier les ports exposés

**Commande** :
```bash
docker compose -f docker-compose.pi.yml ps
```

**Ports attendus** :
```
elibrary-gateway          0.0.0.0:8080->80/tcp
elibrary-frontend-react   0.0.0.0:3000->80/tcp
elibrary-frontend-angular 0.0.0.0:4200->80/tcp
```

**Test depuis l'hôte** :
```bash
# Test gateway
curl http://localhost:8080/health

# Test frontend React
curl http://localhost:3000

# Test API via gateway
curl http://localhost:8080/api/catalog/books
```

---

## 🔍 Diagnostic avancé

### Inspecter le réseau Docker

```bash
# Lister les réseaux
docker network ls

# Inspecter le réseau eLibrary
docker network inspect elibrary_elibrary-network

# Vérifier que tous les conteneurs sont sur le même réseau
docker inspect elibrary-gateway | grep -A 20 Networks
docker inspect elibrary-catalog | grep -A 20 Networks
```

### Capturer le trafic réseau

```bash
# Installer tcpdump dans le conteneur
docker exec -it elibrary-gateway sh
apk add --no-cache tcpdump

# Capturer le trafic vers catalog-service
tcpdump -i any host catalog-service -vv
```

### Vérifier les variables d'environnement

```bash
# Gateway
docker exec elibrary-gateway printenv | grep -E "JWT|ASPNET|ReverseProxy"

# Catalog Service
docker exec elibrary-catalog printenv | grep -E "ConnectionStrings|RabbitMQ"
```

---

## 🚀 Redémarrage et mise à jour

### Redémarrer un service spécifique

```bash
# Gateway uniquement
docker compose -f docker-compose.pi.yml restart gateway

# Catalog service uniquement
docker compose -f docker-compose.pi.yml restart catalog-service
```

### Forcer la mise à jour des images

```bash
# Avec le script de déploiement
cd raspberry-pi
./scripts/deploy.sh update

# Manuellement
docker compose -f docker-compose.pi.yml pull
docker compose -f docker-compose.pi.yml up -d
```

### Reconstruire en cas de changement de configuration

```bash
# Arrêter tous les services
docker compose -f docker-compose.pi.yml down

# Supprimer les volumes (⚠️ DANGER : perte de données)
docker compose -f docker-compose.pi.yml down -v

# Redémarrer
docker compose -f docker-compose.pi.yml up -d
```

---

## 📋 Checklist de diagnostic

- [ ] Tous les services sont démarrés (`docker compose ps`)
- [ ] Les health checks sont OK (`docker compose ps` colonne STATUS)
- [ ] Les noms DNS correspondent aux noms de services
- [ ] Les ports sont correctement exposés
- [ ] Les logs ne montrent pas d'erreurs de connexion
- [ ] Les variables d'environnement JWT sont définies
- [ ] Les frontends utilisent des URLs relatives (`/api/...`)
- [ ] Nginx proxy vers `http://gateway:80`
- [ ] YARP route vers `http://catalog-service:80`, etc.

---

## 🆘 Besoin d'aide supplémentaire ?

1. **Vérifier les logs complets** :
   ```bash
   docker compose -f docker-compose.pi.yml logs > logs.txt
   ```

2. **Vérifier les issues GitHub** du projet

3. **Consulter la documentation** :
   - `docs/ARCHITECTURE-RESEAU.md`
   - `raspberry-pi/README.md`
   - `raspberry-pi/DIAGNOSTIC.md`

---

## 📅 Dernière mise à jour

Date : 2025-10-08
Version : 2.0 - Corrections DNS et YARP

