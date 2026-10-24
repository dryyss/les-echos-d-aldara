# Dialogues du jeu

Le script complet des 4 actes, prêt à être intégré dans le jeu. Les didascalies en italique décrivent ce qui se passe à l'écran. Les choix de réponse du joueur sont marqués ▸, suivis de la réaction qu'ils déclenchent. Les pensées lues avec Écoute sont en italique entre crochets.

## La voix des personnages

Chaque personnage doit être reconnaissable sans voir son nom.

| Personnage | Façon de parler | Tics et expressions | Exemple |
| --- | --- | --- | --- |
| Kaël | Peu de mots, phrases courtes, direct | Répond souvent par une action ou un « … » | « Je vais le chercher. Point. » |
| Nyra | Vive, moqueuse, tutoie tout le monde | « Sérieux ? », surnoms (« forgeron », « binoclard ») | « Sérieux, t'as poussé un rocher avec ta tête ? » |
| Oren | Poli, précis, trop long quand il est nerveux | « Techniquement… », cite des livres | « Techniquement, ce n'est pas de la magie, c'est de la vibration. » |
| Sefa | Ironique, calme, ne répond jamais vraiment | Retourne les questions, appelle Kaël « grand » | « Pourquoi je t'aide ? Et toi, pourquoi tu poses la question ? » |
| Aubin | Chaleureux, sage, un peu bourru | Parle en images de forge | « Le métal le plus dur, c'est celui qu'on a le plus chauffé. » |
| Varn | Lent, posé, jamais en colère | Parle de « nous » pour les Résonants | « Ils nous ont appris à nous taire. J'ai appris à crier. » |
| Ilse | Froide, phrases nettes, vouvoie | Aucune exclamation | « Vous êtes en retard. Le Maître n'attend pas. » |
| Corvo | Bruyant, joyeux, aime le combat | Rit souvent, « Ha ! » | « Ha ! Enfin quelqu'un qui tape fort ! » |
| Lila | Enfant, énergique, pose des questions | « Dis, Kaël… » | « Dis, Kaël, tu crois que les pierres ont des rêves ? » |

### Règles d'écriture

- Une boîte de dialogue = 3 lignes maximum, environ 120 caractères. Une réplique plus longue est découpée en plusieurs boîtes.
- Kaël ne parle presque jamais dans les scènes courantes. Il s'exprime surtout par ses choix de réponse et quelques répliques clés.
- Pas de pavé de lore : une information par réplique, toujours liée à une émotion.
- Les choix de réponse ne changent que la réaction immédiate, sauf mention contraire (drapeaux listés dans `scenario-et-missions.md`).
- Pensées lues avec Écoute : affichées en italique entre crochets, avec un son différent.

### Format technique d'une scène (JSON)

```json
{
  "id": "a1-s01-matin-brumeval",
  "lignes": [
    { "perso": "aubin", "expr": "sourire", "texte": "Debout, l'apprenti ! Le soleil t'a battu, et pourtant il se lève tous les jours." },
    { "perso": "kael", "expr": "fatigue", "texte": "…" },
    { "choix": [
      { "texte": "J'arrive.", "suite": "s1-a" },
      { "texte": "Encore cinq minutes.", "suite": "s1-b" }
    ] }
  ]
}
```

---

# Acte 1 : Le Réveil

## Acte 1, scène 1 : Le matin à Brumeval

*Intérieur de la forge d'Aubin, à l'aube. Kaël dort sur un lit de paille. Aubin martèle une lame.*

**Aubin :** Debout, l'apprenti ! Le soleil t'a battu, et pourtant il se lève tous les jours.

**Kaël :** …

▸ « J'arrive. »
**Aubin :** Bien. Un forgeron qui se lève tôt, c'est un forgeron qui finit tôt.

▸ « Encore cinq minutes. »
**Aubin :** Cinq minutes, et je te refroidis avec le seau du puits. À toi de voir.

**Aubin :** Il me manque du minerai pour la commande du meunier. Va en chercher au fond du village, près du vieux puits. Et ne traîne pas avec Lila, d'accord ?

*Kaël sort. Le village se réveille dans la brume. Des villageois installent des guirlandes pour la fête.*

**Villageoise :** Bonjour, Kaël ! Ce soir, c'est la fête des moissons. Tu viendras danser, cette année ?

*Au fond du village, un tas de caisses s'est effondré contre un mur. On entend une petite voix derrière.*

**Lila :** Kaël ! Kaël, c'est toi ? Je suis coincée ! J'ai voulu attraper le chat et tout est tombé !

**Kaël :** Bouge pas.

*Tutoriel : le joueur essaie de pousser une caisse, trop lourde. Kaël se concentre. Un son grave résonne, la caisse glisse toute seule.*

*Écran de tutoriel : « Kaël a utilisé la Résonance Poussée. »*

**Lila :** … Kaël. T'as même pas touché la caisse.

**Kaël :** …

**Lila :** T'es un Résonant ?! Comme dans les histoires ?

▸ « Ne le dis à personne. »
**Lila :** Promis juré ! Croix de bois, croix de fer ! C'est notre secret.

▸ « Je ne sais pas ce que c'était. »
**Lila :** Moi je sais : c'était trop bien. Mais je dirai rien, promis.

**Lila :** Dis, Kaël… tu crois que les pierres ont des rêves ?

**Kaël :** Peut-être. Elles chantent, en tout cas.

*Kaël ramasse le minerai et rentre à la forge.*

**Aubin :** Te voilà. Tu en as mis du temps… Tiens, tu as les mains qui tremblent. Ça va ?

▸ « Ça va. »
**Aubin :** Hm. Si tu le dis. Le fer aussi dit qu'il va bien, jusqu'à ce qu'il casse.

▸ « Il s'est passé quelque chose. »
**Aubin :** Pas ici. Ce soir, après la fête, retrouve-moi au sanctuaire. On parlera.

## Acte 1, scène 2 : La fête des moissons

*Le soir. La place est éclairée de lanternes. Musique, rires, odeur de pain chaud.*

**Gros Bertrand (aubergiste) :** Kaël ! Prends un morceau de tourte, c'est la recette de ma grand-mère. Enfin, c'est ce que je dis à tout le monde.

**Vieille Margot :** Belle fête. Mais j'aime pas cette brume. La dernière fois qu'elle était aussi épaisse, des étrangers sont passés par le col.

**Fermier Joss :** Paraît qu'à Hautegrange, ils ont attrapé une sorcière de feu. Une Résonante. J'espère qu'ils l'ont bien enfermée.

*Écoute n'est pas encore disponible. Kaël quitte la fête et monte au sanctuaire. Aubin l'attend devant l'autel de pierre.*

**Aubin :** Assieds-toi. Ce matin, avec Lila. J'ai entendu.

**Kaël :** Entendu ?

**Aubin :** Le son. Ce bourdonnement grave, comme une cloche sous la terre. Ça fait trente ans que je ne l'avais pas entendu chez quelqu'un d'autre.

**Kaël :** Chez quelqu'un… d'autre ?

*Aubin pose la main sur une pierre. Elle se soulève doucement dans les airs, puis retombe.*

**Aubin :** Moi aussi, petit. J'ai caché ça toute ma vie. Ici, les gens aiment bien les Résonants… tant qu'ils sont dans les contes.

▸ « Pourquoi tu ne m'as rien dit ? »
**Aubin :** Parce que je voulais que tu aies une vie normale. Et parce que j'avais peur. Les deux ensemble, ça fait un vieux bête.

▸ « Qu'est-ce que je suis ? »
**Aubin :** Tu es Kaël. Tu es mon apprenti. Et tu entends l'Écho. Ça ne change rien au reste.

**Aubin :** Il y a autre chose. Ma famille garde un secret depuis des siècles. Regarde.

*Aubin déplace la pierre de l'autel. Dessous, une pierre gravée brille d'une lueur ocre.*

**Aubin :** La Clé de Terre. Elle ouvre un Diapason, un de ces monolithes que les Accordeurs ont construits. Personne ne doit la trouver. Personne.

**Kaël :** Pourquoi tu me la montres ?

**Aubin :** Parce que je deviens vieux. Et parce que la brume ne me plaît pas, ce soir.

**Aubin :** Avant de redescendre, je vais t'apprendre quelque chose d'utile. Ferme les yeux. Écoute mon chien, Caillou. Pas ses aboiements. Ce qu'il y a dessous.

*Tutoriel Écoute. Le joueur utilise Écoute sur Caillou.*

*[Pensée de Caillou : Os… os… OS. Sous le banc. Personne doit savoir. Os.]*

**Aubin :** Ha ! Tu as entendu ? Ce chien cache des os sous mon banc depuis des mois. Avec ce pouvoir, tu entendras ce que les gens taisent. Utilise-le avec respect.

*Écran : « Kaël a appris la Résonance Écoute. »*

*Au loin, une cloche d'alarme retentit dans le village.*

## Acte 1, scène 3 : L'attaque

*La place du village. Les lanternes sont renversées, une grange brûle. Des silhouettes en manteau noir, masques de cuivre, encerclent les villageois.*

**Gros Bertrand :** Qui êtes-vous ?! On n'a rien, ici ! Que du blé et de la tourte !

*Deux silhouettes s'avancent. Une jeune femme aux cheveux blancs, un colosse aux gantelets énormes.*

**Ilse :** Nous cherchons le gardien de la Clé de Terre. Vous avez une minute pour nous le livrer.

**Corvo :** Ou deux ! Moi je suis patient. Enfin, pas trop. Ha !

**Vieille Margot :** Une clé ? Quelle clé ? On n'a même pas de serrure à l'église !

*Aubin arrive en courant, Kaël derrière lui.*

**Aubin :** Kaël, reste en arrière. C'est moi qu'ils veulent.

**Ilse :** Aubin de Brumeval. Dernier gardien de la lignée de Terre. Le Maître vous salue.

**Aubin :** Dis à ton maître qu'il peut venir me saluer lui-même. Et repartir les mains vides.

**Corvo :** Oh, il me plaît, le vieux ! Je peux le taper, Ilse ? Je peux ?

**Ilse :** Fais vite.

*Combat scénarisé : Aubin contre Corvo. Aubin soulève des rochers, Corvo les brise d'un coup de poing. Aubin finit à genoux.*

**Kaël :** Aubin !

*Deux sbires masqués barrent la route à Kaël. Premier combat du jeu (tutoriel combat).*

**Sbire de l'Ordre :** Un gamin ? On nous a pas payés pour ça.

*Après la victoire :*

**Corvo :** Oh ? Le petit a du répondant ! Ça résonne, là-dedans ?

*Corvo frappe le sol. L'onde projette Kaël contre un mur. L'écran se trouble.*

**Ilse :** La Clé est sous l'autel du sanctuaire. Le vieux pensait vraiment qu'on ne trouverait pas ? Emmenez-le. Le Maître voudra lui parler.

**Aubin (faiblement) :** Kaël… ne les suis pas… vis ta vie…

*Écran noir.*

## Acte 1, scène 4 : Le départ

*Le matin. La place est en ruines, de la fumée monte encore. Kaël se réveille, Lila assise à côté de lui.*

**Lila :** Kaël ! Tu te réveilles ! T'as dormi toute la nuit, j'ai cru que t'étais mort !

**Kaël :** Aubin…

**Lila :** Ils l'ont emmené. Vers le Bois des Murmures, Joss les a vus passer.

*Les villageois se rassemblent autour de Kaël.*

**Fermier Joss :** Tout ça, c'est à cause de lui. J'ai tout vu, hier soir. Il a jeté des sbires en l'air sans les toucher.

**Vieille Margot :** Un Résonant… Sous notre nez. Depuis des années.

**Gros Bertrand :** Allez, allez, on se calme. Le petit a défendu le village, quand même.

**Fermier Joss :** Le village, il a brûlé parce qu'on cachait des Résonants ! Aubin aussi, il en était, pas vrai ? C'est pour ça qu'ils sont venus !

**Lila :** Arrêtez ! Kaël a rien fait de mal ! C'est eux, les méchants, avec leurs masques !

*Silence. Les villageois détournent le regard.*

▸ « Je vais ramener Aubin. »
**Gros Bertrand :** Alors va, petit. Et reviens entier, qu'on puisse s'excuser correctement.

▸ « Vous avez raison d'avoir peur. »
**Gros Bertrand :** Peut-être. Mais avoir peur, ça n'a jamais rendu personne plus juste.

*Kaël retourne dans la forge à moitié détruite. Le marteau d'Aubin est encore sur l'enclume.*

*Écran : « Kaël a obtenu le Marteau d'Aubin. »*

**Kaël :** Je vais le chercher. Point.

*À la sortie du village, Lila l'attend.*

**Lila :** Tiens. C'est du pain de la fête. Bertrand dit que c'est sa meilleure tourte. Il dit ça de toutes ses tourtes.

**Lila :** Dis, Kaël… tu vas revenir, hein ?

**Kaël :** Promis juré. Croix de bois, croix de fer.

*Lila sourit. Kaël part vers le sentier des collines. Le thème principal démarre.*

## Acte 1, scène 5 : Le Bois des Murmures

*L'entrée du bois. Des racines énormes, tordues, sortent du sol et bloquent les chemins. L'air vibre.*

*Pensée affichée quand Kaël s'approche d'une racine (sans Écoute) :*

*[Ça fait mal… ça brûle… qui a crié si fort ?]*

**Kaël :** … Le bois souffre.

*Près de l'entrée, une petite lueur dorée flotte derrière un rocher. Kaël le pousse. Une créature ronde comme un galet, avec deux petits yeux, sautille vers lui.*

**Grès :** Grrr-ès ! Grès !

*Écran de tutoriel : « Tu as trouvé une Lueur ! Les Lueurs sont des fragments vivants de l'Écho. Liée à un héros, une Lueur renforce ses pouvoirs. »*

*Grès se pose sur l'épaule de Kaël et ronronne comme une pierre qui roule.*

*Au cœur du bois, un autel de pierre couvert de mousse, gravé de symboles anciens.*

*Écoute sur l'autel :*

*[Voix lointaine, comme un chœur : Que la racine monte vers la lumière. Que celui qui écoute fasse grandir.]*

*Écran : « Kaël a appris la Résonance Racine. »*

*Plus loin, une clairière. Un cerf immense, couvert de mousse et de lianes, les yeux rouges, gratte le sol.*

*Écoute sur le cerf :*

*[Ils ont frappé la terre… Ils ont crié dans l'Écho… Tout fait mal… Tout doit partir !]*

**Kaël :** Je ne suis pas avec eux.

*Le Cerf de Mousse charge. Combat de boss.*

*Après la victoire, les yeux du cerf redeviennent verts. Il se calme.*

*Écoute sur le cerf :*

*[Le bruit… s'est arrêté. Merci, petit qui écoute. Les hommes masqués sont partis vers le soleil couchant. Vers la ville aux granges.]*

**Kaël :** Hautegrange.

*Le cerf incline la tête et disparaît entre les arbres. Les racines se rétractent doucement.*

## Acte 1, scène 6 : Hautegrange et Nyra

*Hautegrange, place du marché. Des affiches sont placardées partout : « Recherchée : la sorcière de feu. Récompense : 500 pièces. »*

**Maire Gontran :** Ah, un voyageur ! Bienvenue à Hautegrange ! Ne faites pas attention aux affiches. Et si vous voyez une fille rousse qui crache du feu, criez très fort, d'accord ?

*À l'auberge, trois chasseurs boivent à une table.*

**Chasseur Brann :** Demain à l'aube, on la coince. Le vieux moulin, côté forêt. Elle y dort, j'en suis sûr.

*Écoute sur Brann :*

*[Le moulin ? Non, c'est faux. Je dis ça pour que les autres ne prennent pas la prime. Elle est à la cabane du ruisseau.]*

*Kaël part vers la cabane du ruisseau. Une flèche se plante dans un arbre, à un pas de sa tête.*

**Nyra :** Un pas de plus, et la prochaine finit dans ton oreille. T'es qui, toi ? Un chasseur ?

▸ « Je ne suis pas un chasseur. »
**Nyra :** C'est ce qu'ils disent tous. Juste avant de sortir leur filet.

▸ « Je cherche des hommes masqués. »
**Nyra :** Des masqués ? T'es avec eux, alors. Encore mieux, j'ai deux raisons de te griller.

**Nyra :** Bon. On va régler ça à l'ancienne.

*Combat amical contre Nyra. Elle utilise Braise. Si Kaël perd, la scène continue quand même.*

*Après le combat :*

**Nyra :** … Attends. T'as fait bouger ce rocher sans le toucher. Sérieux ? T'es un Résonant, toi aussi ?

**Kaël :** Terre.

**Nyra :** Ha. Le forgeron qui parle aux cailloux. Pourquoi tu m'as pas dit ça tout de suite ?

**Kaël :** Tu tirais des flèches.

**Nyra :** … Ouais. C'est vrai. Ça arrive.

*Des voix au loin. Les chasseurs arrivent avec des torches.*

**Chasseur Brann :** Elle est là ! Et elle a un complice !

**Nyra :** Génial. Il a menti à ses copains, mais pas à moi. Bon, forgeron, tu sais faire quoi d'autre que pousser des cailloux ?

*Puzzle de fuite : Kaël pousse des troncs pour bloquer le chemin, Nyra brûle les ronces pour ouvrir une sortie.*

*Écran : « Nyra a rejoint l'équipe ! Elle maîtrise la Résonance Braise. »*

*Une grotte, la nuit. Un feu de camp allumé par Nyra.*

**Nyra :** Ma mère était une Résonante de Feu. Des types comme Brann l'ont eue, il y a quatre ans. Depuis, je vis ici.

**Kaël :** … Je suis désolé.

**Nyra :** Garde ça pour toi. Bon, tes hommes masqués. Je les ai vus passer il y a deux jours. Ils allaient vers la Mine d'Ocre. Il y a des ruines derrière, que personne n'ose visiter.

▸ « Tu viens avec moi ? »
**Nyra :** Évidemment. Un groupe qui enlève des Résonants, j'ai deux mots à lui dire. Et une flèche.

▸ « Tu peux m'indiquer le chemin ? »
**Nyra :** T'indiquer ? Je viens, oui. T'as l'air de te perdre dans un couloir.

**Nyra :** Il y a un raccourci par la mine. Dors, forgeron. Demain, on va faire du bruit.

## Acte 1, scène 7 : La Mine d'Ocre

*L'entrée de la mine. Des rails rouillés, des lanternes éteintes. On entend des coups de pioche au loin.*

**Nyra :** C'est bizarre. Cette mine est fermée depuis dix ans. Qui creuse là-dedans ?

*Plus loin, des mineurs enchaînés creusent un tunnel. Des sbires de l'Ordre les surveillent.*

**Sbire de l'Ordre :** Plus vite ! Le Maître veut le passage vers les ruines avant la pleine lune !

*Écoute sur un mineur :*

*[Ma femme doit croire que je suis mort… Trois semaines ici… Je veux juste revoir ma fille.]*

**Nyra :** Bon. Là, j'ai plus du tout envie d'être discrète.

**Kaël :** Moi non plus.

*Puzzle des braseros : Nyra allume 3 braseros dans le bon ordre pour faire monter des plateformes. Kaël pousse des wagonnets pour bloquer les sbires.*

*Les héros libèrent les cellules une par une.*

**Mineur Tobias :** Merci… Merci, les jeunes. Ils parlaient d'un Diapason, au fond des ruines. Et d'un vieux qu'ils gardaient enchaîné, là-bas.

**Kaël :** Aubin.

*La salle la plus profonde. Corvo est assis sur un rocher, il mange une pomme.*

**Corvo :** Ha ! Le petit du village ! Et il a ramené une copine qui crache du feu ! C'est mon jour de chance !

**Nyra :** Copine ? Je vais te faire bouffer ta pomme, gros tas.

**Corvo :** Oh, elle me plaît aussi ! Allez, montrez-moi ce que vous avez. Je m'ennuie, ici.

*Combat de boss contre Corvo.*

*Après la victoire, Corvo se relève en riant.*

**Corvo :** Ha ha ! Pas mal, pas mal ! Ça fait longtemps qu'on m'avait pas tapé aussi fort !

**Kaël :** Où est Aubin ?

**Corvo :** Ton vieux ? Dans les ruines, avec ma sœur. Elle, elle rigole pas. Vous allez voir.

**Corvo :** Ah, et le petit… Le Maître va adorer vous rencontrer. Il adore les Résonants qui ont du caractère.

*Corvo frappe le plafond. Des rochers tombent. Quand la poussière retombe, il a disparu.*

## Acte 1, scène 8 : Les Ruines de Tellume

*Une immense salle souterraine. Des colonnes gravées montent jusqu'à une voûte invisible. Au loin, une lueur ocre pulse.*

**Nyra :** … Wow. C'est qui, qui a construit ça ?

*Écoute sur une colonne :*

*[Nous, les Accordeurs, avons calmé la terre. Que celui qui viendra un jour accorde ce que nous avons figé.]*

**Kaël :** Les Accordeurs.

**Nyra :** Les quoi ? Tu lis dans les cailloux, maintenant ?

*Puzzle des ombres : 4 piliers à aligner avec Poussée pour que leur ombre dessine un symbole sur le sol.*

*Au cœur des ruines, une salle circulaire. Au centre, un monolithe gigantesque : le Diapason de Terre. Aubin est enchaîné à une colonne. Ilse se tient devant le Diapason, la Clé à la main.*

**Aubin :** Kaël ?! Je t'avais dit de ne pas venir !

**Kaël :** Je t'avais pas écouté.

**Aubin :** … Évidemment. C'est moi qui t'ai élevé.

**Ilse :** Vous êtes en retard. Mon frère n'a pas réussi à vous arrêter. Je ne commettrai pas la même erreur.

*Corvo descend d'un escalier, une bosse sur le front.*

**Corvo :** Hé, ils trichent ! Ils sont deux ! Moi j'étais tout seul !

**Ilse :** Nous sommes deux aussi, maintenant. Tais-toi et bats-toi.

▸ « Rendez-nous Aubin. »
**Ilse :** Le vieux reste ici jusqu'à ce que le Maître l'interroge. Ce n'est pas négociable.

▸ « Pourquoi faites-vous ça ? »
**Ilse :** Parce que le monde a choisi de nous chasser. Le Maître a choisi de nous rendre notre place. C'est simple.

*Combat de boss contre Ilse et Corvo.*

## Acte 1, scène 9 : Le premier coup

*Après le combat. Ilse et Corvo reculent, blessés. Ilse sourit pour la première fois.*

**Ilse :** Bravo. Vous avez gagné le combat. Mais nous, nous avons gagné du temps.

*Des pas résonnent dans la salle. La lumière des torches vacille. Un homme grand, en manteau noir, masque de cuivre fendu, descend lentement les marches.*

**Corvo (à voix basse) :** … Maître.

*La musique s'arrête. Silence total.*

**Varn :** Aubin. Ça fait longtemps. Trente ans, je crois. Tu étais jeune, et tu avais déjà peur.

**Aubin :** Varn… Tu ne sais pas ce que tu fais. Les Diapasons ne sont pas des armes.

**Varn :** Je sais exactement ce que je fais. Et je sais ce qu'on nous a fait. Ils nous ont appris à nous taire. J'ai appris à crier.

*Varn tourne la tête vers Kaël.*

**Varn :** Et toi. Le petit forgeron. J'ai entendu ta Résonance depuis le haut de l'escalier. Elle est forte. Elle est triste, aussi.

▸ « Laisse Aubin partir. »
**Varn :** Il est libre. Il l'a toujours été. C'est lui qui a choisi de se cacher.

▸ « Tu ne toucheras pas le Diapason. »
**Varn :** Tu ne pourras pas m'en empêcher. Pas aujourd'hui.

*Kaël s'élance. Varn lève la main. Kaël et Nyra sont plaqués au sol par une force invisible.*

**Nyra :** Il… il utilise plusieurs éléments en même temps… C'est pas possible…

**Varn :** Tout est possible, quand on écoute vraiment.

*Varn prend la Clé des mains d'Ilse. Il la place dans le Diapason. Les gravures s'illuminent.*

**Aubin :** Varn, non !

*Varn frappe le Diapason avec sa paume. Un son immense, grave, fait trembler tout l'écran. Les colonnes se fissurent. Une onde ocre traverse la salle et le monde.*

*Plan rapide : à Brumeval, les arbres se penchent. À Hautegrange, les vitres éclatent. Dans le Bois des Murmures, le cerf relève la tête.*

**Varn :** Un. Il en reste trois.

*Varn s'approche de Kaël, toujours au sol.*

**Varn :** Tu entends l'Écho, toi aussi. Un jour, tu comprendras. Ce jour-là, tu viendras me trouver. Ou tu me combattras. Les deux me conviennent.

**Varn :** Ilse. Corvo. On s'en va.

**Corvo :** À la prochaine, le petit ! Mange bien, entraîne-toi !

*Ils disparaissent dans un tourbillon de poussière. La pression disparaît. Kaël se relève et court vers Aubin.*

## Acte 1, scène 10 : Épilogue de l'acte

*Les héros brisent les chaînes d'Aubin. Il est pâle, mais il sourit.*

**Aubin :** Tu as grandi, petit. En trois jours, tu as plus grandi qu'en dix ans de forge.

**Kaël :** On a échoué.

**Aubin :** Non. Vous avez perdu une bataille. C'est différent. Un forgeron qui rate une lame, il recommence. Il ne range pas son marteau.

**Nyra :** C'est qui, ce type ? Il te connaissait.

**Aubin :** Varn. Nous étions jeunes ensemble, deux Résonants qui se cachaient. Un jour, des chasseurs ont brûlé son village. Il n'a plus jamais voulu se cacher. Moi, j'ai continué.

**Aubin :** Écoutez-moi bien, tous les deux. Il existe 4 Diapasons. Celui-ci était le premier. Il y en a trois autres, chacun gardé par une famille comme la mienne.

**Kaël :** Où ?

**Aubin :** La plus proche, ce sont les Marelle, à Port-Lazuli, sur la côte. Ils gardent la Clé de l'Eau. Il faut les prévenir avant que Varn n'arrive.

**Nyra :** Port-Lazuli ? Le grand port ? Plein de gardes, plein de gens qui détestent les Résonants ? Génial. Mon endroit préféré.

**Aubin :** Je rentre à Brumeval. Je suis trop vieux pour courir après Varn. Mais toi…

*Aubin pose la main sur le marteau que porte Kaël.*

**Aubin :** Garde-le. Il frappe mieux entre tes mains que dans les miennes, maintenant.

▸ « Je reviendrai. »
**Aubin :** Je sais. Tu tiens toujours tes promesses. Et Lila va me le rappeler tous les jours jusqu'à ton retour.

▸ « Merci pour tout. »
**Aubin :** Pas de merci entre forgerons. File, avant que je change d'avis et que je te garde à la forge.

*Les héros sortent des ruines. Le soleil se lève sur les collines. Au loin, la mer brille.*

**Nyra :** Bon, forgeron. Tu sais nager, au moins ?

**Kaël :** …

**Nyra :** Sérieux ?

*Écran titre : « Fin de l'Acte 1 : Le Réveil ». Sauvegarde automatique.*

## Acte 1 : dialogues secondaires

Les PNJ changent de réplique selon l'avancée de l'histoire. Chacun a une pensée cachée que le joueur découvre avec Écoute.

### Brumeval

| PNJ | Avant l'attaque | Après l'attaque | Pensée (Écoute) |
| --- | --- | --- | --- |
| Gros Bertrand, aubergiste | « Une chambre ? Pour toi, c'est gratuit. Enfin, tu fais la vaisselle. » | « Reviens entier, petit. Ma tourte t'attendra. » | *[J'aurais dû me battre, moi aussi. J'ai eu peur.]* |
| Vieille Margot | « Cette brume, je l'aime pas. » | « Je n'aurais pas dû dire ça sur les Résonants… » | *[Ma sœur entendait les pierres, elle aussi. On ne l'a jamais revue.]* |
| Fermier Joss | « La récolte est bonne, cette année. » | « Pars, et emmène tes malheurs avec toi. » | *[S'ils reviennent, je perds tout. Ma ferme, mes bêtes. Tout.]* |
| Meunier Paulin | « Ma meule est bloquée. Si tu as des bras, je paie. » | « Le moulin a tenu. Comme toi. » | *[Le gamin a poussé ma meule sans la toucher. Je l'ai vu. Je ne dirai rien.]* |
| Caillou, le chien | « Wouf ! » | « Wouf… » | *[Maître parti. Os sous le banc. Je garde les os. Je garde la maison.]* |

### Hautegrange

| PNJ | Réplique | Pensée (Écoute) |
| --- | --- | --- |
| Maire Gontran | « Hautegrange, ville propre, ville calme, ville sans sorcière ! » | *[Si mon jardin n'est pas prêt pour la foire, ma femme me tue.]* |
| Garde à l'entrée | « Pas d'armes dégainées. Pas de magie. Pas de bêtises. » | *[J'espère que la sorcière ne passe pas pendant mon tour de garde.]* |
| Chasseur Brann | « Un Résonant, c'est une bête. On chasse les bêtes. » | *[La prime, c'est pour payer les dettes de mon père. Je n'ai jamais aimé chasser.]* |
| Jeune chasseur Lucien | « Moi, je fais ça pour l'argent. C'est tout. » | *[Elle m'a laissé partir, une fois. Elle aurait pu me brûler.]* |
| Enfant du marché | « T'as déjà vu une sorcière, toi ? Moi je voudrais bien ! » | *[Si j'étais Résonant, je volerais. Comme un oiseau.]* |

### Marchands

| Marchand | Bonjour | Achat | Au revoir |
| --- | --- | --- | --- |
| Forge d'Aubin (Kaël) | *Kaël allume la forge.* | « … Ça tiendra. » | *Kaël éteint la forge.* |
| Armurier de Hautegrange, Gaspard | « Des lames, des boucliers, et du sérieux. » | « Bon choix. Prends-en soin. » | « Reviens vivant, c'est meilleur pour les affaires. » |
| Épicière de Hautegrange, Rosa | « Herbes, remèdes, et potions qui marchent… presque toujours. » | « Une gorgée le matin, une le soir. Ou quand tu saignes. » | « Prends soin de toi, mon grand ! » |
| Aubergiste (toutes villes) | « Une nuit, 10 pièces. Le petit-déjeuner est compris. » | *Écran noir, musique de repos.* « Bien dormi ? » | « Bonne route ! » |

### Répliques de l'équipe en exploration

Quand le joueur appuie sur « Parler » sans PNJ devant lui, un membre de l'équipe commente le lieu.

| Lieu | Kaël | Nyra |
| --- | --- | --- |
| Brumeval après l'attaque | « … Je reviendrai. » | « Ton village est sympa. Enfin, il l'était. » |
| Bois des Murmures | « Le bois respire mieux. » | Pas encore dans l'équipe |
| Hautegrange | « Trop d'affiches. » | « Ils ont mal dessiné mon nez, sur l'affiche. » |
| Mine d'Ocre | « Ça sent le fer. » | « J'aime pas les endroits sans ciel. » |
| Ruines de Tellume | « Les pierres chantent ici. » | « Ça me donne la chair de poule. Mais c'est beau. » |

---

# Acte 2 : Les Rivières

## Acte 2, scène 1 : Port-Lazuli

*Une porte de ville immense au-dessus de l'eau. Des mouettes, des cloches de bateaux. Une file de voyageurs attend devant des gardes en uniforme bleu.*

**Nyra :** Regarde-moi tous ces gardes. On dirait qu'ils attendent quelqu'un. Genre nous.

**Garde de la porte :** Halte. Nom, provenance, et bracelet de cuivre si vous êtes Résonants.

*Écoute sur le garde :*

*[Les marchands disent « marée haute » pour passer sans fouille. Le capitaine est trop paresseux pour vérifier.]*

▸ « Marée haute. »
**Garde de la porte :** Ah, des marchands. Passez, passez. Et ne faites pas de bruit en ville.

▸ « On vient de Brumeval. »
**Garde de la porte :** Brumeval ? Jamais entendu parler. Bracelet ?
*Kaël ne répond pas. Nyra tire sur son bras. Il faut revenir avec le mot de passe.*

**Nyra :** T'as lu dans sa tête, là ? T'es flippant, forgeron. Utile, mais flippant.

*La maison des Marelle, au bord d'un canal. La porte est enfoncée, les meubles renversés.*

**Nyra :** On arrive trop tard. Encore.

*Kaël ramasse un carnet déchiré sous une table.*

*Écran : « Carnet des Marelle : … si l'Ordre vient, nous partirons vers le temple. Mila doit rester cachée. Personne ne doit savoir… »*

**Kaël :** Mila.

## Acte 2, scène 2 : Le voleur de livres

*Le marché. Un garçon à lunettes, bras chargés de livres, court entre les étals. Trois gardes le poursuivent.*

**Garde :** Arrêtez ce voleur ! Il a dérobé des ouvrages de la bibliothèque royale !

**Oren :** Je ne les ai pas volés, je les ai empruntés ! Pour une durée indéterminée !

**Nyra :** Ha. Il me plaît, le binoclard.

*Puzzle de poursuite : Kaël pousse des tonneaux pour bloquer les gardes. Combat contre 3 gardes dans une ruelle.*

*Une cave sous un pont. Oren reprend son souffle, serre ses livres contre lui.*

**Oren :** M-merci. Je m'appelle Oren. Ancien apprenti de la bibliothèque royale de Valcourt. Très ancien. Depuis la semaine dernière.

**Nyra :** Ils t'ont viré pour quoi ? T'as mangé dans la salle de lecture ?

**Oren :** J'ai lu les mauvais livres. Ceux sur les Accordeurs. Techniquement, ils étaient interdits. Mais techniquement, ils étaient aussi fascinants.

*Oren remarque Grès sur l'épaule de Kaël.*

**Oren :** Attendez… C'est… c'est une Lueur ?! Une vraie ? Les textes disent qu'elles ne suivent que les Résonants ! Vous êtes Résonant ?!

**Kaël :** Terre.

**Oren :** Incroyable. Et moi qui croyais être le seul fou de cette ville…

*Une petite lueur bleue sort de la sacoche d'Oren et flotte autour de lui.*

**Goutte :** Ploc ! Ploc-ploc !

**Oren :** Ah. Oui. Elle me suit depuis trois jours. Je pensais que c'était une hallucination due au manque de sommeil.

**Nyra :** Bienvenue au club, binoclard. Toi aussi, t'entends des choses que les autres entendent pas.

**Oren :** Je… je suis Résonant ? Ça explique pourquoi l'eau de mon thé bouillait toute seule quand j'étais en colère…

▸ « Viens avec nous. »
**Oren :** Avec vous ? Sur les routes ? Avec des monstres et des gens armés ? … D'accord. J'ai toujours voulu vivre un chapitre, au lieu de le lire.

▸ « Tu sais quelque chose sur les Marelle ? »
**Oren :** Les Marelle ? Ce nom apparaît dans un registre que j'ai… emprunté. Ils gardent quelque chose dans le vieux quartier. Je viens avec vous, je vous montre.

*Écran : « Oren a rejoint l'équipe ! »*

## Acte 2, scène 3 : Les canaux gelés

*Le vieux quartier. Les canaux sont gelés d'un bloc, des bateaux pris dans la glace. Pas un bruit. Des habitants grelottent derrière leurs fenêtres.*

**Oren :** Ce n'est pas naturel. L'eau de mer ne gèle pas à cette température. Quelqu'un a forcé l'Écho.

**Nyra :** L'Ordre. Encore eux. Laisse-moi faire.

*Nyra fait fondre un bloc de glace avec Braise. Un passage s'ouvre.*

*Au fond d'un canal asséché, un autel des Accordeurs couvert de givre.*

*Écoute sur l'autel :*

*[Que l'eau dorme quand il faut marcher sur elle. Que celui qui écoute la fasse dormir.]*

*Oren pose la main sur l'autel. L'eau autour de lui se fige en un pilier de glace parfait.*

**Oren :** Oh. Oh ! J'ai fait ça ? Techniquement, ce n'est pas de la magie, c'est de la vibration moléculaire ralentie… Mais c'est de la magie quand même !

*Écran : « Oren a appris la Résonance Givre. »*

*Au centre du quartier, une créature de glace à trois têtes garde le dernier canal.*

**Nyra :** Bon. Ça, c'est pas naturel non plus.

**Oren :** Une Hydre de Givre ! Invoquée ! Il faut viser les têtes avec du feu, d'après le traité de Morvanne, chapitre… je vous dirai après !

*Combat de boss contre l'Hydre de Givre.*

## Acte 2, scène 4 : La dernière Marelle

*Les canaux dégèlent. Les habitants sortent, remercient les héros. Un vieil homme s'approche.*

**Vieux pêcheur :** Vous avez libéré le quartier… Merci. Les masqués sont venus il y a cinq jours. Ils cherchaient une famille. Ils n'ont trouvé que la maison vide.

*Écoute sur le pêcheur :*

*[La petite Mila se cache dans l'entrepôt de son grand-père. Je lui porte du pain chaque matin. Je ne dois rien dire.]*

*L'entrepôt. Une fillette de dix ans, cheveux bleus noués, recule dans un coin.*

**Mila :** N'approchez pas ! J'ai… j'ai un harpon !

*Elle tient une fourchette.*

**Nyra :** C'est une fourchette, ma puce.

**Mila :** C'est un petit harpon !

**Mila :** Mon lapin en tissu… il est tombé dans le canal quand ils sont venus. Je peux pas aller le chercher, l'eau est trop profonde.

*Oren gèle un pilier dans le canal. Kaël saute dessus et ramène la peluche trempée.*

**Mila :** … Pompon !

**Mila :** Vous êtes pas méchants. Les méchants, ils rendent pas les lapins.

**Mila :** Papa et maman sont partis en bateau avec la pierre bleue. Vers le Temple Englouti. Ils m'ont dit de me cacher et d'attendre. Mais ça fait cinq jours. Et j'ai entendu les pêcheurs dire qu'un bateau a coulé près des récifs…

▸ « On va les retrouver. »
**Mila :** Promis ?
**Kaël :** Promis juré. Croix de bois, croix de fer.
**Nyra (à voix basse) :** Tu la sors à tout le monde, celle-là ?

▸ « Où est ce temple ? »
**Mila :** Personne sait exactement. Papa disait que seuls les Fouilleurs avaient la carte des épaves. Mais il disait aussi qu'ils étaient des voleurs.

## Acte 2, scène 5 : Le prix d'Ottavio

*Le siège de la Guilde des Fouilleurs, un ancien navire échoué transformé en boutique. Des reliques partout. Un homme élégant, moustache fine, compte des pièces.*

**Maître Ottavio :** Des clients ! Bienvenue chez les Fouilleurs. Ici, tout se vend. Le passé, surtout.

**Oren :** Ces objets… ce sont des reliques des Accordeurs ! Vous les pillez !

**Maître Ottavio :** Je les sauve, jeune homme. Dans les ruines, elles prennent la poussière. Ici, elles prennent de la valeur.

▸ « Il nous faut la carte des épaves. »
**Maître Ottavio :** Ah. Une carte qui m'a coûté trois plongeurs et un excellent chapeau. Elle a un prix.

▸ « Les Marelle sont peut-être en danger. »
**Maître Ottavio :** Tout le monde est en danger, mon ami. Les affaires, elles, continuent.

**Maître Ottavio :** Il y a une relique au fond de la Grotte des Sirènes. Un coffre que personne n'a jamais pu atteindre. Rapportez-moi ce qu'il contient, et la carte est à vous.

*Écoute sur Ottavio :*

*[Le coffre contient un gant des Accordeurs. Si ces gamins réussissent, je le revends à prix d'or. S'ils échouent… je n'ai rien perdu.]*

**Nyra :** Il nous prend pour des pigeons.

**Kaël :** On ira quand même.

*La Grotte des Sirènes. Au fond, un coffre posé sur une colonne, de l'autre côté d'un gouffre. Le coffre s'ouvre à distance quand Kaël approche : un gant de cuivre en sort et vient se poser dans sa main.*

*Écran : « Kaël a obtenu le Gant d'Accordeur. Nouvelle Résonance : Prise. »*

*De retour à la Guilde :*

**Maître Ottavio :** Alors, cette relique ?

▸ « La voilà. » *(Kaël donne une copie forgée.)*
**Maître Ottavio :** Hm… Le poids est bon. La couleur aussi. Un marché est un marché. Voici la carte.
**Nyra (à voix basse) :** T'as forgé une fausse relique cette nuit ? Respect, forgeron.

▸ « On le garde. Il nous sert. »
**Maître Ottavio :** Ha ! De l'aplomb ! J'aime ça. Gardez votre gant. Mais vous me devrez un service. Un jour, je viendrai le réclamer.

## Acte 2, scène 6 : Le Temple Englouti

*Un petit bateau sur une mer grise. Les récifs. Une épave à moitié immergée. Sous l'eau, des escaliers de pierre descendent vers un dôme.*

**Oren :** D'après mes calculs, on ne peut pas respirer sous l'eau.

**Nyra :** Merci, le génie.

**Oren :** Mais d'après ce bas-relief, les Accordeurs utilisaient des bulles d'Écho. Si je fais vibrer l'eau autour de nous… comme ça…

*Une bulle d'air se forme autour de l'équipe. Ils descendent.*

*Une salle aux bassins vides. Au centre, un autel bleu.*

*Écoute sur l'autel :*

*[Que la pluie remplisse ce qui est vide. Que celui qui écoute rende l'eau à la terre.]*

*Écran : « Oren a appris la Résonance Averse. »*

*Au fond du temple, une créature immense de corail et d'écailles se déploie.*

**Oren :** Un Léviathan de corail ! Il protège le temple depuis des siècles ! Il ne nous veut pas de mal, il fait son travail !

**Nyra :** Ben son travail, là, c'est de nous écraser !

*Combat de boss contre le Léviathan de corail.*

*Derrière le gardien, une pièce sèche. Un homme et une femme, épuisés, se lèvent.*

**Madame Marelle :** Qui êtes-vous ? L'Ordre vous envoie ?

**Kaël :** Mila nous envoie.

**Monsieur Marelle :** Mila ? Elle va bien ? Elle est vivante ?

**Oren :** Elle va très bien. Elle nous a menacés avec une fourchette.

**Madame Marelle :** … C'est bien elle.

**Monsieur Marelle :** Nous avons caché la Clé de l'Eau ici, après le naufrage. Prenez-la. Si l'Ordre la trouve sur nous, ils nous tueront.

## Acte 2, scène 7 : L'embuscade

*La sortie du temple, sur un récif. Des dizaines de silhouettes masquées encerclent l'équipe. Ilse se tient au centre, Corvo à côté d'elle.*

**Ilse :** Merci de l'avoir récupérée pour nous. Ça nous a évité la plongée.

**Corvo :** Ha ! Le petit ! Et il a ramené un binoclard ! Ta bande s'agrandit !

**Oren :** Pourquoi tout le monde m'appelle comme ça ?

**Ilse :** Donnez la Clé. Je ne le demanderai pas deux fois.

▸ « Jamais. »
**Ilse :** Je m'en doutais.

▸ « Laissez partir les Marelle d'abord. »
**Ilse :** Ils ne m'intéressent pas. Ce qui m'intéresse est dans votre sac.

*Combat scénarisé contre Ilse, Corvo et 6 sbires. Impossible à gagner. Au bout de 3 tours, Ilse gèle toute l'équipe sur place.*

**Ilse :** Vous progressez. Mais vous êtes trois. Nous sommes une armée.

*Ilse prend la Clé dans le sac de Kaël.*

## Acte 2, scène 8 : La vague

*Une plateforme de pierre au milieu des récifs : le Diapason d'Eau émerge de la mer. Ilse place la Clé.*

**Ilse :** Le Maître m'a confié celui-ci. C'est un honneur.

**Corvo :** Frappe fort, sœurette !

*Ilse frappe le Diapason. Un son cristallin, assourdissant. La mer se soulève. Une vague géante part vers la côte.*

*Plan rapide : à Port-Lazuli, les quais sont submergés. Les habitants fuient vers les hauteurs.*

*Écran noir.*

*Une chambre dans la maison des Marelle. Kaël se réveille. Mila est assise au pied du lit, Pompon dans les bras.*

**Mila :** Tu te réveilles enfin ! Papa et maman sont rentrés ! Vous les avez ramenés !

**Kaël :** On a perdu la Clé.

**Mila :** Oui, mais tu as tenu ta promesse. Ça compte plus.

*Nyra entre, essoufflée.*

**Nyra :** Debout, tout le monde. La Garde est en ville. Ils disent que la vague, c'est nous. Qu'on est des complices de l'Ordre. Il y a des affiches avec nos têtes partout.

**Oren :** Ils ont mis la mienne ? Elle est ressemblante ?

**Nyra :** Ils t'ont dessiné avec quatre yeux.

**Monsieur Marelle :** Partez par les canaux. Allez à Valcourt. La Capitaine Dumarre est dure, mais juste. Si quelqu'un peut vous croire, c'est elle.

**Mila :** Kaël ! Tiens.

*Mila lui tend un petit coquillage.*

**Mila :** Pour que tu reviennes. Comme Pompon.

*Écran titre : « Fin de l'Acte 2 : Les Rivières ». Sauvegarde automatique.*

---

# Acte 3 : Le Vent Trahi

## Acte 3, scène 1 : Les murs de Valcourt

*Une ville immense aux toits d'ardoise, un château blanc au sommet d'une colline. Les héros sont cachés dans une caravane de marchands.*

**Oren :** Valcourt… Je pensais ne jamais revenir ici. Surtout pas en me cachant sous des sacs de navets.

**Nyra :** Les navets, c'est mieux que la prison. Respire et tais-toi.

*La cour du château. Les héros demandent audience. Une femme en armure, cheveux courts gris, cicatrice au menton, descend les marches. La Capitaine Héloïse Dumarre.*

**Dumarre :** Kaël de Brumeval. Nyra la sorcière de feu. Oren, l'apprenti voleur. Vous avez du culot de vous présenter ici.

▸ « On n'a rien à voir avec l'Ordre. »
**Dumarre :** C'est ce que dirait un complice de l'Ordre.

▸ « On veut vous aider à les arrêter. »
**Dumarre :** Trois gamins qui veulent aider la Garde Royale. Je note ça dans mon carnet des choses absurdes.

*Écoute sur Dumarre :*

*[Ils ont l'air sincères. Mais une ville entière a été inondée. Je ne peux pas me tromper. Pas encore une fois.]*

**Dumarre :** Gardes. En cellule. On verra ce qu'ils valent après une nuit sur la paille.

## Acte 3, scène 2 : La nuit des cellules

*La prison. Une cellule humide. Oren lit les gravures du mur, Nyra fait les cent pas, Kaël est assis.*

**Nyra :** Je pourrais faire fondre les barreaux. Mais il y a dix gardes dans le couloir.

**Oren :** Onze. J'ai compté les bruits de pas. Techniquement, ça ne change pas grand-chose.

*Un cliquetis. La serrure s'ouvre toute seule. Une silhouette en écharpe grise, visage caché, se tient dans l'ombre.*

**Inconnue :** Si vous voulez vivre, suivez-moi. Si vous voulez poser des questions, restez.

**Nyra :** T'es qui, toi ?

**Inconnue :** Quelqu'un qui ouvre des portes. Ça vous suffit, ou je referme ?

*Fuite à travers les égouts. Puzzles de Poussée et Givre. Combat contre le crocodile mécanique qui garde la sortie.*

*La sortie des égouts, sur les toits du quartier bas. L'inconnue baisse son écharpe : une jeune femme aux cheveux noirs tressés, deux dagues à la ceinture.*

**Sefa :** Sefa. Enchantée. Ou pas, on verra.

**Kaël :** Pourquoi tu nous aides ?

**Sefa :** Pourquoi tu poses la question, grand ? T'aimais ta cellule ?

*Une petite créature grise tourbillonne autour de Sefa, comme un mini-cyclone.*

**Rafale :** Fffsshh !

**Oren :** Une Lueur de Vent ! Vous êtes Résonante aussi !

**Sefa :** Bravo, le binoclard. T'as gagné le droit de te taire.

**Oren :** … Même elle.

## Acte 3, scène 3 : Le quartier des cuivres

*Un quartier serré, entouré d'un mur. Des gens portent des bracelets de cuivre au poignet. Des affiches : « Résonants enregistrés, couvre-feu au coucher du soleil. »*

**Résonante enregistrée :** On a le droit de vivre ici. Pas ailleurs. Pas de travail en dehors du mur. Mais au moins, on ne nous chasse pas.

**Vieux Résonant :** Le bracelet, c'est pour qu'ils nous reconnaissent. Comme les vaches au marché.

**Nyra :** Et vous acceptez ça ?

**Vieux Résonant :** Petite, quand le choix c'est le bracelet ou la corde, on choisit le bracelet.

*L'atelier de Sefa, un grenier plein d'objets volés.*

**Sefa :** Je vais être franche. Une fois. Profitez. Je vole les Clés des Diapasons. Avant l'Ordre. Pour que Varn ne puisse pas aller au bout.

**Kaël :** Tu connais Varn ?

**Sefa :** Tout le monde connaît Varn.

*Écoute sur Sefa :*

*[Ne pense pas à lui. Ne pense pas à lui. Il entend tout, ce gamin.]*

*La pensée est brouillée, comme si Sefa savait qu'on l'écoute.*

**Sefa :** Et arrête de fouiller ma tête, grand. C'est malpoli.

**Sefa :** La Clé du Vent est à Ventelune, chez les Aster. Je comptais y aller seule. Mais trois paires de bras, c'est mieux qu'une. On fait équipe, jusqu'à nouvel ordre.

▸ « D'accord. »
**Sefa :** Parfait. Règle numéro un : vous ne touchez pas à mes affaires.

▸ « On ne te fait pas confiance. »
**Sefa :** Tant mieux. Moi non plus. On va bien s'entendre.

*Écran : « Sefa a rejoint l'équipe ! »*

*Sefa ouvre un tiroir et lance un monocle de verre bleu à Kaël.*

**Sefa :** Cadeau. Un receleur me le devait. Il montre ce qui est caché. Utile quand on vole. Ou quand on cherche des passages secrets pour sortir d'une ville pleine de gardes.

*Écran : « Kaël a obtenu le Monocle d'Accordeur. Nouvelle Résonance : Révélation. »*

## Acte 3, scène 4 : La route des falaises

*Un col venteux, bordé de précipices. Le vent hurle. Un moulin en ruines au sommet.*

**Oren :** Mes lunettes vont s'envoler. Mes livres vont s'envoler. Je vais m'envoler.

**Sefa :** Pour une fois que tu dis quelque chose d'intéressant.

*Dans le moulin, un autel des Accordeurs, gravé de spirales.*

*Écoute sur l'autel :*

*[Que le souffle chasse ce qui encombre. Que celui qui écoute fasse danser l'air.]*

*Sefa pose la main dessus. Une bourrasque balaie la brume qui couvrait le col. Le chemin apparaît.*

**Sefa :** … Pas mal.

**Nyra :** C'est tout ? « Pas mal » ? Moi quand j'ai eu Braise, j'ai fait la fête !

**Sefa :** Toi, tu fais la fête quand tu trouves une pomme.

*Écran : « Sefa a appris la Résonance Bourrasque. »*

## Acte 3, scène 5 : La cité suspendue

*Ventelune : une cité de bois et de cordes accrochée entre deux falaises. Des planeurs de toile colorée tournent dans le ciel.*

**Oren :** C'est… magnifique. Les Haut-Vents ont construit ça il y a quatre siècles, sans un seul clou !

**Sefa :** Et sans rambarde. Fais attention où tu mets les pieds, le savant.

*Le palais des Aster, au sommet. Une femme âgée, robe blanche, regarde les héros sans sourire.*

**Dame Aster :** Les fugitifs de Valcourt. Les affiches sont arrivées avant vous. Que voulez-vous ?

**Kaël :** Protéger la Clé du Vent.

**Dame Aster :** Et pourquoi vous croirais-je ? Peut-être que vous travaillez pour l'Ordre. Peut-être que vous voulez la voler.

*Sefa regarde ailleurs.*

*Une cloche d'alarme. Des planeurs noirs, masques de cuivre, attaquent les ponts de la cité.*

**Garde Haut-Vent :** L'Ordre ! Ils attaquent les ponts !

**Nyra :** Bon. Voilà notre preuve qui arrive en volant.

*Défense des ponts : 3 combats à la suite. Nyra brûle les cordes des planeurs ennemis.*

*Après l'attaque, Dame Aster rejoint les héros sur le dernier pont.*

**Dame Aster :** Vous avez défendu ma cité alors que je vous insultais. Les gens de l'Ordre ne font pas ça.

**Dame Aster :** Au sommet de la cité, il y a un dernier autel. Montez-y. Le vent vous portera.

*Au sommet, Sefa touche l'autel. Elle saute dans le vide… et retombe doucement sur une plateforme, deux cases plus loin.*

**Sefa :** Ha. Ça, j'aime bien.

*Écran : « Sefa a appris la Résonance Envol. »*

**Dame Aster :** La Clé est dans la Tour des Vents, au-delà du grand pont. Ramenez-la ici. Je la protégerai moi-même.

## Acte 3, scène 6 : La Tour des Vents

*Une tour de pierre blanche qui monte dans les nuages. À l'intérieur, des courants d'air soulèvent des feuilles et des plumes.*

**Oren :** Cinq étages. Sans escalier. Les Accordeurs avaient un sens de l'humour particulier.

**Sefa :** Ou ils savaient voler. Accrochez-vous à moi, je vous fais monter.

*Étage 3, une Lueur cachée derrière un mur de vent.*

**Sefa :** Attendez. Il y a quelque chose, là.

*Sefa souffle le mur avec Bourrasque. Une petite Lueur en forme de flocon tourbillonne vers elle (Lueur Bise).*

**Sefa :** Toi, je t'aime bien. Tu ne poses pas de questions.

*Au sommet. Un oiseau gigantesque, ailes d'orage, plumes chargées d'éclairs : le Roc Tempête.*

**Nyra :** C'est un oiseau. Un oiseau énorme. Pourquoi c'est toujours énorme ?

*Combat de boss contre le Roc Tempête.*

*Après la victoire, l'oiseau se pose, calme. Derrière lui, sur un piédestal, une pierre gravée gris-argent : la Clé du Vent.*

**Kaël :** On l'a. Avant eux, cette fois.

**Nyra :** Enfin ! Enfin, on gagne un truc ! On fait la fête ce soir, je décide !

*Sefa prend la Clé. Elle la regarde longtemps.*

**Sefa :** Je la porte. J'ai l'habitude de garder ce qui a de la valeur.

▸ « D'accord. » *(drapeau sefa_porte_cle)*
**Sefa :** … Merci, grand.

▸ « Je préfère la garder. »
**Sefa :** Comme tu veux.
*Elle la lui tend. Kaël la prend. Dans la scène suivante, elle aura disparu de son sac sans qu'il s'en rende compte.*

## Acte 3, scène 7 : La trahison

*Le sommet de la tour. Le vent tombe d'un coup. Silence. Des pas lents dans l'escalier de pierre.*

**Varn :** Sefa. Tu as bien travaillé.

*Les trois autres se tournent vers Sefa. Elle ne bouge pas.*

**Nyra :** … Quoi ?

**Varn :** Elle ne vous a pas dit ? Sefa a grandi chez nous. Je l'ai trouvée dans une rue, à six ans. Je l'ai nourrie. Je lui ai appris à écouter le vent.

**Oren :** Sefa… dis-lui qu'il ment.

*Sefa marche vers Varn. Elle lui tend la Clé du Vent.*

**Sefa :** Il ne ment pas.

**Nyra :** Espèce de… On t'a fait confiance ! Kaël t'a fait confiance !

**Sefa :** C'était son erreur.

*Écoute sur Sefa :*

*[…]*

*Pour la première fois du jeu, Écoute ne renvoie rien. Un silence total, un son grave et étouffé.*

**Oren :** Kaël… Tu entends quelque chose ?

**Kaël :** Rien. Elle s'est fermée.

**Varn :** Et voilà le troisième coup, petit forgeron. Regarde bien.

*Le Diapason du Vent se dresse au centre du toit de la tour. Varn place la Clé et frappe. Un hurlement de vent, des nuages qui tournent. Une tornade part vers Ventelune.*

*Plan rapide : les ponts de corde de Ventelune se brisent. Des maisons de bois s'envolent.*

**Varn :** Trois. Il n'en reste qu'un. Viens, Sefa.

*Sefa suit Varn sans se retourner. Juste avant de disparaître, elle s'arrête.*

**Sefa :** Kaël. Ne me suis pas.

*Ils disparaissent dans le vent.*

## Acte 3, scène 8 : Celle qui revient

*Ventelune, trois jours plus tard. La moitié de la cité est détruite. Les héros aident à reconstruire.*

**Nyra :** Trois jours. Trois jours que je reconstruis des ponts au lieu de lui courir après.

**Oren :** On ne sait même pas où ils sont allés.

**Nyra :** Moi je sais où elle va finir. Au bout de ma flèche.

*Un garde Haut-Vent accourt.*

**Garde Haut-Vent :** Il y a quelqu'un, à l'entrée de la cité. Une fille blessée. Elle demande Kaël.

*L'entrée de la ville. Sefa est assise contre un rocher, le bras ensanglanté. Elle sourit faiblement.*

**Sefa :** Salut, grand.

**Nyra :** Toi ! Tu as un sacré culot de revenir ici !

**Sefa :** Je sais. J'ai toujours eu du culot. C'est même ma meilleure qualité.

**Sefa :** Écoute-moi. Une minute. Après, tu peux me laisser à la Garde, ou à Nyra. Elle a l'air d'en avoir envie.

**Sefa :** Je ne vous ai pas trahis. Je l'ai trompé, lui. Varn ne fait confiance à personne. Sauf à moi. Pour connaître son plan, il fallait qu'il croie que j'étais revenue.

**Oren :** Et alors ? Tu sais ce qu'il prépare ?

**Sefa :** Le dernier Diapason est dans un volcan, au Désert de Cendre. Quand il le frappera, une île sortira de la mer. L'Île du Chœur. Et là-bas… il veut réveiller quelque chose d'énorme.

**Sefa :** Ilse m'a surprise quand je fuyais. Voilà pour le bras.

*Écoute sur Sefa :*

*[S'il te plaît, crois-moi. Je n'ai jamais eu de famille avant vous. Je ne veux pas la perdre.]*

*Cette fois, la pensée est claire, sans brouillage.*

**Nyra :** Kaël. C'est toi qui décides. Moi, je lui fais plus confiance.

▸ « Je te crois. » *(drapeau sefa_confiance)*
**Sefa :** … Merci. Vraiment.
**Nyra :** Tsss. Si elle nous trahit encore, je dirai « je te l'avais dit » pendant cent ans.
**Sefa :** Ça me va. Ça veut dire qu'on sera vivants dans cent ans.

▸ « Je ne sais pas encore. »
**Sefa :** C'est honnête. Je ferai mes preuves. À ma façon.
**Oren :** Elle reste avec nous en attendant ?
**Kaël :** Elle reste.

## Acte 3, scène 9 : L'alliance

*Les ruines du palais des Aster. La Capitaine Dumarre est là, avec une dizaine de gardes. Elle regarde la cité détruite.*

**Dumarre :** Je vous ai suivis depuis Valcourt. Je vous ai vus défendre cette cité. Et j'ai vu qui l'a détruite.

**Dumarre :** Je me suis trompée sur vous. Je ne le dis pas souvent. Profitez-en.

**Nyra :** Ça fait deux personnes qui nous disent ça cette semaine.

**Dumarre :** La Garde est à votre disposition. Mais je ne sais pas comment arrêter un homme qui frappe des Diapasons.

**Oren :** Il nous faudrait quelqu'un qui connaît vraiment les Accordeurs. Pas juste des livres.

**Dumarre :** Il y a un peuple qui garde leur mémoire. Les Cendrais, au Désert de Cendre. Leur doyenne, Mère Sahra, vit à l'Oasis de Sahr. Personne de la capitale n'y est allé depuis cinquante ans.

**Sefa :** Le désert. Là où se trouve le dernier Diapason. Ça tombe bien.

**Kaël :** On part demain.

**Dumarre :** Je viens avec vous. Avec mes meilleurs gardes. Si on doit traverser le désert, autant le faire ensemble.

*Écran titre : « Fin de l'Acte 3 : Le Vent Trahi ». Sauvegarde automatique.*

---

# Acte 4 : Le Chœur

## Acte 4, scène 1 : La mer de cendres

*Un désert gris à perte de vue. Des champs morts, des arbres noircis. Le soleil est rouge. L'équipe marche avec Dumarre et ses gardes.*

**Oren :** Regardez ces champs. D'après les archives, c'était une région fertile il y a cinquante ans. Ce n'est pas la sécheresse. C'est l'Écho qui s'éteint.

**Nyra :** Tu veux dire que le monde est en train de mourir ? Comme ça, tranquillement ?

**Oren :** Techniquement… oui.

**Sefa :** Varn parlait de ça. Tout le temps. « Le monde meurt, et personne n'écoute. » Je pensais que c'était une excuse.

*Une dune s'effondre. Un ver gigantesque surgit du sable.*

**Dumarre :** Formation de défense ! Les gamins, devant !

**Nyra :** Pourquoi c'est nous, devant ?

**Dumarre :** Parce que vous lancez du feu et moi j'ai une épée !

*Combat de boss contre le Ver des Sables.*

## Acte 4, scène 2 : La mémoire de Sahr

*Une oasis au milieu du désert. Des tentes colorées autour d'un puits sacré. Des enfants courent. Ici, personne ne porte de bracelet de cuivre.*

**Enfant cendrais :** Des Résonants ! Regarde, maman, ils ont des Lueurs ! Comme dans les chants !

**Nyra :** … Ils nous regardent pas comme des monstres.

**Sefa :** Ça fait bizarre, hein ?

*La grande tente. Une très vieille femme, yeux voilés, est assise devant un feu. Mère Sahra.*

**Mère Sahra :** Quatre Résonants. Un de chaque note. Ça faisait mille ans que je vous attendais. Enfin, ma lignée vous attendait. Moi, seulement depuis soixante ans. Asseyez-vous.

**Kaël :** Vous savez qui on est ?

**Mère Sahra :** Je suis aveugle, petit. Mais je vous entends. Toi, tu sonnes comme une montagne. Elle, comme un feu de camp. Lui, comme une rivière qui hésite. Et elle… comme un vent qui cherche où se poser.

**Sefa :** … C'est pas faux.

**Mère Sahra :** Venez. Les fresques vont vous parler.

*Le sanctuaire sous la tente. Trois fresques gravées dans la roche. Kaël utilise Écoute sur chacune.*

*[Fresque 1 : Le monde chantait trop fort. Les tempêtes déchiraient le ciel. Alors nous avons construit les Diapasons pour baisser le chant.]*

*[Fresque 2 : Mais un chant trop bas finit par s'éteindre. Nous le savions. Un jour, il faudra le réaccorder.]*

*[Fresque 3 : Pas en frappant. En écoutant. Un Diapason après l'autre, une note après l'autre, par ceux qui entendent toutes les notes ensemble.]*

**Oren :** Réaccorder… pas frapper. Varn s'est trompé. Il croit qu'il faut réveiller le Chœur d'un coup. Mais si on frappe tous les Diapasons, on revient à l'Ère des Tempêtes !

**Mère Sahra :** C'est exactement ça, petit savant. Il a raison sur le mal. Il se trompe sur le remède.

**Kaël :** Les Diapasons déjà frappés ?

**Mère Sahra :** On peut encore les réaccorder. Mais pour ça, il faut savoir résonner à deux. Ce que les Accordeurs appelaient un Accord.

▸ « Apprenez-nous. »
**Mère Sahra :** C'est pour ça que vous êtes là. Demain, au lever du soleil.

▸ « Pourquoi personne ne savait ? »
**Mère Sahra :** Parce que les rois ont préféré chasser les Résonants plutôt que d'écouter ceux qui savaient. Et parce que nous, les Cendrais, avons préféré nous cacher dans le désert. Tout le monde a eu peur. Tout le monde a eu tort.

## Acte 4, scène 3 : Résonner à deux

*Le sanctuaire de Sahr, au lever du soleil. Quatre cercles de pierre au sol.*

**Mère Sahra :** Un Accord, c'est deux notes qui deviennent une. Il faut que chacun écoute l'autre autant que lui-même. Nyra, Oren. Commencez.

**Nyra :** Avec le binoclard ? Sérieux ?

**Oren :** Je te ferai remarquer que le feu et l'eau, ensemble, c'est techniquement la combinaison la plus puissante.

**Nyra :** Ça fait de la vapeur.

**Oren :** Exactement !

*Épreuve Vapeur. Nyra et Oren créent un nuage qui soulève une plateforme de pierre.*

**Nyra :** … Ok. C'était cool.

**Oren :** Tu as dit que j'étais cool ?

**Nyra :** J'ai dit que c'était cool. Pas toi.

*Épreuves Magma (Kaël et Nyra), Marée verte (Kaël et Oren), puis Tempête, Sable vif et Brasier avec Sefa.*

*Après l'épreuve Sable vif, Kaël et Sefa seuls dans le sanctuaire.*

**Sefa :** C'est bizarre, de résonner avec quelqu'un. J'ai l'impression que tu entends tout ce que je pense.

**Kaël :** Pas tout.

**Sefa :** Menteur.

*La statue gardienne du sanctuaire s'anime. Combat contre la gardienne, à remporter avec les Accords.*

**Mère Sahra :** Vous êtes prêts. Maintenant, allez réparer ce qui a été cassé.

## Acte 4, scène 4 : Réaccorder le monde

*Montage de séquences jouables courtes. Retour aux Ruines de Tellume. Le Diapason de Terre est fissuré, sa lueur est rouge.*

**Kaël :** À moi.

*Kaël pose les mains sur le Diapason. Au lieu de frapper, il écoute. Un son doux monte. Les fissures se referment. La lueur redevient ocre.*

*Retour au Temple Englouti. Oren pose les mains sur le Diapason d'Eau.*

**Oren :** Je… je n'ai jamais rien réparé d'aussi grand. J'ai déjà eu du mal à recoller une tasse.

**Nyra :** T'es pas obligé de le recoller, t'es censé le chanter.

**Oren :** Ce n'est pas plus rassurant.

*Le Diapason d'Eau s'apaise. Au loin, la mer devient calme.*

*Retour à la Tour des Vents. Sefa hésite devant le Diapason du Vent.*

**Sefa :** J'ai aidé à le casser.

**Kaël :** Alors répare-le.

*Sefa réaccorde le Diapason. La tempête au-dessus de Ventelune se dissipe. Dame Aster lève les yeux au ciel.*

*Les alliances : courtes scènes à Port-Lazuli, Ventelune, Valcourt, Brumeval.*

**Mila :** Kaël ! T'as gardé mon coquillage ?

*Kaël montre le coquillage accroché à son marteau.*

**Mila :** Hiii !

**Maître Ottavio :** Vous me deviez un service. Je viens le réclamer : laissez-moi vous aider. La fin du monde, c'est mauvais pour les affaires.

*(Si la copie a été rendue à l'Acte 2 : « J'ai fini par découvrir que ma relique était fausse. Excellent travail, d'ailleurs. Je vous aide quand même. La fin du monde, c'est mauvais pour les affaires. »)*

**Dame Aster :** Les planeurs de Ventelune sont à vous.

**Aubin :** Tu es revenu. Je le savais. Lila aussi. Elle a dit « je le savais » à tout le village.

**Lila :** Je le savais !

## Acte 4, scène 5 : Le Temple de Braise

*Un volcan au cœur du désert. Des rivières de lave. Une chaleur étouffante.*

**Nyra :** Enfin un endroit où je me sens chez moi.

**Oren :** Je transpire de partout. Mes lunettes fondent. Je crois que mes lunettes fondent vraiment.

*Au cœur du volcan, un dragon de lave, ailes de flammes, garde le Diapason de Feu.*

**Nyra :** Un dragon. Un vrai dragon. Ok, je retire ce que j'ai dit sur les choses énormes. Celui-là, je l'adore.

*Combat contre le Dragon de Braise sauvage.*

*Après la victoire, le dragon baisse la tête devant Nyra. Une petite Lueur rouge sort de sa gueule et vole vers elle.*

**Nyra :** … Il me fait un cadeau ?

**Mère Sahra (souvenir, voix off) :** *Les gardiens reconnaissent ceux qui entendent leur chant.*

*Écran : « Nyra a obtenu la Lueur Magma. »*

*Sur le piédestal, la Clé du Feu, rouge et brûlante. Kaël la prend.*

**Dumarre :** On la protège. Personne ne la touche. Mes gardes encerclent le temple.

**Sefa :** Ils vont venir. Varn ne renonce jamais. Il a juste besoin de nous trouver.

## Acte 4, scène 6 : Les jumeaux

*L'entrée du Temple de Braise. Les gardes de Dumarre sont au sol, assommés. Ilse et Corvo s'avancent, seuls.*

**Corvo :** Ha ! Le petit ! Ça fait plaisir ! T'as grandi, on dirait. Et t'as récupéré la petite voleuse !

**Sefa :** Salut, Corvo.

**Ilse :** Traîtresse. Le Maître t'a donné une maison. Un nom. Et tu l'as poignardé dans le dos.

**Sefa :** Il m'a donné une maison, oui. Mais il ne m'a jamais demandé si je voulais y rester.

**Ilse :** Donnez la Clé du Feu. C'est la dernière fois que je le demande.

▸ « Varn se trompe. Frapper les Diapasons va détruire le monde. »
**Ilse :** … Mensonges.
*Écoute sur Ilse :* *[Et si c'était vrai ? La vague à Port-Lazuli… Les enfants sur les quais… Je n'ai pas voulu ça.]*

▸ « Venez avec nous. »
**Corvo :** Ha ! Il nous invite ! T'entends, sœurette ? Il est sympa, le petit.
**Ilse :** Tais-toi, Corvo.

**Corvo :** Bon. Assez parlé. On fait le combat. Le dernier, le vrai. Pas de piège, pas de renforts. Juste nous deux contre vous quatre. Ça te va, Ilse ?

**Ilse :** … Ça me va.

*Combat de boss contre Ilse et Corvo, le plus difficile hors boss final.*

*Après la victoire. Ilse est à genoux. Corvo est assis par terre, essoufflé, il rit.*

**Corvo :** Ha… Ha ha… Le meilleur combat de ma vie. Merci, le petit.

**Ilse :** Finissez-en.

▸ « On ne tue personne. » *(drapeau jumeaux_epargnes)*
**Ilse :** … Pourquoi ?
**Kaël :** Parce que vous n'êtes pas lui.
**Corvo :** Tu sais quoi, le petit ? T'aurais fait un super membre de l'Ordre. Et je dis ça comme un compliment.
**Ilse :** Corvo. On s'en va. Et on ne revient pas.
*Ils partent. Ilse se retourne une dernière fois.*
**Ilse :** Il est déjà ici. Faites vite.

▸ « Livrez-vous à la Garde. »
**Dumarre (se relevant) :** Vous avez entendu le gamin. Les mains en l'air.
**Corvo :** Ha. Bon. Au moins, en prison, on mange tous les jours.
**Ilse :** Vous arrivez trop tard, de toute façon. Regardez derrière vous.

*Un grondement. Au fond du temple, la Clé du Feu a disparu du sac de Kaël. Une silhouette en manteau noir se tient devant le Diapason de Feu.*

**Varn :** Merci de l'avoir protégée pour moi. Pendant que vous jouiez avec mes lieutenants, je n'ai eu qu'à me servir.

**Sefa :** Non… Il a utilisé le combat comme diversion !

**Varn :** Je t'ai appris cette ruse, Sefa. Tu aurais dû t'en souvenir.

## Acte 4, scène 7 : L'apparition de l'Île

*Varn frappe le Diapason de Feu. Un son de cloche immense, grave et aigu à la fois. La lave monte. Le volcan tremble.*

**Varn :** Quatre. C'est fini. Le Chœur se réveille.

*Plan large : au centre de la carte, la mer bouillonne. Une île de pierre noire surgit des vagues, couverte de colonnes et de spirales. Le ciel devient rouge. Des éclairs partout.*

*Plan rapide : à Brumeval, Lila serre Caillou contre elle. À Port-Lazuli, Mila regarde la mer. À Ventelune, les cordes des ponts tremblent.*

**Mère Sahra (souvenir, voix off) :** *Si les quatre sont frappés sans être accordés, l'Ère des Tempêtes reviendra.*

**Oren :** Ça commence. Les tempêtes… elles commencent.

**Varn :** Vous vouliez savoir ce que je voulais ? Venez le voir. Je vous attends au sommet.

*Varn disparaît dans un tourbillon de flammes.*

**Dumarre :** Tout le monde ! On part pour la côte. On réunit tout ce qu'on a. Bateaux, planeurs, gardes, fouilleurs. Tout.

**Nyra :** C'est le moment de faire du bruit, forgeron.

**Kaël :** On y va. Tous ensemble.

## Acte 4, scène 8 : L'Île du Chœur

*La côte. Des dizaines de bateaux, des planeurs dans le ciel. Les Marelle, les Aster, Ottavio, Dumarre et ses gardes. Le vent hurle.*

**Maître Ottavio :** Mes plongeurs connaissent les courants. On vous amène au pied de l'île. Après, c'est votre affaire.

**Dame Aster :** Les planeurs vont détourner les éclairs. Nous tiendrons le ciel aussi longtemps que possible.

**Dumarre :** La Garde tient la plage. Rien ne passe. Allez-y.

*Le pied de l'île. Quatre portes, une par élément.*

**Oren :** Quatre sanctuaires. Un par élément. Chacun de nous doit ouvrir le sien.

**Sefa :** On se sépare ? C'est jamais une bonne idée, dans les histoires.

**Nyra :** Ce n'est pas une histoire. Enfin… si, un peu. Mais c'est la nôtre.

*Séquence jouable : un puzzle par héros, chacun seul dans son sanctuaire. Avant d'entrer, chacun dit un mot à Kaël.*

**Nyra :** Hé, forgeron. Si je meurs, je te hanterai. Avec des flèches.

**Oren :** Kaël… Merci de m'avoir sorti de cette cave, à Port-Lazuli. C'est le meilleur chapitre de ma vie.

**Sefa :** Grand. Tu te souviens, à la Tour ? Tu m'as laissé porter la Clé. Personne ne m'avait jamais fait confiance comme ça. *(si drapeau sefa_porte_cle)*

**Sefa :** Grand. On se voit en haut. Ne me fais pas attendre. *(sinon)*

*Les quatre se retrouvent dans la salle finale. Un mécanisme géant demande les 6 Accords, l'un après l'autre.*

*Si le joueur a les 27 autres Lueurs, une dernière Lueur aux quatre couleurs apparaît.*

**Lueur Prisme :** … Chœur. Chœur. Chœur.

*Écran : « La classe Accordeur est débloquée. »*

## Acte 4, scène 9 : Le Chœur

*Le sommet de l'île. Un cercle de pierre sous un ciel déchiré. Au centre, une colonne de lumière qui pulse comme un cœur. Varn se tient devant.*

**Varn :** Vous êtes venus. Tous les quatre. Je le savais.

*Varn ôte son masque de cuivre. Son visage est marqué de cicatrices de brûlures.*

**Varn :** Mon village s'appelait Corbec. J'avais dix-sept ans. Les chasseurs sont venus une nuit. Ils ont brûlé toutes les maisons où vivaient des Résonants. Ma mère. Ma sœur. Mes amis. Aubin était là, ce soir-là. Il s'est caché. Moi, j'ai crié.

**Varn :** Depuis, j'ai compris une chose. Le monde ne changera que si on l'oblige à changer. Le Chœur réveillé, les Résonants seront les plus forts. Plus personne ne pourra nous chasser.

**Kaël :** Et les autres ? Ceux qui n'entendent pas ?

**Varn :** Ils apprendront à avoir peur. Comme nous avons eu peur.

▸ « Ce n'est pas de la justice. C'est de la vengeance. »
**Varn :** Peut-être. Mais la justice n'est jamais venue. Alors j'ai pris ce qui restait.

▸ « Les tempêtes vont tuer tout le monde. Résonants compris. »
**Varn :** Les Accordeurs mentaient. Ils avaient peur, comme tous les autres.
**Oren :** Non ! Nous avons lu les fresques ! Mère Sahra nous a montré !
**Varn :** … Assez.

*Combat final contre Varn, en 3 phases.*

*Phase 1, Varn masqué, change d'élément chaque tour.*

**Varn :** Vous êtes forts. Mais vous n'êtes que quatre notes. Moi, je les entends toutes.

*Phase 2, les 4 Lueurs volées tournent autour de Varn.*

**Sefa :** Varn ! Ces Lueurs ne t'ont jamais choisi ! Tu les as volées, comme moi je volais des bourses !

**Varn :** Elles m'obéissent. C'est tout ce qui compte.

*Phase 3, la colonne de lumière explose. Le Chœur déchaîné prend la forme d'une tempête vivante. Varn est projeté au sol.*

**Varn :** Non… Pas comme ça… Il devait m'écouter…

**Kaël :** Il n'écoute personne. Il faut qu'on l'écoute, lui.

*Les quatre héros jouent en même temps. Après la victoire, séquence finale jouable : chaque héros lance un Accord avec un autre, l'un après l'autre. La tempête se calme note par note.*

*Le Chœur s'apaise. Une lumière douce, dorée, s'étend sur tout le monde. Les Lueurs apparaissent partout, visibles par tous.*

## Épilogue

*Le sommet de l'île. Le ciel est bleu. Varn est assis contre une colonne, épuisé.*

**Varn :** Je n'ai pas… gagné.

**Kaël :** Si. Les Lueurs se montrent à tout le monde, maintenant. Plus personne ne pourra dire que les Résonants n'existent pas. Ou les chasser en secret.

**Varn :** … Ce que je voulais. Mais sans la tempête.

**Varn :** Aubin avait raison sur toi. Tu ne cries pas. Tu écoutes. C'était peut-être ça, la réponse.

*Dumarre arrive au sommet avec deux gardes.*

**Dumarre :** Varn de Corbec. Vous êtes en état d'arrestation.

**Varn :** Je sais. Je ne fuirai pas. Pour une fois.

*Plans de fin, un par lieu :*

*Brumeval. Les villageois accueillent Kaël avec une fête. Joss lui serre la main sans un mot. Lila court vers lui.*

**Lila :** Croix de bois, croix de fer ! T'as tenu ta promesse !

**Aubin :** La forge t'attend, apprenti. Enfin, maître forgeron.

*Port-Lazuli. Mila apprend à faire geler l'eau avec une petite Lueur bleue. Oren lui donne un livre.*

**Oren :** Chapitre un. Techniquement, c'est le plus important.

*Hautegrange. Les affiches « Recherchée » sont arrachées. Nyra entraîne des enfants au tir à l'arc.*

**Nyra :** Visez la cible. Pas le maire.

**Maire Gontran :** Merci !

*Ventelune. Sefa reconstruit un pont avec les Haut-Vents. Elle regarde l'horizon.*

**Sefa :** Pas mal, cette vie. Je crois que je vais rester un peu.

*Si drapeau jumeaux_epargnes : Brumeval. Corvo porte des poutres pour la nouvelle forge. Ilse aide Aubin à planter un arbre.*

**Corvo :** Ha ! Elle est où, la prochaine poutre ? J'en veux une plus lourde !

**Ilse :** … C'est calme, ici. J'aime bien.

*Dernière image : les quatre héros sur une colline, au coucher du soleil. Les Lueurs tournent autour d'eux.*

**Nyra :** Bon. On fait quoi, maintenant ?

**Oren :** Techniquement, il reste des ruines inexplorées sous Valcourt…

**Sefa :** Et un trésor de la Guilde que je n'ai pas encore volé.

**Kaël :** …

**Kaël :** On y va.

*Écran titre : « Les Échos d'Aldara ». Générique. Après le générique : « Le donjon secret sous Valcourt est maintenant accessible. »*
