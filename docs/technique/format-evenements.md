# Format des scènes et événements (`data/dialogues/*.json`)

Une scène est une liste d'actions exécutées dans l'ordre par `EventRunner`. Le format suit celui du document Dialogues (`perso`, `expr`, `texte`, `choix`, `suite`) et l'étend avec des actions typées. Les types exacts sont dans `src/data/types.ts` (`DialogueScene`, `EventAction`).

## Squelette

```json
{
  "id": "a1-s01-matin-brumeval",
  "titre": "Acte 1, scène 1 : Le matin à Brumeval",
  "lignes": []
}
```

## Les 4 formes courtes

```json
{ "perso": "aubin", "expr": "sourire", "texte": "Debout, l’apprenti ! Le soleil t’a battu, et pourtant il se lève tous les jours." }
{ "pensee": "Os… os… OS. Sous le banc. Personne doit savoir. Os.", "perso": "caillou" }
{ "ecran": "Kaël a utilisé la Résonance Poussée." }
{ "choix": [
  { "texte": "J’arrive.", "suite": [ { "perso": "aubin", "texte": "Bien. Un forgeron qui se lève tôt, c’est un forgeron qui finit tôt." } ] },
  { "texte": "Encore cinq minutes.", "suite": [ { "perso": "aubin", "texte": "Cinq minutes, et je te refroidis avec le seau du puits. À toi de voir." } ] }
] }
```

- `perso` : identifiant de `data/characters.json`. Pour un PNJ sans portrait, le nom s'affiche seul. Kaël qui dit « … » s'écrit `{ "perso": "kael", "texte": "…" }`.
- `expr` est facultatif (`neutre` par défaut). Choisis l'expression d'après la didascalie et le ton.
- Après un `choix`, l'exécution reprend à l'action suivante du tableau parent : la plupart des choix du script ne changent que la réaction immédiate.
- `suite` peut être une chaîne : identifiant d'une étiquette `{ "type": "label", "id": "..." }` vers laquelle sauter.
- `drapeau` sur un choix pose ce drapeau (exemples obligatoires : `sefa_porte_cle`, `sefa_confiance`, `ottavio_relique_rendue`, `jumeaux_epargnes`).

## Actions typées

Toutes les autres actions ont un champ `type`. Liste complète dans `TypedEventAction` :

| type | Champs | Usage |
| --- | --- | --- |
| `move` | `cible`, `direction`, `pas`, `vitesse?` | Déplace `player` ou un PNJ de N cases. |
| `moveTo` | `cible`, `x`, `y` | Déplace vers une case (chemin direct). |
| `face` | `cible`, `direction` | Oriente. |
| `teleport` | `cible?`, `carte?`, `x`, `y`, `direction?` | Change de carte ou de position (avec fondu si `carte` change). |
| `spawn` / `despawn` | `pnj`, `sprite`, `x`, `y` | Fait apparaître un personnage de cinématique (Ilse, Corvo, sbires…). |
| `anim` | `cible`, `animation` | Joue une animation (`kael/victory`). |
| `emote` | `cible`, `emote` | Bulle `exclamation`, `question`, `coeur`, `colere`, `sueur`, `musique`. |
| `give` | `objet`, `quantite`, `pieces`, `lueur`, `resonance` | Donne. Pour une Résonance ou une Lueur, l'écran de tutoriel du GDD s'affiche automatiquement. |
| `take` | `objet`, `quantite`, `pieces` | Retire. |
| `setFlag` | `drapeau`, `valeur?` | Pose un drapeau (`true` par défaut). |
| `if` | `condition`, `alors`, `sinon?` | Branche selon une `EventCondition`. |
| `startBattle` | `groupe`, `scripted?` | Lance un combat (`data/encounters.json`). `scripted.loseAfterTurns` pour l'embuscade, `defeatContinues` pour le duel contre Nyra. |
| `fade` | `vers` (`noir`, `blanc`, `visible`), `duree?` | Fondu. |
| `wait` | `duree` (ms) | Pause. |
| `playSound` / `playMusic` | `son` / `musique` (null = silence), `fondu?` | Audio. |
| `shake` / `flash` | `duree?`, `intensite?` / `couleur?` | Caméra. |
| `recruit` | `heros` | Ajoute un héros à l'équipe (affiche « X a rejoint l’équipe ! »). |
| `heal` | | Soin complet de l'équipe. |
| `quest` | `action` (`start`, `task`, `complete`), `mission`, `tache?` | Fait avancer le journal. `task` valide la tâche d'index `tache` (0 = première). |
| `title` | `texte`, `sousTitre?`, `duree?` | Carton (« Fin de l’Acte 1 : Le Réveil »). |
| `save` | | Sauvegarde automatique. |
| `setMapState` | `cle`, `valeur` | Modifie un objet de la carte courante (ouvrir une porte…). |
| `openShop` / `inn` / `forge` | `boutique` / `prix` | Ouvre une interface. |
| `gameOver`, `credits`, `end` | | Fin de scène ou du jeu. |

## Transcrire le script

1. Une scène du document = un fichier. Le numéro de scène et le titre reprennent ceux du document.
2. Chaque didascalie en italique devient des actions de mise en scène (`move`, `spawn`, `fade`, `shake`, `playMusic`, `wait`). Reste sobre : 1 à 4 actions par didascalie.
3. Les « Écran : … » deviennent `ecran`. Les « Écran de tutoriel : … » aussi.
4. Les « Écoute sur X : [pensée] » dans une scène deviennent `pensee`. Quand la pensée dépend d'un objet de la carte (autel, colonne, cerf), elle va plutôt dans `data/npcs.json` ou dans l'objet de la carte ; indique-le dans ton rapport.
5. Les « Combat … » deviennent `startBattle`, avec l'identifiant de groupe convenu : `a1-sbires-place`, `a1-nyra-duel`, `boss-cerf-de-mousse`, `boss-corvo-mine`, `boss-ilse-corvo-tellume`, `a2-gardes-ruelle`, `boss-hydre-givre`, `boss-leviathan`, `a2-embuscade-recifs`, `boss-crocodile`, `a3-planeurs-1` à `-3`, `boss-roc-tempete`, `boss-ver-sables`, `boss-gardienne`, `boss-dragon-braise`, `boss-jumeaux-final`, `boss-varn-1`, `boss-varn-2`, `boss-varn-3`.
6. Les « Puzzle … » du script sont joués sur la carte, pas dans la scène : coupe la scène en deux fichiers (`-a` et `-b`) autour du puzzle et note la coupure dans ton rapport.
7. Une réplique de plus de 120 caractères est découpée en plusieurs `say` du même `perso`, sans changer un mot.
8. Quand le script dit que Kaël « ne parle pas » ou « … », garde le `…`.
9. Les fins d'acte : `title`, puis `save`.

## Personnages (`data/characters.json`)

Un tableau de `CharacterData`. Identifiants à utiliser : `kael`, `nyra`, `oren`, `sefa`, `aubin`, `lila`, `caillou`, `bertrand`, `margot`, `joss`, `paulin`, `villageoise`, `villageois`, `ilse`, `corvo`, `varn`, `sbire`, `gontran`, `brann`, `lucien`, `gaspard`, `rosa`, `garde`, `enfant`, `tobias`, `mineur`, `mila`, `mme-marelle`, `m-marelle`, `ottavio`, `vieux-pecheur`, `dumarre`, `resonante`, `vieux-resonant`, `inconnue`, `dame-aster`, `mere-sahra`, `aubergiste`, `gres`, `goutte`, `rafale`, `tison`, `narrateur`, et tout autre nom en gras du script. Les Lueurs ont une voix très aiguë et courte. Varn a une voix grave et lente. Ilse une voix nette et moyenne. Corvo grave et rapide.

## PNJ secondaires (`data/npcs.json`)

Les tableaux « dialogues secondaires » du script deviennent des `NpcData` avec des variantes conditionnelles :

```json
{
  "id": "bertrand",
  "name": "Gros Bertrand",
  "sprite": "bertrand",
  "character": "bertrand",
  "lines": [
    { "si": { "flag": "attaque_brumeval" }, "texte": "Reviens entier, petit. Ma tourte t’attendra.", "pensee": "J’aurais dû me battre, moi aussi. J’ai eu peur." },
    { "texte": "Une chambre ? Pour toi, c’est gratuit. Enfin, tu fais la vaisselle.", "pensee": "J’aurais dû me battre, moi aussi. J’ai eu peur." }
  ]
}
```

La première variante dont la condition passe est utilisée ; la dernière n'a pas de condition. Les drapeaux de progression à utiliser : `m1_01_fini` … `m4_08_fini` (posés automatiquement à la fin de chaque mission), `attaque_brumeval` (après la scène 3), `nyra_recrutee`, `oren_recrute`, `sefa_recrutee`, `diapason_terre_frappe`, `diapason_eau_frappe`, `diapason_vent_frappe`, `diapason_feu_frappe`, `sefa_confiance`, `sefa_mefiance`, `jumeaux_epargnes`, `ottavio_relique_rendue`, `sefa_porte_cle`, `lueurs_27`, `jeu_fini`.
