# Format audio (`data/audio/`)

Aucun fichier audio n'est disponible : toute la musique et tous les bruitages sont **synthétisés en temps réel** par `AudioManager` avec la Web Audio API, dans un style chiptune (oscillateurs carré, triangle, dent de scie, bruit). Les morceaux sont écrits en texte dans des JSON.

## Musique (`data/audio/music/<id>.json`)

```json
{
  "id": "brumeval",
  "title": "Brumeval dans la brume",
  "bpm": 104,
  "stepsPerBeat": 4,
  "loop": true,
  "tracks": [
    { "name": "melodie", "wave": "square", "volume": 0.22, "pattern": "E4:2 G4:2 A4:4 . B4:2 A4:2 G4:4 E4:4 | D4:4 E4:4 G4:8" },
    { "name": "accords", "wave": "triangle", "volume": 0.14, "pattern": "C3:8 G3:8 | A3:8 E3:8", "detune": 3 },
    { "name": "basse", "wave": "triangle", "volume": 0.2, "pattern": "C2:4 C2:4 G2:4 G2:4 | A2:4 A2:4 E2:4 E2:4" },
    { "name": "percu", "wave": "noise", "volume": 0.08, "pattern": "k:1 . h:1 . s:1 . h:1 . | k:1 . h:1 . s:1 h:1 h:1 ." }
  ]
}
```

### Syntaxe d'un `pattern`

- Les jetons sont séparés par des espaces. `|` est un simple repère de mesure, ignoré.
- Note : `<nom><octave>[:<durée>]`. Noms : `C C# D D# E F F# G G# A A# B` (ou `Db`, `Eb`…). Octaves 1 à 7. La durée est en pas (`stepsPerBeat` pas par temps, 4 par défaut = double-croche). Sans durée : 1 pas.
- `.` : silence d'un pas. `.:4` : silence de 4 pas.
- `~` : prolonge la note précédente d'un pas (liaison).
- Piste `noise` : `k` (grave, caisse claire basse), `s` (snare), `h` (hi-hat), avec durée optionnelle.
- Toutes les pistes d'un morceau doivent avoir la même longueur totale en pas (le script de validation le vérifie). Un morceau boucle quand il atteint la fin.

### Paramètres de piste

| Champ | Rôle |
| --- | --- |
| `wave` | `square`, `triangle`, `sawtooth`, `sine`, `noise`, `pulse25` (carré à 25 %), `pulse12` |
| `volume` | 0 à 1 (reste sous 0.3 pour éviter la saturation) |
| `detune` | décalage en cents, pour épaissir |
| `attack`, `release` | enveloppe en secondes (défaut 0.01 et 0.05) |
| `vibrato` | profondeur en cents (défaut 0) |
| `octave` | transpose toute la piste de N octaves |
| `arpeggio` | si `true`, les accords `[C4 E4 G4]:4` sont arpégés rapidement |

Accord simultané : `[C4 E4 G4]:4` joue 3 notes à la fois sur la piste.

### Morceaux attendus

| Id | Usage | Ambiance |
| --- | --- | --- |
| `titre` | Écran titre | Thème principal, ample, mélodie mémorisable en mode majeur avec un détour mineur |
| `brumeval` | Village de départ | Doux, pastoral, flûte carrée |
| `brumeval-nuit` | Fête des moissons | Même thème plus dansant |
| `attaque` | Scène 3, urgence | Rapide, mineur, percussions |
| `collines` | Sentier des Collines, carte du monde Acte 1 | Aventure, entraînant |
| `foret` | Bois des Murmures | Mystérieux, notes tenues, écho |
| `hautegrange` | Bourg | Marché, joyeux |
| `mine` | Mine d'Ocre | Sombre, rythmé comme des coups de pioche |
| `ruines` | Tellume, Temple Englouti, Tour des Vents | Ancien, solennel, chœur triangle |
| `port-lazuli` | Acte 2 ville | Marin, balancé 6/8 |
| `canaux` | Vieux quartier gelé | Froid, cristallin |
| `temple-englouti` | Donjon sous l'eau | Lent, bulles, basse ronde |
| `valcourt` | Capitale | Royal, cuivres carrés |
| `egouts` | Prison et égouts | Tendu, goutte régulière |
| `falaises` | Hauts Venteux | Aérien, arpèges |
| `ventelune` | Cité suspendue | Lumineux, cordes |
| `desert` | Désert de Cendre | Chaleur, gamme orientale |
| `oasis` | Oasis de Sahr | Calme, mystique |
| `volcan` | Temple de Braise | Lourd, lent, grave |
| `ile-choeur` | Donjon final | Les 4 thèmes régionaux cités |
| `combat` | Combat normal | Énergique, 4 pistes |
| `boss` | Boss | Plus rapide, dissonances |
| `jumeaux` | Ilse et Corvo | Thème à deux voix qui se répondent |
| `varn` | Boss final | Lent puis déchaîné, 3 variations `varn-1`, `varn-2`, `varn-3` |
| `victoire` | Fanfare de fin de combat (court, sans boucle) | Fanfare |
| `defaite` | Game Over | Triste, court |
| `kael`, `nyra`, `oren`, `sefa` | Thèmes de héros (moments d'émotion) | Chacun dans son élément |
| `repos` | Auberge (court) | Berceuse |
| `tension` | Cinématiques sombres (Varn) | Bourdon grave |
| `fin` | Épilogue et générique | Reprise du thème titre |

## Bruitages (`data/audio/sfx.json`)

```json
{
  "poussee": { "wave": "square", "freq": 90, "freqEnd": 38, "duration": 0.35, "volume": 0.5, "attack": 0.005, "decay": 0.3 },
  "ecoute": { "wave": "sine", "freq": 440, "freqEnd": 660, "duration": 0.4, "volume": 0.3, "vibrato": 20 },
  "ecoute-bloquee": { "wave": "sine", "freq": 220, "freqEnd": 110, "duration": 0.5, "volume": 0.3, "lowpass": 400 },
  "menu-deplacer": { "wave": "square", "freq": 880, "duration": 0.04, "volume": 0.2 },
  "coup": { "wave": "noise", "freq": 200, "duration": 0.12, "volume": 0.4, "decay": 0.1 }
}
```

Champs : `wave`, `freq`, `freqEnd?` (glissando), `duration`, `volume`, `attack?`, `decay?`, `vibrato?`, `lowpass?`, `highpass?`, `repeat?` (nombre de répétitions rapides), `interval?` (délai entre répétitions).

### Bruitages attendus

Résonances : `poussee`, `racine`, `braise`, `ecoute`, `ecoute-bloquee`, `givre`, `averse`, `prise`, `bourrasque`, `envol`, `revelation`, `accord`. Exploration : `pas`, `pas-herbe`, `pas-bois`, `pas-eau`, `porte`, `coffre`, `objet`, `lueur-trouvee`, `sauvegarde`, `warp`, `bloque`, `pousser`, `chute`, `puzzle-ok`, `puzzle-erreur`, `secret`. Menus : `menu-deplacer`, `menu-valider`, `menu-annuler`, `menu-ouvrir`, `menu-fermer`, `texte-bip` (de secours), `achat`, `pieces`. Combat : `combat-debut`, `coup`, `coup-critique`, `esquive`, `sort-feu`, `sort-eau`, `sort-terre`, `sort-vent`, `soin`, `poison`, `sommeil`, `etourdi`, `ko`, `lueur-liberee`, `invocation`, `niveau`, `fuite`, `victoire-court`. Cinématiques : `cloche`, `onde-diapason`, `tremblement`, `verre-brise`, `tonnerre`, `vague`, `chaines`.

## Voix des personnages

Le bip de voix de chaque personnage vient de `data/characters.json` (`voice: { pitch, wave, length }`). `AudioManager.voiceBlip(voice)` joue un bip court avec une variation aléatoire de ±8 % de hauteur. Les Lueurs : `pitch` 1400 à 1800, `sine`. Varn : 110, `sawtooth` filtré. Corvo : 150, `square`. Ilse : 420, `triangle`. Kaël : 260, `square`. Nyra : 380, `pulse25`. Oren : 460, `triangle`. Sefa : 340, `square`. Lila : 620, `triangle`. Aubin : 190, `triangle`.
