// =============================================================
//  mondes.js — Les mondes : charger, vérifier, importer, exporter
// =============================================================
//
//  Un MONDE est une suite de niveaux, rangée dans un fichier .pepin
//  (c'est du JSON à l'intérieur). Le format complet est expliqué
//  dans mondes/README.md.
//
//  Les mondes viennent de deux endroits :
//  - la bibliothèque : les fichiers du dossier mondes/ (listés dans
//    mondes/index.json)
//  - les mondes importés par le joueur : gardés dans son navigateur
//
//  Tes TODO 11, 12 et 13 sont ici ✅ (vérifiés par tests.html).
// =============================================================

import { Jardin } from './jardin.js';
import { BLOCS_DISPONIBLES, BLOCS_PAR_TYPE } from './boite-a-outils.js';
import { TYPES_DE_NIVEAU } from './types.js';
import { OBJECTIFS, POTS_MAX, HAUTEUR_POT_MAX } from './etagere.js';
import { TRAITS_MAX } from './fractale.js';
import { stockage } from './stockage.js';

export { TYPES_DE_NIVEAU };
export const FORMAT = 'pepin-monde';
export const VERSION = 1;
export const LARGEUR_MAX = 15;
export const HAUTEUR_MAX = 12;
export const MAX_BLOCS_DEFI = 200;

// ---------------------------------------------------------
// TODO 11 — Vérifier un niveau
// ---------------------------------------------------------
// Un fichier importé peut venir de n'importe où : il peut avoir été
// mal écrit à la main, ou abîmé. Avant de jouer un niveau, on vérifie
// qu'il est correct.
//
// Renvoie un TABLEAU de messages d'erreur (des chaînes de caractères).
// Tableau vide = tout va bien ! Commence chaque message par le numéro
// du niveau pour que le créateur s'y retrouve, par exemple :
//   'Niveau 2 : il manque le titre'
//
// À vérifier :
//  a) titre et consigne sont des chaînes de caractères non vides
//  b) type fait partie de TYPES_DE_NIVEAU
//  c) blocs est un tableau, et chaque bloc fait partie de BLOCS_DISPONIBLES
//  d) carte est un tableau de chaînes, et le jardin ne dépasse pas
//     LARGEUR_MAX × HAUTEUR_MAX
//  e) la carte est lisible : essaie de créer un Jardin avec ce niveau !
//     Le constructeur lance une erreur si une ligne est trop courte, si un
//     symbole est inconnu, ou s'il n'y a pas de Pépin. Attrape-la avec
//     try { ... } catch (e) { ... } et ajoute e.message à tes erreurs.
//  f) il y a UN SEUL Pépin (le constructeur ne vérifie pas ça !)
//  g) il y a au moins une graine 'o' (sinon le niveau est gagné d'avance)
//
// Outils utiles : typeof, Array.isArray(), .includes(), .every(),
// .trim(), et pour compter un caractère dans une chaîne, une boucle
// for...of sur ses lettres.
// Conseil : si carte n'est pas un tableau, inutile de vérifier d), e), f) et g).
function estUnTexteNonVide(valeur) {
  return typeof valeur === 'string' && valeur.trim().length > 0;
}

export function verifierNiveau(niveau, numero) {
  const erreurs = [];
  if (!estUnTexteNonVide(niveau.titre)) {
    erreurs.push(`Niveau ${numero} : Le titre est vide ou n'est pas une chaîne de caractères.`);
  }
  if (!estUnTexteNonVide(niveau.consigne)) {
    erreurs.push(`Niveau ${numero} : La consigne est vide ou n'est pas une chaîne de caractères.`);
  }
  if (!TYPES_DE_NIVEAU.includes(niveau.type)) {
    erreurs.push(`Niveau ${numero} : Le type « ${niveau.type} » n'existe pas.`);
  }
  if (Array.isArray(niveau.blocs)) {
    for (const bloc of niveau.blocs) {
      if (!BLOCS_DISPONIBLES.includes(bloc)) {
        erreurs.push(`Niveau ${numero} : Le bloc « ${bloc} » n'existe pas.`);
      } else if (BLOCS_PAR_TYPE[niveau.type] && !BLOCS_PAR_TYPE[niveau.type].includes(bloc)) {
        erreurs.push(`Niveau ${numero} : Le bloc « ${bloc} » ne sert pas dans ce type de niveau.`);
      }
    }
  } else {
    erreurs.push(`Niveau ${numero} : Les blocs doivent être dans un tableau.`);
  }

  // Le défi bonus 🏅 (facultatif) : { "maxBlocs": 6 }
  if (niveau.exigences !== undefined && niveau.exigences !== null) {
    const maxBlocs = niveau.exigences?.maxBlocs;
    if (!estUnObjet(niveau.exigences)) {
      erreurs.push(`Niveau ${numero} : Les exigences doivent être un objet, comme { "maxBlocs": 6 }.`);
    } else if (maxBlocs !== undefined && !(Number.isInteger(maxBlocs) && maxBlocs >= 1 && maxBlocs <= MAX_BLOCS_DEFI)) {
      erreurs.push(`Niveau ${numero} : Le défi « maxBlocs » doit être un nombre entier entre 1 et ${MAX_BLOCS_DEFI}.`);
    }
  }

  // Le programme de départ (facultatif) : un programme à déboguer 🐛
  if (niveau.depart !== undefined && !estUnObjet(niveau.depart)) {
    erreurs.push(`Niveau ${numero} : Le programme de départ est illisible.`);
  }

  // Ce qui reste dépend du type de niveau
  if (niveau.type === 'etagere') erreurs.push(...verifierEtagere(niveau, numero));
  if (niveau.type === 'jardin') erreurs.push(...verifierCarte(niveau, numero));
  if (niveau.type === 'fractale') erreurs.push(...verifierModele(niveau, numero));
  return erreurs;
}

// Le modèle d'un dessin reçu sans sa solution (solutions cachées par le
// prof) : une liste de traits [x1, y1, x2, y2]
function verifierModele(niveau, numero) {
  if (niveau.modele === undefined) return [];
  const bonTrait = (trait) => Array.isArray(trait) && trait.length === 4
    && trait.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 100000);
  const lisible = Array.isArray(niveau.modele) && niveau.modele.length > 0
    && niveau.modele.length <= TRAITS_MAX && niveau.modele.every(bonTrait);
  return lisible ? [] : [`Niveau ${numero} : Le modèle du dessin est illisible.`];
}

// Les étagères d'essai d'un niveau « serre »
function estUneRangee(liste, minimum) {
  return Array.isArray(liste) && liste.length >= minimum && liste.length <= POTS_MAX
    && liste.every((hauteur) => Number.isInteger(hauteur) && hauteur >= 0 && hauteur <= HAUTEUR_POT_MAX);
}

function verifierEtagere(niveau, numero) {
  const erreurs = [];
  if (niveau.maxRegards !== undefined && !(Number.isInteger(niveau.maxRegards) && niveau.maxRegards >= 1 && niveau.maxRegards <= 100)) {
    erreurs.push(`Niveau ${numero} : Le nombre de regards autorisés doit être un entier entre 1 et 100.`);
  }
  if (!OBJECTIFS.includes(niveau.objectif)) {
    erreurs.push(`Niveau ${numero} : L'objectif doit être « trier », « cible » ou « reponse ».`);
  }
  if (!Array.isArray(niveau.essais) || niveau.essais.length === 0 || niveau.essais.length > 6) {
    erreurs.push(`Niveau ${numero} : Il faut entre 1 et 6 étagères d'essai.`);
    return erreurs;
  }
  niveau.essais.forEach((essai, i) => {
    const debut = `Niveau ${numero}, étagère ${i + 1}`;
    if (!estUnObjet(essai)) {
      erreurs.push(`${debut} : Ce n'est pas une étagère.`);
      return;
    }
    if (!estUneRangee(essai.pots, 1)) {
      erreurs.push(`${debut} : Il faut de 1 à ${POTS_MAX} pots, de hauteurs entières entre 0 et ${HAUTEUR_POT_MAX}.`);
    }
    if (niveau.objectif === 'cible' && !estUneRangee(essai.cible, 0)) {
      erreurs.push(`${debut} : Le résultat attendu doit être une liste de hauteurs entières (0 à ${HAUTEUR_POT_MAX}).`);
    }
    if (niveau.objectif === 'reponse' && (typeof essai.reponse !== 'number' || !Number.isFinite(essai.reponse))) {
      erreurs.push(`${debut} : La réponse attendue doit être un nombre.`);
    }
  });
  return erreurs;
}

// Le jardin principal, puis les autres jardins de test éventuels
function verifierCarte(niveau, numero) {
  if (niveau.autresCartes === undefined) return verifierUneCarte(niveau, numero);
  if (!Array.isArray(niveau.autresCartes) || niveau.autresCartes.length > 5) {
    return [`Niveau ${numero} : « autresCartes » doit être une liste d'au plus 5 jardins.`];
  }
  return [
    ...verifierUneCarte(niveau, numero),
    ...niveau.autresCartes.flatMap((carte, i) => verifierUneCarte({ carte }, `${numero} (jardin ${i + 2})`)),
  ];
}

// La carte d'un niveau « jardin » (ton TODO 11, points d à g)
function verifierUneCarte(niveau, numero) {
  const erreurs = [];
  if (!Array.isArray(niveau.carte) || niveau.carte.length === 0) {
    erreurs.push(`Niveau ${numero} : La carte doit être un tableau de lignes, non vide.`);
    return erreurs;
  }
  if (!niveau.carte.every((ligne) => typeof ligne === 'string')) {
    erreurs.push(`Niveau ${numero} : Chaque ligne de la carte doit être une chaîne de caractères.`);
    return erreurs;
  }
  if (niveau.carte.length > HAUTEUR_MAX || niveau.carte.some((ligne) => ligne.length > LARGEUR_MAX)) {
    erreurs.push(`Niveau ${numero} : Le jardin est trop grand (${LARGEUR_MAX} × ${HAUTEUR_MAX} maximum).`);
  }

  try {
    new Jardin(niveau);
  } catch (e) {
    erreurs.push(`Niveau ${numero} : ${e.message}`);
  }

  // f) et g) On compte les Pépins et les graines, caractère par caractère
  let pepins = 0;
  let graines = 0;
  for (const ligne of niveau.carte) {
    for (const symbole of ligne) {
      if ('^>v<'.includes(symbole)) pepins++;
      if (symbole === 'o') graines++;
    }
  }
  if (pepins > 1) {
    erreurs.push(`Niveau ${numero} : Il y a ${pepins} Pépins, il en faut un seul.`);
  }
  if (graines === 0) {
    erreurs.push(`Niveau ${numero} : Il n'y a aucune graine à arroser.`);
  }

  return erreurs;
}

// ---------------------------------------------------------
// TODO 12 — Vérifier un monde complet
// ---------------------------------------------------------
// Même principe : renvoie un tableau de messages d'erreur.
//
// Attention : `donnees` sort tout droit d'un fichier, ça peut être
// N'IMPORTE QUOI (null, un nombre, un tableau…). Vérifie d'abord que
// c'est bien un objet, sinon renvoie tout de suite une erreur.
// Rappel du piège : typeof null vaut 'object' 😬
//
// À vérifier ensuite :
//  a) format vaut FORMAT et version vaut VERSION
//  b) id est fait uniquement de minuscules, chiffres et tirets.
//     Cette « expression régulière » le teste pour toi :
//       /^[a-z0-9-]+$/.test(texte)   → true ou false
//  c) titre est une chaîne non vide
//  d) niveaux est un tableau qui contient au moins un niveau
//  e) chaque niveau est correct → réutilise verifierNiveau !
//     (astuce : erreurs.push(...autreTableau) ajoute tous les éléments)
//  f) deux niveaux n'ont pas le même id (un Set peut t'aider)
// Un « vrai » objet : ni null, ni un tableau (typeof répond 'object' pour les deux !)
function estUnObjet(valeur) {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

export function verifierMonde(donnees) {
  const erreurs = [];
  if (!estUnObjet(donnees)) {
    return ['Monde : Le fichier ne contient pas un monde.'];
  }
  if (donnees.format !== FORMAT || donnees.version !== VERSION) {
    erreurs.push(`Monde : Le monde est dans un format ou une version incorrecte.`);
  }
  if (typeof donnees.id !== 'string' || !/^[a-z0-9-]+$/.test(donnees.id)) {
    erreurs.push(`Monde : L'id du monde doit être fait uniquement de minuscules, chiffres et tirets.`);
  }
  if (!estUnTexteNonVide(donnees.titre)) {
    erreurs.push(`Monde : Le titre du monde est vide ou n'est pas une chaîne de caractères.`);
  }
  if (donnees.difficulte !== undefined && ![1, 2, 3, 4].includes(donnees.difficulte)) {
    erreurs.push('Monde : La difficulté doit valoir 1, 2, 3 ou 4.');
  }
  if (!Array.isArray(donnees.niveaux) || donnees.niveaux.length === 0) {
    erreurs.push(`Monde : Il faut au moins un niveau pour faire un monde.`);
    return erreurs; 
  }

  const idsDejaVus = new Set();
  let numero = 1;
  for (const niveau of donnees.niveaux) {
    if (!estUnObjet(niveau)) {
      erreurs.push(`Niveau ${numero} : Ce n'est pas un niveau.`);
    } else {
      erreurs.push(...verifierNiveau(niveau, numero));
      if (idsDejaVus.has(niveau.id)) {
        erreurs.push(`Niveau ${numero} : L'id « ${niveau.id} » est déjà utilisé par un autre niveau.`);
      }
      idsDejaVus.add(niveau.id);
    }
    numero++;
  }
  return erreurs;
}

// ---------------------------------------------------------
// TODO 13 — Un joli nom de fichier
// ---------------------------------------------------------
// Pour exporter un monde, il faut un nom de fichier. On le fabrique
// à partir du titre, mais sans accents, sans espaces ni symboles :
//   'La Forêt des Boucles !'  →  'la-foret-des-boucles'
//   '  Été 2026 '             →  'ete-2026'
//   '!!!'                     →  'mon-monde'   (s'il ne reste rien)
//
// Étapes :
//  1. tout en minuscules
//  2. enlever les accents. Astuce magique (cherche « normalize NFD »
//     pour comprendre !) : texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
//  3. remplacer chaque groupe de caractères qui ne sont pas des lettres
//     ou des chiffres par UN tiret : .replace(/[^a-z0-9]+/g, '-')
//  4. enlever les tirets au début et à la fin
//  5. si le résultat est vide, renvoyer 'mon-monde'
export function nomDeFichier(titre) {
  const titrePropre = 
    titre.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return titrePropre === '' ? 'mon-monde' : titrePropre;
}

// --- Lire un monde depuis un texte (fichier) --------------------

// Une erreur qui contient la liste de tous les problèmes trouvés
export class ErreurMonde extends Error {
  constructor(erreurs) {
    super(erreurs.join('\n'));
    this.erreurs = erreurs;
  }
}

export function lireTexteMonde(texte) {
  let donnees;
  try {
    donnees = JSON.parse(texte);
  } catch (e) {
    throw new ErreurMonde([`le fichier n'est pas du JSON valide (${e.message})`]);
  }
  const erreurs = verifierMonde(donnees);
  if (erreurs.length) throw new ErreurMonde(erreurs);
  return donnees;
}

export function texteDuMonde(monde) {
  return `${JSON.stringify(monde, null, 2)}\n`;
}

// --- La bibliothèque (dossier mondes/) ---------------------------
//
//  Renvoie une liste de { monde } ou de { fichier, erreur }, pour
//  pouvoir afficher les mondes abîmés au lieu de tout faire planter.

export async function chargerBibliotheque() {
  const reponse = await fetch('mondes/index.json', { cache: 'no-cache' });
  if (!reponse.ok) throw new Error(`mondes/index.json introuvable (${reponse.status})`);
  const { mondes: fichiers } = await reponse.json();

  return Promise.all(fichiers.map(async (fichier) => {
    try {
      const r = await fetch(`mondes/${fichier}`, { cache: 'no-cache' });
      if (!r.ok) throw new ErreurMonde([`fichier introuvable (${r.status})`]);
      return { monde: lireTexteMonde(await r.text()) };
    } catch (e) {
      return { fichier, erreur: e.erreurs ?? [e.message] };
    }
  }));
}

// --- Mes mondes : importés ou créés (gardés dans le navigateur) ---

const CLE_MES_MONDES = 'pepin.mondes';

export function mesMondes() {
  return stockage.lire(CLE_MES_MONDES, []);
}

// Ajoute le monde, ou le remplace s'il existe déjà (même id)
export function enregistrerMonMonde(monde) {
  const liste = mesMondes();
  const position = liste.findIndex((m) => m?.id === monde.id);
  if (position === -1) liste.push(monde);
  else liste[position] = monde;
  stockage.ecrire(CLE_MES_MONDES, liste);
}

export function retirerMonMonde(id) {
  stockage.ecrire(CLE_MES_MONDES, mesMondes().filter((m) => m?.id !== id));
}
