# GE Vernova — Gestion des Dessins Techniques

Application web de gestion des échanges de dessins techniques (PDF) entre dessinateurs et ingénieurs. Remplace le système de fichiers partagés Box.com.

## Stack

- **Next.js 14** (App Router + Server Components)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Tailwind CSS**
- **Resend** (emails transactionnels)
- **Vercel** (déploiement)

---

## Déploiement (étape par étape)

### 1. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un nouveau projet
2. Dans **SQL Editor**, exécuter le fichier `supabase/schema.sql` en entier
3. Dans **Authentication > Providers**, vérifier que Email/Password est activé
4. Dans **Project Settings > API**, copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurer Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier votre domaine d'envoi (ex: `ge-vernova-app.com`)
3. Générer une API key → `RESEND_API_KEY`
4. Mettre à jour l'adresse `FROM` dans `lib/resend.ts` avec votre domaine vérifié

### 3. Déployer sur Vercel

```bash
# Installer Vercel CLI (si nécessaire)
npm i -g vercel

# Depuis le répertoire du projet
vercel

# Suivre l'assistant et choisir "Next.js" comme framework
```

Ou via l'interface Vercel :
1. Importer le repo GitHub sur [vercel.com/new](https://vercel.com/new)
2. Ajouter les variables d'environnement (voir `.env.example`)
3. Déployer

### 4. Variables d'environnement Vercel

Ajouter dans **Vercel > Project > Settings > Environment Variables** :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (secrète) |
| `RESEND_API_KEY` | Clé API Resend |
| `NEXT_PUBLIC_APP_URL` | URL de production (ex: https://votre-app.vercel.app) |

### 5. Créer les premiers utilisateurs

Dans **Supabase > Authentication > Users**, créer les utilisateurs manuellement ou via l'API :

```sql
-- Après création via Supabase Auth, mettre à jour le rôle manuellement si besoin :
UPDATE profiles SET role = 'engineer' WHERE email = 'ingenieur@ge.com';
UPDATE profiles SET role = 'project_manager' WHERE email = 'pm@ge.com';
-- Les nouveaux utilisateurs sont 'drafter' par défaut
```

---

## Développement local

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs Supabase et Resend

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
app/
├── (auth)/login/          ← Page de connexion (email + mdp)
├── (app)/
│   ├── layout.tsx         ← Shell : sidebar + barre de notifications
│   ├── page.tsx           ← Dashboard (adapté au rôle)
│   ├── projects/          ← Liste et détail des projets
│   ├── drawings/
│   │   ├── new/           ← Formulaire de création dessin + révision initiale
│   │   └── [id]/          ← Fiche dessin, historique révisions, actions
│   └── notifications/     ← Centre de notifications
└── api/revisions/         ← API route : soumission et révision
```

### Sécurité

- **RLS Supabase** sur toutes les tables — aucun accès cross-projet possible
- **Validation Box URL** côté serveur (API route + contrainte DB) ET côté client
- **Service role** limité aux API routes server-side (audit_log, notifications)
- Aucun fichier PDF stocké — seulement les URLs Box

### Futur : ajout PingID (SSO OIDC)

1. Dans Supabase Dashboard > Authentication > Providers > OpenID Connect
2. Configurer : `client_id`, `client_secret`, `issuer_url` fournis par PingID
3. Décommenter le bouton dans `app/(auth)/login/page.tsx` (commentaire présent)
4. **Aucun autre changement de code nécessaire**

---

## Phase 2 (prévue)

- Gestion des mandats (liés aux projets)
- Tableau de bord statistiques avancé
- Export PDF des historiques de révision
