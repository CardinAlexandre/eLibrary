# eLibrary
Full-stack library management platform featuring .NET 8 microservices, CQRS, event-driven architecture, dual frontends (React/Angular), Docker, Terraform &amp; CI/CD

## Configuration

### Variables d'environnement

Le projet utilise un fichier `.env` à la racine pour stocker les configurations sensibles (chaînes de connexion, clés API, etc.).

**Configuration initiale :**

1. Copiez le fichier template :
```bash
cp .env.example .env
```

2. Modifiez le fichier `.env` avec vos propres valeurs :
```env
DB_CONNECTION_STRING=Server=localhost,1433;Database=CatalogDb;User Id=VOTRE_USER;Password=VOTRE_PASSWORD;TrustServerCertificate=True;
```

⚠️ **Important** : Le fichier `.env` est ignoré par Git et ne doit jamais être commité. Utilisez `.env.example` comme template.

## Services

- **catalog-service** : Service de gestion du catalogue - voir [README](services/catalog-service/README.md)
