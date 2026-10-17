# 🌱 Ton parcours de développeur

Ce fichier, c'est ta feuille de route : ce qui a été construit, et ce que tu peux encore faire pour continuer à apprendre.

## Lancer le jeu sur ton ordi

Le jeu utilise des **modules JavaScript**. Ils ne marchent pas si tu ouvres `index.html` par un double-clic : il faut un petit serveur local.

- **Avec VS Code** : fais un clic droit sur `index.html`, puis choisis **Open with Live Server**.
- **Ou avec Python** : dans un terminal ouvert dans le dossier, tape `python -m http.server 8080`, puis ouvre <http://localhost:8080>

Pour vérifier le moteur, ouvre aussi **tests.html** : il y a 98 tests, qui doivent tous être verts. Si rien ne change après une modification, recharge avec **Ctrl + F5**.

## ✅ Ce que tu as codé (les TODO)

- [x] **TODO 1 à 6** — le moteur du jardin (`js/jardin.js`) : tourner, la case devant, case libre, avancer, arroser, gagné
- [x] **TODO 7** — les traductions JavaScript des blocs (`js/blocs.js`)
- [x] **TODO 8** — le piège à boucles infinies (`js/execution.js`)
- [x] **TODO 9** — les traductions Python des blocs (`js/blocs.js`)
- [x] **TODO 11 à 13** — vérifier un niveau, vérifier un monde, un joli nom de fichier (`js/mondes.js`)
- [x] **TODO 14 à 16** — le pinceau, le redimensionnement, les id uniques (`js/edition.js`, écrits avec Claude)

## ✅ Ce qui a été construit ensuite

- [x] **Les mondes en fichiers** : la bibliothèque, l'import et l'export
- [x] **L'éditeur de niveaux** : les 3 types, et le test obligatoire avant de partager
- [x] **Le partage par lien et par QR code**, sans serveur
- [x] **La langue au chat** 🐱
- [x] **Les défis bonus** 🏅
- [x] **Le mode difficile en Python** 🐍 (Pyodide)
- [x] **La serre des listes** 🪴 : listes, variables, tri
- [x] **La forêt fractale** 🌀 : angles, fonctions à paramètres, récursivité
- [x] **La mémoire visible** : les variables dans des bocaux 🫙, la pile des fonctions 📚
- [x] **Le mode nuit** 🌙, les sons, la version téléphone
- [x] **Le suivi de la classe** 📊 : qui joue, sauvegarde 💾, rendre son travail 📮, tableau de bord du prof

## 🎯 Défis pour aller plus loin

Ces défis sont rangés du plus facile au plus costaud. Pour chacun, dis-moi « corrige mon défi n », et je relis ton code sans le réécrire à ta place.

### Défi 1 — Ton premier monde (facile)

Crée un monde de 3 niveaux avec l'éditeur (✨ Créer un monde), exporte-le, puis ajoute-le dans `mondes/` et dans `mondes/index.json`. Ensuite, recharge `tests.html` : le test « La bibliothèque » vérifie tes solutions !

### Défi 2 — Mettre le jeu en ligne (facile)

Mets le projet sur GitHub et active GitHub Pages (les étapes sont dans le README). Ensuite, ajoute le lien de ton jeu tout en haut du README : c'est la première chose que regardera quelqu'un qui visite ton portfolio.

### Défi 3 — Un nouveau bloc « reculer » pour le jardin (moyen)

C'est un excellent exercice, parce qu'il faut toucher à toutes les couches du jeu :

1. `js/jardin.js` : une méthode `reculer()`. Indice : c'est `caseDevant()`, mais dans l'autre sens.
2. `js/types.js` : l'action `reculer` dans le type `jardin`, avec son nom Python.
3. `js/blocs.js` : la définition du bloc `pepin_reculer`, et ses deux traductions.
4. `js/boite-a-outils.js` : la clé `reculer` dans le catalogue, et dans la liste du jardin.
5. `js/tests.js` : au moins deux tests (reculer sur l'herbe, reculer contre un rocher).

### Défi 4 — Une nouvelle case : la flaque (moyen)

Une case `~` où Pépin peut **remplir son arrosoir**. Par exemple : Pépin ne peut arroser que 3 graines, puis il doit retourner à une flaque. Il faudra un nouveau symbole dans la carte, une nouvelle façon de la dessiner (`js/rendu.js`), un bloc « remplir l'arrosoir »… et une variable `eau` dans le Jardin !

### Défi 5 — Un nouveau type de niveau : les piles (costaud)

Une **pile de paniers** : on ne peut prendre que le panier du dessus. C'est la structure de données « pile » (*stack*), celle-là même qui sert à ranger les appels de fonctions dans la pile 📚 ! Inspire-toi de `js/etagere.js` (le modèle), de `js/types.js` (les actions et la victoire) et de `js/rendu-serre.js` (le dessin).

### Défi 6 — Plus de tests (moyen)

La forêt fractale a peu de tests. Ajoute-en dans `js/tests.js` : un carré dessiné avec `tourner(90)`, un trait de longueur 0, un dessin en trop…

## Comment demander une correction

Quand tu as fini un défi, ou que tu bloques, dis-moi par exemple :

> « J'ai fait le défi 3, tu peux me corriger ? »

Je relis ton code et je t'explique ce qui va, ce qui ne va pas, et pourquoi.
