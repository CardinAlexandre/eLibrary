# 🔧 Corrections Production - Guide Rapide

## 🎯 Problèmes résolus

Votre application eLibrary avait des problèmes de **résolution DNS** et de **ports** en production, malgré l'utilisation de YARP. Les corrections suivantes ont été appliquées :

### ✅ Ce qui a été corrigé

1. **Gateway YARP** : Ajout de `appsettings.Production.json` avec les bonnes URLs des services
2. **React Frontend** : Correction des URLs en double (`/api/api/...` → `/api/...`)
3. **Docker Compose Production** : Ajout des variables JWT au gateway
4. **Docker Compose Local** : Configuration cohérente avec la production
5. **Documentation** : Architecture réseau et guide de dépannage

---

## 📁 Fichiers modifiés

### Nouveaux fichiers

```
services/gateway/appsettings.Production.json       # Configuration YARP pour production
docs/ARCHITECTURE-RESEAU.md                        # Documentation architecture
docs/TROUBLESHOOTING-PROD.md                       # Guide de dépannage
docs/README-CORRECTIONS-PROD.md                    # Ce fichier
CHANGELOG-PROD-FIXES.md                            # Détails des changements
scripts/validate-production.ps1                    # Script de validation (Windows)
raspberry-pi/scripts/validate-config.sh            # Script de validation (Linux/Pi)
```

### Fichiers modifiés

```
frontend/react/src/store/slices/booksSlice.ts     # API_URL par défaut : '' au lieu de '/api'
frontend/react/src/store/slices/loansSlice.ts     # API_URL par défaut : '' au lieu de '/api'
frontend/react/src/store/slices/authSlice.ts      # API_URL par défaut : '' au lieu de '/api'
docker-compose.pi.yml                              # Ajout variables JWT gateway
docker-compose.postgres-local.yml                  # Cohérence avec production
```

---

## 🚀 Comment déployer les corrections

### Option 1 : Déploiement automatique (via CI/CD)

```bash
# 1. Commit et push les changements
git add .
git commit -m "fix: Corrections DNS et YARP pour production"
git push origin main

# 2. Le workflow CI/CD va automatiquement :
#    - Builder les nouvelles images Docker
#    - Les pousser vers GitHub Container Registry
#    - Watchtower les déploiera automatiquement sur le Raspberry Pi (après 5 min)
```

### Option 2 : Déploiement manuel sur Raspberry Pi

```bash
# 1. Sur le Raspberry Pi, mettre à jour le code
cd /path/to/eLibrary
git pull origin main

# 2. Valider la configuration
cd raspberry-pi
chmod +x scripts/validate-config.sh
./scripts/validate-config.sh

# 3. Mettre à jour les images et redémarrer
./scripts/deploy.sh update
```

### Option 3 : Test local avant déploiement

```bash
# Sur votre machine de développement

# 1. Valider la configuration
.\scripts\validate-production.ps1

# 2. Tester localement
docker compose -f docker-compose.postgres-local.yml up --build

# 3. Vérifier que tout fonctionne
curl http://localhost:8080/health
curl http://localhost:8080/api/catalog/books
curl http://localhost:3000
curl http://localhost:4200
```

---

## ✅ Validation

### Script de validation automatique

**Windows** :
```powershell
.\scripts\validate-production.ps1
```

**Linux/Raspberry Pi** :
```bash
cd raspberry-pi
chmod +x scripts/validate-config.sh
./scripts/validate-config.sh
```

### Validation manuelle

#### 1. Vérifier les fichiers

```bash
# Fichier de configuration YARP
cat services/gateway/appsettings.Production.json

# Vérifier qu'il contient :
# - "Address": "http://catalog-service:80"
# - "Address": "http://auth-service:80"
```

#### 2. Vérifier les URLs React

```bash
# Vérifier que les fichiers contiennent "|| ''" et pas "|| '/api'"
grep "API_URL" frontend/react/src/store/slices/*.ts
```

#### 3. Vérifier Docker Compose

```bash
# Vérifier les variables JWT du gateway
grep -A 5 "gateway:" docker-compose.pi.yml | grep JWT
```

#### 4. Tester la connectivité

```bash
# Gateway
curl http://localhost:8080/health

# API Catalog via Gateway
curl http://localhost:8080/api/catalog/books

# Frontend React
curl http://localhost:3000

# Frontend Angular
curl http://localhost:4200
```

---

## 🔍 Vérification post-déploiement

Une fois déployé en production, vérifiez :

### 1. Services démarrés

```bash
cd raspberry-pi
./scripts/deploy.sh status
```

Tous les services doivent être `Up` et `healthy`.

### 2. Logs du gateway

```bash
./scripts/deploy.sh logs gateway
```

Vérifiez qu'il n'y a pas d'erreurs de connexion aux services backend.

### 3. Tests fonctionnels

```bash
# Remplacer <IP_RASPBERRY_PI> par l'IP de votre Pi
IP=<IP_RASPBERRY_PI>

# Gateway
curl http://$IP:8080/health

# API
curl http://$IP:8080/api/catalog/books

# Frontend React
curl http://$IP:3000

# Frontend Angular
curl http://$IP:4200
```

### 4. Tests depuis le navigateur

- **React** : http://\<IP_RASPBERRY_PI\>:3000
- **Angular** : http://\<IP_RASPBERRY_PI\>:4200
- **RabbitMQ** : http://\<IP_RASPBERRY_PI\>:15672
- **Grafana** : http://\<IP_RASPBERRY_PI\>:3001

---

## 🐛 Dépannage

### Problème : Gateway ne démarre pas

**Logs** :
```bash
./scripts/deploy.sh logs gateway
```

**Cause probable** : Variables JWT manquantes dans `.env`

**Solution** :
```bash
# Vérifier le fichier .env
cat .env | grep JWT_SECRET

# Si manquant, ajouter :
echo "JWT_SECRET=VotreSuperSecretKey2025!" >> .env

# Redémarrer
./scripts/deploy.sh restart
```

### Problème : Erreur 404 sur les API

**Symptôme** : `/api/catalog/books` retourne 404

**Cause probable** : YARP mal configuré

**Solution** :
```bash
# Vérifier la configuration YARP
docker exec elibrary-gateway cat /app/appsettings.Production.json

# Vérifier les logs
docker logs elibrary-gateway | grep -i yarp
```

### Problème : Frontend ne peut pas atteindre l'API

**Symptôme** : Console du navigateur montre `ERR_CONNECTION_REFUSED`

**Cause probable** : Problème de proxy Nginx

**Solution** :
```bash
# Vérifier la config nginx
docker exec elibrary-frontend-react cat /etc/nginx/conf.d/default.conf

# Tester depuis le conteneur
docker exec elibrary-frontend-react wget -O- http://gateway:80/health
```

---

## 📚 Documentation complète

Pour plus de détails, consultez :

- **Architecture** : `docs/ARCHITECTURE-RESEAU.md`
- **Dépannage** : `docs/TROUBLESHOOTING-PROD.md`
- **Changelog** : `CHANGELOG-PROD-FIXES.md`

---

## 💡 Astuces

### Développement local

Pour tester en local avant de déployer :

```bash
# Build et démarrage
docker compose -f docker-compose.postgres-local.yml up --build

# En cas d'erreur, rebuild complètement
docker compose -f docker-compose.postgres-local.yml down -v
docker compose -f docker-compose.postgres-local.yml up --build
```

### Production sur Raspberry Pi

```bash
# Accès SSH
ssh pi@<IP_RASPBERRY_PI>

# Aller dans le projet
cd /path/to/eLibrary

# Voir tous les services
cd raspberry-pi
./scripts/deploy.sh status

# Logs d'un service spécifique
./scripts/deploy.sh logs catalog-service

# Redémarrer un service
docker compose -f docker-compose.pi.yml restart gateway
```

### Monitoring

- **Prometheus** : http://\<IP\>:9090
- **Grafana** : http://\<IP\>:3001
  - Login : `admin`
  - Password : (défini dans `.env` → `GRAFANA_PASSWORD`)

---

## ✨ Résumé des changements techniques

### Avant ❌

```typescript
// React
const API_URL = '/api';
axios.get(`${API_URL}/api/catalog/books`);
// → /api/api/catalog/books (ERREUR!)
```

```yaml
# docker-compose.pi.yml
gateway:
  environment:
    - ASPNETCORE_ENVIRONMENT=Production
    # JWT manquant !
```

### Après ✅

```typescript
// React
const API_URL = '';
axios.get(`${API_URL}/api/catalog/books`);
// → /api/catalog/books (CORRECT!)
```

```yaml
# docker-compose.pi.yml
gateway:
  environment:
    - ASPNETCORE_ENVIRONMENT=Production
    - JwtSettings__Secret=${JWT_SECRET}
```

```json
// appsettings.Production.json
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

---

## 🎉 C'est tout !

Votre application eLibrary est maintenant correctement configurée pour la production avec YARP et Docker. Les problèmes de résolution DNS et de ports sont résolus.

**Bon déploiement ! 🚀**

