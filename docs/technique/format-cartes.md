# Format des cartes (dossier `maps/` → `assets/maps/*.tmj`)

Les cartes sont écrites en ASCII dans `maps/<id>.json`, puis converties en cartes Tiled JSON (`.tmj`) par `scripts/build-maps.mjs`. Le jeu charge uniquement les `.tmj`, qui restent ouvrables dans Tiled.

## Structure d'une carte

```json
{
  "id": "brumeval",
  "name": "Brumeval",
  "tileset": "village",
  "music": "brumeval",
  "zone": "collines",
  "indoor": false,
  "ground": [
    "..............................",
    "....==========................",
    "..(autant de lignes que de hauteur, toutes de même longueur)"
  ],
  "decor": [
    "..TTT.........................",
    "..ttt.........................",
    "..(mêmes dimensions ; '.' = rien)"
  ],
  "collisions": [
    "..(optionnel, mêmes dimensions ; '#' force un blocage, 'o' force un passage, '.' = déduit des tuiles)"
  ],
  "encounters": {
    "min": 25,
    "max": 40,
    "groups": ["collines-loups", "collines-sbires"]
  },
  "objects": [],
  "puzzles": []
}
```

- `ground` : couche de sol, obligatoire, pas de case vide (`.` est le sol principal du tileset).
- `decor` : couche au-dessus du sol, `.` signifie « rien ». Les tuiles marquées `above` dans le tileset sont rendues au-dessus du joueur automatiquement.
- Les collisions sont déduites des propriétés `solid` des tuiles de `ground` et `decor`, plus la couche `collisions` facultative.
- `encounters` : `null` pour une zone sans combats. Les identifiants pointent vers `data/encounters.json`.
- Dimensions conseillées : villages 30 × 24 à 40 × 30, salles de donjon 20 × 15 à 30 × 20, intérieurs 12 × 10 à 20 × 14. La caméra fait 25 × 15 tuiles.

## Objets

Chaque objet a `x`, `y` en tuiles (origine en haut à gauche) et un `type`.

| type | Champs | Rôle |
| --- | --- | --- |
| `spawn` | `id`, `direction` | Point d'arrivée nommé. Chaque carte a au moins un spawn `defaut`. |
| `warp` | `to: { map, spawn }`, `w?`, `h?`, `direction?` | Changement de carte quand le joueur marche sur la case. `direction` impose la direction de sortie. |
| `npc` | `id` (référence `data/npcs.json`), `direction?`, `si?` | PNJ posé sur la carte. `si` est une condition (`EventCondition`) pour qu'il apparaisse. |
| `object` | `id`, `sprite`, `reactsTo: []`, `onReact`, `solid?`, `state?`, `si?`, `props?` | Objet interactif (voir ci-dessous). |
| `trigger` | `id`, `w?`, `h?`, `scene`, `once?`, `si?` | Lance la scène `data/dialogues/<scene>.json` quand le joueur entre dans la zone. `once` ne la rejoue jamais (mémorisé dans `mapState`). |
| `chest` | `id`, `item`, `quantity?`, `coins?`, `si?` | Coffre. Ouvert une fois (mémorisé). |
| `lueur` | `id` (référence `data/lueurs.json`), `si?`, `needs?` | Lueur à ramasser. `needs` : Résonance requise pour la voir (`revelation`) ou l'atteindre. |
| `sign` | `texte` | Panneau lisible. |
| `save` | | Point de sauvegarde (cristal). |
| `inn` | `prix`, `npc` | Lit de l'auberge : soin complet et sauvegarde. |
| `shop` | `boutique` (référence `data/shops.json`) | Comptoir du marchand. |
| `forge` | | Enclume de la forge de Kaël. |
| `talk` | `id`, `scene`, `si?`, `sprite?` | Zone ou objet avec lequel on peut « parler » (autel, colonne, fresque) : lance la scène. Pour Écoute sur un objet, utilise `pensee`. |
| `examine` | `id`, `texte`, `pensee?` | Objet que l'on examine (texte court) et que l'on peut écouter. |

### Objets interactifs et Résonances

`reactsTo` liste les Résonances acceptées, `onReact` l'effet déclenché :

| onReact | Résonance habituelle | Effet |
| --- | --- | --- |
| `push` | poussee | Glisse d'une case dans la direction du lancer si la case suivante est libre. Peut être poussé au-dessus d'un `gap` (il tombe et comble le trou : devient passage). `props.weight: "heavy"` pour les piliers (ne bougent que de 1 case par lancer, jamais au-dessus du vide). |
| `burn` | braise | Disparaît (ronce, toile, corde). |
| `light` | braise | Passe à l'état `on` (torche, brasero). `averse` le repasse à `off`. |
| `melt` | braise | Disparaît (bloc de glace). |
| `grow` | racine | Un bourgeon devient une liane grimpable : les cases au-dessus listées dans `props.liana` deviennent franchissables. |
| `freeze` | givre | Une flaque devient un pilier de glace : la case devient franchissable. |
| `fill` | averse | Un bassin se remplit (état `on`), ce qui déclenche un puzzle ou fait monter une `plateforme`. |
| `extinguish` | averse | Éteint un feu de sol qui bloque. |
| `grab` | prise | Attire l'objet jusqu'au joueur (objet distant) ou actionne un levier hors de portée. |
| `blow` | bourrasque | Pousse un objet léger de `props.distance` cases (3 par défaut), fait tourner un moulin (`on`), disperse une brume (`props.fog`). |
| `reveal` | revelation | L'objet devient visible et solide ou franchissable (passage secret, Lueur cachée). |
| `listen` | ecoute | Affiche la pensée `props.pensee`. |
| `lever` | (parler) | Bascule `on` / `off`. |
| `plate` | (marcher) | Dalle de pression : `on` tant qu'un objet ou le joueur est dessus. |
| `vapor-lift` | vapeur | Fait monter une plateforme. |
| `melt-rock` | magma | Disparaît (roche). |
| `forest` | maree-verte | Transforme une zone morte (puzzle). |
| `turbine` | tempete | Fait tourner une turbine (`on`). |
| `dune` | sable-vif | Déplace une dune de `props.distance` cases. |
| `fireball` | brasier | Allume une cible distante. |

L'état d'un objet (`on`, `off`, position après poussée, détruit) est mémorisé dans `GameState.mapState[carte][objet]` quand `props.persist` vaut `true` (par défaut `true` pour les coffres, Lueurs, portes et objets détruits ; `false` pour les poussables et les torches, pour que « sortir et revenir » réinitialise la salle).

## Puzzles

Un puzzle relie des objets et une récompense. Il est évalué par `PuzzleManager` à chaque changement d'état d'objet.

```json
{
  "id": "braseros-mine-1",
  "type": "sequence",
  "objects": ["brasero-a", "brasero-b", "brasero-c"],
  "order": ["brasero-b", "brasero-a", "brasero-c"],
  "resetOnFail": true,
  "onSolved": { "setMapState": { "plateforme-1": "on" }, "setFlag": "mine_plateformes_1", "sound": "puzzle-ok", "scene": "a1-s07-plateformes" }
}
```

| type | Résolu quand |
| --- | --- |
| `all` | Tous les `objects` sont à l'état `targetState` (`on` par défaut). |
| `sequence` | Les objets sont activés dans l'ordre `order`. `resetOnFail` éteint tout si l'ordre est faux. |
| `positions` | Chaque objet listé dans `targets: [{ "object", "x", "y" }]` est à sa position. |
| `count` | Au moins `count` objets sont à l'état cible. |
| `flags` | Tous les drapeaux de `flags` sont vrais. |

`onSolved` accepte : `setMapState` (objets de la carte à modifier, ex. ouvrir une `porte-fermee` → `open`), `setFlag`, `sound`, `scene`, `questTask: { mission, tache }`.

## Règles de design des puzzles

- Une salle = une Résonance nouvelle ou une combinaison de deux Résonances connues. Jamais plus de 3 étapes dans l'Acte 1, jusqu'à 5 dans l'Acte 4.
- Chaque donjon suit la structure du GDD : entrée qui annonce le thème, 3 à 6 salles de difficulté croissante, Résonance au milieu, Lueur cachée qui demande un usage inattendu, point de sauvegarde avant le boss, boss, raccourci vers la sortie.
- Toujours un moyen de réinitialiser (sortir et revenir remet les poussables en place).
- Les objets interactifs ont une couleur ou un liseré reconnaissable et scintillent légèrement si la Résonance sélectionnée peut agir dessus.
- Les anciennes zones gagnent des passages optionnels ouverts par les Résonances des actes suivants (missions Lueur du document Scénario).

## Sortie Tiled

Le script produit un `.tmj` orthogonal 16 × 16 avec : les tilesets embarqués (`image` relative vers `../tiles/<id>.png`, `tileproperties` pour `solid`, `water`, etc.), les calques de tuiles `sol`, `decor`, `au-dessus` (tuiles `above` extraites de `decor`), le calque `collisions` (1 = bloqué), et le calque d'objets `objets` dont chaque objet porte ses champs dans `properties` (les tableaux et objets sont sérialisés en JSON dans une propriété de type `string`). Les propriétés de carte (`music`, `zone`, `indoor`, `encounters`, `puzzles`) sont dans `properties` de la carte.
