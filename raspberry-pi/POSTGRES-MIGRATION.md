

# 🐘 Migration vers PostgreSQL pour Raspberry Pi

Guide complet pour migrer de SQL Server vers PostgreSQL, optimisé pour Raspberry Pi.

## 🎯 Pourquoi PostgreSQL ?

### Comparaison des ressources sur Raspberry Pi 4 (4GB)

| Métrique | SQL Server Edge | PostgreSQL | Gain |
|----------|-----------------|------------|------|
| **RAM au repos** | 2-4 GB 🔴 | 100-300 MB ✅ | **90% moins** |
| **Taille image** | 1.5 GB 🔴 | 80 MB ✅ | **95% moins** |
| **CPU idle** | 15-20% 🔴 | 1-3% ✅ | **85% moins** |
| **Température** | 65-75°C 🔥 | 40-50°C ❄️ | **-20°C** |
| **Démarrage** | 30-60s ⏱️ | 2-5s ⚡ | **10x plus rapide** |
| **Compatibilité ARM** | ⚠️ Problématique | ✅ Excellent | - |

**Résultat** : PostgreSQL est **PARFAIT** pour Raspberry Pi ! 🎉

## 🔧 Modifications nécessaires

### 1. Mettre à jour les packages NuGet

Pour chaque service (.NET), remplacer le provider SQL Server par PostgreSQL :

```bash
# Retirer SQL Server
dotnet remove package Microsoft.EntityFrameworkCore.SqlServer

# Ajouter PostgreSQL
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.0
```

**Services à modifier** :
- ✅ `catalog-service/CatalogService.csproj`
- ✅ `auth-service/AuthService.csproj`
- ✅ `recommender-service/RecommenderService.csproj`

### 2. Mettre à jour les DbContext

#### Dans `Program.cs` de chaque service :

**Avant (SQL Server)** :
```csharp
builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**Après (PostgreSQL)** :
```csharp
builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 3. Mettre à jour les chaînes de connexion

**Avant (SQL Server)** :
```
Server=sqlserver;Database=CatalogDb;User Id=sa;Password=XXX;TrustServerCertificate=True;
```

**Après (PostgreSQL)** :
```
Host=postgres;Database=CatalogDb;Username=elibrary;Password=XXX
```

### 4. Recréer les migrations

Les migrations SQL Server ne sont pas compatibles avec PostgreSQL.

```bash
# Pour chaque service
cd services/catalog-service

# Supprimer les anciennes migrations
rm -rf Migrations/

# Créer les nouvelles migrations PostgreSQL
dotnet ef migrations add InitialCreate

# Vérifier
dotnet ef migrations list
```

### 5. Adapter les types de données spécifiques

Certains types SQL Server doivent être adaptés :

| SQL Server | PostgreSQL | Action |
|------------|------------|--------|
| `nvarchar(max)` | `text` | Auto-converti ✅ |
| `datetime2` | `timestamp` | Auto-converti ✅ |
| `uniqueidentifier` | `uuid` | Auto-converti ✅ |
| `varbinary(max)` | `bytea` | Auto-converti ✅ |
| `GETDATE()` | `NOW()` | À modifier dans le code |

**La plupart sont auto-convertis par Entity Framework Core !** ✅

## 📦 Installation rapide

J'ai déjà créé la configuration PostgreSQL optimisée :

### Sur le Raspberry Pi :

```bash
# 1. Mettre à jour le repository
git pull origin main

# 2. Arrêter l'ancienne configuration (si en cours)
docker compose -f docker-compose.pi-prod.yml down

# 3. Utiliser la nouvelle configuration PostgreSQL
./raspberry-pi/scripts/deploy-postgres.sh start
```

## 🚀 Utilisation

### Démarrer avec PostgreSQL

```bash
./raspberry-pi/scripts/deploy-postgres.sh start
```

### Vérifier PostgreSQL

```bash
# Se connecter au conteneur
docker exec -it elibrary-postgres psql -U elibrary -d eLibraryDb

# Lister les bases de données
\l

# Lister les tables (une fois les services démarrés)
\c CatalogDb
\dt

# Quitter
\q
```

### Backup PostgreSQL

```bash
# Backup de toutes les bases
docker exec elibrary-postgres pg_dumpall -U elibrary > backup-$(date +%Y%m%d).sql

# Restore
cat backup-20251008.sql | docker exec -i elibrary-postgres psql -U elibrary
```

## 📊 Performance attendue

Sur un Raspberry Pi 4 (4GB) avec PostgreSQL :

- **RAM utilisée totale** : 1.5-2GB (au lieu de 3.5GB+)
- **Temps de démarrage** : 30-45 secondes (au lieu de 2-3 minutes)
- **Température moyenne** : 45-55°C (au lieu de 70-80°C)
- **CPU idle** : 5-10% (au lieu de 20-30%)
- **Durée de vie SD card** : Augmentée (moins d'écritures)

## 🔄 Migration des données existantes

Si vous avez déjà des données dans SQL Server :

### Option 1 : Utiliser pgloader (recommandé)

```bash
# Installer pgloader
sudo apt install pgloader -y

# Créer un fichier de configuration
cat > migrate.load << 'EOF'
LOAD DATABASE
     FROM mssql://sa:PASSWORD@sqlserver/CatalogDb
     INTO postgresql://elibrary:PASSWORD@postgres/CatalogDb

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '256 MB', maintenance_work_mem to '512 MB';
EOF

# Exécuter la migration
pgloader migrate.load
```

### Option 2 : Export/Import manuel

```bash
# 1. Exporter depuis SQL Server (format CSV)
# 2. Importer dans PostgreSQL
# 3. Ajuster les séquences
```

### Option 3 : Recommencer à zéro

```bash
# Utiliser le seeder de données
docker compose -f docker-compose.pi-postgres.yml exec catalog-service \
    dotnet run -- seed
```

## ⚙️ Optimisations PostgreSQL pour Raspberry Pi

Le fichier `docker-compose.pi-postgres.yml` inclut déjà des optimisations :

```yaml
command: >
  postgres
  -c shared_buffers=256MB        # Mémoire partagée
  -c effective_cache_size=512MB  # Cache estimé
  -c work_mem=4MB                # Mémoire par opération
  -c maintenance_work_mem=64MB   # Maintenance
  -c max_connections=100         # Connexions max
```

Ces paramètres sont optimisés pour un Raspberry Pi avec 4GB de RAM.

## 🔧 Ajustements selon votre matériel

### Raspberry Pi 4 (8GB)

Augmentez les paramètres :
```yaml
-c shared_buffers=512MB
-c effective_cache_size=1GB
-c work_mem=8MB
```

### Raspberry Pi 4 (2GB)

Réduisez les paramètres :
```yaml
-c shared_buffers=128MB
-c effective_cache_size=256MB
-c work_mem=2MB
-c max_connections=50
```

## ✅ Checklist de migration

- [ ] Packages NuGet PostgreSQL ajoutés à tous les services
- [ ] `UseSqlServer()` remplacé par `UseNpgsql()` dans Program.cs
- [ ] Chaînes de connexion mises à jour
- [ ] Migrations recréées pour PostgreSQL
- [ ] Script `init-databases.sql` vérifié
- [ ] Configuration testée localement
- [ ] Données migrées ou seedées
- [ ] Services démarrés avec succès
- [ ] Tests fonctionnels passés

## 📚 Ressources

- [Npgsql Documentation](https://www.npgsql.org/efcore/)
- [PostgreSQL on Raspberry Pi](https://pimylifeup.com/raspberry-pi-postgresql/)
- [Entity Framework Core with PostgreSQL](https://learn.microsoft.com/en-us/ef/core/providers/npgsql/)

## 🎉 Résultat final

Avec PostgreSQL, votre Raspberry Pi :
- ❄️ Reste frais (moins de 50°C)
- ⚡ Démarre rapidement (30 secondes)
- 💾 Utilise moins de RAM (1.5GB au total)
- 🔋 Consomme moins d'énergie
- 💪 Peut gérer plus de charge
- ⏱️ Répond plus rapidement aux requêtes

**PostgreSQL est THE way to go pour Raspberry Pi !** 🐘🍓

