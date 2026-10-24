# Identifiants officiels partagés

Tous les agents utilisent exactement ces identifiants pour que les cartes, les missions, les dialogues, les ennemis et les sprites se retrouvent.

## Cartes (`maps/<id>.json`)

### Acte 1 : Collines de Brumeval

`monde-collines` (carte du monde de la région), `brumeval`, `brumeval-forge`, `brumeval-auberge`, `brumeval-sanctuaire`, `brumeval-moulin`, `sentier-collines`, `bois-murmures-1` (entrée, Lueur Grès), `bois-murmures-2`, `bois-murmures-3` (autel, Racine), `bois-murmures-4` (Lueur cachée), `bois-murmures-5` (clairière, Cerf de Mousse), `hautegrange`, `hautegrange-auberge`, `hautegrange-armurerie`, `hautegrange-epicerie`, `hautegrange-mairie`, `hautegrange-jardin`, `foret-hautegrange` (cabane du ruisseau), `grotte-nyra` (feu de camp), `mine-ocre-1` (entrée), `mine-ocre-2` (braseros), `mine-ocre-3` (cellules), `mine-ocre-4` (minerai rouge, Lueur Cendre), `mine-ocre-5` (Corvo), `ruines-tellume-1` (colonnes), `ruines-tellume-2` (ombres), `ruines-tellume-3` (Lueur cachée), `ruines-tellume-4` (sauvegarde), `ruines-tellume-5` (Diapason de Terre).

### Acte 2 : Marches de Saphir

`monde-saphir`, `port-lazuli-porte`, `port-lazuli` (ville et marché), `port-lazuli-auberge`, `port-lazuli-maison-marelle`, `port-lazuli-ruelle`, `port-lazuli-cave-oren`, `port-lazuli-vieux-quartier-1`, `port-lazuli-vieux-quartier-2` (autel, Givre), `port-lazuli-vieux-quartier-3` (Hydre), `port-lazuli-entrepot`, `port-lazuli-guilde`, `port-lazuli-phare`, `quais`, `villages-pilotis`, `grotte-sirenes-1`, `grotte-sirenes-2`, `grotte-sirenes-3` (coffre, Prise), `recifs`, `temple-englouti-1`, `temple-englouti-2` (autel, Averse), `temple-englouti-3` (3 niveaux d'eau), `temple-englouti-4` (sauvegarde, Lueur Brume), `temple-englouti-5` (Léviathan, Marelle), `diapason-eau` (plateforme des récifs).

### Acte 3 : Hauts Venteux

`monde-venteux`, `valcourt-porte`, `valcourt`, `valcourt-chateau-cour`, `valcourt-prison`, `egouts-1`, `egouts-2`, `egouts-3` (crocodile), `valcourt-toits`, `quartier-cuivres`, `atelier-sefa`, `valcourt-bibliotheque`, `col-corbeaux-1`, `col-corbeaux-2`, `moulin-accordeurs` (Bourrasque), `ventelune`, `ventelune-ponts`, `ventelune-palais`, `ventelune-sommet` (Envol), `tour-vents-1`, `tour-vents-2`, `tour-vents-3` (Lueur cachée), `tour-vents-4`, `tour-vents-5` (sauvegarde), `tour-vents-sommet` (Roc Tempête, Diapason du Vent).

### Acte 4 : Désert de Cendre et Île du Chœur

`monde-cendre`, `monde-aldara` (carte complète), `desert-cendre-1`, `desert-cendre-2`, `desert-cendre-3` (Ver des Sables), `champs-morts`, `oasis-sahr`, `sanctuaire-sahr` (fresques), `epreuve-vapeur`, `epreuve-magma`, `epreuve-maree-verte`, `epreuve-vent`, `sanctuaire-sahr-gardienne`, `temple-braise-1`, `temple-braise-2`, `temple-braise-3`, `temple-braise-4` (sauvegarde), `temple-braise-5` (Dragon, Clé du Feu), `temple-braise-entree` (combat des jumeaux), `cote-rassemblement`, `ile-choeur-entree`, `ile-sanctuaire-terre`, `ile-sanctuaire-feu`, `ile-sanctuaire-eau`, `ile-sanctuaire-vent`, `ile-salle-accords`, `ile-sommet` (Varn), `corbec` (ancien repaire de l'Ordre, quête de Sefa), `donjon-secret-1` à `donjon-secret-5` (sous Valcourt, après la fin).

## Points d'apparition

Chaque carte a un spawn `defaut`. Les autres suivent le modèle `depuis-<carte-d-origine>` (ex. dans `sentier-collines`, le spawn `depuis-brumeval`).

## Zones (pour `zone` des cartes, missions et répliques d'équipe)

`collines`, `brumeval`, `bois`, `hautegrange`, `mine`, `tellume`, `saphir`, `port-lazuli`, `temple-englouti`, `valcourt`, `egouts`, `venteux`, `ventelune`, `tour-vents`, `cendre`, `oasis`, `volcan`, `ile-choeur`.

## Puzzles (pour les tâches `resoudre`)

`<carte>-<nom>` : `brumeval-caisses-lila`, `brumeval-meule`, `brumeval-torches-sanctuaire`, `sentier-collines-rocher-pont`, `sentier-collines-torches`, `bois-murmures-3-lianes`, `bois-murmures-4-lianes-ordre`, `hautegrange-jardin-ronces`, `foret-hautegrange-fuite`, `mine-ocre-2-braseros`, `mine-ocre-3-cellules`, `ruines-tellume-2-ombres`, `port-lazuli-ruelle-tonneaux`, `port-lazuli-vieux-quartier-1-glace`, `port-lazuli-vieux-quartier-3-piliers`, `port-lazuli-entrepot-pompon`, `port-lazuli-phare-braseros`, `grotte-sirenes-3-coffre`, `temple-englouti-3-niveaux`, `villages-pilotis-ponts`, `egouts-2-vannes`, `quartier-cuivres-passage`, `col-corbeaux-2-brume`, `ventelune-ponts-cordes`, `tour-vents-2-courants`, `tour-vents-4-courants`, `desert-cendre-2-dunes`, `epreuve-vapeur-plateformes`, `epreuve-magma-roches`, `epreuve-maree-verte-champ`, `epreuve-vent-turbines`, `champs-morts-renaissance`, `temple-braise-2-magma`, `temple-braise-3-vapeur`, `ile-sanctuaire-terre-piliers`, `ile-sanctuaire-feu-braseros`, `ile-sanctuaire-eau-bassins`, `ile-sanctuaire-vent-courants`, `ile-salle-accords-six`, `valcourt-bibliotheque-enigme`.

## Groupes d'ennemis scénarisés (`data/encounters.json`)

`a1-sbires-place`, `a1-nyra-duel`, `boss-cerf-de-mousse`, `boss-corvo-mine`, `boss-ilse-corvo-tellume`, `a2-gardes-ruelle`, `boss-hydre-givre`, `boss-leviathan`, `a2-embuscade-recifs`, `boss-crocodile`, `a3-planeurs-1`, `a3-planeurs-2`, `a3-planeurs-3`, `boss-roc-tempete`, `boss-ver-sables`, `boss-gardienne`, `boss-dragon-braise`, `boss-jumeaux-final`, `boss-varn-1`, `boss-varn-2`, `boss-varn-3`, `boss-maitre-echo`.

Groupes aléatoires : `<zone>-<n>` (ex. `collines-1`, `bois-2`, `mine-1`, `tellume-3`).

## Ennemis (`data/enemies.json`, `sprite` = même identifiant)

- Acte 1 : `sbire-ordre`, `sbire-arbaletrier`, `loup-collines`, `corbeau-rouge`, `sanglier-brume`, `champignon-fou`, `araignee-mousse`, `racine-animee`, `chauve-souris-ocre`, `golem-ocre`, `rat-mineur`, `gardien-pierre`, `ombre-tellume`, `scarabee-ocre`. Boss et duels : `cerf-de-mousse`, `corvo`, `ilse`, `nyra-duel`.
- Acte 2 : `crabe-geant`, `mouette-voleuse`, `garde-royal`, `meduse-bleue`, `poisson-epee`, `corail-anime`, `sbire-eau`, `tete-de-givre`, `anguille-electrique`, `sirene-echo`. Boss : `hydre-givre`, `leviathan-corail`.
- Acte 3 : `rat-egout`, `limon-vert`, `garde-elite`, `corbeau-geant`, `harpie`, `chevre-folle`, `elementaire-vent`, `gargouille`, `planeur-ordre`, `sbire-vent`. Boss : `crocodile-mecanique`, `roc-tempete`.
- Acte 4 : `scorpion-cendre`, `scarabee-cendre`, `bandit-dunes`, `chacal-sable`, `salamandre`, `elementaire-feu`, `dragonnet-braise`, `echo-terre`, `echo-feu`, `echo-eau`, `echo-vent`, `statue-animee`, `sbire-elite`. Boss : `ver-des-sables`, `gardienne-sanctuaire`, `dragon-braise`, `ilse-finale`, `corvo-final`, `varn-1`, `varn-2`, `lueur-volee-terre`, `lueur-volee-feu`, `lueur-volee-eau`, `lueur-volee-vent`, `varn-3`. Après la fin : `spectre-accordeur`, `colosse-oublie`, `maitre-echo`.

## Invocations (`data/summons.json`, `sprite` = identifiant)

`golem-pierre`, `titan-argile`, `colosse-basalte`, `salamandre-invoc`, `phenix-rouge`, `dragon-braise-invoc`, `ondine`, `serpent-marees`, `leviathan-invoc`, `faucon`, `griffon`, `roc-tempete-invoc`, `gardien-aldara`.

## Lueurs (`data/lueurs.json`, `sprite` = identifiant)

- Terre (7) : `gres`, `mousse`, `ardoise`, `lichen`, `silex`, `argile`, `humus`.
- Feu (7) : `tison`, `cendre`, `magma`, `etincelle`, `suie`, `fumerolle`, `salpetre`.
- Eau (7) : `goutte`, `brume`, `ressac`, `perle`, `ecume`, `rosee`, `embrun`.
- Vent (6) : `zephyr`, `rafale`, `bise`, `alize`, `grain`, `mistral`.
- Secrète : `prisme` (élément `prisme`). Total : 28.

## Fonds de combat (`background` des groupes, sprites kind `background`)

`fond-collines`, `fond-village-nuit`, `fond-foret`, `fond-hautegrange`, `fond-mine`, `fond-ruines`, `fond-port`, `fond-canaux`, `fond-temple`, `fond-recifs`, `fond-egouts`, `fond-valcourt`, `fond-falaises`, `fond-ventelune`, `fond-tour`, `fond-desert`, `fond-oasis`, `fond-volcan`, `fond-ile`, `fond-choeur`.

## Musiques

Voir `docs/technique/format-audio.md`, tableau « Morceaux attendus ».

## Héros en combat et portraits

Sprites exploration : `kael`, `nyra`, `oren`, `sefa`. Sprites combat : `kael-combat`, `nyra-combat`, `oren-combat`, `sefa-combat`. Portraits : `kael`, `nyra`, `oren`, `sefa`, `aubin`, `lila`, `ilse`, `corvo`, `varn`, `dumarre`, `mila`, `ottavio`, `dame-aster`, `mere-sahra`, `gontran`, `brann`, `sefa-inconnue` (visage caché).

## PNJ (sprites exploration)

Nommés : `aubin`, `lila`, `caillou`, `bertrand`, `margot`, `joss`, `paulin`, `ilse`, `corvo`, `varn`, `gontran`, `brann`, `lucien`, `gaspard`, `rosa`, `tobias`, `mila`, `m-marelle`, `mme-marelle`, `ottavio`, `vieux-pecheur`, `dumarre`, `dame-aster`, `mere-sahra`, `sefa-inconnue`. Génériques (bases recolorables) : `villageois-homme`, `villageois-femme`, `enfant`, `garde-royal`, `sbire`, `mineur`, `pecheur`, `nomade`, `resonant`, `marchand`, `aubergiste`, `chasseur`, `chat`.
