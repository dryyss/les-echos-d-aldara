# Scénario et missions

L'histoire jouée mission par mission, avec les tâches que le joueur doit accomplir. Les répliques exactes de chaque scène sont dans `dialogues.md`.

## Système de missions

Le jeu se découpe en missions, chacune composée de tâches courtes et claires. Le joueur sait toujours quoi faire ensuite grâce au journal, sans flèche géante à l'écran.

### Les 3 types de missions

| Type | Couleur dans le journal | Obligatoire | Exemple |
| --- | --- | --- | --- |
| Principale | Or | Oui | « Le Bois des Murmures » |
| Annexe | Bleu | Non | « Le jardin du maire » |
| Lueur | Vert | Non | « La Lueur du moulin » |

### Les types de tâches

| Tâche | Ce que le joueur fait | Exemple |
| --- | --- | --- |
| Aller | Atteindre un lieu | Atteindre l'entrée du Bois des Murmures |
| Parler | Discuter avec un PNJ | Parler au maire Gontran |
| Écouter | Lire les pensées d'un PNJ avec Écoute | Écouter le garde pour trouver le mot de passe |
| Résoudre | Finir un puzzle avec des Résonances | Aligner les 4 piliers de Tellume |
| Vaincre | Gagner un combat précis | Vaincre le Cerf de Mousse |
| Trouver | Ramasser un objet | Trouver 5 minerais rouges |
| Livrer | Apporter un objet à quelqu'un | Rapporter le minerai à Aubin |
| Choisir | Prendre une décision qui a une conséquence | Épargner Ilse et Corvo ou non |

### Le journal de missions

- Une mission affiche son titre, une phrase de résumé écrite comme un carnet de Kaël, et la liste de ses tâches.
- Les tâches se cochent au fur et à mesure, la suivante apparaît seulement quand la précédente est faite.
- Une icône sur la carte du monde montre la zone de la tâche principale en cours, jamais le point exact.
- Une mission terminée reste lisible dans un onglet « Souvenirs ».

### Récompenses

- **Missions principales :** expérience, nouvelle Résonance ou Lueur, avancée de l'histoire.
- **Missions annexes :** pièces, objets rares, matériaux de forge, parfois une Lueur.
- **Missions Lueur :** toujours une Lueur, souvent dans une zone déjà visitée qui demande une Résonance obtenue plus tard.

### Format technique d'une mission (JSON)

```json
{
  "id": "m1-04",
  "type": "principale",
  "titre": "Le Bois des Murmures",
  "resume": "Les traces de l'Ordre mènent au bois. Aubin est peut-être là-bas.",
  "taches": [
    { "type": "aller", "cible": "bois-entree", "texte": "Entrer dans le Bois des Murmures" },
    { "type": "resoudre", "cible": "bois-salle-3", "texte": "Trouver un moyen de grimper" },
    { "type": "vaincre", "cible": "cerf-de-mousse", "texte": "Vaincre le gardien du bois" }
  ],
  "recompenses": { "xp": 120, "resonance": "racine" },
  "suivante": "m1-05"
}
```

### Drapeaux de choix importants

| Drapeau | Posé à | Effet |
| --- | --- | --- |
| `sefa_porte_cle` | Acte 3, scène 6 | Réplique de Sefa avant l'Île du Chœur |
| `sefa_confiance` | Acte 3, scène 8 | Confiance : bonus d'attaque permanent pour Sefa, dialogues chaleureux, scène bonus avec Kaël. Méfiance : dialogues tendus, quête « La dette de Sefa » pour regagner sa confiance |
| `ottavio_relique_rendue` | Acte 2, scène 5 | Si non rendue, Ottavio réclame un service à l'Acte 4 |
| `jumeaux_epargnes` | Acte 4, scène 6 | Ilse et Corvo apparaissent dans l'épilogue à Brumeval |
| `lueurs_27` | Acte 4, scène 8 | Lueur Prisme et classe Accordeur débloquées |

---

# Acte 1 : Le Réveil

L'Acte 1 raconte comment Kaël, simple apprenti forgeron, devient un Résonant assumé et échoue à empêcher l'Ordre de frapper le premier Diapason. Il se termine sur une défaite qui lance la vraie aventure. Durée visée : 3 à 4 heures.

## Scénario scène par scène

1. **Le matin à Brumeval.** Kaël se réveille chez Maître Aubin, qui lui demande d'aller chercher du minerai au fond du village. En chemin, Lila est coincée derrière des caisses effondrées. Kaël les pousse « par réflexe »… à distance. Il vient d'utiliser une Résonance sans le vouloir. Lila promet de garder le secret.
2. **La fête des moissons.** Le soir, le village fête les moissons. Aubin prend Kaël à part au sanctuaire et lui avoue qu'il sait : Kaël est un Résonant, comme Aubin lui-même. Il lui montre la Clé de Terre cachée sous l'autel et lui apprend Écoute. Une cloche d'alarme retentit.
3. **L'attaque.** Des hommes masqués de cuivre encerclent le village. Ilse et Corvo réclament la Clé. Aubin refuse et se bat, mais il est vaincu par Corvo et emmené avec la Clé. Premier combat du jeu contre deux sbires. Kaël est assommé par Corvo.
4. **Le départ.** Les villageois accusent Kaël. Seule Lila le défend. Kaël prend le marteau d'Aubin et part sur la piste de l'Ordre vers le Bois des Murmures, en promettant à Lila de revenir.
5. **Le Bois des Murmures.** Le bois est envahi par des racines géantes depuis le passage de l'Ordre. Kaël y trouve sa première Lueur (Grès) et apprend Racine sur un autel des Accordeurs. Le Cerf de Mousse, gardien du bois rendu fou par l'Ordre, l'attaque. Vaincu, il retrouve son calme et indique Hautegrange.
6. **Hautegrange et Nyra.** Des chasseurs traquent une « sorcière de feu ». Grâce à Écoute, Kaël la retrouve avant eux : c'est Nyra. Combat amical, puis alliance quand Kaël l'aide à semer les chasseurs. Nyra connaît un raccourci par la Mine d'Ocre.
7. **La Mine d'Ocre.** L'Ordre fait travailler des mineurs de force pour dégager l'accès aux Ruines de Tellume. Kaël et Nyra libèrent les mineurs et battent Corvo, qui s'enfuit en riant.
8. **Les Ruines de Tellume.** Les héros traversent le donjon, retrouvent Aubin enchaîné devant le Diapason de Terre et affrontent Ilse et Corvo.
9. **Le premier coup.** Même vaincus, les jumeaux ont gagné du temps. Varn apparaît pour la première fois, masqué, immobilise les héros et frappe le Diapason. Une onde secoue la région. Il épargne Kaël : « Tu entends l'Écho, toi aussi. Un jour, tu comprendras. »
10. **Épilogue de l'acte.** Aubin révèle qu'il reste 3 Diapasons. La Famille Gardienne la plus proche, les Marelle, vit à Port-Lazuli. Il donne son marteau à Kaël. Kaël et Nyra partent vers les Marches de Saphir.

## Missions principales de l'Acte 1

| N° | Mission | Lieu | Récompense |
| --- | --- | --- | --- |
| M1-01 | Une matinée ordinaire | Brumeval | Résonance Poussée |
| M1-02 | Le secret d'Aubin | Brumeval | Résonance Écoute |
| M1-03 | La nuit des masques | Brumeval | Marteau d'Aubin, 50 XP |
| M1-04 | Le Bois des Murmures | Bois des Murmures | Résonance Racine, Lueur Grès |
| M1-05 | La sorcière de feu | Hautegrange | Nyra rejoint l'équipe, Lueur Tison |
| M1-06 | Sous la montagne | Mine d'Ocre | Lueur Cendre, accès aux ruines |
| M1-07 | Le cœur de Tellume | Ruines de Tellume | Aubin libéré |
| M1-08 | Le premier coup | Ruines de Tellume | Fin de l'Acte 1 |

### M1-01 : Une matinée ordinaire

1. Parler à Maître Aubin dans la forge.
2. Aller chercher le minerai au fond du village.
3. Aider Lila, coincée derrière des caisses (tutoriel Poussée).
4. Rapporter le minerai à Aubin.

### M1-02 : Le secret d'Aubin

1. Rejoindre la fête des moissons sur la place.
2. Parler à 3 villageois (présentation du village).
3. Retrouver Aubin au sanctuaire.
4. Utiliser Écoute sur Caillou, le chien d'Aubin (tutoriel Écoute).

### M1-03 : La nuit des masques

1. Rejoindre la place attaquée par l'Ordre.
2. Vaincre 2 sbires de l'Ordre (tutoriel combat).
3. Assister à l'enlèvement d'Aubin.
4. Parler aux villageois après l'attaque.
5. Récupérer le marteau d'Aubin dans la forge en ruines.

### M1-04 : Le Bois des Murmures

1. Suivre les traces de l'Ordre jusqu'au bois.
2. Trouver la Lueur Grès cachée près de l'entrée (tutoriel Lueurs).
3. Atteindre l'autel des Accordeurs et obtenir Racine.
4. Grimper jusqu'au cœur du bois avec Racine.
5. Vaincre le Cerf de Mousse.

### M1-05 : La sorcière de feu

1. Arriver à Hautegrange et se reposer à l'auberge.
2. Écouter les chasseurs pour apprendre où se cache la « sorcière ».
3. Trouver Nyra à la cabane du ruisseau avant les chasseurs.
4. Vaincre Nyra en combat amical.
5. Aider Nyra à semer les chasseurs (puzzle de fuite avec Poussée et Braise).

### M1-06 : Sous la montagne

1. Entrer dans la Mine d'Ocre par le raccourci de Nyra.
2. Allumer les 3 braseros pour faire monter les plateformes.
3. Libérer les mineurs enfermés (3 cellules).
4. Vaincre Corvo.

### M1-07 : Le cœur de Tellume

1. Traverser l'entrée des Ruines de Tellume.
2. Résoudre la salle des ombres (aligner les 4 piliers).
3. Retrouver Aubin enchaîné.
4. Vaincre Ilse et Corvo devant le Diapason.

### M1-08 : Le premier coup

1. Assister à l'apparition de Varn (cinématique).
2. Ramener Aubin à l'entrée des ruines.
3. Parler à Aubin pour apprendre l'existence des 3 autres Diapasons.
4. Partir vers Port-Lazuli (fin de l'acte).

## Quêtes annexes de l'Acte 1

| Quête | Type | Où | Disponible | Tâches | Récompense |
| --- | --- | --- | --- | --- | --- |
| Le chat de Lila | Annexe | Brumeval | Après M1-01 | Écouter les animaux pour retrouver le chat, le faire descendre du toit avec Poussée | Herbe de soin × 3 |
| La dette du meunier | Annexe | Brumeval | Après M1-02 | Pousser la meule bloquée, rapporter 3 sacs de grain | 80 pièces |
| Le jardin du maire | Annexe | Hautegrange | Après M1-05 | Brûler les ronces avec Braise, faire pousser une liane avec Racine pour atteindre le pommier d'or | Anneau de vitalité |
| Les chasseurs repentis | Annexe | Hautegrange | Après M1-05 | Écouter les 3 chasseurs, convaincre Lucien de quitter le groupe | Arc de frêne pour Nyra |
| Le minerai rouge | Annexe | Mine d'Ocre | Pendant M1-06 | Trouver 5 minerais rouges cachés, les rapporter à la forge | Épée d'ocre forgée par Kaël |
| Le fantôme du sanctuaire | Annexe | Brumeval (retour) | Après M1-08 | Écouter les murmures du sanctuaire la nuit, résoudre l'énigme des 4 torches | Fragment d'histoire des Accordeurs, 200 XP |
| La Lueur du moulin | Lueur | Brumeval | Après M1-04 | Faire pousser une liane sur le moulin avec Racine | Lueur Mousse |
| La Lueur des braises | Lueur | Sentier des Collines | Après M1-05 | Allumer 3 torches cachées dans le bon ordre | Lueur Zéphyr |

### Règles d'écriture des quêtes annexes

- Chaque quête raconte une petite histoire humaine qui montre comment les Sourds vivent avec (ou contre) les Résonants.
- Une quête = au moins une Résonance utilisée de façon nouvelle.
- Les quêtes Lueur sont signalées par un petit scintillement visible seulement avec la bonne Résonance.

---

# Acte 2 : Les Rivières

L'Acte 2 introduit Oren et l'élément Eau, et se termine sur la première vraie défaite des héros : l'Ordre frappe le Diapason d'Eau sous leurs yeux. Durée visée : 4 à 5 heures.

## Scénario scène par scène

1. **Arrivée à Port-Lazuli.** Kaël et Nyra découvrent le grand port. La ville tolère les Résonants enregistrés, mais la Garde Royale contrôle tout le monde. La maison de la Famille Gardienne de l'Eau, les Marelle, est vide et fouillée. Un carnet déchiré mentionne Mila.
2. **Le bibliothécaire en fuite.** Dans le marché, la Garde poursuit un garçon qui a « emprunté » des livres : Oren. Les héros l'aident à s'échapper. Une Lueur (Goutte) le suit : il découvre qu'il est Résonant et rejoint l'équipe.
3. **Les canaux gelés.** L'Ordre a gelé les canaux du vieux quartier. Oren obtient Givre sur un autel des Accordeurs. L'équipe libère les quartiers et bat l'Hydre de Givre.
4. **La dernière Marelle.** Grâce à Écoute, l'équipe retrouve Mila Marelle cachée dans un entrepôt. Ses parents sont partis en bateau avec la Clé de l'Eau vers le Temple Englouti, et un bateau a fait naufrage. Seule la Guilde des Fouilleurs a la carte des épaves.
5. **Le marché avec Ottavio.** Maître Ottavio accepte de donner la carte en échange d'une relique gardée dans la Grotte des Sirènes. L'équipe y trouve le Gant d'Accordeur (Prise). Choix : rendre une copie forgée ou garder le gant contre un service futur.
6. **Le Temple Englouti.** Donjon sous-marin des Accordeurs. Oren crée des bulles d'air d'Écho et obtient Averse. Boss : le Léviathan de corail. Au fond, les parents Marelle, vivants, et la Clé.
7. **L'embuscade.** À la sortie, Ilse et Corvo attendent avec une armée de l'Ordre. Combat perdu d'avance : Ilse gèle l'équipe et prend la Clé.
8. **La vague.** Ilse frappe le Diapason d'Eau. Un raz-de-marée frappe la côte. Les héros se réveillent chez les Marelle. La Garde les accuse d'être complices de l'Ordre. Fuite vers Valcourt pour plaider leur cause. Mila donne un coquillage à Kaël.

## Missions principales

| N° | Mission | Lieu | Récompense |
| --- | --- | --- | --- |
| M2-01 | La ville sous contrôle | Port-Lazuli | Accès à la ville |
| M2-02 | Le voleur de livres | Port-Lazuli | Oren rejoint l'équipe, Lueur Goutte |
| M2-03 | Les canaux gelés | Vieux quartier | Résonance Givre |
| M2-04 | La dernière Marelle | Port-Lazuli | Informations sur la Clé |
| M2-05 | Le prix d'Ottavio | Grotte des Sirènes | Objet Prise, carte des épaves |
| M2-06 | Le Temple Englouti | Temple Englouti | Résonance Averse, Lueur Brume |
| M2-07 | La vague | Temple Englouti, Port-Lazuli | Fin de l'Acte 2 |

### M2-01 : La ville sous contrôle

1. Passer le contrôle de la Garde à l'entrée (Écouter le garde pour connaître le mot de passe « marée haute »).
2. Trouver une auberge qui accepte les Résonants.
3. Aller à la maison des Marelle.
4. Fouiller la maison et trouver le carnet déchiré.

### M2-02 : Le voleur de livres

1. Rejoindre le marché.
2. Suivre le garçon poursuivi par la Garde.
3. Bloquer les gardes avec Poussée (puzzle de poursuite).
4. Vaincre 3 gardes dans la ruelle.
5. Parler à Oren dans sa cachette.

### M2-03 : Les canaux gelés

1. Entrer dans le vieux quartier.
2. Faire fondre la glace avec Braise pour ouvrir le passage.
3. Atteindre l'autel des Accordeurs et obtenir Givre.
4. Libérer les 3 quartiers gelés (piliers de glace pour traverser).
5. Vaincre l'Hydre de Givre, créature invoquée par l'Ordre.

### M2-04 : La dernière Marelle

1. Écouter les habitants pour retrouver une enfant cachée.
2. Trouver Mila dans l'entrepôt.
3. Gagner sa confiance en rendant son lapin Pompon tombé dans l'eau (Givre).
4. Apprendre le secret du Temple Englouti.

### M2-05 : Le prix d'Ottavio

1. Rencontrer Maître Ottavio au siège de la Guilde.
2. Aller à la Grotte des Sirènes.
3. Récupérer le Gant d'Accordeur dans le coffre inaccessible (obtenir Prise).
4. Revenir voir Ottavio et choisir : rendre une copie ou garder le gant.
5. Recevoir la carte des épaves.

### M2-06 : Le Temple Englouti

1. Rejoindre l'épave des Marelle en bateau.
2. Plonger dans le Temple Englouti.
3. Obtenir Averse et remplir les bassins pour faire monter les plateformes.
4. Résoudre la salle des 3 niveaux d'eau.
5. Vaincre le Léviathan de corail.
6. Retrouver les parents Marelle et la Clé de l'Eau.

### M2-07 : La vague

1. Sortir du temple.
2. Affronter l'armée de l'Ordre (combat perdu d'avance).
3. Assister au coup frappé par Ilse (cinématique).
4. Se réveiller à Port-Lazuli et parler aux Marelle.
5. Fuir la ville avant l'arrivée de la Garde.

## Quêtes annexes

| Quête | Type | Où | Tâches | Récompense |
| --- | --- | --- | --- | --- |
| Le phare éteint | Annexe | Port-Lazuli | Rallumer les 3 braseros du phare avec Braise | Bottes marines |
| Les livres d'Oren | Annexe | Port-Lazuli | Retrouver 5 pages perdues dans la ville | Bâton du savant pour Oren |
| Le pêcheur et le poisson d'argent | Annexe | Quais | Geler l'eau pour coincer un poisson géant | 300 pièces |
| Les enfants des pilotis | Annexe | Villages sur pilotis | Réparer 3 ponts avec Racine et Givre | Amulette de calme |
| La Lueur du canal | Lueur | Vieux quartier | Attraper avec Prise une Lueur coincée sous un pont | Lueur Ressac (Eau) |
| La Lueur de l'épave | Lueur | Grotte des Sirènes | Faire monter l'eau avec Averse | Lueur Perle (Eau) |
| Le retour à Brumeval | Lueur | Brumeval | Geler la fontaine pour atteindre le toit du sanctuaire | Lueur Ardoise (Terre) |

---

# Acte 3 : Le Vent Trahi

L'Acte 3 fait entrer Sefa dans l'équipe et pose la question de la confiance. Les héros perdent la Clé du Vent par une trahison apparente, mais gagnent la Garde Royale comme alliée. Durée visée : 4 à 5 heures.

## Scénario scène par scène

1. **Valcourt, la capitale.** Les héros arrivent cachés dans une caravane pour prouver leur innocence. La Capitaine Dumarre les arrête aussitôt et les enferme.
2. **L'évasion.** Une inconnue masquée ouvre leur cellule : Sefa. Fuite à travers les égouts, boss crocodile mécanique.
3. **Le quartier des cuivres.** Dans le quartier fermé des Résonants enregistrés, Sefa avoue qu'elle vole les Clés avant l'Ordre. Elle sait que la Clé du Vent est à Ventelune et rejoint l'équipe. Elle donne le Monocle d'Accordeur (Révélation).
4. **La route des falaises.** Voyage vers les Hauts Venteux par le Col des Corbeaux. Sefa obtient Bourrasque dans un moulin des Accordeurs.
5. **Ventelune.** La Famille Gardienne du Vent, les Aster, refuse d'aider des « fugitifs ». L'équipe sauve la cité d'une attaque de planeurs de l'Ordre. Sefa obtient Envol.
6. **La Tour des Vents.** Donjon vertical (5 étages). Boss Roc Tempête. Les héros récupèrent la Clé du Vent avant l'Ordre. Choix : laisser Sefa porter la Clé ou la garder.
7. **La trahison.** Varn apparaît au sommet. Sefa lui remet la Clé et part avec lui. Écoute ne renvoie rien sur Sefa. Varn frappe le Diapason du Vent, une tornade détruit une partie de Ventelune.
8. **Le choix.** Trois jours plus tard, Sefa revient blessée. Sa trahison était une ruse pour connaître le plan de Varn : le dernier Diapason est dans un volcan du Désert de Cendre, et le frapper fera surgir l'Île du Chœur. Écoute confirme sa sincérité. Le joueur choisit de lui faire confiance ou non.
9. **L'alliance.** Dumarre a vu l'Ordre détruire Ventelune. Elle s'excuse, propose une alliance et révèle l'existence de Mère Sahra à l'Oasis de Sahr. Elle accompagne l'équipe dans le désert.

## Missions principales

| N° | Mission | Lieu | Récompense |
| --- | --- | --- | --- |
| M3-01 | Les murs de Valcourt | Valcourt | Accès à la capitale |
| M3-02 | La nuit des cellules | Prison de Valcourt | Sefa rejoint l'équipe, Lueur Rafale |
| M3-03 | Le quartier des cuivres | Valcourt | Objet Révélation |
| M3-04 | La route des falaises | Hauts Venteux | Résonance Bourrasque |
| M3-05 | La cité suspendue | Ventelune | Résonance Envol, Lueur Bise |
| M3-06 | La Tour des Vents | Tour des Vents | Clé du Vent (temporairement) |
| M3-07 | Celle qui revient | Ventelune | Retour de Sefa, choix de confiance |
| M3-08 | L'alliance | Ventelune | Alliance avec la Garde, fin de l'Acte 3 |

### M3-01 : Les murs de Valcourt

1. Entrer dans la capitale avec une caravane de marchands.
2. Aller au château pour demander audience.
3. Se faire arrêter par la Capitaine Dumarre (cinématique).

### M3-02 : La nuit des cellules

1. Écouter les gardes pour connaître la ronde.
2. Suivre l'inconnue masquée hors de la cellule.
3. Traverser les égouts (puzzles de Poussée et Givre).
4. Vaincre le gardien des égouts, un crocodile mécanique.
5. Parler à Sefa à la sortie.

### M3-03 : Le quartier des cuivres

1. Trouver l'atelier de Sefa dans le quartier des Résonants.
2. Parler à 4 Résonants enregistrés (montre leur vie sous contrôle).
3. Récupérer l'objet Révélation (Monocle d'Accordeur).
4. Révéler le passage secret vers la sortie de la ville.

### M3-04 : La route des falaises

1. Traverser le Col des Corbeaux.
2. Obtenir Bourrasque dans le moulin des Accordeurs.
3. Disperser la brume avec Bourrasque pour trouver le chemin.
4. Échapper aux patrouilles de la Garde (éviter les rencontres).

### M3-05 : La cité suspendue

1. Arriver à Ventelune et parler aux Aster.
2. Défendre les ponts contre l'attaque de l'Ordre (3 combats à la suite).
3. Couper les cordes des planeurs ennemis avec Braise.
4. Obtenir Envol au sommet de la cité.
5. Gagner l'accès à la Tour des Vents.

### M3-06 : La Tour des Vents

1. Entrer dans la tour.
2. Monter les 5 étages avec Envol et Bourrasque (courants d'air).
3. Trouver la Lueur cachée de l'étage 3.
4. Vaincre le Roc Tempête, gardien de la tour.
5. Récupérer la Clé du Vent et choisir qui la porte.
6. Assister à la trahison de Sefa (cinématique).

### M3-07 : Celle qui revient

1. Aider les habitants de Ventelune après la tempête.
2. Retrouver Sefa blessée à l'entrée de la cité.
3. Écouter Sefa pour savoir si elle ment.
4. Choisir : lui faire confiance ou rester méfiant.

### M3-08 : L'alliance

1. Retrouver la Capitaine Dumarre dans les ruines du palais des Aster.
2. Lui raconter ce qui s'est passé.
3. Accepter son alliance.
4. Partir vers le Désert de Cendre.

## Conséquences du choix sur Sefa

| Choix | Effet |
| --- | --- |
| Confiance | Sefa gagne un bonus d'attaque permanent, dialogues chaleureux, scène bonus avec Kaël à l'Acte 4 |
| Méfiance | Sefa reste dans l'équipe mais garde ses distances, dialogues tendus, elle doit regagner la confiance dans une quête annexe |

## Quêtes annexes

| Quête | Type | Où | Tâches | Récompense |
| --- | --- | --- | --- | --- |
| Le registre des cuivres | Annexe | Valcourt | Voler le registre des Résonants pour libérer 5 familles | Bracelet d'argent |
| La bibliothèque interdite | Annexe | Valcourt | Infiltrer la bibliothèque royale avec Oren, trouver 3 livres | Fragment d'histoire, sort Vague pour Oren |
| Les planeurs perdus | Annexe | Ventelune | Retrouver 4 planeurs emportés par le vent avec Bourrasque | Planeur sur la carte du monde |
| La dette de Sefa | Annexe | Valcourt | Rembourser l'ancien receleur de Sefa (si méfiance) | Confiance de Sefa regagnée |
| La Lueur des nuages | Lueur | Hauts Venteux | Sauter avec Envol sur 3 nuages solides | Lueur Alizé (Vent) |
| La Lueur invisible | Lueur | Port-Lazuli (retour) | Utiliser Révélation sur le phare | Lueur Écume (Eau) |
| L'autel caché | Lueur | Bois des Murmures (retour) | Souffler les feuilles mortes avec Bourrasque | Lueur Lichen (Terre) |

---

# Acte 4 : Le Chœur

L'Acte 4 révèle la vérité sur les Accordeurs et transforme la course contre l'Ordre en mission de sauvetage du monde. Les héros découvrent les Accords, des Résonances qui combinent deux éléments. Durée visée : 5 à 6 heures.

## La nouveauté de l'acte : les Accords

À l'Oasis de Sahr, les héros apprennent à résonner à deux. Un Accord demande deux héros d'éléments différents et sert en exploration comme en combat.

| Accord | Éléments | Effet en exploration | Effet en combat |
| --- | --- | --- | --- |
| Vapeur | Feu + Eau | Crée un nuage qui soulève des plateformes | Brûlure et aveuglement sur tous les ennemis |
| Magma | Terre + Feu | Fait fondre la roche pour ouvrir des passages | Grosse attaque de zone |
| Marée verte | Terre + Eau | Fait pousser une forêt entière en un instant | Soin puissant et régénération |
| Tempête | Vent + Eau | Fait tourner les turbines géantes des ruines | Attaque électrique sur tous les ennemis |
| Sable vif | Vent + Terre | Déplace des dunes entières | Ralentit tous les ennemis |
| Brasier | Vent + Feu | Projette des boules de feu à distance | Attaque de feu en chaîne |

## Scénario scène par scène

1. **La traversée du désert.** Avec l'aide de la Garde, l'équipe traverse le Désert de Cendre. Les champs morts montrent que l'Écho s'affaiblit vraiment. Boss : Ver des Sables.
2. **L'Oasis de Sahr.** Mère Sahra révèle le secret à travers 3 fresques : les Accordeurs voulaient que l'Écho soit réaccordé un jour, en douceur. Frapper les Diapasons de force rallumera l'Ère des Tempêtes. Les Diapasons frappés peuvent encore être réaccordés.
3. **L'apprentissage des Accords.** Les héros passent les épreuves du sanctuaire et apprennent les 6 Accords. Boss : la statue gardienne.
4. **Réaccorder le monde.** Les héros réaccordent les 3 Diapasons frappés (Kaël à Tellume, Oren au Temple Englouti, Sefa à la Tour des Vents) et rallient les Marelle, les Aster, Ottavio, la Garde et Brumeval.
5. **Le Temple de Braise.** Le dernier Diapason est dans un volcan. Boss : Dragon de Braise sauvage, qui offre la Lueur Magma à Nyra. Les héros récupèrent la Clé du Feu.
6. **Les jumeaux.** Ilse et Corvo attaquent le temple. Dernier combat loyal contre eux. Choix : les épargner ou les livrer à la Garde. Pendant ce temps, Varn vole la Clé du Feu.
7. **L'apparition de l'Île.** Varn frappe le dernier Diapason. L'Île du Chœur surgit de la mer au centre du monde. Les tempêtes commencent. Tous les alliés se réunissent sur la côte.
8. **L'Île du Chœur.** Les alliés tiennent la côte et le ciel. Les héros traversent 4 sanctuaires élémentaires (un par héros, seul) puis la salle des 6 Accords. Si 27 Lueurs : Lueur Prisme et classe Accordeur.
9. **Varn.** Au sommet, Varn ôte son masque et raconte Corbec. Combat final en 3 phases. Les héros réaccordent le Chœur ensemble, note par note.

## Missions principales

| N° | Mission | Lieu | Récompense |
| --- | --- | --- | --- |
| M4-01 | La mer de cendres | Désert de Cendre | Accès à l'oasis |
| M4-02 | La mémoire de Sahr | Oasis de Sahr | Révélation du secret |
| M4-03 | Résonner à deux | Sanctuaire de Sahr | Les 6 Accords |
| M4-04 | Réaccorder le monde | Tellume, Temple Englouti, Tour des Vents | 3 Diapasons réaccordés, alliances |
| M4-05 | Le Temple de Braise | Temple de Braise | Lueur Magma, Clé du Feu |
| M4-06 | Les jumeaux | Temple de Braise | Choix sur Ilse et Corvo |
| M4-07 | L'Île du Chœur | Île du Chœur | Accès au sommet |
| M4-08 | Le Chœur | Sommet de l'Île | Fin du jeu |

### M4-01 : La mer de cendres

1. Traverser le désert avec l'escorte de la Garde.
2. Déplacer les dunes avec Bourrasque pour trouver la piste.
3. Vaincre le Ver des Sables.
4. Atteindre l'Oasis de Sahr.

### M4-02 : La mémoire de Sahr

1. Parler à Mère Sahra.
2. Écouter les 3 fresques vivantes du sanctuaire.
3. Assister à la révélation (cinématique).
4. Parler à chaque membre de l'équipe pour connaître sa réaction.

### M4-03 : Résonner à deux

1. Passer l'épreuve de l'Eau et du Feu (Vapeur).
2. Passer l'épreuve de la Terre et du Feu (Magma).
3. Passer l'épreuve de la Terre et de l'Eau (Marée verte).
4. Passer l'épreuve du Vent (Tempête, Sable vif, Brasier).
5. Vaincre la gardienne du sanctuaire, une statue d'Accordeur.

### M4-04 : Réaccorder le monde

1. Retourner aux Ruines de Tellume et réaccorder le Diapason de Terre avec Kaël.
2. Retourner au Temple Englouti et réaccorder le Diapason d'Eau avec Oren.
3. Retourner à la Tour des Vents et réaccorder le Diapason du Vent avec Sefa.
4. Rallier les Marelle, les Aster, la Guilde d'Ottavio et la Garde.

### M4-05 : Le Temple de Braise

1. Entrer dans le volcan.
2. Faire fondre les passages avec Magma.
3. Créer des plateformes de vapeur au-dessus de la lave.
4. Vaincre le Dragon de Braise sauvage.
5. Récupérer la Clé du Feu.

### M4-06 : Les jumeaux

1. Défendre l'entrée du temple contre l'Ordre.
2. Vaincre Ilse et Corvo (combat le plus difficile hors boss final).
3. Choisir : les épargner ou les livrer à la Garde.
4. Assister au vol de la Clé par Varn (cinématique).

### M4-07 : L'Île du Chœur

1. Rejoindre l'île en bateau avec les alliés.
2. Traverser les 4 sanctuaires élémentaires de l'île (un puzzle par héros).
3. Résoudre la salle finale qui demande les 6 Accords.
4. Trouver la dernière Lueur cachée (si le joueur a les 27 autres, la classe Accordeur se débloque).
5. Atteindre le sommet.

### M4-08 : Le Chœur

1. Écouter Varn sans masque (cinématique).
2. Vaincre Varn, phase 1 : le Maître de l'Ordre (change d'élément).
3. Vaincre Varn, phase 2 : Varn et ses Lueurs volées.
4. Vaincre Varn, phase 3 : l'écho du Chœur déchaîné.
5. Réaccorder le Chœur (séquence finale jouable : un Accord par héros).

## Le boss final en 3 phases

| Phase | Forme | Mécanique principale |
| --- | --- | --- |
| 1 | Varn masqué | Change d'élément chaque tour, il faut viser sa faiblesse du moment |
| 2 | Varn et ses Lueurs | 4 Lueurs volées en orbite à détruire avant de pouvoir le toucher |
| 3 | L'écho du Chœur | Combat contre une tempête vivante, seuls les Accords font de gros dégâts, les 4 héros jouent en même temps |

## Quêtes annexes

| Quête | Type | Où | Tâches | Récompense |
| --- | --- | --- | --- | --- |
| Les champs morts | Annexe | Désert de Cendre | Faire renaître 3 champs avec Marée verte | Armure des nomades |
| L'arme de Kaël | Annexe | Brumeval | Rapporter 3 métaux légendaires à la forge d'Aubin | Marteau des Accordeurs (meilleure arme de Kaël) |
| L'arc de la mère | Annexe | Hautegrange | Retrouver l'arc de la mère de Nyra dans la Mine d'Ocre | Arc du foyer (meilleure arme de Nyra) |
| Le dernier livre | Annexe | Valcourt | Résoudre l'énigme de la bibliothèque royale | Bâton des savants (meilleure arme d'Oren) |
| Le passé de Sefa | Annexe | Ancien repaire de l'Ordre | Revisiter le lieu où Sefa a grandi | Dagues du vent (meilleure arme de Sefa) |
| Le Gardien d'Aldara | Lueur | Île du Chœur | Réunir les 28 Lueurs | Invocation Gardien d'Aldara améliorée |
| Le donjon secret | Annexe | Ruines sous Valcourt | Donjon optionnel très difficile, accessible après la fin | Classe Accordeur ultime, titre « Maître de l'Écho » |

---

## La fin du jeu

Varn est vaincu mais pas tué. Les héros réaccordent le Chœur ensemble : l'Écho redevient fort sans tempêtes, et les Lueurs se montrent à tout le monde, même aux Sourds. Les Résonants ne peuvent plus être cachés ni chassés : le monde doit apprendre à vivre avec eux. Varn, voyant que son rêve se réalise autrement, se rend à Dumarre.

Plans de fin : Kaël accueilli en héros à Brumeval, Oren qui enseigne à Mila, Nyra qui entraîne des enfants à Hautegrange, Sefa qui reconstruit Ventelune. Dernière image : les quatre héros sur une colline, prêts pour une nouvelle aventure.

**Variante :** si le joueur a épargné Ilse et Corvo, ils apparaissent dans l'épilogue en train d'aider à reconstruire Brumeval.

**Après le générique :** le donjon secret sous Valcourt devient accessible.
