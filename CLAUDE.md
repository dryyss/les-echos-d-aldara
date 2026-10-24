# Les Échos d'Aldara

RPG 2D en pixel art inspiré des RPG Game Boy Advance : exploration avec pouvoirs élémentaires utilisables dans le décor (les Résonances), esprits élémentaires à collectionner (les Lueurs), combats au tour par tour. Univers, personnages et noms 100 % originaux.

## Documents de référence

Avant toute tâche de contenu ou de gameplay, lis le document concerné dans `docs/` :

- `docs/game-design-document.md` : vision, Résonances, Lueurs, classes, combat, formules, zones, progression, DA, plan technique, roadmap.
- `docs/univers.md` : carte, chronologie, règles de la magie, peuples, factions, villes, fiches personnages.
- `docs/scenario-et-missions.md` : scénario des 4 actes, missions et tâches, quêtes annexes, système de missions.
- `docs/dialogues.md` : voix des personnages et script complet des 4 actes.

Ces documents font foi. Si une demande les contredit, signale-le avant de coder. N'invente pas de nouveaux personnages, lieux ou règles sans le demander.

## Stack

- Phaser 3 (dernière version 3.x stable) + TypeScript en mode strict
- Vite pour le serveur de dev et le build
- Tiled pour les cartes (format JSON `.tmj`)
- Déploiement sur Vercel (build statique)
- Pas d'autre framework (pas de React dans le jeu)

Commandes :

```
npm run dev      # serveur de dev
npm run build    # build de production
npm run lint     # ESLint
npm run test     # Vitest (logique de jeu pure)
```

## Architecture

```
src/
  main.ts            config Phaser, liste des scènes
  scenes/            BootScene, TitleScene, WorldScene, BattleScene, MenuScene, DialogueScene
  systems/           GameState, EventRunner, SaveManager, AudioManager, QuestManager
  battle/            formules, file des tours, IA ennemie, animations de combat
  field/             Player, Npc, InteractiveObject, resonances/
  ui/                DialogueBox, ChoiceMenu, HpBar, Menus
  data/types.ts      types TypeScript de toutes les données JSON
data/
  heroes.json  lueurs.json  enemies.json  items.json  resonances.json  quests.json
  dialogues/         un fichier JSON par scène (ex. a1-s01-matin-brumeval.json)
assets/
  maps/  tiles/  sprites/  portraits/  audio/
```

Règles d'architecture :

- Aucune scène ne garde l'état du jeu. Tout l'état (équipe, Lueurs, inventaire, drapeaux, missions, position) vit dans `GameState`.
- Tout le contenu est en JSON dans `data/`. Le code lit les données, il ne les contient pas. Ajouter une Lueur, un monstre ou un dialogue ne doit jamais demander de modifier du code.
- La logique pure (formules de dégâts, ordre des tours, calcul de classe, XP) est dans des fonctions sans dépendance à Phaser, testées avec Vitest.
- Les objets interactifs des cartes Tiled ont une propriété `reactsTo` (liste de Résonances) et une propriété `onReact` (identifiant d'effet).
- Les cinématiques et dialogues sont des listes d'actions JSON exécutées par `EventRunner` : `say`, `choice`, `move`, `give`, `setFlag`, `startBattle`, `fade`, `wait`, `playSound`.
- La progression de l'histoire est pilotée par des drapeaux booléens dans `GameState.flags` (ex. `nyra_recrutee`).

## Spécifications techniques

- Résolution interne 400 × 240, `pixelArt: true`, mise à l'échelle entière sans flou.
- Tuiles 16 × 16. Sprites exploration 16 × 24, 4 directions. Sprites combat 32 × 48. Portraits 48 × 48.
- Déplacement case par case sur la grille (comme les RPG GBA), avec collisions issues du calque `collisions` de Tiled.
- Contrôles clavier : flèches ou ZQSD, Espace ou Entrée pour valider, Échap pour annuler, Tab pour le menu, R pour la roue des Résonances, 1 et 2 pour les raccourcis. Prévoir la manette (Gamepad API) et les contrôles tactiles dès que l'exploration fonctionne.
- Sauvegarde : `GameState` sérialisé en JSON dans le localStorage, 3 emplacements, sauvegarde auto à chaque changement de zone. Toujours versionner le format (`saveVersion`).
- Tant que les vrais assets n'existent pas, utiliser des placeholders générés (rectangles de couleur, formes simples) pour ne jamais être bloqué.

## Textes du jeu

- Tous les textes affichés sont en français.
- Jamais de tiret cadratin dans les textes du jeu.
- Apostrophe typographique ’ et guillemets « » dans les textes affichés.
- Boîte de dialogue : 3 lignes maximum, environ 120 caractères, texte affiché lettre par lettre, « bip » de voix par personnage.
- Respecter la voix de chaque personnage décrite dans `docs/dialogues.md`.
- Reprendre les dialogues du script tels quels, sans les réécrire.

## Façon de travailler

- Avance par petites étapes testables. Une étape = une fonctionnalité qui marche en jeu.
- Avant de coder une étape, résume en quelques lignes ce que tu vas faire et les fichiers touchés.
- Après chaque étape : `npm run build` et `npm run lint` doivent passer, et la fonctionnalité doit être testable dans `npm run dev`. Explique comment la tester.
- Écris des tests Vitest pour toute la logique pure.
- Code lisible, fonctions courtes, noms en anglais dans le code, commentaires en français seulement quand c'est utile.
- Ne supprime ni ne réécris un système existant sans le dire.
- Fais un commit Git à la fin de chaque étape validée, message en français (ex. « Ajout de la Résonance Poussée »).
- Mets à jour `PLAN.md` en cochant l'étape terminée.
