# Équilibrage : chiffres de référence

Ces courbes sont la base commune des données (héros, ennemis, objets) et du moteur de combat. Les formules viennent du GDD section 5.

## Formules

- Dégâts physiques = max(1, (Attaque − Défense) ÷ 2 × aléa(0,9 à 1,1)).
- Dégâts d'un sort = Puissance × (1 + (Puissance élémentaire du lanceur − Résistance élémentaire de la cible) ÷ 200), minimum 1.
- Soin = Puissance × (1 + Puissance d'Eau du lanceur ÷ 200).
- Critique : chance = 5 % + Chance ÷ 4 (en %), dégâts × 1,5. Pas de critique sur les sorts.
- Défense (commande) : dégâts reçus ÷ 2 jusqu'au prochain tour du défenseur.
- Ordre des tours : Vitesse × aléa(0,9 à 1,1), décroissant.
- Fuite : chance = 50 % + (Vitesse moyenne des héros − Vitesse moyenne des ennemis) × 2 %, bornée entre 10 % et 90 %. Impossible contre un boss (`noFlee`).
- XP requise pour atteindre le niveau n : 20 × n² (total cumulé). Niveau max 50.
- Poison : 10 % des PV max par tour. Sommeil : 1 à 3 tours, réveil si touché. Étourdi : 1 tour. Silence : 3 tours. Confusion : 2 à 4 tours, cible au hasard (alliés compris).
- Résistance élémentaire : faiblesse = −60 (×1,3 avec une puissance de 0), résistance = +60 (×0,7), quasi-immunité = +150. Feu est faible contre Eau, Terre contre Vent, et réciproquement selon les monstres.

## Héros : stats au niveau L (sans équipement ni Lueur)

`baseStats` = valeur à L = 1, `growth` = gain par niveau. Les stats sont arrondies à l'entier inférieur au calcul.

| Héros | PV | PR | Attaque | Défense | Vitesse | Chance |
| --- | --- | --- | --- | --- | --- | --- |
| Kaël (Terre, équilibré, tank) | 40 + 8 L | 6 + 1,5 L | 8 + 2 L | 6 + 1,8 L | 5 + 1,2 L | 3 + 0,5 L |
| Nyra (Feu, attaque) | 34 + 7 L | 8 + 1,6 L | 9 + 2,4 L | 4 + 1,3 L | 7 + 1,5 L | 5 + 0,7 L |
| Oren (Eau, PR et soin) | 30 + 6 L | 12 + 2,4 L | 5 + 1,3 L | 4 + 1,3 L | 6 + 1,3 L | 4 + 0,6 L |
| Sefa (Vent, vitesse) | 36 + 7 L | 8 + 1,8 L | 8 + 2 L | 5 + 1,4 L | 9 + 2 L | 7 + 0,9 L |

Puissance et Résistance élémentaires de base : 10 dans l'élément natif, 0 ailleurs. Chaque Lueur Liée ajoute +5 Puissance et +5 Résistance dans son élément, en plus de son bonus propre.

Niveaux visés : fin de l'Acte 1 niveau 12, Acte 2 niveau 22, Acte 3 niveau 32, Acte 4 niveau 42 à 45, donjon secret niveau 50.

## Classes (Lueurs Liées par élément)

- Total < 2 : classe de base, rang 0, pas de bonus.
- Rang = nombre de seuils franchis parmi 2, 4, 6, 8, 10 Lueurs Liées (rang 1 à 5).
- Prisme Liée et les 4 éléments présents : Accordeur.
- Uniquement l'élément natif : classe pure (nom 1 aux rangs 1 et 2, nom 2 aux rangs 3 à 5).
- Sinon : classe hybride de l'élément non natif dominant (égalité : ordre terre, feu, eau, vent).
- Bonus par rang selon le thème de l'élément : Terre (tank) +4 % PV et +4 % Défense ; Feu (frappe) +5 % Attaque ; Eau (soutien) +5 % PR et +3 Puissance Eau ; Vent (vif) +5 % Vitesse et +2 Chance. Classe pure : thème de l'élément natif à 100 %. Hybride : thème natif à 50 % + thème secondaire à 50 %. Accordeur : +3 % sur toutes les stats par rang.

## Équipement par palier (Attaque des armes, Défense des armures)

| Palier | Ville | Arme | Armure | Bouclier ou bracelet | Casque | Prix arme |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Départ (Brumeval, forge) | +4 | +2 | +1 | +1 | gratuit |
| 1 | Hautegrange | +8 | +5 | +3 | +2 | 120 |
| 2 | Port-Lazuli | +14 | +9 | +5 | +4 | 350 |
| 3 | Valcourt | +22 | +14 | +8 | +6 | 800 |
| 4 | Ventelune | +30 | +19 | +11 | +8 | 1600 |
| 5 | Oasis de Sahr | +40 | +25 | +14 | +10 | 3200 |
| Forge | Recettes de Kaël | +6 par rapport au palier courant, effet spécial | | | | matériaux |
| Ultime | Quêtes de l'Acte 4 | +55 | | | | quête |

Revente à 50 %. Auberge 10 pièces.

## Ennemis par acte (hors boss)

| Acte | Niveau | PV | Attaque | Défense | Vitesse | XP | Pièces |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 à 10 | 18 à 60 | 24 à 50 | 0 à 8 | 4 à 12 | 6 à 28 | 4 à 20 |
| 2 | 11 à 20 | 70 à 170 | 90 à 130 | 10 à 22 | 12 à 22 | 40 à 90 | 20 à 60 |
| 3 | 21 à 30 | 170 à 320 | 150 à 200 | 22 à 38 | 22 à 32 | 100 à 190 | 60 à 120 |
| 4 | 31 à 45 | 320 à 650 | 220 à 300 | 38 à 60 | 32 à 45 | 200 à 380 | 120 à 250 |

Boss : PV 6 à 10 fois ceux d'un ennemi courant de l'acte, Attaque au haut de la fourchette, 2 à 4 compétences, XP 10 à 15 fois celle d'un ennemi courant, souvent une Lueur. Boss final : 3 phases, PV 2500, 3200, 4000.

Puissance des sorts : Acte 1 de 20 à 35, Acte 2 de 45 à 70, Acte 3 de 80 à 120, Acte 4 de 130 à 200, Accords de 220 à 300. Soins : Acte 1 de 30 à 50, puis ×1,8 par acte.

Taille des groupes : 1 à 3 ennemis dans l'Acte 1, 2 à 4 ensuite. Rencontres : un combat tous les 25 à 40 pas. Encens de calme : 200 pas sans rencontre.

## Objets consommables

| Id | Nom | Effet | Prix |
| --- | --- | --- | --- |
| `herbe-soin` | Herbe de soin | Soigne 50 PV | 10 |
| `grande-herbe` | Grande herbe | Soigne 150 PV | 40 |
| `baume` | Baume | Soigne 400 PV | 120 |
| `eau-claire` | Eau claire | Rend 20 PR | 30 |
| `eau-vive` | Eau vive | Rend 60 PR | 90 |
| `antidote` | Antidote | Retire le poison | 8 |
| `reveil` | Sel de réveil | Retire sommeil, étourdi et confusion | 12 |
| `plume-vie` | Plume de vie | Ramène un héros K.O. avec 50 % des PV | 150 |
| `encens-calme` | Encens de calme | Réduit les rencontres pendant 200 pas | 40 |
| `elixir` | Élixir | Soin complet de l'équipe | 500 |
| `tourte-bertrand` | Tourte de Bertrand | Soigne 80 PV à toute l'équipe | non vendue |

Matériaux de forge : `minerai-ocre`, `minerai-rouge`, `ecaille-salamandre`, `plume-griffon`, `cristal-givre`, `soie-vent`, `cendre-sacree`, `perle-noire`, `metal-legendaire`, `fragment-accordeur`.

Objets clés : `marteau-aubin` (arme), `cle-terre`, `cle-eau`, `cle-vent`, `cle-feu`, `gant-accordeur`, `monocle-accordeur`, `carnet-marelle`, `carte-epaves`, `coquillage-mila`, `pain-fete`, `registre-cuivres`, `sac-grain`, `page-oren`, `relique-copie`.
