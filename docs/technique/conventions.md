# Conventions techniques pour l'équipe

Ce document s'adresse à tout agent ou développeur qui travaille sur le projet. Lis d'abord `CLAUDE.md`, puis les documents de référence de `docs/` qui concernent ta tâche.

## Règles d'or

1. **Le contenu est en JSON dans `data/`, le code lit les données.** Ajouter une Lueur, un monstre ou un dialogue ne demande jamais de modifier du code.
2. **`src/data/types.ts` est le contrat.** Toute donnée doit respecter ces types. Si un type manque, signale-le dans ton rapport plutôt que de contourner.
3. **Logique pure testée.** Tout calcul (formules, ordre des tours, classes, XP, puzzles) est une fonction sans Phaser, dans `src/battle/`, `src/systems/` ou `src/field/`, testée dans `tests/`.
4. **Tu ne touches qu'aux fichiers de ton périmètre.** Si tu dois modifier un fichier partagé (`types.ts`, `main.ts`, `PLAN.md`), explique-le dans ton rapport final au lieu de le faire.
5. **Pas de commit.** L'intégrateur relit et commite.

## Commandes

```
npx tsc --noEmit                       # vérification des types (tout le projet)
npx eslint src/mon-dossier tests/x.ts  # lint sur tes fichiers
npx vitest run tests/mon-test.test.ts  # tes tests
npx prettier --write <fichiers>        # formatage avant de rendre ton travail
node scripts/build-art.mjs             # génère assets/sprites et assets/tiles depuis art/
node scripts/build-maps.mjs            # génère assets/maps/*.tmj depuis maps/
node scripts/validate-data.mjs         # vérifie les JSON de data/
```

D'autres agents travaillent en parallèle : si `tsc` signale des erreurs dans des fichiers qui ne sont pas les tiens, ignore-les et dis-le dans ton rapport.

## Identifiants

- kebab-case, sans accent ni majuscule : `cerf-de-mousse`, `herbe-soin`, `a1-s03-attaque`.
- Scènes de dialogue : `a<acte>-s<numéro à 2 chiffres>-<mot-clé>` (ex. `a1-s01-matin-brumeval`). Dialogues secondaires : `pnj-<id>-<variante>` ou `annexe-<quete>-<etape>`.
- Missions : `m1-01` … `m4-08` pour les principales, `annexe-<mot-cle>` et `lueur-<mot-cle>` pour les autres.
- Cartes : nom du lieu (`brumeval`, `brumeval-forge`, `bois-murmures-1`).
- Drapeaux : snake_case français (`nyra_recrutee`, `sefa_confiance`, `jumeaux_epargnes`), ceux du document Scénario sont obligatoires.

## Textes affichés

- Français, apostrophe typographique `’`, guillemets `« »` avec espaces insécables fines ou normales (`« texte »`).
- Jamais de tiret cadratin. Utilise une virgule, un point ou deux points.
- Boîte de dialogue : 3 lignes maximum, environ 120 caractères par réplique. Une réplique plus longue est découpée en plusieurs actions `say` consécutives du même personnage.
- Reprends les répliques du script `docs/dialogues.md` **mot pour mot**. Seule l'apostrophe droite `'` devient `’`.
- Les points de suspension du script sont le caractère `…`.

## Style de code

- TypeScript strict, `noUncheckedIndexedAccess` activé : un accès `tableau[i]` ou `record[cle]` renvoie `T | undefined`, gère ce cas.
- Noms en anglais dans le code, commentaires en français seulement quand ils apportent quelque chose.
- Fonctions courtes. Pas de classe « fourre-tout ».
- Import de types : `import type { X } from '...'`.
- Pas de `any`. Pas de `console.log` (seulement `console.warn` et `console.error`).
- Aléatoire : toute fonction qui tire au hasard reçoit un `rng: () => number` en paramètre (valeur entre 0 et 1) pour être testable. `Math.random` n'apparaît que dans le code Phaser.

## Phaser

- Une scène ne garde jamais d'état de jeu : tout passe par `GameState`.
- Les textures sont chargées depuis `assets/` (dossier public de Vite, servi à la racine : `/sprites/kael.png`).
- Tout texte utilise la police `PIXEL_FONT` de `src/config.ts` avec `resolution: 1`.
- Résolution 400 × 240, tuiles 16 × 16.
