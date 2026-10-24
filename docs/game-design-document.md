# Les Échos d'Aldara : Game Design Document

## 1. Vision du jeu

**Pitch :** Les Échos d'Aldara est un RPG 2D en pixel art où quatre jeunes « Résonants » parcourent un continent pour empêcher un ordre fanatique de frapper les Diapasons, quatre monolithes qui maintiennent l'équilibre élémentaire du monde.

Le jeu reprend ce qui fait le charme des RPG GBA du genre (pouvoirs utilisables hors combat, créatures élémentaires à collectionner, combats au tour par tour spectaculaires) avec un univers, des personnages et des noms entièrement originaux.

### Les 4 piliers

1. **Explorer, c'est résoudre.** Chaque pouvoir sert aussi dans le décor : déplacer, geler, brûler, faire pousser. Les donjons sont des puzzles avant d'être des couloirs à monstres.
2. **Construire son équipe.** Les Lueurs (esprits élémentaires) se répartissent entre les héros et changent leur classe, leurs stats et leurs sorts.
3. **Des combats lisibles et généreux.** Tour par tour classique, mais chaque sort et chaque invocation a un vrai effet visuel.
4. **Un monde qui récompense la curiosité.** Coffres cachés, Lueurs secrètes, PNJ dont on peut lire les pensées, quêtes annexes.

### Fiche technique

| Élément | Choix |
| --- | --- |
| Genre | RPG japonais (JRPG) avec puzzles d'exploration |
| Plateforme | Navigateur (PC et mobile), export possible en app desktop |
| Moteur | Phaser 3 + TypeScript |
| Vue | 3/4 de dessus en exploration, vue de côté inclinée en combat |
| Joueurs | Solo |
| Durée visée | 3 à 4 h pour la version 1 (Acte 1), 15 à 20 h pour le jeu complet |
| Public | Joueurs nostalgiques GBA et amateurs de RPG rétro, 12 ans et plus |

### Ce qu'on ne fait pas (pour rester réaliste)

- Pas de multijoueur, pas de monde en 3D.
- Pas de doublage voix : dialogues écrits avec des « bips » de voix par personnage.
- Version 1 limitée à l'Acte 1 complet et jouable de bout en bout.

## 2. Univers et histoire (résumé)

Le détail complet est dans `univers.md`, `scenario-et-missions.md` et `dialogues.md`.

**Le monde :** Aldara est un continent traversé par l'Écho, une vibration élémentaire qui fait pousser les forêts, couler les rivières et souffler les vents. Quatre Diapasons géants, cachés aux quatre coins du continent, gardent cette vibration stable.

Certaines personnes naissent « Résonantes » : elles entendent l'Écho et peuvent le façonner. Dans la plupart des villages, on les craint ou on les cache.

### Le lore en bref

- Il y a mille ans, une civilisation appelée les Accordeurs a créé les Diapasons pour apaiser un monde ravagé par des tempêtes élémentaires.
- Frapper un Diapason libère une onde de puissance pure. Frapper les quatre réveillerait le Chœur Primordial, une force capable de remodeler le monde.
- Les Accordeurs ont scellé les clés des Diapasons et ont disparu. Leurs ruines parsèment Aldara et servent de donjons.

### Les héros

| Personnage | Élément | Rôle | Personnalité |
| --- | --- | --- | --- |
| Kaël, 16 ans | Terre | Héros principal, guerrier polyvalent | Apprenti forgeron de Brumeval, calme, têtu, protecteur |
| Nyra, 17 ans | Feu | Attaquante, dégâts magiques | Chasseuse impulsive, grande gueule, loyale |
| Oren, 15 ans | Eau | Soigneur, soutien | Apprenti érudit, timide, passionné par les Accordeurs |
| Sefa, 18 ans | Vent | Rapide, statuts et vol d'objets | Ancienne voleuse, ironique, cache un lien avec l'antagoniste |

### Les antagonistes

- **L'Ordre du Silence :** une secte qui veut frapper les quatre Diapasons pour réveiller le Chœur.
- **Varn, le Maître de l'Ordre :** ancien Résonant persécuté. Il veut un monde où les Résonants ne seraient plus jamais chassés. Ses intentions sont compréhensibles, ses méthodes sont destructrices.
- **Les jumeaux Ilse et Corvo :** lieutenants de Varn, combattus plusieurs fois au fil de l'aventure.

### Trame en 4 actes

1. **Acte 1, Le Réveil (version 1 du jeu).** L'Ordre attaque Brumeval et vole la première clé gardée par l'ancien du village. Kaël découvre ses pouvoirs, rencontre Nyra et part à leur poursuite. Fin de l'acte : l'Ordre frappe le Diapason de Terre malgré les héros.
2. **Acte 2, Les Rivières.** Oren rejoint le groupe. Course contre l'Ordre vers le Diapason d'Eau. Première défaite face aux jumeaux.
3. **Acte 3, Le Vent Trahi.** Sefa rejoint l'équipe, puis révèle qu'elle a grandi dans l'Ordre. Le groupe doit choisir de lui faire confiance.
4. **Acte 4, Le Chœur.** Les héros découvrent que l'Écho s'affaiblit depuis des siècles : sans réveil du Chœur, Aldara mourra lentement. Le combat final oppose deux visions : réveiller le Chœur de force (Varn) ou le réaccorder en douceur (les héros).

## 3. Les Résonances (pouvoirs d'exploration)

Les Résonances sont les pouvoirs que les héros utilisent sur la carte, hors combat, pour ouvrir des chemins et résoudre des puzzles. Chacune coûte des Points de Résonance (PR) qui se rechargent en marchant (1 PR tous les 4 pas).

### Comment ça marche en jeu

1. Le joueur ouvre la roue des Résonances (touche dédiée).
2. Il choisit un pouvoir, le personnage se tourne et lance l'effet devant lui sur 1 case.
3. Certains objets du décor réagissent (avec une petite lueur pour aider le joueur à les repérer).
4. Les Résonances débloquées sont aussi assignables à 2 raccourcis rapides.

### Liste des Résonances

| Résonance | Élément | Coût PR | Effet en exploration | Obtenue |
| --- | --- | --- | --- | --- |
| Poussée | Terre | 1 | Pousse un rocher ou un pilier à distance, même au-delà d'un trou | Acte 1, Brumeval |
| Racine | Terre | 2 | Fait pousser une liane sur un bourgeon pour grimper | Acte 1, Bois des Murmures |
| Braise | Feu | 1 | Brûle ronces, toiles, allume torches et braseros, fait fondre la glace | Acte 1, recrutement de Nyra |
| Écoute | Neutre | 1 | Lit les pensées d'un PNJ ou d'un animal, révèle des indices | Acte 1, scène 2 |
| Givre | Eau | 2 | Gèle une flaque en pilier de glace sur lequel on peut sauter | Acte 2 |
| Averse | Eau | 3 | Fait pousser des plantes, éteint des feux, remplit des bassins | Acte 2 |
| Prise | Neutre | 2 | Attrape un objet éloigné ou un levier inaccessible (Gant d'Accordeur) | Objet rare, Acte 2 |
| Bourrasque | Vent | 2 | Souffle des objets légers, fait tourner des moulins, disperse la brume, déplace les dunes | Acte 3 |
| Envol | Vent | 3 | Saute au-dessus d'un vide de 2 cases | Acte 3 |
| Révélation | Neutre | 1 | Montre les passages cachés et les Lueurs invisibles (Monocle d'Accordeur) | Objet rare, Acte 3 |

À l'Acte 4 s'ajoutent les **Accords**, des Résonances à deux héros (voir `scenario-et-missions.md`, Acte 4) : Vapeur, Magma, Marée verte, Tempête, Sable vif, Brasier.

### Règles de design des puzzles

- Un puzzle = une Résonance nouvelle ou une combinaison de deux connues. Jamais plus de 3 étapes au début du jeu.
- Toujours un moyen de réinitialiser la salle (sortir et revenir).
- Les objets interactifs ont une couleur ou un liseré reconnaissable.
- Les Résonances débloquent aussi des zones optionnelles dans les régions déjà visitées : c'est ce qui donne envie de revenir en arrière.

## 4. Les Lueurs et les classes

Les Lueurs sont 28 petits esprits élémentaires (7 par élément) cachés dans le monde. On les trouve en explorant, parfois en les battant en combat, parfois en résolvant un puzzle. Elles sont le cœur de la personnalisation de l'équipe.

### Les 3 états d'une Lueur

| État | Ce que ça fait | Comment on y passe |
| --- | --- | --- |
| Liée | Donne un bonus de stats permanent au héros et compte pour sa classe | Par défaut quand on l'assigne à un héros |
| Libérée | Utilisée en combat : déclenche son effet unique, puis passe en Repos | Commande « Lueur » en combat |
| Repos | Disponible pour une invocation, ne compte plus pour la classe | Après libération ; revient à Liée après 1 tour ou après une invocation |

Le vrai choix stratégique est là : libérer ses Lueurs donne des effets puissants mais fait baisser temporairement la classe et les stats du héros.

### Exemples de Lueurs

| Nom | Élément | Bonus si Liée | Effet si Libérée |
| --- | --- | --- | --- |
| Grès | Terre | +8 PV, +2 Défense | Attaque de terre sur 1 ennemi, puissance 30 |
| Mousse | Terre | +3 PR | Soigne 40 PV à toute l'équipe |
| Tison | Feu | +3 Attaque | Attaque de feu sur 3 ennemis, puissance 25 |
| Cendre | Feu | +2 Vitesse | Baisse la défense de tous les ennemis |
| Goutte | Eau | +6 PV, +2 PR | Soigne 60 PV à un allié et retire le poison |
| Brume | Eau | +2 Chance | Rend l'équipe difficile à toucher pendant 2 tours |
| Zéphyr | Vent | +3 Vitesse | Attaque rapide qui frappe toujours en premier |
| Rafale | Vent | +2 Attaque | Peut étourdir tous les ennemis |

Lueurs nommées dans le scénario : Grès, Mousse, Ardoise, Lichen (Terre) ; Tison, Cendre, Magma (Feu) ; Goutte, Brume, Ressac, Perle, Écume (Eau) ; Zéphyr, Rafale, Bise, Alizé (Vent) ; Prisme (Lueur secrète des 4 éléments, débloque la classe Accordeur). Les Lueurs restantes sont à créer pour atteindre 7 par élément.

### Les invocations

Les Lueurs en Repos servent à invoquer de grandes créatures. Plus on en sacrifie, plus l'invocation est puissante.

| Lueurs en Repos | Terre | Feu | Eau | Vent |
| --- | --- | --- | --- | --- |
| 1 | Golem de Pierre | Salamandre | Ondine | Faucon |
| 2 | Titan d'Argile | Phénix Rouge | Serpent des Marées | Griffon |
| 3 | Colosse de Basalte | Dragon de Braise | Léviathan | Roc Tempête |

Invocation spéciale : **Le Gardien d'Aldara**, avec 1 Lueur en Repos de chaque élément.

### Les classes

La classe d'un héros dépend du nombre de Lueurs Liées de chaque élément. Chaque héros a un élément natif ; les Lueurs de son élément renforcent sa classe de base, les autres la font évoluer vers une classe hybride.

| Répartition (pour un héros Terre) | Classe | Style |
| --- | --- | --- |
| Que des Lueurs Terre | Gardien, puis Paladin | Tank, gros PV, soins légers |
| Terre + Feu | Briseur | Gros dégâts physiques |
| Terre + Eau | Druide | Soins et régénération |
| Terre + Vent | Rôdeur | Vitesse, attaques multiples |
| Mélange des 4 éléments | Accordeur | Classe secrète, sorts uniques |

Chaque classe a 5 niveaux de rang qui se débloquent avec le nombre de Lueurs (2, 4, 6, 8, 10). Les mêmes règles s'appliquent aux 3 autres héros avec leurs propres noms de classes (à définir).

## 5. Le combat

Les combats sont au tour par tour : le joueur choisit les actions de tous ses héros, puis tout le monde agit dans l'ordre de vitesse. Les rencontres sont aléatoires dans les donjons et sur la carte du monde (environ 1 combat tous les 25 à 40 pas), avec un objet pour les réduire.

### Déroulement d'un tour

1. Le joueur choisit une commande pour chaque héros (jusqu'à 4 en ligne).
2. Les ennemis choisissent leurs actions selon leur IA.
3. Tout le monde est trié par Vitesse, avec un petit aléa (Vitesse × 0,9 à 1,1).
4. Les actions se jouent une par une avec leur animation. La caméra tourne légèrement autour de l'arène pendant les sorts.
5. Fin du tour : effets de statut, Lueurs en Repos qui redeviennent Liées.

### Les commandes

| Commande | Effet |
| --- | --- |
| Attaque | Coup avec l'arme équipée, parfois déclenche l'effet spécial de l'arme |
| Résonance | Lance un sort de combat (attaque, soin, buff, malus), coûte des PR |
| Lueur | Libère une Lueur Liée pour son effet unique |
| Invoquer | Utilise des Lueurs en Repos pour une invocation |
| Objet | Utilise un objet de l'inventaire |
| Défense | Divise les dégâts reçus par 2 jusqu'au prochain tour |
| Fuir | Tente de fuir (impossible contre les boss) |

### Formules de base

- Dégâts physiques = (Attaque − Défense) ÷ 2 × aléa(0,9 à 1,1), minimum 1.
- Dégâts d'un sort = Puissance du sort × (1 + (Puissance élémentaire du lanceur − Résistance élémentaire de la cible) ÷ 200).
- Soin = Puissance du sort × (1 + Puissance d'Eau du lanceur ÷ 200).
- Coup critique : 5 % de base + Chance ÷ 4, dégâts × 1,5.

### Affinités élémentaires

Chaque personnage et chaque monstre a une Puissance et une Résistance pour chacun des 4 éléments. Les Lueurs Liées augmentent les deux pour leur élément. Faiblesses classiques : Feu contre Eau, Terre contre Vent.

### Statuts

| Statut | Effet | Durée |
| --- | --- | --- |
| Poison | Perd 10 % des PV max par tour | Jusqu'à soin |
| Sommeil | Ne peut pas agir | 1 à 3 tours, réveillé par un coup |
| Étourdi | Perd son tour | 1 tour |
| Silence | Ne peut plus lancer de Résonance | 3 tours |
| Confusion | Attaque une cible au hasard | 2 à 4 tours |
| K.O. | Hors combat | Jusqu'à résurrection |

### Fin de combat

Victoire : expérience, pièces et parfois un objet. Défaite : retour au dernier point de sauvegarde avec la moitié des pièces. Les boss ne réapparaissent pas et donnent souvent une Lueur. Certains combats sont scénarisés et perdus d'avance (embuscade de l'Acte 2) : la défaite y déclenche la suite de l'histoire au lieu du Game Over.

### Liste des boss

| Acte | Boss | Lieu |
| --- | --- | --- |
| 1 | Cerf de Mousse | Bois des Murmures |
| 1 | Corvo | Mine d'Ocre |
| 1 | Ilse et Corvo | Ruines de Tellume |
| 2 | Hydre de Givre | Vieux quartier de Port-Lazuli |
| 2 | Léviathan de corail | Temple Englouti |
| 2 | Ilse, Corvo et l'armée de l'Ordre (scénarisé, perdu d'avance) | Récifs |
| 3 | Crocodile mécanique | Égouts de Valcourt |
| 3 | Roc Tempête | Tour des Vents |
| 4 | Ver des Sables | Désert de Cendre |
| 4 | Gardienne du sanctuaire (statue d'Accordeur) | Oasis de Sahr |
| 4 | Dragon de Braise sauvage | Temple de Braise |
| 4 | Ilse et Corvo (combat final des jumeaux) | Temple de Braise |
| 4 | Varn, 3 phases | Sommet de l'Île du Chœur |

## 6. Le monde, les zones et les donjons

Aldara se découpe en 4 régions, une par acte et par Diapason, avec la capitale Valcourt au centre. On passe de l'une à l'autre par une carte du monde où le groupe se déplace en petit sprite, avec villes, donjons et passages qui s'ouvrent avec les nouvelles Résonances.

### Acte 1 en détail (contenu de la version 1)

| Lieu | Type | Ce qu'on y fait | Puzzle phare | Boss |
| --- | --- | --- | --- | --- |
| Brumeval | Village de départ | Prologue, attaque de l'Ordre, tutoriel Poussée et Écoute | Pousser des caisses pour libérer Lila | Aucun |
| Sentier des Collines | Zone extérieure | Premiers combats, 2 Lueurs cachées | Rocher à pousser pour créer un pont | Aucun |
| Bois des Murmures | Donjon 1 | Obtenir Racine | Faire pousser des lianes dans le bon ordre pour atteindre la sortie | Le Cerf de Mousse |
| Hautegrange | Ville | Boutiques, auberge, recrutement de Nyra (Braise) | Brûler les ronces du jardin du maire pour une quête | Aucun |
| Mine d'Ocre | Donjon 2 | Poussée + Braise combinées | Allumer les braseros pour faire monter des plateformes | Corvo |
| Ruines de Tellume | Donjon 3, fin d'acte | Diapason de Terre | Salle à 4 piliers à aligner avec Poussée en fonction de l'ombre projetée | Ilse et Corvo ensemble |

### Les régions suivantes (Actes 2 à 4)

| Région | Ambiance | Diapason | Résonances découvertes |
| --- | --- | --- | --- |
| Les Marches de Saphir | Lacs, ports, villages sur pilotis | Eau | Givre, Averse, Prise |
| Les Hauts Venteux | Falaises, moulins, cités suspendues | Vent | Bourrasque, Envol, Révélation |
| Le Désert de Cendre | Volcans, ruines des Accordeurs | Feu | Les Accords |
| L'Île du Chœur | Donjon final | Les 4 réunis | Aucune, toutes sont utilisées ensemble |

### Structure type d'un donjon

1. Entrée avec un panneau ou un PNJ qui annonce le thème.
2. 3 à 6 salles de puzzle de difficulté croissante, une nouvelle Résonance trouvée au milieu.
3. Une Lueur cachée qui demande d'utiliser la nouvelle Résonance de façon inattendue.
4. Un point de sauvegarde avant le boss.
5. Boss, puis récompense et raccourci vers l'entrée.

## 7. Progression, équipement et économie

Le joueur progresse sur trois axes : les niveaux de ses héros, les Lueurs trouvées et l'équipement forgé ou acheté.

### Niveaux et statistiques

- Niveau maximum : 50 (environ niveau 12 à la fin de l'Acte 1).
- Stats : PV, PR, Attaque, Défense, Vitesse, Chance, plus Puissance et Résistance par élément.
- Chaque héros a une courbe de croissance différente : Kaël équilibré, Nyra forte en Attaque, Oren fort en PR, Sefa forte en Vitesse.
- Expérience pour passer au niveau n : XP requise(n) = 20 × n².

### Équipement

| Emplacement | Exemples | Rôle |
| --- | --- | --- |
| Arme | Épée, hache, arc court, bâton | Attaque, certaines ont un effet spécial (ex. 20 % de chance de brûler) |
| Armure | Tunique, cotte, robe | Défense, parfois résistance élémentaire |
| Bouclier ou bracelet | Bouclier de bois, bracelet d'argent | Défense |
| Casque | Bandeau, casque de fer | Défense, résistance aux statuts |
| Accessoire | Anneau, amulette | Effet spécial (régénération de PR, immunité au poison) |

Chaque héros n'équipe que certains types d'armes : Kaël épées, haches et marteaux, Nyra arcs et dagues, Oren bâtons, Sefa dagues et fléaux.

Armes ultimes (quêtes de l'Acte 4) : Marteau des Accordeurs (Kaël), Arc du foyer (Nyra), Bâton des savants (Oren), Dagues du vent (Sefa).

### La forge de Kaël

Kaël est forgeron : à partir de l'Acte 1, il peut transformer des matériaux rares trouvés en exploration (minerai d'ocre, minerai rouge, écaille de salamandre, plume de griffon, métaux légendaires) en équipement unique à l'auberge. C'est une mécanique propre au jeu qui donne une vraie raison de fouiller chaque coin.

### Objets

| Objet | Effet | Prix |
| --- | --- | --- |
| Herbe de soin | Soigne 50 PV | 10 pièces |
| Eau claire | Rend 20 PR | 30 pièces |
| Antidote | Retire le poison | 8 pièces |
| Plume de vie | Ramène un héros K.O. avec 50 % des PV | 150 pièces |
| Encens de calme | Réduit les rencontres pendant 200 pas | 40 pièces |

### Économie

- Les pièces viennent des combats, des coffres et de la revente d'objets (à 50 % du prix).
- Chaque nouvelle ville propose un palier d'équipement environ 1,5 fois plus cher que le précédent.
- Objectif d'équilibrage : le joueur qui ne fuit pas tous les combats peut s'acheter l'équipement de base de chaque ville sans farmer.
- Auberge : 10 pièces la nuit, soin complet et sauvegarde.

## 8. Direction artistique, son, interface et contrôles

Le rendu vise le look d'un RPG Game Boy Advance « remasterisé » : pixel art net, couleurs saturées, petites animations partout, mais une résolution un peu plus large adaptée aux écrans actuels.

### Graphismes

| Élément | Spécification |
| --- | --- |
| Résolution interne | 400 × 240 pixels, agrandie en plein écran sans flou (pixel perfect) |
| Tuiles | 16 × 16 pixels, cartes construites dans Tiled |
| Personnages exploration | 16 × 24 pixels, 4 directions, 4 images de marche |
| Personnages combat | 32 × 48 pixels, poses attente, attaque, sort, dégâts, K.O. |
| Monstres | 32 × 32 à 96 × 96 pixels (boss) |
| Palette | Couleurs chaudes en Terre et Feu, froides en Eau et Vent ; une palette par région |
| Portraits | 48 × 48 pixels avec 3 expressions par héros pour les dialogues |

Pour démarrer sans graphiste : placeholders générés, puis packs d'assets libres de droits (itch.io, OpenGameArt) en vérifiant les licences, puis remplacement progressif par des assets faits sur Aseprite.

### Apparence des personnages principaux

- **Kaël :** cheveux châtains en bataille, tablier de forgeron, bandeau vert, marteau à la ceinture.
- **Nyra :** cheveux roux courts, cape en cuir, arc court, cicatrice sur la joue.
- **Oren :** petit, lunettes rondes, robe bleue trop grande, sacoche pleine de livres.
- **Sefa :** longue écharpe grise, cheveux noirs tressés, dagues jumelles, sourire en coin.
- **Varn :** grand, manteau noir, masque de cuivre fendu, visage marqué de brûlures sous le masque.
- **Ilse :** cheveux blancs, armure légère. **Corvo :** colosse, gantelets énormes.
- **Sbires de l'Ordre :** manteaux noirs, masques de cuivre.

### Son

- Musique de style chiptune orchestral : un thème par région, un thème de combat, un thème de boss, un thème par héros, un thème principal.
- Bruitages courts pour chaque Résonance, chaque coup, chaque menu. Écoute a un son distinct (grave et étouffé quand une pensée est bloquée).
- « Bips » de voix pour les dialogues, différents selon le personnage.

### Interface

- Boîtes de dialogue en bas de l'écran avec portrait, texte qui s'affiche lettre par lettre.
- Menu principal : Équipe, Lueurs, Résonances, Objets, Équipement, Missions, Carte, Sauvegarde.
- En combat : menu de commandes en bas, barres de PV et PR des héros à droite, ordre des tours affiché en haut.
- Écran Lueurs : grille des 28 Lueurs, glisser-déposer pour assigner à un héros, aperçu de la nouvelle classe avant de valider.

### Contrôles

| Action | Clavier | Manette | Mobile |
| --- | --- | --- | --- |
| Se déplacer | Flèches ou ZQSD | Stick ou croix | Joystick virtuel |
| Valider, parler | Espace ou Entrée | A | Bouton A |
| Annuler | Échap | B | Bouton B |
| Menu | Tab | Start | Bouton Menu |
| Roue des Résonances | R | Y | Bouton R |
| Raccourcis Résonance | 1 et 2 | L et R | Boutons rapides |

## 9. Plan technique

Le jeu tourne sur Phaser 3 en TypeScript, avec Vite pour le build. Tout le contenu (héros, Lueurs, monstres, objets, dialogues, missions) vit dans des fichiers JSON séparés du code, ce qui permet d'ajouter du contenu sans toucher à la logique.

### Architecture en 3 couches

- **Scènes Phaser :** Boot → Titre → Monde ⇄ Combat. Menu et Dialogue s'ouvrent par-dessus Monde. La scène Monde est le centre du jeu : elle lance le Combat sur une rencontre et le reprend à la victoire.
- **Systèmes :** GameState (héros, Lueurs, sac, drapeaux, missions), Événements (EventRunner, scripts de dialogue), Sauvegarde (localStorage), Audio (musiques, bruitages). Les scènes lisent et modifient ces systèmes.
- **Données :** fichiers JSON, cartes Tiled, sprites et sons, chargés au démarrage.

Aucune scène ne garde de données pour elle, tout passe par GameState.

### Stack

| Outil | Rôle |
| --- | --- |
| Phaser 3 + TypeScript | Moteur, scènes, sprites, collisions, input |
| Vite | Serveur de dev et build pour le web |
| Vitest | Tests de la logique pure |
| Tiled | Création des cartes (calques sol, décor, collisions, objets) |
| Aseprite | Pixel art et animations |
| Audio de Phaser | Musique et bruitages |
| Vercel | Hébergement de la version jouable |
| Tauri (plus tard) | Version desktop téléchargeable |

### Organisation des dossiers

```
src/
  scenes/      Boot, Titre, Monde, Combat, Menu, Dialogue
  systems/     GameState, EventRunner, SaveManager, AudioManager, QuestManager
  battle/      formules, IA ennemie, file des tours, animations
  field/       joueur, PNJ, Résonances, objets interactifs
  ui/          boîtes de dialogue, menus, barres de vie
data/
  heroes.json  lueurs.json  enemies.json  items.json  resonances.json  quests.json
  dialogues/   un fichier par scène
assets/
  maps/        cartes Tiled (.tmj)
  sprites/  tiles/  portraits/  audio/
```

### Exemple de donnée : une Lueur

```json
{
  "id": "tison",
  "name": "Tison",
  "element": "feu",
  "bonus": { "attack": 3, "firePower": 5 },
  "unleash": { "type": "damage", "power": 25, "targets": 3, "element": "feu" },
  "location": "mine-ocre-salle-3"
}
```

### Points techniques clés

- **Résonances sur la carte :** chaque objet interactif dans Tiled a une propriété `reactsTo` (ex. `["poussee", "braise"]`). Quand le joueur lance une Résonance sur la case devant lui, le jeu cherche un objet qui réagit et joue son effet.
- **Événements scriptés :** les cinématiques et dialogues sont des listes d'actions en JSON (parler, choisir, déplacer un PNJ, donner un objet, lancer un combat, changer un drapeau). Un lecteur d'événements les exécute dans l'ordre.
- **Drapeaux :** un dictionnaire de booléens dans GameState (`nyra_recrutee`, `coffre_mine_1_ouvert`, `sefa_confiance`, `jumeaux_epargnes`) pilote toute la progression de l'histoire et les variantes de fin.
- **Sauvegarde :** GameState est sérialisé en JSON dans le localStorage du navigateur, 3 emplacements, plus une sauvegarde automatique à chaque changement de zone.

## 10. Roadmap de développement

Le jeu se construit en 5 phases, chacune jouable à la fin. On ne passe à la suivante que lorsque la « porte » est franchie. Le détail étape par étape est dans `PLAN.md`.

| Phase | Contenu | Porte pour passer à la suite |
| --- | --- | --- |
| 1. Prototype d'exploration | Projet Phaser + Vite, une carte Tiled, Kaël qui marche avec collisions et caméra, Poussée et un rocher qui réagit | On traverse la carte et on résout un puzzle de rocher |
| 2. Prototype de combat | Scène Combat, Kaël contre 2 monstres, commandes, formules, ordre des tours, XP | Un combat complet, de la rencontre à la victoire |
| 3. Tranche verticale | Brumeval et le Bois des Murmures finis : dialogues, PNJ, boutique, sauvegarde, Racine, Écoute, Cerf de Mousse, premières Lueurs | 20 minutes jouables qui donnent envie de continuer |
| 4. Version 1, Acte 1 complet | Nyra, Hautegrange, Mine d'Ocre, Ruines de Tellume, 8 premières Lueurs, classes, invocations, forge, musique, équilibrage, mise en ligne | L'Acte 1 se finit sans bug bloquant, testé par 5 joueurs |
| 5. Actes 2 à 4 | Oren et Sefa, trois nouvelles régions, Résonances Eau et Vent, Accords, les 28 Lueurs, fin du jeu | Jeu complet, version desktop, sortie itch.io ou Steam |
