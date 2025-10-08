# 🌐 Architecture Réseau et Résolution DNS - eLibrary

## 📋 Vue d'ensemble

Ce document explique comment la résolution DNS et le routage des requêtes fonctionnent dans l'architecture eLibrary, en particulier avec YARP (Yet Another Reverse Proxy) pour le gateway.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Navigateur │────▶│   Frontend   │────▶│   Gateway   │
│             │     │ (React/Ang.) │     │    (YARP)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                      │
                           │                      ├──▶ Catalog Service
                           │                      ├──▶ Auth Service
                           │                      ├──▶ Importer Service
                           └──────────────────────┴──▶ Recommender Service
```

## 🔄 Flux de requête

### 1️⃣ Requête depuis le navigateur
```
Utilisateur : http://localhost:3000/api/catalog/books
```

### 2️⃣ Requête interceptée par Nginx (Frontend)
Le conteneur frontend utilise Nginx qui intercepte les requêtes `/api/*` :

```nginx
location /api {
    proxy_pass http://gateway:80;
    ...
}
```

**Important** : `gateway` est le nom DNS du service Docker, **pas** le nom du conteneur !

### 3️⃣ Gateway YARP route vers les services
Le gateway utilise YARP pour router les requêtes vers les microservices :

```
/api/catalog/*      → http://catalog-service:80
/api/auth/*         → http://auth-service:80
/api/importer/*     → http://importer-service:80
/api/recommendations/* → http://recommender-service:80
```

## 🐳 Résolution DNS Docker

Dans Docker Compose, chaque service obtient automatiquement un nom DNS basé sur le **nom du service** (pas le nom du conteneur) :

| Service Docker | Nom DNS | Nom du conteneur | Accessible via |
|---------------|---------|------------------|----------------|
| `gateway` | `gateway` | `elibrary-gateway` | `http://gateway:80` |
| `catalog-service` | `catalog-service` | `elibrary-catalog` | `http://catalog-service:80` |
| `auth-service` | `auth-service` | `elibrary-auth` | `http://auth-service:80` |
| `frontend-react` | `frontend-react` | `elibrary-frontend-react` | `http://frontend-react:80` |

⚠️ **Attention** : Utilisez toujours le **nom du service**, pas le nom du conteneur !

## 📁 Configuration des composants

### Frontend (React/Angular)

#### Code source
```typescript
// ✅ CORRECT - URL relative, le proxy Nginx s'en occupe
const API_URL = process.env.REACT_APP_API_URL || '';
axios.get(`${API_URL}/api/catalog/books`);
// Résultat : GET /api/catalog/books
```

```typescript
// ❌ INCORRECT - Duplication de /api
const API_URL = process.env.REACT_APP_API_URL || '/api';
axios.get(`${API_URL}/api/catalog/books`);
// Résultat : GET /api/api/catalog/books (ERREUR!)
```

#### nginx.conf
```nginx
server {
    listen 80;
    
    # Proxy toutes les requêtes /api vers le gateway
    location /api {
        proxy_pass http://gateway:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Gateway (YARP)

#### appsettings.Production.json
```json
{
  "ReverseProxy": {
    "Routes": {
      "catalog-route": {
        "ClusterId": "catalog",
        "Match": {
          "Path": "/api/catalog/{**catch-all}"
        }
      }
    },
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

#### Variables d'environnement (docker-compose)
```yaml
gateway:
  environment:
    - ASPNETCORE_ENVIRONMENT=Production
    - JwtSettings__Secret=${JWT_SECRET}
    - JwtSettings__Issuer=eLibrary-API
```

**Note** : Les URLs des services backend sont définies dans `appsettings.json` et utilisent les noms DNS Docker.

## 🔧 Problèmes courants et solutions

### ❌ Problème 1 : "Connection refused" depuis le gateway

**Symptôme** : Le gateway ne peut pas atteindre les services backend.

**Cause** : Utilisation du nom du conteneur au lieu du nom du service.

**Solution** :
```yaml
# ❌ INCORRECT
Address: "http://elibrary-catalog:80"

# ✅ CORRECT
Address: "http://catalog-service:80"
```

### ❌ Problème 2 : Routes dupliquées "/api/api/..."

**Symptôme** : Les requêtes frontend arrivent avec `/api/api/...` au lieu de `/api/...`.

**Cause** : Duplication de `/api` dans le code frontend.

**Solution** :
```typescript
// ✅ CORRECT
const API_URL = '';
axios.get(`${API_URL}/api/catalog/books`);
```

### ❌ Problème 3 : "localhost" ne fonctionne pas depuis un conteneur

**Symptôme** : Les frontends ne peuvent pas atteindre le gateway avec `http://localhost:8080`.

**Cause** : `localhost` dans un conteneur pointe vers le conteneur lui-même, pas vers l'hôte.

**Solution** : Utiliser le proxy Nginx avec le nom DNS Docker :
```nginx
location /api {
    proxy_pass http://gateway:80;  # ✅ Nom DNS Docker
}
```

## 📦 Build et déploiement

### Build local (développement)
```bash
docker compose -f docker-compose.postgres-local.yml up --build
```

Les ARG de build sont passés lors de la construction :
```yaml
frontend-react:
  build:
    args:
      - REACT_APP_API_URL=  # URL relative (vide)
```

### Déploiement production (Raspberry Pi)
```bash
cd raspberry-pi
./scripts/deploy.sh start
```

Les images sont pré-buildées et téléchargées depuis GitHub Container Registry.

## 🧪 Tests de connectivité

### Depuis votre ordinateur
```bash
# Frontend React
curl http://localhost:3000

# Frontend Angular
curl http://localhost:4200

# Gateway
curl http://localhost:8080/health

# API via Gateway
curl http://localhost:8080/api/catalog/books
```

### Depuis un conteneur
```bash
# Se connecter au conteneur gateway
docker exec -it elibrary-gateway sh

# Tester la connectivité vers catalog-service
wget -O- http://catalog-service:80/health
```

## 📚 Références

- [YARP Documentation](https://microsoft.github.io/reverse-proxy/)
- [Docker Networking](https://docs.docker.com/network/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

## 🔄 Dernière mise à jour

Date : 2025-10-08
Version : 2.0 avec PostgreSQL et YARP

