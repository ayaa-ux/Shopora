# ShopOra

Plateforme e-commerce à architecture **microservices** : comparateur de prix, achats groupés avec pré-autorisation de paiement, commandes, tableau de bord vendeur et administrateur, et assistant IA (RAG) qui recommande des produits.

## Architecture

| Service | Port | Rôle |
|---|---|---|
| `api-gateway` | 8080 | Point d'entrée unique (Spring Cloud Gateway), CORS, routage |
| `auth-service` | 8081 | Inscription, connexion, JWT, administration des utilisateurs |
| `catalog-service` | 8082 | Produits, offres des vendeurs, stock, statistiques catalogue |
| `groupbuying-service` | 8083 | Sessions d'achat groupé, participations, WebSocket |
| `ai-assistant-service` | 8084 | Assistant IA : embeddings locaux (pgvector) + LLM |
| `order-service` | 8085 | Commandes, suivi par vendeur, statistiques de ventes |
| `postgres-db` | 5432 | PostgreSQL + pgvector (une base par service) |
| `shopora-frontend` | 5173 | React + Vite + Tailwind |

Rôles : `CLIENT`, `VENDOR`, `ADMIN`. Chaque service valide lui-même le JWT (secret partagé `JWT_SECRET`).
Les appels internes entre services (réservation de stock, indexation IA) utilisent la clé `INTERNAL_API_KEY`, que la gateway retire des requêtes externes.

## Prérequis

- Docker Desktop
- Node.js 18+ (pour le frontend)

## Démarrage

1. Copier la configuration et renseigner les valeurs :
   ```
   cd shopora-backend
   copy .env.example .env
   ```
   Variables : `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` (>= 32 caractères), `INTERNAL_API_KEY`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.
   `.env` ne doit **jamais** être commité.

2. Lancer le backend :
   ```
   docker compose up -d --build
   ```
   > Les bases sont créées au premier démarrage du volume. Si le volume existait avant l'ajout d'un service, créer la base à la main :
   > `docker compose exec postgres-db psql -U <POSTGRES_USER> -c "CREATE DATABASE shopora_orders;"`

3. Lancer le frontend :
   ```
   cd shopora-frontend
   npm install
   npm run dev
   ```
   Ouvrir http://localhost:5173

## Créer un administrateur

S'inscrire normalement, puis promouvoir le compte :
```
docker compose exec postgres-db psql -U <POSTGRES_USER> -d shopora_auth -c "UPDATE users SET role='ADMIN' WHERE email='votre@email';"
```
Se reconnecter, puis ouvrir `/admin`.

## Assistant IA

Le chat utilise toute API compatible OpenAI (ex. Groq) configurée via `AI_*`. Les embeddings sont calculés localement (modèle all-MiniLM-L6-v2, dimension 384).
Après un import de produits, un administrateur peut réindexer depuis l'onglet **Produits** (bouton « Réindexer l'assistant IA »).

## Sécurité

- Mots de passe hachés (BCrypt), JWT signé, autorisations par rôle (`@PreAuthorize`).
- Les prix et vendeurs d'une commande sont relus côté serveur depuis le catalogue (jamais fiés au navigateur).
- Le stock est réservé de façon atomique (`UPDATE ... WHERE stock >= quantité`) ; il est rendu si la commande échoue.
- Paiement : simulation (aucune donnée de carte reçue ni stockée).

## Limites connues

- Un compte désactivé conserve un token valide jusqu'à son expiration.
- Pas d'annulation de commande par le client.
