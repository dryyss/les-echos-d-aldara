# Les Échos d’Aldara

RPG 2D en pixel art inspiré des RPG Game Boy Advance : exploration avec pouvoirs élémentaires (les Résonances), esprits à collectionner (les Lueurs), combats au tour par tour. Version web pour PC, comptes joueurs et sauvegardes en ligne.

## Démarrer

```
npm install
npm run dev          # http://localhost:5173
```

Le jeu fonctionne sans configuration en mode invité (sauvegarde locale). Pour les comptes et les sauvegardes en ligne, copie `.env.example` en `.env` et renseigne les clés Supabase (voir `docs/technique/supabase.md`).

## Commandes

```
npm run dev            # serveur de développement (génère les assets avant)
npm run build          # build de production dans dist/
npm run preview        # sert le build
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Vitest (logique pure)
npm run build:assets   # régénère assets/ depuis art/ et maps/
npm run validate       # vérifie les JSON de data/
```

## Organisation

- `docs/` : documents de référence (GDD, univers, scénario, dialogues) et spécifications techniques (`docs/technique/`).
- `data/` : tout le contenu du jeu en JSON (héros, Lueurs, monstres, objets, missions, dialogues, musiques).
- `art/` : pixel art écrit en texte, converti en PNG par `scripts/build-art.mjs`.
- `maps/` : cartes en ASCII, converties en cartes Tiled (`.tmj`) par `scripts/build-maps.mjs`.
- `src/` : code TypeScript (scènes Phaser, systèmes, combat, exploration, interface).
- `tests/` : tests Vitest.
- `assets/` : fichiers générés servis tels quels (ignorés par git).

## Déploiement

Build statique Vite, déployable sur Vercel : commande `npm run build`, dossier de sortie `dist`. Variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
