# Architecture du moteur (couche Phaser)

Ce document décrit comment les scènes Phaser s'articulent autour des systèmes purs (`GameState`, `QuestManager`, `SaveManager`, `BattleEngine`, `AudioManager`, `DataRegistry`). Il sert de référence à toute l'équipe qui code la couche jeu.

## Vue d'ensemble

```
BootScene ──► TitleScene ──► WorldScene ◄──► BattleScene
                 │               │  ▲
                 │               │  └── DialogueScene (superposée : dialogues, cinématiques, pensées, cartons)
                 │               └───── MenuScene (superposée : menu principal, boutique, auberge, forge, journal)
                 └── AuthOverlay (HTML au-dessus du canvas : connexion, inscription, invité)
```

- **Aucune scène ne garde l'état du jeu.** Tout vit dans `GameState`. Les scènes lisent et appellent des mutateurs.
- Les services partagés sont créés une fois dans `BootScene` et exposés par `src/game/services.ts` : `{ data: DataRegistry, state: GameState | null, quests: QuestManager | null, saves: SaveManager, audio: AudioManager, input: InputManager, auth: AuthService }`. `state` et `quests` sont créés à « Nouvelle partie » ou au chargement.
- La carte du monde n'est pas une scène à part : ce sont des cartes normales (tileset `monde`, zone `monde-*`) où le joueur est dessiné plus petit (`setScale(0.75)`), sans rencontres, avec des warps vers les villes et les donjons.

## Entrées (`src/game/InputManager.ts`)

Actions abstraites : `up`, `down`, `left`, `right`, `confirm` (Espace, Entrée, manette A), `cancel` (Échap, B), `menu` (Tab, Start), `wheel` (R, Y), `shortcut1` (1, L), `shortcut2` (2, R), `run` (Maj, X : marche rapide). Clavier (flèches et ZQSD) et Gamepad API. API : `isDown(action)`, `justPressed(action)` (une seule fois par appui, remis à zéro à chaque `update`), `axis()` pour la direction dominante, `anyKey()`. Les scènes superposées capturent les entrées : `InputManager.pushContext(name)` / `popContext()` ; seul le contexte du haut reçoit `justPressed`.

## Exploration (`src/field/`, `src/scenes/WorldScene.ts`)

### Chargement d'une carte

1. `WorldScene.init({ map, spawn })` : lit `assets/maps/<map>.tmj` (chargé à la volée avec `this.load.tilemapTiledJSON` si absent du cache), et l'image du tileset `assets/tiles/<tileset>.png` + son JSON.
2. Crée les calques `sol`, `decor` (profondeur sous le joueur), `au-dessus` (profondeur au-dessus), lit `collisions`.
3. `CollisionGrid` (pur, testé) : grille booléenne depuis le calque collisions + objets solides + PNJ, mise à jour quand un objet bouge ou disparaît. `isBlocked(x, y)`, `setBlocked`, `clear`.
4. `MapObjects` : instancie les objets du calque `objets` selon `type` (voir `format-cartes.md`), en consultant `GameState.mapState[map]` pour les états persistants (coffre ouvert, objet détruit, porte ouverte) et les conditions `si` (`GameState.evaluate`).
5. Place le joueur sur le spawn demandé, la caméra suit le joueur (`startFollow`, `setBounds` à la taille de la carte, arrondi au pixel), lance la musique de la carte, déclenche `QuestManager.onReachMap(map)`, sauvegarde automatique (`SaveManager.autoSave`) si la carte change.

### Déplacement

- `GridMover` (`src/field/GridMover.ts`) : déplacement case par case par tween (150 ms par case, 100 ms en marche rapide), file d'attente d'une entrée, appui court = se tourner sans bouger (délai 80 ms), animation `walk-<dir>` pendant le mouvement et `idle-<dir>` à l'arrêt. Le même composant sert aux PNJ (déplacements d'événements, errance).
- À chaque case franchie par le joueur : `GameState.addStep(...)` → recharge des PR (son discret et petit « +1 » optionnel), rencontre aléatoire si la carte a des `encounters` (transition vers `BattleScene`), vérification des `warp` (changement de carte avec fondu) et des `trigger` (lancement de scène).
- Les membres de l'équipe suivent le joueur en file indienne (suiveurs : les 3 autres héros, historique des positions), traversants.

### Interaction (`confirm` face à une case)

Ordre : PNJ (`NpcController.talk`) → objet `talk`/`examine`/`sign`/`chest`/`lueur`/`save`/`inn`/`shop`/`forge`/`lever` → sinon réplique d'équipe (`bantersFor(zone)`, héros au hasard parmi les présents, première variante dont la condition passe).

### Résonances

- `ResonanceWheel` (UI, touche `wheel`) : roue des Résonances débloquées avec icônes, nom, coût et PR du héros propriétaire ; `confirm` lance ; `shortcut1`/`shortcut2` lancent directement les raccourcis (`GameState.shortcuts`) ; dans la roue, `menu` assigne la Résonance sélectionnée au raccourci 1 ou 2.
- `ResonanceCaster` : vérifie que le héros propriétaire est dans l'équipe et a assez de PR (sinon son `bloque` et message court), paie les PR, joue l'animation du héros (tourné vers la cible, flash de couleur), parcourt les cases devant lui jusqu'à `range`, prend le premier objet dont `reactsTo` contient la Résonance (ou un PNJ pour `ecoute`), applique l'effet via le registre `src/field/resonances/effects.ts` (une fonction par `onReact` : `push`, `burn`, `light`, `melt`, `grow`, `freeze`, `fill`, `extinguish`, `grab`, `blow`, `reveal`, `listen`, `vapor-lift`, `melt-rock`, `forest`, `turbine`, `dune`, `fireball`), joue l'effet visuel (sprite `effect`) et le son. Si rien ne réagit : effet visuel quand même, son `bloque` étouffé.
- Écoute sur un PNJ : affiche sa `pensee` dans la boîte de dialogue en italique entre crochets (son `ecoute`) ; sans pensée : « […] » et son `ecoute-bloquee`. Déclenche `QuestManager.onListen(npcId)`.
- Objets qui réagissent à la Résonance sélectionnée : léger scintillement (teinte pulsée) pour guider le joueur.
- Accords (Acte 4) : disponibles quand les deux héros des éléments requis sont dans l'équipe ; les deux paient 1 PR.

### Puzzles

`PuzzleManager` (pur, testé) : reçoit la liste des puzzles de la carte et l'état courant des objets, `onObjectState(objectId, state)` et `onObjectMoved(objectId, x, y)` renvoient les puzzles nouvellement résolus ; `WorldScene` applique `onSolved` (états d'objets, drapeau, son `puzzle-ok`, scène, tâche de mission via `QuestManager.onPuzzleSolved(id)`). `resetOnFail` remet les objets de la séquence à `off`.

### PNJ

`NpcController` : sprite + `GridMover`, errance aléatoire légère si `wander`, se tourne vers le joueur quand on lui parle, choisit la première `NpcLine` dont la condition passe : `scene` → lance la scène ; `texte` → boîte de dialogue simple avec le nom et le portrait du personnage ; après le dialogue, `QuestManager.onTalk(id)` et `onDeliver(id, item)` si une mission `livrer` attend cet objet (proposer l'objet automatiquement avec confirmation).

## Dialogues et événements (`src/systems/EventRunner.ts`, `src/scenes/DialogueScene.ts`, `src/ui/`)

- `EventRunner` est indépendant de Phaser et testé avec des doublures : `run(scene: DialogueScene, ctx: EventContext): Promise<void>`. `EventContext` fournit : `state`, `quests`, `audio`, `ui` (`say`, `thought`, `screen`, `choice`, `title`, `fadeTo`, `wait`), `world` (`move`, `moveTo`, `face`, `teleport`, `spawn`, `despawn`, `anim`, `emote`, `shake`, `flash`, `setMapState`), `battle(group, scripted): Promise<'victory' | 'defeat' | 'fled' | 'scripted'>`, `recruit`, `openShop`, `inn`, `forge`, `save`, `gameOver`, `credits`. Il gère `label`/`goto`, `if`, les `choix` avec `si` et `drapeau`, et pose les drapeaux de résultat de combat (`<outcomeFlag>_victoire` / `_defaite`).
- `give` d'une Résonance ou d'une Lueur affiche automatiquement l'écran de tutoriel (`tutorial` de la Résonance, texte générique du GDD pour la première Lueur) et le son `lueur-trouvee` ou `secret`.
- `DialogueScene` est lancée par-dessus `WorldScene` (`scene.launch`) et la met en pause pour les entrées seulement (les tweens de déplacement des PNJ continuent). Elle possède `DialogueBox`, `ChoiceMenu`, `ScreenBanner`, `TitleCard`.
- `DialogueBox` (`src/ui/DialogueBox.ts`) : cadre 9-slice (`cadre`) en bas, 400 × 72, portrait 48 × 48 à gauche (ou à droite si `cote: 'droite'`), nom en couleur du personnage, texte lettre par lettre (vitesse selon `options.textSpeed` : 60, 30, 15 ms par lettre), bip de voix toutes les 2 lettres (`audio.voiceBlip`), retour à la ligne automatique sur 3 lignes maximum (découpe en pages si besoin), flèche clignotante en fin de page, `confirm` accélère puis passe. Pensées : italique simulé par une teinte bleutée et des crochets, son `ecoute`.
- `ChoiceMenu` : liste de 2 à 4 choix dans un cadre à droite au-dessus de la boîte, curseur, `cancel` ignoré (un choix est obligatoire).
- `ScreenBanner` : bandeau centré pour `ecran` (« Kaël a appris la Résonance Écoute. »), son `secret`.
- `TitleCard` : plein écran noir, texte centré (`title`), fondu.

## Combat (`src/scenes/BattleScene.ts`, `src/battle/ui/`)

- Lancement : `WorldScene` appelle `scene.sleep` sur elle-même et `scene.start('BattleScene', { group, scripted, returnTo })` après un effet de transition (flash + zoom pixelisé). À la fin, `BattleScene` renvoie `{ outcome }` via `scene.wake('WorldScene', result)`.
- Mise en page : fond (`fond-*`, 400 × 120 en haut, échelle 2), héros à droite (sprites `*-combat` espacés verticalement, orientés vers la gauche), ennemis à gauche (taille selon `size`, boss centré), fenêtre d'ordre des tours en haut (portraits miniatures ou icônes dans l'ordre prévu), barres PV/PR des héros en bas à droite (nom, PV, PR, statuts), menu de commandes en bas à gauche (Attaque, Résonance, Lueur, Invoquer, Objet, Défense, Fuir : grisés si indisponibles), sous-menus (liste des sorts avec coût, Lueurs Liées avec effet, invocations disponibles, objets), sélection de cible avec curseur sur l'ennemi ou l'allié.
- Déroulement : pour chaque héros vivant, choix de commande (`BattleEngine.getAvailableCommands`), puis `resolveTurn()` et lecture des `BattleEvent` un par un avec animation : `action-start` (le sprite avance, nom de l'action affiché), `damage` (sprite `coup`, chiffre qui monte et s'efface, blanc normal, jaune critique, bleu si faiblesse exploitée ; secousse de la cible ; animation `hurt`), `heal` (vert), `status-applied` (icône), `ko` (animation `ko` puis sprite grisé ou disparition de l'ennemi), `lueur-unleashed` (la Lueur sort du héros et file sur la cible), `summon` (grand sprite qui apparaît côté héros, attaque, disparaît), `phase-change` (réplique en boîte de dialogue), `line`, `victory`, `defeat`.
- Caméra : légère rotation (`±2°`) et zoom (`1.05`) pendant les sorts, retour en douceur. Tout est lisible : jamais plus d'une animation en même temps, 250 à 600 ms par événement, `confirm` accélère.
- Victoire : fanfare `victoire`, écran récapitulatif (XP gagnée par héros avec barre qui se remplit, « Niveau supérieur ! » et stats avant → après, pièces, objets, Lueur). Les gains sont appliqués au `GameState` (`gainXp` de `src/battle/stats.ts`, `addCoins`, `addItem`, `findLueur`), puis `QuestManager.onBattleWon(group)`.
- Défaite : si `scripted.defeatContinues` → retour avec `defeat` ; sinon musique `defaite`, écran « Game Over », puis retour au titre avec « Continuer » qui recharge la dernière sauvegarde en divisant les pièces par deux (`GameState.loseHalfCoins`).
- Fuite réussie : retour immédiat.

## Menu principal (`src/scenes/MenuScene.ts`, `src/ui/menus/`)

Superposé à `WorldScene` (pause), touche `menu`. Onglets à gauche, contenu à droite :
- **Équipe** : portraits, niveau, PV/PR, classe et rang (`computeClass`), stats complètes (`computeHeroStats`), XP vers le prochain niveau, ordre de l'équipe.
- **Lueurs** : grille des 28 Lueurs (trouvées en couleur avec sprite, inconnues en silhouette avec `hint`), sélection → assigner à un héros ou retirer, aperçu de la classe avant validation (nom et rang si on confirme), état Liée/Libérée/Repos, bonus.
- **Résonances** : liste des Résonances débloquées, description, coût, assignation aux raccourcis 1 et 2.
- **Objets** : inventaire par catégorie, utilisation hors combat des consommables (choix du héros), description.
- **Équipement** : par héros, 5 emplacements, liste filtrée (type d'arme autorisé, `allowedHeroes`), comparaison des stats (flèches vertes et rouges).
- **Missions** : `QuestManager.summary()` : principales en or, annexes en bleu, Lueur en vert, tâches cochées, onglet Souvenirs (missions terminées + fragments d'histoire `lore`).
- **Sauvegarde** : 3 emplacements avec résumé (acte, lieu, niveau, temps), sauvegarder ou charger, indicateur local/en ligne, bouton Compte (ouvre `AuthOverlay`).
- **Options** : volumes musique et bruitages, vitesse du texte, aide des touches, retour au titre.
- Modes spéciaux ouverts par le monde ou les événements : **Boutique** (achat avec quantité, revente à 50 %, répliques du marchand), **Auberge** (confirmation, fondu noir, `repos`, soin complet, sauvegarde), **Forge** (recettes de `recipes.json` filtrées par drapeau, matériaux possédés en vert ou rouge, forger).

## Titre et comptes (`src/scenes/TitleScene.ts`, `src/game/AuthOverlay.ts`)

- `TitleScene` : fond animé (brume qui dérive, titre `logo` qui descend, « Appuyez sur une touche »), menu : Nouvelle partie, Continuer (sélection d'emplacement avec résumé, local ou en ligne), Compte, Options. Musique `titre`.
- `AuthOverlay` : panneau HTML (`#ui-overlay` dans index.html, au-dessus du canvas, style pixel : police `Press Start 2P`, cadre sombre) avec onglets Connexion / Inscription / Invité, champs email et mot de passe, bouton Google, messages d'erreur en français, indicateur de chargement. Si Supabase n'est pas configuré : seul le mode Invité (local) est proposé avec une note. Un invité connecté peut, depuis Compte, « Créer un compte pour synchroniser » (`upgradeGuest`). À la connexion : `SaveManager.setCloud(...)` puis `syncFromCloud()`.
- Première ouverture du jeu : l'overlay apparaît avant le menu (le joueur doit être connecté ou invité pour jouer).

## Boot (`src/scenes/BootScene.ts`)

Barre de chargement pixel. Charge : police, `assets/sprites/manifest.json` puis chaque atlas (`this.load.atlas(id, png, json)`), crée les animations `<id>/<anim>` depuis le manifeste, `assets/tiles/*.json` + PNG pour les tilesets connus (liste dans `src/config.ts`), les données via `DataRegistry` (déjà bundlées), initialise `AudioManager` avec `data/audio`. Puis `TitleScene`.

## Effets visuels partagés (`src/field/Effects.ts`)

`playEffect(scene, id, x, y, { scale, tint, onComplete })` : sprite `effect` joué une fois puis détruit. `floatingText(scene, x, y, text, color)` pour les chiffres de dégâts et les « +1 PR ». `screenShake`, `flash`, `fadeTo`.

## Transitions et sauvegarde

- Changement de carte : fondu noir 200 ms, sauvegarde automatique (slot 0) avec `locationName` = `name` de la carte.
- Point de sauvegarde (`save`) : menu Sauvegarder / Charger / Annuler.
- Game Over : rechargement de la dernière sauvegarde (slot 0 ou le plus récent).

## Tests

- Pur et testé : `CollisionGrid`, `GridMover` (logique de file d'attente et de direction, sans tween), `PuzzleManager`, `EventRunner` (avec doublures), `ResonanceCaster` (ciblage et effets sur une grille de test), `MenuScene` logique de filtrage d'équipement et de comparaison (fonctions pures), `BattleScene` ordonnancement des événements (pur).
- Tests de bout en bout (Playwright, dossier `e2e/`) : démarrage, nouvelle partie en invité, déplacement, scène 1, puzzle des caisses, premier combat. Captures d'écran dans `e2e/screenshots/`.
