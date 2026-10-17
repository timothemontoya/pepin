// =============================================================
//  types.js — Les différents types de niveaux
// =============================================================
//
//  Chaque type de niveau décrit :
//  - essais(niveau)   : la liste des situations à tester
//  - creer(niveau, essai) : le « monde » de départ (Jardin, Etagere…)
//  - actions(monde, outils) : les fonctions que le programme du joueur
//                       peut appeler (avancer, echanger, pousser…)
//  - python           : le nom de ces fonctions en Python, et combien
//                       de valeurs elles attendent entre parenthèses
//  - verdict(...)     : a-t-on gagné ? Sinon, pourquoi ?
//
//  Les actions appellent `noter(evenement, details)` à chaque fois
//  que quelque chose change : ça prend une « photo » pour l'animation.
// =============================================================

import { Jardin } from './jardin.js';
import { Etagere, verdictEtagere, arrondir, HAUTEUR_POT_MAX, POTS_MAX } from './etagere.js';
import { Fractale, verdictFractale, TRAITS_MAX } from './fractale.js';

export const TYPES = {
  // ---------------------------------------------------------------
  jardin: {
    nom: 'Jardin',
    icone: '🌱',
    maxEtapes: 500,
    // plusieurs jardins à tester ? (« autresCartes ») : impossible de tricher
    essais: (niveau) => [niveau, ...(niveau.autresCartes ?? []).map((carte) => ({ carte }))],
    creer: (niveau, essai = niveau) => new Jardin(essai),

    actions: (jardin, { noter, ErreurPepin, FinVictoire, libre }) => ({
      avancer() {
        if (jardin.avancer()) {
          noter('avancer');
        } else {
          noter('bonk');
          throw new ErreurPepin('Bonk ! Il y a un obstacle devant moi. 🪨 Je me suis arrêté là.');
        }
      },
      tournerGauche() {
        jardin.tournerGauche();
        noter('tourner');
      },
      tournerDroite() {
        jardin.tournerDroite();
        noter('tourner');
      },
      arroser() {
        const aFleuri = jardin.arroser();
        noter(aFleuri ? 'arroser' : 'arroser-rien');
        if (!libre && jardin.estGagne()) throw new FinVictoire();
      },
      devantEstLibre: () => jardin.devantEstLibre(),
      surUneGraine: () => jardin.surUneGraine(),
      gaucheEstLibre: () => jardin.gaucheEstLibre(),
      droiteEstLibre: () => jardin.droiteEstLibre(),
    }),

    python: {
      avancer: ['avancer', 0],
      tournerGauche: ['tourner_gauche', 0],
      tournerDroite: ['tourner_droite', 0],
      arroser: ['arroser', 0],
      devantEstLibre: ['devant_est_libre', 0],
      surUneGraine: ['sur_une_graine', 0],
      gaucheEstLibre: ['gauche_est_libre', 0],
      droiteEstLibre: ['droite_est_libre', 0],
    },
    aide: [
      ['avancer()', "avance d'une case"],
      ['tourner_gauche()', 'pivote d’un quart de tour ↺'],
      ['tourner_droite()', 'pivote d’un quart de tour ↻'],
      ['arroser()', 'arrose la case où se trouve Pépin'],
      ['devant_est_libre()', 'True si Pépin peut avancer'],
      ['sur_une_graine()', 'True si Pépin est sur une graine'],
      ['gauche_est_libre()', 'True si la case à gauche de Pépin est libre'],
      ['droite_est_libre()', 'True si la case à droite de Pépin est libre'],
    ],
    objectif: (niveau) => {
      const n = 1 + (niveau.autresCartes?.length ?? 0);
      return `🎯 Arrose toutes les graines.${n > 1 ? ` Ton programme sera testé sur ${n} jardins différents.` : ''}`;
    },

    verdict: (jardin) => (jardin.estGagne()
      ? { gagne: true }
      : { gagne: false, message: "J'ai fini le programme… mais il reste des graines à arroser. On réessaie ? 🌱" }),
  },

  // ---------------------------------------------------------------
  etagere: {
    nom: 'Serre',
    icone: '🪴',
    maxEtapes: 2000,
    essais: (niveau) => niveau.essais,
    creer: (niveau, essai) => new Etagere(essai),

    actions: (etagere, { noter, ErreurPepin, niveau }) => {
      let regards = 0;
      const verifierPot = (i) => {
        const probleme = etagere.probleme(i);
        if (probleme) {
          noter('bonk', { i });
          throw new ErreurPepin(`Oups ! ${probleme}`);
        }
      };
      return {
        nombreDePots: () => etagere.pots.length,
        hauteur(i) {
          verifierPot(i);
          regards++;
          if (niveau.maxRegards && regards > niveau.maxRegards) {
            throw new ErreurPepin(`J'ai déjà regardé ${niveau.maxRegards} pots : c'est le maximum ici ! 👀 Il faut une méthode plus maline.`);
          }
          const hauteur = etagere.regarder(i);
          noter('regarder', { i });
          return hauteur;
        },
        echanger(i, j) {
          verifierPot(i);
          verifierPot(j);
          etagere.echanger(i, j);
          noter('echanger', { i, j });
        },
        arroserPot(i) {
          verifierPot(i);
          if (etagere.pots[i] >= HAUTEUR_POT_MAX) {
            noter('bonk', { i });
            throw new ErreurPepin(`La plante du pot n°${i} touche déjà le plafond de la serre ! 🌿`);
          }
          etagere.arroser(i);
          noter('arroserPot', { i });
        },
        ajouterPot(hauteur) {
          if (typeof hauteur !== 'number' || !Number.isInteger(hauteur) || hauteur < 0 || hauteur > HAUTEUR_POT_MAX) {
            throw new ErreurPepin(`Je ne peux ajouter qu'un pot de hauteur entière, entre 0 et ${HAUTEUR_POT_MAX}.`);
          }
          if (etagere.pots.length >= POTS_MAX) {
            throw new ErreurPepin(`L'étagère est pleine : ${POTS_MAX} pots au maximum ! 🪴`);
          }
          etagere.ajouter(hauteur);
          noter('ajouterPot', { i: etagere.pots.length - 1 });
        },
        retirerPot() {
          if (etagere.pots.length === 0) throw new ErreurPepin("Il n'y a plus de pot à retirer !");
          const i = etagere.pots.length - 1;
          etagere.retirer();
          noter('retirerPot', { i });
        },
        repondre(valeur) {
          etagere.repondre(valeur);
          noter('repondre', { valeur: typeof valeur === 'number' ? arrondir(valeur) : String(valeur) });
        },
      };
    },

    python: {
      nombreDePots: ['nombre_de_pots', 0],
      hauteur: ['hauteur', 1],
      echanger: ['echanger', 2],
      arroserPot: ['arroser_pot', 1],
      ajouterPot: ['ajouter_pot', 1],
      retirerPot: ['retirer_pot', 0],
      repondre: ['repondre', 1],
    },
    aide: [
      ['nombre_de_pots()', "le nombre de pots (la longueur de la liste)"],
      ['hauteur(i)', 'la hauteur de la plante du pot n°i (on compte à partir de 0)'],
      ['arroser_pot(i)', 'la plante du pot n°i grandit de 1'],
      ['echanger(i, j)', 'les pots n°i et n°j changent de place'],
      ['ajouter_pot(h)', "ajoute un pot de hauteur h au bout de l'étagère"],
      ['retirer_pot()', 'enlève le dernier pot'],
      ['repondre(valeur)', 'Pépin annonce sa réponse'],
    ],
    objectif: (niveau) => {
      const n = niveau.essais?.length ?? 1;
      const plusieurs = n > 1 ? ` Ton programme sera testé sur ${n} étagères différentes.` : '';
      const buts = {
        trier: '🎯 Range les pots du plus petit au plus grand.',
        cible: '🎯 Amène chaque plante à la hauteur de son drapeau 🚩.',
        reponse: '🎯 Trouve la bonne réponse et annonce-la avec « répondre ».',
      };
      const regards = niveau.maxRegards ? ` 👀 Tu n'as le droit de regarder que ${niveau.maxRegards} pots !` : '';
      return (buts[niveau.objectif] ?? '') + regards + plusieurs;
    },

    verdict: (etagere, niveau, essai) => verdictEtagere(etagere, niveau, essai),
  },

  // ---------------------------------------------------------------
  fractale: {
    nom: 'Forêt fractale',
    icone: '🌀',
    maxEtapes: 6000,
    essais: (niveau) => [niveau],
    creer: () => new Fractale(),

    actions: (fractale, { noter, ErreurPepin }) => {
      const verifier = (nombre, quoi) => {
        const probleme = fractale.probleme(nombre, quoi);
        if (probleme) throw new ErreurPepin(probleme);
      };
      const tourner = (degres) => {
        verifier(degres, 'tourner');
        fractale.tourner(degres);
        noter('tourner');
      };
      return {
        pousser(longueur) {
          verifier(longueur, 'pousser');
          if (fractale.traits.length >= TRAITS_MAX) {
            throw new ErreurPepin('Ma liane est devenue gigantesque… beaucoup trop de traits ! 🌿');
          }
          fractale.pousser(longueur);
          noter('pousser');
        },
        reculer(longueur) {
          verifier(longueur, 'reculer');
          fractale.reculer(longueur);
          noter('reculer');
        },
        tournerGauche: (degres) => tourner(-degres),
        tournerDroite: (degres) => tourner(degres),
      };
    },

    python: {
      pousser: ['pousser', 1],
      reculer: ['reculer', 1],
      tournerGauche: ['tourner_gauche', 1],
      tournerDroite: ['tourner_droite', 1],
    },
    aide: [
      ['pousser(longueur)', 'avance en faisant pousser la liane'],
      ['reculer(longueur)', 'recule, sans rien faire pousser'],
      ['tourner_gauche(degres)', 'pivote dans le sens anti-horaire ↺'],
      ['tourner_droite(degres)', 'pivote dans le sens horaire ↻'],
    ],
    objectif: () => '🎯 Reproduis le modèle en pointillés : ni plus, ni moins !',

    verdict: (fractale, niveau, essai, options) => verdictFractale(fractale, options.cibleFractale ?? null),
  },
};

export const TYPES_DE_NIVEAU = Object.keys(TYPES);

export function typeDuNiveau(niveau) {
  return TYPES[niveau?.type] ?? TYPES.jardin;
}
