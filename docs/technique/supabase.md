# Supabase : comptes joueurs et sauvegardes en ligne

Ce guide s'adresse au propriétaire du projet. Il explique, étape par étape, comment créer le projet Supabase qui héberge les comptes des joueurs (email + mot de passe, Google, invité) et leurs sauvegardes.

Sans Supabase, le jeu fonctionne quand même : le joueur joue en invité local et ses sauvegardes restent dans le navigateur. Avec Supabase, les sauvegardes des joueurs connectés sont copiées en ligne (table `saves`) en plus du cache local, et un invité peut créer un compte plus tard sans rien perdre.

## Comment le jeu utilise Supabase

- `src/systems/auth/supabaseClient.ts` crée le client **une seule fois**, uniquement si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` existent. Sinon le client vaut `null`.
- `src/systems/auth/AuthService.ts` enveloppe l'authentification : inscription, connexion, Google, invité (utilisateur anonyme Supabase), conversion d'un invité en compte, déconnexion, mot de passe oublié. Les erreurs sont traduites en français.
- `src/systems/SaveManager.ts` écrit toujours en local (`localStorage`, clés `aldara:save:<slot>`), puis en ligne quand un joueur est connecté. Une panne réseau n'empêche jamais de sauvegarder.
- Table `saves` : une ligne par joueur et par emplacement (0 = sauvegarde automatique, 1 à 3 = manuelles). Les règles de sécurité (RLS) garantissent qu'un joueur ne voit que ses lignes.

## Étape 1 : créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi (compte GitHub ou email).
2. Clique sur **New project**.
3. Choisis ton organisation, donne un nom (`les-echos-d-aldara`), génère un **mot de passe de base de données** et garde-le dans un gestionnaire de mots de passe (il ne sert pas au jeu, mais il est demandé pour certaines opérations d'administration).
4. Région : **Europe (Frankfurt ou Paris)** pour des joueurs en France.
5. Formule **Free** (suffisante pour commencer : 50 000 utilisateurs actifs par mois, 500 Mo de base).
6. Clique sur **Create new project** et attends une à deux minutes.

## Étape 2 : créer la table `saves`

1. Dans le menu de gauche, ouvre **SQL Editor**.
2. Clique sur **New query**.
3. Ouvre le fichier `supabase/migrations/0001_saves.sql` du projet, copie tout son contenu et colle-le dans l'éditeur.
4. Clique sur **Run** (ou Ctrl + Entrée). Le message « Success. No rows returned » confirme l'exécution.
5. Vérifie dans **Table Editor** : la table `saves` apparaît avec les colonnes `user_id`, `slot`, `data`, `save_version`, `summary`, `created_at`, `updated_at`, et un cadenas indiquant que RLS est activé.

Le script peut être relancé sans danger (il utilise `if not exists` et `drop ... if exists`).

## Étape 3 : activer le mode invité en ligne (connexions anonymes)

1. Menu **Authentication** → **Sign In / Providers** (selon la version de l'interface : **Providers** ou **Auth Providers**).
2. Dans la section générale (au-dessus de la liste des fournisseurs), active **Allow anonymous sign-ins**.
3. Enregistre.

Un invité en ligne reçoit un utilisateur anonyme : ses sauvegardes sont synchronisées, et s'il ajoute plus tard un email et un mot de passe (bouton « Créer un compte » dans le jeu, méthode `upgradeGuest`), il garde le même identifiant et donc les mêmes sauvegardes.

Conseil : Supabase recommande d'activer un CAPTCHA (**Authentication → Attack Protection**) quand les connexions anonymes sont ouvertes, pour éviter la création massive de comptes fantômes. Ce n'est pas indispensable pour commencer.

## Étape 4 : connexion par email et mot de passe

1. Toujours dans **Authentication → Sign In / Providers**, ouvre **Email**.
2. Vérifie que **Enable Email provider** est actif.
3. **Confirm email** :
   - **Désactivé** : le joueur est connecté immédiatement après l'inscription. Pratique pour le développement et les tests.
   - **Activé** : le joueur reçoit un email de confirmation. Pour la production, c'est recommandé, mais le service d'email intégré de Supabase est limité à quelques messages par heure. Il faut alors configurer un SMTP personnalisé dans **Project Settings → Authentication → SMTP Settings** (Resend, Brevo, Postmark…).
4. Longueur minimale du mot de passe : laisse 6 (le jeu affiche « Le mot de passe doit contenir au moins 6 caractères » en cas d'erreur).
5. Enregistre.

Le lien « Mot de passe oublié » du jeu appelle `resetPasswordForEmail` : il envoie un email avec un lien de retour vers le site (voir les URL de redirection de l'étape 6).

## Étape 5 : connexion avec Google

### 5a. Côté Google Cloud

1. Va sur [console.cloud.google.com](https://console.cloud.google.com) et crée un projet (ex. `Les Echos d Aldara`).
2. Menu **APIs & Services → OAuth consent screen** (ou **Google Auth Platform → Branding**) :
   - Type d'utilisateurs : **External**.
   - Nom de l'application : `Les Échos d’Aldara`, email d'assistance : le tien.
   - Domaines autorisés : `supabase.co` et, plus tard, ton domaine Vercel.
   - Enregistre. Tant que l'application est en mode « Testing », seuls les comptes Google ajoutés comme testeurs peuvent se connecter ; passe en **Publish app** quand tu ouvres le jeu au public.
3. Menu **Credentials → Create credentials → OAuth client ID** :
   - Type : **Web application**.
   - **Authorized JavaScript origins** : `http://localhost:5173` et `https://<ton-projet>.vercel.app`.
   - **Authorized redirect URIs** : `https://<ref-du-projet>.supabase.co/auth/v1/callback`
     (la valeur exacte est affichée par Supabase dans la fiche du fournisseur Google, champ « Callback URL (for OAuth) »).
   - Clique sur **Create**, puis copie le **Client ID** et le **Client secret**.

### 5b. Côté Supabase

1. **Authentication → Sign In / Providers → Google**.
2. Active **Enable Sign in with Google**.
3. Colle le **Client ID** et le **Client Secret**.
4. Enregistre.

Le jeu appelle `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })` : après la connexion, Google renvoie vers Supabase, qui renvoie vers le jeu.

## Étape 6 : URL du site et redirections autorisées

1. **Authentication → URL Configuration**.
2. **Site URL** : l'adresse publique du jeu (`https://<ton-projet>.vercel.app`). En développement, `http://localhost:5173` fonctionne aussi comme Site URL.
3. **Redirect URLs** : ajoute toutes les adresses depuis lesquelles le jeu peut lancer une connexion :
   - `http://localhost:5173/**`
   - `https://<ton-projet>.vercel.app/**`
   - éventuellement les prévisualisations Vercel : `https://*-<ton-equipe>.vercel.app/**`
4. Enregistre.

Sans cette étape, la connexion Google et les liens de réinitialisation de mot de passe renvoient vers la mauvaise adresse.

## Étape 7 : récupérer l'URL du projet et la clé anon

1. **Project Settings** (roue dentée en bas du menu) → **API** (ou **Data API** / **API Keys** selon la version).
2. Copie :
   - **Project URL** : `https://<ref-du-projet>.supabase.co`
   - La clé publique : **anon public** (`eyJ...`) ou, dans les projets récents, la **Publishable key** (`sb_publishable_...`). Les deux fonctionnent avec `createClient`.
3. Ne copie **jamais** la clé `service_role` (ou `secret`) dans le jeu : elle contourne toutes les règles de sécurité.

La clé anon est conçue pour être publique : elle se retrouve dans le code livré au navigateur. La protection des données repose sur les politiques RLS de l'étape 2.

## Étape 8 : configurer le projet local

1. À la racine du projet, copie `.env.example` en `.env` :

   ```
   VITE_SUPABASE_URL=https://<ref-du-projet>.supabase.co
   VITE_SUPABASE_ANON_KEY=<clé anon ou publishable>
   ```

2. Redémarre `npm run dev` (Vite ne relit les variables qu'au démarrage).
3. Dans le jeu, l'écran titre propose la connexion. Sans ces variables, seul « Jouer en invité » (mode local) est disponible.

Le fichier `.env` est ignoré par Git (`.gitignore`), seul `.env.example` est versionné.

## Étape 9 : configurer Vercel

1. Sur [vercel.com](https://vercel.com), ouvre le projet → **Settings → Environment Variables**.
2. Ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les mêmes valeurs, pour les environnements **Production** et **Preview**.
3. Relance un déploiement (**Deployments → Redeploy**) : les variables `VITE_*` sont intégrées au moment du build.
4. Reviens à l'étape 6 pour ajouter l'adresse Vercel définitive dans **Site URL** et **Redirect URLs**, et à l'étape 5a pour l'ajouter dans les origines autorisées de Google.

## Étape 10 : vérifier que tout fonctionne

1. Lance le jeu, choisis « Créer un compte » avec un email de test et un mot de passe de 6 caractères minimum.
2. Dans Supabase, **Authentication → Users** : l'utilisateur apparaît.
3. Joue jusqu'au premier changement de zone (sauvegarde automatique) ou sauvegarde dans un emplacement.
4. **Table Editor → saves** : une ligne par emplacement, avec `user_id` égal à l'identifiant de l'utilisateur.
5. Ouvre le jeu dans un autre navigateur, connecte-toi : les sauvegardes sont récupérées (`syncFromCloud`).

## Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Le bouton de connexion n'apparaît pas | Variables d'environnement absentes | Vérifie `.env` (ou Vercel) et redémarre le serveur |
| « Email ou mot de passe incorrect » à l'inscription | Confirmation d'email activée, compte non confirmé | Désactive **Confirm email** en développement ou clique sur le lien reçu |
| « Le mode invité en ligne est désactivé » | Connexions anonymes désactivées | Étape 3 |
| Google : « redirect_uri_mismatch » | URL de callback absente dans Google Cloud | Étape 5a, champ **Authorized redirect URIs** |
| Après Google, retour sur une page vide ou localhost | Site URL ou Redirect URLs incorrectes | Étape 6 |
| Erreur « new row violates row-level security policy » | L'utilisateur n'est pas connecté ou `user_id` ne correspond pas | Vérifie que la session est active avant de sauvegarder |
| « Trop de tentatives » | Limites d'envoi d'emails ou de requêtes du plan gratuit | Attends, ou configure un SMTP personnalisé |

## Évolutions du format de sauvegarde

Le fichier de sauvegarde porte un numéro de version (`saveVersion`, constante `SAVE_VERSION` dans `src/systems/save/migrations.ts`). Quand le format change, on ajoute une migration dans `MIGRATIONS` ; les anciennes sauvegardes (locales ou en ligne) sont converties au chargement. La colonne `save_version` de la table permet de voir d'un coup d'œil quelles sauvegardes sont anciennes.
