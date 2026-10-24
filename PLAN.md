# Plan de développement : Les Échos d'Aldara

Ce plan découpe le jeu en 5 phases, chacune jouable à la fin. Chaque étape contient le message à envoyer à Claude Code et la condition pour la considérer comme terminée. On ne passe à la phase suivante que lorsque sa « porte » est franchie.

Mode d'emploi : une étape à la fois, testée dans le navigateur, puis case cochée. Jamais de vague d’agents en parallèle.

## État au 24/10/2026

Les briques pures sont là : projet Phaser + TypeScript + Vite (0.1), `GameState` et sauvegarde (0.3), moteur de combat sans Phaser (2.1), audio, auth Supabase, beaucoup de JSON et de pixel art. Il manque encore la couche jouable : `WorldScene`, `EventRunner`, cartes, `enemies.json`, `quests.json`, PNJ. On assemble ces trous dans l’ordre du plan d’assemblage, sans tout relancer.

---

## Phase 0 : Mise en place du projet

- [x] **0.1 Créer le projet**

  > Lis CLAUDE.md et les 4 documents de docs/. Crée le projet Phaser 3 + TypeScript strict + Vite avec l'arborescence décrite dans CLAUDE.md. Configure ESLint, Prettier et Vitest. Ajoute les scripts dev, build, lint et test. Affiche une scène vide en 400 × 240 mise à l'échelle sans flou, avec le texte « Les Échos d'Aldara » au centre.

  Terminé quand : `npm run dev` affiche l'écran, `npm run build`, `lint` et `test` passent.

- [ ] **0.2 Types et données de base**

  > Crée src/data/types.ts avec les types de toutes les données du GDD (héros, Lueurs, monstres, objets, Résonances, missions, lignes de dialogue, actions d'événement). Crée les fichiers JSON de data/ avec seulement le contenu de l'Acte 1 : Kaël et Nyra, les 8 premières Lueurs, les Résonances Poussée, Écoute, Racine, Braise, les objets de base et les monstres de l'Acte 1. Ajoute un test qui vérifie que chaque JSON respecte son type.

  Terminé quand : les données se chargent et le test de validation passe.

- [x] **0.3 GameState et sauvegarde**

  > Crée GameState (équipe, Lueurs, inventaire, pièces, drapeaux, missions, carte et position actuelles) et SaveManager (3 emplacements dans le localStorage, saveVersion, sauvegarde auto). Ajoute des tests Vitest pour la sérialisation et le chargement.

  Terminé quand : les tests passent et une sauvegarde survit à un rechargement de la page.

- [ ] **0.4 Déploiement**

  > Prépare le projet pour Vercel (build statique) et ajoute un README avec les commandes.

  Terminé quand : une URL Vercel affiche l'écran titre.

---

## Phase 1 : Prototype d'exploration

- [x] **1.1 Carte et déplacement**

  > Crée une carte placeholder de Brumeval (20 × 15 tuiles) au format Tiled JSON avec les calques sol, décor, collisions et objets. Charge-la dans WorldScene. Fais marcher Kaël case par case dans 4 directions avec une petite animation, bloqué par les collisions. La caméra suit Kaël et reste dans les limites de la carte.

  Terminé quand : Kaël se déplace partout sans traverser les murs.

- [ ] **1.2 Boîte de dialogue**

  > Crée DialogueBox : boîte en bas de l'écran, portrait à gauche, nom du personnage, texte lettre par lettre, bip de voix, Espace pour accélérer puis passer à la suite. Ajoute ChoiceMenu pour les choix marqués ▸. Ajoute un PNJ (la villageoise de la scène 1) qui dit sa réplique quand Kaël lui parle.

  Terminé quand : on peut parler au PNJ, la boîte respecte 3 lignes maximum.

- [ ] **1.3 EventRunner**

  > Crée EventRunner qui lit une scène de dialogue JSON et exécute ses actions dans l'ordre (say, choice, move, give, setFlag, fade, wait). Transcris la scène 1 de l'Acte 1 depuis docs/dialogues.md dans data/dialogues/a1-s01-matin-brumeval.json, sans modifier les répliques, et joue-la au lancement du jeu.

  Terminé quand : la scène 1 se joue avec Aubin, les choix fonctionnent et changent la réponse.

- [ ] **1.4 Objets interactifs et Poussée**

  > Crée InteractiveObject qui lit reactsTo et onReact depuis Tiled. Code la Résonance Poussée (coût 1 PR) : elle pousse une caisse ou un rocher d'une case dans la direction de Kaël si la case suivante est libre, avec un effet visuel d'onde et un son grave. Ajoute les PR dans GameState, qui se rechargent de 1 tous les 4 pas. Place les caisses qui bloquent Lila et branche le tutoriel de la scène 1.

  Terminé quand : on libère Lila avec Poussée et le dialogue de Lila se déclenche.

- [ ] **1.5 Roue des Résonances et Écoute**

  > Crée la roue des Résonances (touche R) et les raccourcis 1 et 2. Code Écoute : sur un PNJ ou un animal, elle affiche sa pensée en italique entre crochets avec un son différent. Ajoute le champ « pensee » aux PNJ dans les données. Ajoute Caillou, le chien d'Aubin, et sa pensée de la scène 2.

  Terminé quand : Écoute fonctionne sur Caillou et sur au moins 3 villageois.

**Porte de la Phase 1 :** on traverse Brumeval, on parle aux PNJ, on résout le puzzle des caisses et on lit des pensées.

---

## Phase 2 : Prototype de combat

- [x] **2.1 Logique de combat pure**

  > Dans src/battle/, code en TypeScript pur (sans Phaser) : les formules de dégâts physiques, de sorts, de soin et de critique du GDD, l'ordre des tours par Vitesse avec l'aléa de 0,9 à 1,1, les statuts (poison, sommeil, étourdi, silence, confusion, K.O.) et le calcul d'XP (20 × n²). Écris les tests Vitest correspondants.

  Terminé quand : tous les tests de formules passent.

- [ ] **2.2 Scène de combat**

  > Crée BattleScene : héros à droite, ennemis à gauche, fond placeholder, menu de commandes en bas (Attaque, Résonance, Objet, Défense, Fuir), barres de PV et PR, ordre des tours en haut. Le joueur choisit les actions, puis tout le monde agit dans l'ordre avec une animation simple et des chiffres de dégâts. Ajoute une légère rotation de caméra pendant les sorts.

  Terminé quand : un combat Kaël contre 2 sbires de l'Ordre se joue jusqu'au bout.

- [ ] **2.3 Victoire, défaite et retour**

  > Gère la victoire (XP, pièces, objet éventuel, montée de niveau avec écran récapitulatif) et la défaite (retour à la dernière sauvegarde avec la moitié des pièces). Ajoute l'action startBattle à EventRunner. Ajoute les rencontres aléatoires sur une carte de test (1 combat tous les 25 à 40 pas).

  Terminé quand : on passe de l'exploration au combat et on revient au même endroit après la victoire.

- [ ] **2.4 Sorts de combat**

  > Ajoute les Résonances de combat de Kaël et Nyra avec leur coût en PR et leurs affinités élémentaires (Puissance et Résistance par élément).

  Terminé quand : les faiblesses élémentaires changent visiblement les dégâts.

**Porte de la Phase 2 :** un combat complet, de la rencontre à la victoire.

---

## Phase 3 : Tranche verticale

- [ ] **3.1 Brumeval complet**

  > Termine Brumeval : forge, place, sanctuaire, maisons, auberge, sortie vers le Sentier des Collines. Transcris les scènes 1 à 4 de l'Acte 1 depuis docs/dialogues.md et les missions M1-01 à M1-03 depuis docs/scenario-et-missions.md. Ajoute les répliques des villageois avant et après l'attaque.

  Terminé quand : on joue de la scène 1 au départ du village.

- [ ] **3.2 Journal de missions**

  > Crée QuestManager et l'écran du journal : missions principales en or, annexes en bleu, Lueurs en vert, tâches qui se cochent une par une, onglet Souvenirs. Les missions sont lues depuis data/quests.json au format du document Scénario.

  Terminé quand : les missions M1-01 à M1-03 se suivent et se cochent.

- [ ] **3.3 Lueurs**

  > Code le système de Lueurs : trouver une Lueur sur la carte, l'écran Lueurs (grille, assignation à un héros, aperçu de la classe), les 3 états Liée, Libérée, Repos, les bonus de stats et la commande Lueur en combat. Code le calcul de classe selon la répartition des Lueurs, avec des tests.

  Terminé quand : Grès se trouve dans le bois, se lie à Kaël et se libère en combat.

- [ ] **3.4 Le Bois des Murmures**

  > Crée le donjon du Bois des Murmures (3 à 5 salles), la Résonance Racine (bourgeons et lianes pour grimper), la scène 5 et la mission M1-04, puis le boss Cerf de Mousse.

  Terminé quand : on finit le bois et on bat le Cerf.

- [ ] **3.5 Boutique, auberge, menus**

  > Ajoute la boutique (achat, revente à 50 %), l'auberge (soin complet et sauvegarde), le menu principal (Équipe, Lueurs, Résonances, Objets, Équipement, Missions, Sauvegarde) et l'équipement.

  Terminé quand : on peut acheter, s'équiper, dormir et sauvegarder.

**Porte de la Phase 3 :** 20 minutes jouables qui donnent envie de continuer. Fais tester à 2 ou 3 proches.

---

## Phase 4 : Version 1, Acte 1 complet

- [ ] **4.1 Hautegrange et Nyra**

  > Crée Hautegrange, la Résonance Braise, le recrutement de Nyra (scène 6 et mission M1-05) et le passage du combat à 2 héros.

- [ ] **4.2 Mine d'Ocre**

  > Crée la Mine d'Ocre, les puzzles des braseros, la scène 7, la mission M1-06 et le boss Corvo.

- [ ] **4.3 Ruines de Tellume et fin d'acte**

  > Crée les Ruines de Tellume, le puzzle des 4 piliers et des ombres, les scènes 8 à 10, les missions M1-07 et M1-08, le boss Ilse et Corvo et l'écran de fin d'acte.

- [ ] **4.4 Invocations et forge**

  > Ajoute les invocations avec les Lueurs en Repos et la forge de Kaël avec les matériaux rares.

- [ ] **4.5 Quêtes annexes**

  > Ajoute les 8 quêtes annexes de l'Acte 1 listées dans docs/scenario-et-missions.md.

- [ ] **4.6 Son, finitions et équilibrage**

  > Ajoute la musique et les bruitages, les écrans titre et options, les contrôles manette et tactiles, et équilibre l'Acte 1 pour arriver au niveau 12 environ à la fin, en 3 à 4 heures.

- [ ] **4.7 Mise en ligne**

  > Prépare la version 1 pour la production sur Vercel et corrige les bugs bloquants.

**Porte de la Phase 4 :** l'Acte 1 se finit sans bug bloquant, testé par 5 joueurs.

---

## Phase 5 : Actes 2 à 4

Même méthode, un acte à la fois, dans l'ordre des missions du document Scénario :

- [ ] **Acte 2 :** Port-Lazuli, Oren, Givre, Averse, Prise, Temple Englouti, défaite scénarisée.
- [ ] **Acte 3 :** Valcourt, Sefa, Révélation, Bourrasque, Envol, Tour des Vents, choix de confiance.
- [ ] **Acte 4 :** les Accords à deux héros, réaccordage des Diapasons, Temple de Braise, Île du Chœur, boss final en 3 phases, épilogues selon les choix.
- [ ] **Après le jeu :** donjon secret sous Valcourt, version desktop (Tauri), sortie sur itch.io.

Message type pour chaque mission :

> Implémente la mission M2-03 « Les canaux gelés » : relis la mission dans docs/scenario-et-missions.md et ses scènes dans docs/dialogues.md, crée la carte, les objets interactifs, les événements et le boss, puis explique comment la tester.

---

## Conseils pour travailler avec Claude Code

- Une étape par conversation, ou par session courte. Commence chaque session par : « Relis CLAUDE.md et PLAN.md, on attaque l'étape X. »
- Teste toujours dans le navigateur avant de valider une étape.
- Si quelque chose ne te plaît pas, décris ce que tu vois et ce que tu voulais plutôt que de demander de « refaire ».
- Garde les placeholders tant que le gameplay n'est pas validé. Les beaux graphismes viennent en dernier.
