// =============================================================
//  bac-a-sable.js — Le bac à sable : jouer librement, sans but
// =============================================================
//
//  Un petit monde spécial, jamais partagé ni corrigé : un jardin,
//  une serre et une forêt où l'on peut programmer ce qu'on veut.
//  Ses niveaux ont `libre: true` : pas de victoire, pas d'échec,
//  le programme est simplement joué jusqu'au bout.
//
//  Le bouton « 🎲 Nouveau terrain » tire un jardin ou une étagère
//  au hasard ; le dernier terrain est gardé dans le navigateur.
// =============================================================

import { BLOCS_PAR_TYPE } from './boite-a-outils.js';
import { POTS_MAX } from './etagere.js';
import { stockage } from './stockage.js';

export const ID_BAC_A_SABLE = 'bac-a-sable';

const JARDIN_DE_DEPART = [
  '..........',
  '.>..o..#..',
  '...##..o..',
  '.o.....#..',
  '....o.....',
  '.#.....o#.',
  '..........',
];
const POTS_DE_DEPART = [3, 1, 4, 1, 5, 2];

const hasard = (n) => Math.floor(Math.random() * n);

// Un jardin au hasard : quelques rochers, 5 à 8 graines, et Pépin
export function jardinAuHasard(largeur = 10, hauteur = 7) {
  const cases = Array.from({ length: hauteur }, () => Array.from({ length: largeur }, () => (Math.random() < 0.12 ? '#' : '.')));
  const caseLibre = () => {
    for (;;) {
      const x = hasard(largeur);
      const y = hasard(hauteur);
      if (cases[y][x] === '.') return [x, y];
    }
  };
  const [x, y] = caseLibre();
  cases[y][x] = '><^v'[hasard(4)];
  for (let graines = 5 + hasard(4); graines > 0; graines--) {
    const [gx, gy] = caseLibre();
    cases[gy][gx] = 'o';
  }
  return cases.map((rangee) => rangee.join(''));
}

// Une étagère au hasard : entre 4 et 8 pots
export function potsAuHasard() {
  const nombre = 4 + hasard(Math.min(5, POTS_MAX - 3));
  return Array.from({ length: nombre }, () => 1 + hasard(7));
}

export const TERRAINS = {
  jardin: {
    lire: () => stockage.lire('pepin.bac.jardin', JARDIN_DE_DEPART),
    tirer(niveau) {
      niveau.carte = jardinAuHasard();
      stockage.ecrire('pepin.bac.jardin', niveau.carte);
    },
  },
  etagere: {
    lire: () => stockage.lire('pepin.bac.serre', POTS_DE_DEPART),
    tirer(niveau) {
      niveau.essais = [{ pots: potsAuHasard() }];
      stockage.ecrire('pepin.bac.serre', niveau.essais[0].pots);
    },
  },
};

export function creerBacASable() {
  return {
    id: ID_BAC_A_SABLE,
    titre: 'Bac à sable',
    libre: true,
    solutionsVisibles: false,
    niveaux: [
      {
        id: 'jardin-libre',
        type: 'jardin',
        titre: 'Jardin libre',
        libre: true,
        consigne: 'Ici, pas de niveau à réussir : fais-moi bouger comme tu veux ! 🏖️ Arrose les graines, fais des tours, invente des chemins… Le bouton 🎲 change le jardin.',
        blocs: BLOCS_PAR_TYPE.jardin,
        carte: TERRAINS.jardin.lire(),
      },
      {
        id: 'serre-libre',
        type: 'etagere',
        titre: 'Serre libre',
        libre: true,
        consigne: 'La serre est à toi ! 🪴 Arrose, échange, ajoute ou retire des pots, range-les… comme tu veux. Le bouton 🎲 change l\'étagère.',
        blocs: BLOCS_PAR_TYPE.etagere,
        essais: [{ pots: TERRAINS.etagere.lire() }],
      },
      {
        id: 'foret-libre',
        type: 'fractale',
        titre: 'Forêt libre',
        libre: true,
        consigne: 'Une grande feuille blanche ! 🌀 Fais pousser la liane pour dessiner ce que tu veux : une maison, une fleur, une spirale, un arbre fractal…',
        blocs: BLOCS_PAR_TYPE.fractale,
      },
    ],
  };
}
