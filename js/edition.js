// =============================================================
//  edition.js — Les outils de l'éditeur de niveaux
// =============================================================
//
//  Ici, que des fonctions « pures » : elles reçoivent des données
//  et renvoient un résultat, sans toucher à la page. C'est ce qui
//  permet de les tester facilement dans tests.html !
//
//  Rappel : une carte est un tableau de chaînes, une par rangée.
//    ['>..o',
//     '.#..']   → carte[y][x], ici carte[0][3] vaut 'o'
// =============================================================

import { nomDeFichier, verifierMonde, FORMAT, VERSION } from './mondes.js';

export const LARGEUR_MIN = 2;
export const HAUTEUR_MIN = 1;

// ---------------------------------------------------------
// Le pinceau
// ---------------------------------------------------------
// Renvoie une NOUVELLE carte où la case (x, y) contient `symbole`.
// La carte reçue n'est jamais modifiée.
//  - En dehors de la carte : on renvoie une copie identique.
//  - Il n'y a qu'un seul Pépin : poser un Pépin efface l'ancien.
//
// En JavaScript, on ne peut PAS modifier une lettre d'une chaîne
// (ligne[2] = 'o' ne fait rien !) : on fabrique une nouvelle chaîne.
export function peindre(carte, x, y, symbole) {
  const dansLaCarte = y >= 0 && y < carte.length && x >= 0 && x < carte[y].length;
  if (!dansLaCarte) return [...carte];

  const estUnPepin = '^>v<'.includes(symbole);
  return carte.map((ligne, rangee) => {
    // dans les crochets, le ^ a besoin d'un \ devant pour être un vrai ^
    let nouvelle = estUnPepin ? ligne.replace(/[\^>v<]/g, '.') : ligne;
    if (rangee === y) nouvelle = nouvelle.slice(0, x) + symbole + nouvelle.slice(x + 1);
    return nouvelle;
  });
}

// ---------------------------------------------------------
// Agrandir ou rétrécir le jardin
// ---------------------------------------------------------
// Le coin en haut à gauche ne bouge pas, ce qui dépasse est coupé
// et les nouvelles cases sont de l'herbe.
//   redimensionner(['>o'], 3, 2)  →  ['>o.', '...']
export function redimensionner(carte, largeur, hauteur) {
  const nouvelle = [];
  for (let y = 0; y < hauteur; y++) {
    nouvelle.push((carte[y] ?? '').slice(0, largeur).padEnd(largeur, '.'));
  }
  return nouvelle;
}

// ---------------------------------------------------------
// Un id unique
// ---------------------------------------------------------
//   nouvelId('Le Virage', ['le-virage'])  →  'le-virage-2'
export function nouvelId(texte, idsExistants) {
  const base = nomDeFichier(texte);
  let id = base;
  let numero = 2;
  while (idsExistants.includes(id)) {
    id = `${base}-${numero}`;
    numero++;
  }
  return id;
}

// ---------------------------------------------------------
// Compter les blocs d'un programme (pour les défis 🏅)
// ---------------------------------------------------------
// `programme` est un programme Blockly sauvegardé (du JSON).
// On compte tous les blocs posés par le joueur, sauf le bloc de
// départ et les « ombres » (les petites valeurs grises par défaut).
export function compterBlocs(programme) {
  let total = 0;
  const visiter = (bloc) => {
    if (!bloc) return;
    if (bloc.type !== 'pepin_depart') total++;
    visiter(bloc.next?.block);
    for (const entree of Object.values(bloc.inputs ?? {})) visiter(entree.block);
  };
  for (const bloc of programme?.blocks?.blocks ?? []) visiter(bloc);
  return total;
}

// Enlève les identifiants internes des blocs : le programme marche
// pareil, mais il prend beaucoup moins de place (liens de partage !)
export function allegerProgramme(programme) {
  const nettoyer = (valeur) => {
    if (Array.isArray(valeur)) return valeur.map(nettoyer);
    if (typeof valeur !== 'object' || valeur === null) return valeur;
    const copie = {};
    for (const [cle, contenu] of Object.entries(valeur)) {
      // un objet avec un « type » est un bloc : son id ne sert à rien
      if (cle === 'id' && 'type' in valeur) continue;
      copie[cle] = nettoyer(contenu);
    }
    return copie;
  };
  return nettoyer(programme);
}

// --- Fabriquer des mondes et des niveaux --------------------------

const NOUVEAUX_NIVEAUX = {
  jardin: () => ({
    type: 'jardin',
    titre: 'Nouveau niveau',
    concept: null,
    consigne: 'Aide-moi à arroser toutes les graines ! 🌱',
    blocs: ['avancer', 'tourner', 'arroser'],
    carte: [
      '......',
      '>..o..',
      '......',
    ],
  }),
  etagere: () => ({
    type: 'etagere',
    titre: 'Nouvelle étagère',
    concept: null,
    consigne: 'Arrose chaque pot une fois ! (Les pots sont numérotés à partir de 0.)',
    blocs: ['arroserPot', 'nombreDePots', 'pour', 'variables', 'calcul', 'nombre'],
    objectif: 'cible',
    essais: [
      { pots: [2, 5, 1], cible: [3, 6, 2] },
      { pots: [4, 1, 3, 2], cible: [5, 2, 4, 3] },
    ],
  }),
  fractale: () => ({
    type: 'fractale',
    titre: 'Nouveau dessin',
    concept: null,
    consigne: 'Fais pousser la liane pour reproduire le modèle en pointillés !',
    blocs: ['pousser', 'tournerDe', 'repeterNombre'],
  }),
};

export function nouveauNiveau(idsExistants, type = 'jardin') {
  const niveau = (NOUVEAUX_NIVEAUX[type] ?? NOUVEAUX_NIVEAUX.jardin)();
  return { id: nouvelId(niveau.titre, idsExistants), ...niveau };
}

export function nouveauMonde(idsExistants) {
  return {
    format: FORMAT,
    version: VERSION,
    id: nouvelId('Mon monde', idsExistants),
    titre: 'Mon monde',
    auteur: '',
    description: '',
    difficulte: 1,
    solutionsVisibles: true,
    niveaux: [nouveauNiveau([])],
  };
}

export function copierMonde(monde, idsExistants) {
  const copie = structuredClone(monde);
  copie.titre = `${monde.titre} (copie)`;
  copie.id = nouvelId(copie.titre, idsExistants);
  return copie;
}

// Un monde ne peut être partagé que s'il est correct ET que l'auteur
// a réussi chacun de ses niveaux. Renvoie la liste de ce qui manque.
export function raisonsPasPartageable(monde) {
  const raisons = verifierMonde(monde);
  if (raisons.length) return raisons;
  monde.niveaux.forEach((niveau, i) => {
    if (!niveau.solution) {
      raisons.push(`Niveau ${i + 1} (« ${niveau.titre} ») : réussis-le toi-même avec 🧪 Tester.`);
    }
  });
  return raisons;
}
