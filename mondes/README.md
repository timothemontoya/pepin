# 🌍 Les mondes de Pépin

Un **monde** est une suite de niveaux, rangée dans un fichier `.pepin`. Dans le jeu, on peut :

- **créer** un monde avec l'éditeur (✨ Créer un monde) ;
- le **partager** avec un lien ou un QR code (🔗), ou le **télécharger** (⬇) ;
- **ouvrir** un lien ou **importer** un fichier reçu.

Ce dossier contient la **bibliothèque** : les mondes proposés à tout le monde sur le site.

## Proposer un monde pour la bibliothèque

1. Créez votre monde dans l'éditeur du jeu. Chaque niveau doit être réussi au moins une fois par vous, ce qui enregistre sa solution.
2. Téléchargez-le (bouton ⬇ Fichier).
3. Ajoutez le fichier dans ce dossier, et son nom dans `index.json`.
4. Ouvrez `tests.html` : le test « La bibliothèque » vérifie que chaque solution réussit bien son niveau.
5. Ouvrez une *pull request* sur GitHub 🌱

## Le format d'un fichier `.pepin`

C'est du [JSON](https://fr.wikipedia.org/wiki/JavaScript_Object_Notation). Le plus simple est de le fabriquer avec l'éditeur du jeu, mais on peut aussi l'écrire à la main. Attention, le JSON est strict : les guillemets doivent être doubles `"`, il ne faut pas de virgule après le dernier élément d'une liste, et les commentaires sont interdits.

```json
{
  "format": "pepin-monde",
  "version": 1,
  "id": "foret-des-boucles",
  "titre": "La forêt des boucles",
  "auteur": "Mme Dupont",
  "description": "Pour s'entraîner aux boucles (CM2 – 6e).",
  "difficulte": 1,
  "solutionsVisibles": true,
  "niveaux": [
    {
      "id": "clairiere",
      "type": "jardin",
      "titre": "La clairière",
      "concept": "la boucle « répéter »",
      "consigne": "Ce que Pépin dit au début du niveau.",
      "blocs": ["avancer", "arroser", "repeter"],
      "exigences": { "maxBlocs": 4 },
      "carte": [
        ">.o.o",
        "....."
      ]
    }
  ]
}
```

### Le monde

| Champ | Obligatoire | Description |
| --- | --- | --- |
| `format` | oui | toujours `"pepin-monde"` |
| `version` | oui | toujours `1` |
| `id` | oui | identifiant unique : minuscules, chiffres et tirets (`"foret-des-boucles"`) |
| `titre` | oui | le nom du monde |
| `auteur` | non | qui l'a créé |
| `description` | non | quelques mots sur le monde (thème, niveau scolaire…) |
| `difficulte` | non | `1` (🌱 débutant), `2` (🌿 intermédiaire), `3` (🌳 avancé) ou `4` (🔥 expert) |
| `solutionsVisibles` | non | `false` pour cacher les solutions (évaluation) : pas de « langue au chat » 🐱, et les solutions sont **retirées** du lien et du fichier envoyés aux élèves |
| `vitrine` | non | le numéro (à partir de 0) du niveau montré en miniature sur l'accueil |
| `niveaux` | oui | la liste des niveaux, dans l'ordre |

### Ce qui est commun à tous les niveaux

| Champ | Obligatoire | Description |
| --- | --- | --- |
| `id` | oui | identifiant unique dans ce monde (sert à retenir la progression) |
| `type` | oui | `"jardin"`, `"etagere"` (la serre) ou `"fractale"` (la forêt) |
| `titre` | oui | le nom du niveau |
| `concept` | non | la notion découverte, affichée en « ✨ Nouveau : … » (ou `null`) |
| `consigne` | oui | ce que dit Pépin au début du niveau |
| `blocs` | oui | les blocs disponibles (voir plus bas) |
| `exigences` | non | un défi bonus 🏅 : `{ "maxBlocs": 6 }` (6 blocs au maximum) |
| `depart` | non | un programme de départ (programme Blockly), chargé tant que l'élève n'a rien écrit. Idéal pour un exercice de **débogage** 🐛 ou un programme à compléter |
| `solution` | non* | la solution de l'auteur : un programme Blockly enregistré par l'éditeur. *Obligatoire pour les fractales (c'est le modèle) et pour partager depuis l'éditeur |

### 🌱 Type `jardin`

Pépin doit arroser toutes les graines. Champ en plus : `carte`, avec une chaîne par rangée, toutes de la même longueur (15 × 12 au maximum).

Facultatif : `autresCartes`, une liste de 1 à 5 jardins de plus (même format que `carte`). Le programme doit réussir **tous** les jardins : impossible de le réussir « par cœur », il faut un vrai algorithme (avec les capteurs).

| Symbole | Case |
| --- | --- |
| `.` | herbe |
| `#` | rocher |
| `o` | graine à arroser |
| `*` | fleur (déjà arrosée) |
| `^` `>` `v` `<` | Pépin. La pointe indique où il regarde (un seul par carte !) |

### 🪴 Type `etagere` (la serre)

Une rangée de pots, c'est-à-dire une liste. Les pots sont numérotés à partir de **0**. Le programme est testé sur plusieurs étagères pour qu'on ne puisse pas tricher.

| Champ | Description |
| --- | --- |
| `objectif` | `"trier"` (ranger du plus petit au plus grand), `"cible"` (obtenir des hauteurs précises) ou `"reponse"` (répondre une valeur) |
| `essais` | de 1 à 6 étagères : `{ "pots": [3, 1, 2] }`, plus `"cible": [4, 1, 2]` si l'objectif est `cible`, ou `"reponse": 6` si l'objectif est `reponse` |

Chaque étagère a de 1 à 12 pots, avec des hauteurs entières de 0 à 15.

Facultatif : `maxRegards`, le nombre maximum de fois où le bloc « hauteur du pot » peut servir, sur chaque étagère. Parfait pour faire découvrir la **complexité** : avec `"maxRegards": 4` sur 12 pots rangés, seule une dichotomie passe !

### 🌀 Type `fractale` (la forêt)

Pépin fait pousser une liane en se déplaçant, comme la « tortue » de Logo ou de Python. Le **modèle** à reproduire (en pointillés) est simplement le dessin de la `solution`. On compare les traits, sans tenir compte de l'ordre dans lequel ils ont été dessinés.

Quand les solutions sont cachées, la solution est remplacée par le champ `modele` : la liste des traits à dessiner, `[[x1, y1, x2, y2], …]`, arrondis à 0,5 près. Il faut donc l'un ou l'autre : `solution` ou `modele`.

### Les blocs

| Type de niveau | Blocs propres |
| --- | --- |
| jardin | `avancer`, `tourner`, `arroser`, `devantLibre`, `gaucheLibre`, `droiteLibre`, `surGraine` |
| serre | `nombreDePots`, `hauteur`, `arroserPot`, `echanger`, `ajouterPot`, `retirerPot`, `repondre` |
| forêt | `pousser`, `reculer`, `tournerDe` |
| tous | `repeter` (3 fois), `repeterNombre`, `pour` (compter avec i), `tantQue`, `si`, `siSinon`, `comparer`, `etOu`, `non`, `nombre`, `calcul`, `modulo` (reste de la division), `arrondi` (arrondir), `variables`, `fonctions` |
