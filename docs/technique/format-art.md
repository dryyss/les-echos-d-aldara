# Format du pixel art (dossier `art/`)

Tout le pixel art du jeu est écrit en texte : chaque image est une grille de caractères, chaque caractère pointe vers une couleur de la palette. Le script `scripts/build-art.mjs` transforme ces sources en PNG et en atlas JSON dans `assets/`.

Pourquoi : aucun graphiste n'est disponible, et ce format permet à toute l'équipe de dessiner, relire et corriger les sprites comme du code. Les fichiers sont des JSON.

## Règles communes

- Le caractère `.` est **toujours** transparent. Il ne doit pas apparaître dans la palette.
- La palette est un objet `{ "caractère": "#rrggbb" }`. Un caractère = une couleur. Utilise des lettres et chiffres lisibles (`k` noir, `s` peau, `h` cheveux, `w` blanc…).
- Chaque ligne d'une frame a exactement `width` caractères, chaque frame a exactement `height` lignes. Le script refuse tout écart.
- Style : palette limitée (6 à 12 couleurs par sprite), contour sombre (pas noir pur : `#1b1a2e` ou brun foncé), 1 ou 2 niveaux d'ombre, couleurs saturées. Référence : RPG Game Boy Advance.
- Les personnages sont vus de 3/4 dessus en exploration (face, dos, profil) et de côté incliné en combat.
- Lisibilité à taille réelle avant tout : une silhouette reconnaissable, un visage avec des yeux marqués, les couleurs signature du personnage (Kaël : bandeau vert et tablier brun ; Nyra : cheveux roux et cape cuir ; Oren : robe bleue et lunettes ; Sefa : écharpe grise et tresses noires).

## Fichier sprite (`art/sprites/<id>.json`, `art/portraits/<id>.json`, `art/ui/<id>.json`)

```json
{
  "id": "kael",
  "kind": "character",
  "width": 16,
  "height": 24,
  "palette": { "k": "#1b1a2e", "s": "#f1c9a5", "h": "#7a4a2a", "g": "#3fae5a", "b": "#6b4a2d" },
  "frames": {
    "down-0": ["................", "......kkkk......", "...(24 lignes de 16 caractères)..."],
    "down-1": ["..."],
    "down-2": ["..."],
    "up-0": ["..."],
    "up-1": ["..."],
    "up-2": ["..."],
    "left-0": ["..."],
    "left-1": ["..."],
    "left-2": ["..."],
    "right-0": { "mirror": "left-0" },
    "right-1": { "mirror": "left-1" },
    "right-2": { "mirror": "left-2" }
  },
  "animations": {
    "special": { "frames": ["down-0", "down-1"], "frameRate": 6, "repeat": -1 }
  }
}
```

- `kind` : `character` (exploration 16 × 24), `battle` (combat 32 × 48), `enemy` (taille libre, multiple de 8), `portrait` (48 × 48), `object` (16 × 16 ou 16 × 24), `icon` (16 × 16), `effect` (taille libre), `background` (fond de combat 400 × 120 maximum).
- Une frame est soit un tableau de lignes, soit `{ "mirror": "autre-frame" }` (miroir horizontal), soit `{ "copy": "autre-frame", "palette": { "h": "#c0392b" } }` (copie avec couleurs remplacées).
- Un sprite entier peut dériver d'un autre : `"base": "villageois-homme"` avec une `palette` qui remplace certaines couleurs. Les frames de la base sont reprises, celles définies localement les remplacent. Idéal pour les variantes de villageois, gardes et sbires.

### Frames obligatoires par `kind`

| kind | Frames | Animations générées automatiquement |
| --- | --- | --- |
| character | `down-0..2`, `up-0..2`, `left-0..2`, `right-0..2` (frame 0 = debout, 1 et 2 = pas) | `idle-<dir>` (frame 0) et `walk-<dir>` (1, 0, 2, 0 à 8 images/s) pour les 4 directions |
| battle | `idle-0`, `idle-1`, `attack-0`, `attack-1`, `cast-0`, `cast-1`, `hurt-0`, `ko-0`, `victory-0` | `idle` (2 images/s), `attack`, `cast`, `hurt`, `ko`, `victory` |
| enemy | `idle-0`, `idle-1`, `attack-0`, `hurt-0` | `idle`, `attack`, `hurt` |
| portrait | une frame par expression : `neutre` obligatoire, puis `sourire`, `colere`, `triste`, `surpris`, `fatigue` (3 minimum pour les héros) | aucune |
| object | `idle-0` obligatoire, états optionnels : `on-0`, `on-1` (allumé), `off-0`, `open-0`, `broken-0`, `grown-0`, `frozen-0` | `on` si `on-0` et `on-1` existent |
| icon, effect, background | `idle-0` au minimum, `idle-N` pour animer | `idle` |

Les ennemis font face à **droite** (ils sont à gauche de l'écran de combat). Les héros en combat font face à **gauche**.

## Fichier tileset (`art/tiles/<id>.json`)

```json
{
  "id": "village",
  "tileSize": 16,
  "palette": { "g": "#4f9d4a", "G": "#3a7d3a", "d": "#8a6a44", "k": "#2a2420" },
  "tiles": {
    "herbe": { "char": ".", "solid": false, "rows": ["gggggggggggggggg", "..."] },
    "mur": { "char": "#", "solid": true, "rows": ["..."] },
    "eau": { "char": "~", "solid": true, "water": true, "frames": [["..."], ["..."]] }
  }
}
```

- Chaque tuile a un `char` unique dans le tileset : c'est ce caractère que les cartes utilisent.
- `solid` : bloque le déplacement. Propriétés optionnelles : `water` (gelable par Givre), `lava`, `gap` (vide franchissable par Envol), `climb` (grimpable), `slow`, `ice`, `above` (dessinée au-dessus du joueur : haut d'arbre, toit, haut de mur).
- `frames` remplace `rows` pour une tuile animée (2 à 4 images, 4 images/s).
- Sortie : `assets/tiles/<id>.png` (grille de 16 colonnes) et `assets/tiles/<id>.json` (correspondance nom, caractère, index, propriétés).

### Catalogue commun obligatoire

Tous les tilesets de décor fournissent ces tuiles avec ces caractères, dans leur style propre. Les cartes ne peuvent utiliser que des caractères du tileset ciblé.

| Char | Nom | Solide | Description |
| --- | --- | --- | --- |
| `.` | sol | non | Sol principal (herbe, dalle, sable, planches…) |
| `,` | sol-2 | non | Variante de sol (touffe, dalle fendue…) |
| `:` | sol-3 | non | Sol décoré (fleurs, cailloux, coquillages) |
| `=` | chemin | non | Chemin ou dallage |
| `-` | chemin-bord | non | Bord de chemin (transition) |
| `_` | plancher | non | Plancher intérieur ou dalle lisse |
| `#` | mur | oui | Mur plein, face visible |
| `H` | mur-haut | oui, above | Haut de mur ou de falaise |
| `^` | falaise | oui | Flanc de falaise ou de roche |
| `T` | arbre-haut | oui, above | Feuillage, dessiné au-dessus du joueur |
| `t` | arbre-bas | oui | Tronc ou bas de l'arbre |
| `b` | buisson | oui | Buisson, haie, corail… |
| `r` | rocher | oui | Rocher fixe du décor |
| `~` | eau | oui, water | Eau profonde (animée) |
| `w` | eau-bord | oui, water | Bord d'eau, rive |
| `*` | vide | oui, gap | Trou, gouffre, abîme |
| `%` | lave | oui, lava | Lave ou braises (animée) |
| `i` | glace | non, ice | Glace solide sur laquelle on marche |
| `s` | escalier | non | Escalier ou rampe |
| `p` | pont | non | Pont, passerelle |
| `\|` | barriere | oui | Barrière, clôture, rambarde, corde |
| `D` | porte | oui | Porte fermée (le passage est un objet warp) |
| `W` | mur-maison | oui | Mur de bâtiment |
| `F` | fenetre | oui | Fenêtre dans un mur de bâtiment |
| `R` | toit | oui, above | Toit |
| `Q` | toit-bord | oui, above | Bord ou faîte de toit |
| `U` | meuble | oui | Meuble générique (comptoir, coffre fixe, étal) |
| `A` | table | oui | Table |
| `B` | lit | oui | Lit ou banc |
| `E` | etagere | oui | Étagère, armoire, rayonnage |
| `K` | tonneau | oui | Tonneau, jarre, caisse fixe |
| `o` | tapis | non | Tapis, dalle gravée, mosaïque |
| `L` | lampe | oui | Lanterne, torche murale, brasero fixe |
| `P` | pilier | oui | Colonne, poteau |
| `S` | statue | oui | Statue, autel décoratif, stèle |
| `c` | colonne-haut | oui, above | Haut de colonne |
| `g` | herbe-haute | non, slow | Herbes hautes, sable mou, neige profonde |
| `x` | debris | non | Débris, gravats, fissures au sol |
| `!` | panneau | oui | Panneau de bois ou borne |

### Tilesets attendus

| Id | Lieux | Tuiles supplémentaires (char : nom) |
| --- | --- | --- |
| `village` | Brumeval, Hautegrange, campagne | `f` champ-ble, `m` moulin-mur, `C` cheminee, `V` puits, `Y` guirlande, `z` feu-sol (grange brûlée), `h` foin |
| `interieur` | Maisons, forge, auberge, boutiques, sanctuaire, prison, bibliothèque | `a` enclume, `n` fourneau-forge, `v` autel, `j` barreaux, `y` livres-sol, `e` escalier-descente, `u` tapis-bord, `q` cheminee-interieur |
| `foret` | Sentier des Collines, Bois des Murmures | `n` racine-geante, `v` autel-mousse, `a` souche, `C` champignon, `V` fougere, `y` racine-sol (non solide) |
| `grotte` | Mine d'Ocre, Grotte des Sirènes, égouts de Valcourt | `n` rail (non solide), `a` minerai-mur, `v` eau-egout (water), `C` stalactite (above), `V` stalagmite, `y` grille-egout, `e` echelle |
| `ruines` | Tellume, Temple Englouti, Tour des Vents, sanctuaires de l'Île | `n` glyphe-sol (non solide, lumineux), `v` autel-accordeur, `a` diapason-base, `C` voute (above), `V` fresque, `y` dalle-pression, `e` mecanisme |
| `port` | Port-Lazuli, villages sur pilotis, récifs | `n` quai, `a` cordage, `v` bateau-coque, `C` mat (above), `V` filet, `y` caisse-port, `e` phare-mur, `f` glace-fissuree (ice) |
| `ville` | Valcourt, quartier des cuivres, château | `n` pave-royal, `a` mur-chateau, `v` creneau (above), `C` banniere, `V` fontaine, `y` affiche, `e` grille-fer |
| `falaises` | Col des Corbeaux, Hauts Venteux, Ventelune | `n` planche-suspendue, `a` corde-tendue, `v` moulin-aile, `C` nuage-solide, `V` planeur-pose, `y` courant-air (non solide), `e` echelle-corde |
| `desert` | Désert de Cendre, Oasis de Sahr, champs morts | `n` dune (solide, déplaçable par Bourrasque via objet), `a` tente, `v` puits-sacre, `C` palmier-haut (above), `V` palmier-bas, `y` champ-mort, `e` fresque-cendraise |
| `volcan` | Temple de Braise | `n` roche-noire, `a` cristal-feu, `v` pont-obsidienne, `C` fumee (above), `V` geyser, `y` cendre-sol, `e` roche-fondable |
| `monde` | Carte du monde (déplacement en petit sprite) | `n` ville, `a` donjon, `v` route, `C` montagne (solide), `V` foret-monde, `y` plage, `e` ile |

## Objets interactifs (`art/sprites/`, kind `object`)

Sprites attendus, avec leurs états : `caisse` (idle), `rocher-poussable` (idle), `brasero` (off, on), `torche` (off, on), `bourgeon` (idle, grown = liane sur 1 case, `liane` sprite séparé pour les cases au-dessus), `ronce` (idle), `toile` (idle), `glace-bloc` (idle), `flaque` (idle, frozen), `bassin` (off = vide, on = plein), `coffre` (idle, open), `levier` (off, on), `pilier-mobile` (idle), `wagonnet` (idle), `tronc` (idle), `tonneau-roulant` (idle), `meule` (idle), `porte-fermee` (idle, open), `dalle` (off, on), `autel` (idle, on), `cristal-cache` (idle = invisible pointillé, on = révélé), `plateforme` (off = basse, on = haute), `moulin-roue` (idle-0..3), `point-sauvegarde` (idle-0..1), `lueur-scintillement` (idle-0..3), `cle-pierre`, `diapason` (grand, idle-0..1).

## Lueurs

28 petits esprits 16 × 16, kind `object` avec `idle-0`, `idle-1` (flottement). Une forme par élément (Terre : galet rond avec yeux ; Feu : flammèche ; Eau : goutte ; Vent : petit tourbillon) et une variation de couleur et de détail par Lueur. Prisme : les 4 couleurs.

## Portraits

48 × 48, buste de face légèrement tourné, fond transparent. Héros : 6 expressions. Personnages principaux (Aubin, Lila, Ilse, Corvo, Varn, Dumarre, Mila, Ottavio, Dame Aster, Mère Sahra, Gontran, Brann) : `neutre` plus 1 à 2 expressions. PNJ secondaires : pas de portrait.

## Interface (`art/ui/`)

`cadre` (bordure 9-slice 24 × 24 : coins 8 px), `curseur` (flèche 8 × 8, 2 frames), `coeur`, `barre-pv` (fond et remplissage 1 × 4), `icones-resonances` (16 × 16, une frame par Résonance nommée par id), `icones-objets` (16 × 16 : `herbe`, `fiole`, `plume`, `encens`, `epee`, `hache`, `marteau`, `arc`, `dague`, `baton`, `fleau`, `armure`, `bouclier`, `casque`, `anneau`, `amulette`, `minerai`, `cle`, `livre`, `coquillage`), `icones-elements` (terre, feu, eau, vent, neutre), `emotes` (exclamation, question, coeur, colere, sueur, musique en 16 × 16), `icones-statuts` (poison, sommeil, etourdi, silence, confusion, ko).

## Effets (`art/sprites/`, kind `effect`)

`onde-poussee` (3 frames, 32 × 32), `flamme` (4 frames, 16 × 24), `givre-eclat` (3 frames), `feuilles` (racine, 4 frames), `goutte-pluie` (averse), `rafale` (bourrasque, 4 frames), `eclair`, `lueur-eclat` (révélation), `coup` (impact 16 × 16, 3 frames), `soin` (étincelles vertes, 4 frames), `poison-bulle`, `zzz` (sommeil), `etoiles` (étourdi).

## Sortie du script

- `assets/sprites/<id>.png` + `assets/sprites/<id>.json` : atlas Phaser (format `JSON hash`) dont les frames portent les noms du fichier source.
- `assets/sprites/manifest.json` : `{ "sprites": [{ "id", "kind", "width", "height", "animations": { "nom": { "frames": [...], "frameRate", "repeat" } } }] }`. `BootScene` lit ce manifeste pour tout charger et créer les animations `<id>/<animation>`.
- `assets/tiles/<id>.png` + `assets/tiles/<id>.json`.
