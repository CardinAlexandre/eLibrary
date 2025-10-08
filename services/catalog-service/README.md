# Catalog Service

Service de gestion du catalogue pour eLibrary.

## Configuration de la base de données

### Développement local

Les identifiants de connexion à la base de données sont stockés de manière sécurisée dans un fichier `.env` à la racine du projet (ignoré par Git).

**Configuration initiale :**

1. À la racine du projet, copiez le fichier template :
```bash
cd C:\Dev\eLibrary
cp .env.example .env
```

2. Modifiez le fichier `.env` à la racine avec vos identifiants :
```
DB_CONNECTION_STRING=Server=localhost,1433;Database=CatalogDb;User Id=sa;Password=VOTRE_MOT_DE_PASSE;TrustServerCertificate=True;
```

Le fichier `.env` est automatiquement ignoré par Git et ne sera jamais commité.

**Note :** Le fichier `.env` doit être à la racine du projet (`C:\Dev\eLibrary\.env`), pas dans le dossier du service.

### Production

En production, définissez la variable d'environnement `DB_CONNECTION_STRING` :

**Linux/macOS :**
```bash
export DB_CONNECTION_STRING="Server=prod-server;Database=CatalogDb;User Id=prod-user;Password=PROD_PASSWORD;TrustServerCertificate=False;"
```

**Windows PowerShell :**
```powershell
$env:DB_CONNECTION_STRING="Server=prod-server;Database=CatalogDb;User Id=prod-user;Password=PROD_PASSWORD;TrustServerCertificate=False;"
```

**Azure App Service (Configuration) :**
- Nom : `DB_CONNECTION_STRING`
- Valeur : votre chaîne de connexion de production
- Type : Application Setting

**Docker :**
```yaml
environment:
  - DB_CONNECTION_STRING=Server=prod-server;Database=CatalogDb;User Id=prod-user;Password=PROD_PASSWORD;TrustServerCertificate=False;
```

## Démarrage

```bash
dotnet run
```

L'API Swagger sera disponible à : https://localhost:7196/swagger

## Sécurité

⚠️ **Important** : 
- Ne commitez **JAMAIS** le fichier `.env` dans le code source
- Le fichier `.env.example` est un template sans identifiants réels
- Utilisez toujours des variables d'environnement pour la production
- Pour la production, utilisez un service de gestion des secrets (Azure Key Vault, AWS Secrets Manager, etc.)

