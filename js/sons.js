// =============================================================
//  sons.js — De tout petits sons, fabriqués par le navigateur
// =============================================================
//
//  Pas de fichier audio : on fabrique des notes avec la Web Audio
//  API (un « oscillateur » qui vibre à une fréquence donnée).
//  Les sons sont coupés par défaut, et se règlent avec le bouton 🔇.
// =============================================================

import { stockage } from './stockage.js';

let actif = stockage.lire('pepin.sons', false);
let contexte = null;

export function sonsActifs() {
  return actif;
}

export function activerSons(oui) {
  actif = oui;
  stockage.ecrire('pepin.sons', oui);
  if (oui) jouer('clic');
}

function note(frequence, debut, duree, { type = 'sine', volume = 0.08, glisse = null } = {}) {
  const osc = contexte.createOscillator();
  const gain = contexte.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequence, debut);
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, debut + duree);
  gain.gain.setValueAtTime(0.0001, debut);
  gain.gain.exponentialRampToValueAtTime(volume, debut + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  osc.connect(gain).connect(contexte.destination);
  osc.start(debut);
  osc.stop(debut + duree + 0.02);
}

const SONS = {
  clic: (t) => note(660, t, 0.06, { type: 'triangle', volume: 0.05 }),
  pas: (t) => note(420, t, 0.05, { type: 'triangle', volume: 0.03 }),
  tourner: (t) => note(520, t, 0.07, { type: 'triangle', volume: 0.03, glisse: 600 }),
  goutte: (t) => note(900, t, 0.12, { volume: 0.06, glisse: 1500 }),
  fleur: (t) => {
    note(784, t, 0.12, { volume: 0.06 });
    note(1046, t + 0.08, 0.16, { volume: 0.06 });
  },
  bonk: (t) => note(160, t, 0.18, { type: 'square', volume: 0.04, glisse: 90 }),
  echange: (t) => {
    note(500, t, 0.08, { type: 'triangle', volume: 0.04 });
    note(650, t + 0.07, 0.08, { type: 'triangle', volume: 0.04 });
  },
  liane: (t) => note(300 + Math.random() * 300, t, 0.05, { volume: 0.02 }),
  reponse: (t) => note(740, t, 0.15, { type: 'triangle', volume: 0.05 }),
  victoire: (t) => [523, 659, 784, 1046].forEach((f, i) => note(f, t + i * 0.1, 0.22, { volume: 0.07 })),
  medaille: (t) => [880, 1175, 1568].forEach((f, i) => note(f, t + i * 0.07, 0.3, { volume: 0.05 })),
  rate: (t) => {
    note(392, t, 0.16, { type: 'triangle', volume: 0.05 });
    note(330, t + 0.14, 0.24, { type: 'triangle', volume: 0.05 });
  },
};

export function jouer(nom) {
  if (!actif || !SONS[nom]) return;
  try {
    contexte ??= new AudioContext();
    if (contexte.state === 'suspended') contexte.resume();
    SONS[nom](contexte.currentTime + 0.01);
  } catch {
    // pas de son disponible : tant pis !
  }
}

// Le son qui va avec une étape d'animation
const SON_DES_EVENEMENTS = {
  avancer: 'pas',
  tourner: 'tourner',
  arroser: 'fleur',
  'arroser-rien': 'goutte',
  arroserPot: 'goutte',
  bonk: 'bonk',
  echanger: 'echange',
  ajouterPot: 'pas',
  retirerPot: 'pas',
  regarder: 'clic',
  repondre: 'reponse',
  pousser: 'liane',
};

export function sonDeLEtape(evenement) {
  jouer(SON_DES_EVENEMENTS[evenement]);
}
