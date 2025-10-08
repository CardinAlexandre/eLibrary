-- Script d'initialisation PostgreSQL pour eLibrary
-- Crée les bases de données pour chaque service

-- Base de données pour le service Catalog
CREATE DATABASE "CatalogDb"
    WITH 
    OWNER = elibrary
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Base de données pour le service Auth
CREATE DATABASE "AuthDb"
    WITH 
    OWNER = elibrary
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Base de données pour le service Recommender
CREATE DATABASE "RecommenderDb"
    WITH 
    OWNER = elibrary
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Afficher les bases de données créées
\l

