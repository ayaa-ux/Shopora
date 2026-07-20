#!/bin/bash
set -e

# Ce script s'exécute UNE SEULE FOIS, au premier démarrage du conteneur PostgreSQL.
# Il crée une base de données distincte pour chaque microservice
# (principe "Database per Service" malgré un seul conteneur Postgres).

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE shopora_auth;
    CREATE DATABASE shopora_catalog;
    CREATE DATABASE shopora_groupbuying;
    CREATE DATABASE shopora_ai;
EOSQL

# L'assistant IA a besoin de pgvector pour stocker les embeddings (LangChain).
# On active l'extension uniquement sur sa base dédiée.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "shopora_ai" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL