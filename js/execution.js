// =============================================================
//  execution.js — Faire tourner le programme du joueur
// =============================================================
//
//  Le programme est d'abord exécuté d'un coup, « en coulisses ».
//  À chaque action, on prend une photo du monde (une « étape »),
//  avec en plus la valeur des variables et la pile des fonctions
//  en cours. Ensuite, les lecteurs (rendu*.js) jouent ces étapes
//  comme un petit film.
//
//  Le programme peut venir des blocs (traduits en JavaScript) ou du
//  mode Python : dans les deux cas, il appelle les mêmes fonctions.
// =============================================================

import { typeDuNiveau } from './types.js';

const LIMITE_TOURS = 10000;   // nombre maximum de tours de boucle
const PROFONDEUR_MAX = 120;   // fonctions imbriquées au maximum

// Une erreur « gentille » : son message est affiché tel quel par Pépin
export class ErreurPepin extends Error {}

// Signal spécial : le niveau est gagné, on peut s'arrêter tout de suite
export class FinVictoire extends Error {}

// Exécute du code JavaScript (fabriqué à partir des blocs)
export function executer(code, niveau, options = {}) {
  const lancer = (api) => {
    const programme = new Function(...Object.keys(api), code);
    programme(...Object.values(api));
  };
  return executerProgramme(lancer, niveau, options);
}

// `lancer(api)` fait tourner le programme en lui donnant les fonctions.
// Renvoie { essais: [...], gagne } (+ etapes et erreur du dernier essai)
export function executerProgramme(lancer, niveau, options = {}) {
  const type = typeDuNiveau(niveau);
  const essais = type.essais(niveau) ?? [];
  if (essais.length === 0) {
    const erreur = "Ce niveau n'a rien à tester !";
    return { essais: [], etapes: [], erreur, message: erreur, gagne: false };
  }
  const resultats = [];
  for (const essai of essais) {
    const resultat = executerEssai(lancer, type, niveau, essai, options);
    resultats.push(resultat);
    if (!resultat.gagne) break;
  }
  const dernier = resultats[resultats.length - 1];
  return {
    essais: resultats,
    etapes: dernier.etapes,
    erreur: dernier.erreur,
    message: dernier.message,
    gagne: resultats.length === essais.length && resultats.every((r) => r.gagne),
  };
}

// Les valeurs des variables, prêtes à être affichées dans les bocaux
function copierValeur(valeur) {
  if (Array.isArray(valeur)) return valeur.slice(0, 30).map(copierValeur);
  if (['number', 'string', 'boolean'].includes(typeof valeur)) return valeur;
  if (valeur === undefined || valeur === null) return null;
  return String(valeur);
}

function executerEssai(lancer, type, niveau, essai, options) {
  const monde = type.creer(niveau, essai);
  const etapes = [];
  const pile = [];
  let blocCourant = null;
  let ligne = null;
  let lireVariables = null;
  let variablesPython = null;
  let tours = 0;
  let signal = null; // la dernière ErreurPepin ou FinVictoire lancée

  function memoire() {
    let variables = {};
    if (variablesPython) variables = variablesPython;
    else if (lireVariables) {
      for (const [nom, valeur] of Object.entries(lireVariables())) variables[nom] = copierValeur(valeur);
    }
    return { variables, pile: pile.map((appel) => ({ nom: appel.nom, args: { ...appel.args } })) };
  }

  function noter(evenement, details = {}) {
    etapes.push({ etat: monde.instantane(), evenement, details, bloc: blocCourant, ligne, ...memoire() });
    if (etapes.length > type.maxEtapes) {
      throw new ErreurPepin(
        `Ouf, je suis épuisé… J'ai fait plus de ${type.maxEtapes} actions ! Est-ce que ton programme s'arrête un jour ? 😵`,
      );
    }
  }

  etapes.push({ etat: monde.instantane(), evenement: 'depart', details: {}, bloc: null, ligne: null, variables: {}, pile: [] });

  const api = {
    ...type.actions(monde, { noter, ErreurPepin, FinVictoire, niveau, libre: Boolean(niveau.libre) }),

    // Avant chaque bloc : on note lequel s'exécute, et comment lire les variables
    surligner(idBloc, lecteurDeVariables) {
      blocCourant = idBloc;
      if (lecteurDeVariables) lireVariables = lecteurDeVariables;
    },

    // Le piège à boucles infinies (TODO 8) : appelé à chaque tour de boucle
    tourDeBoucle() {
      tours++;
      if (tours >= LIMITE_TOURS) {throw new ErreurPepin('Je tourne en boucle là...')}
    },

    // Au début et à la fin de chaque fonction : la pile d'appels
    entrer(nom, args) {
      pile.push({ nom, args });
      if (pile.length > PROFONDEUR_MAX) {
        throw new ErreurPepin("La tête me tourne… Une fonction s'appelle elle-même sans jamais s'arrêter ? 🌀");
      }
    },
    sortir() {
      pile.pop();
    },

    // Mode Python : le programme nous envoie la ligne, les variables et la pile
    contexte(json) {
      const infos = JSON.parse(json);
      ligne = infos.ligne;
      variablesPython = infos.variables;
      pile.length = 0;
      pile.push(...infos.pile);
    },
  };

  // On retient les signaux au passage : en Python, ils sont emballés
  // dans une erreur Python, et il faut pouvoir les retrouver.
  for (const [nom, fonction] of Object.entries(api)) {
    api[nom] = (...args) => {
      try {
        return fonction(...args);
      } catch (e) {
        if (e instanceof ErreurPepin || e instanceof FinVictoire) signal = e;
        throw e;
      }
    };
  }

  let erreur = null;
  try {
    lancer(api);
  } catch (e) {
    erreur = traduireErreur(signal ?? e);
  }
  if (!erreur && signal instanceof ErreurPepin) erreur = signal.message;

  // bac à sable (niveau libre) : ni gagné, ni raté, juste joué
  const verdict = erreur || niveau.libre ? { gagne: false } : type.verdict(monde, niveau, essai, options);
  return {
    etapes,
    erreur,
    message: erreur ?? (verdict.gagne ? null : verdict.message),
    gagne: !erreur && verdict.gagne,
    monde,
  };
}

function traduireErreur(e) {
  if (e instanceof FinVictoire) return null;
  if (e instanceof ErreurPepin) return e.message;
  if (e instanceof RangeError || /recursion|stack/i.test(e?.message ?? '')) {
    return "La tête me tourne… Une fonction s'appelle elle-même sans jamais s'arrêter ? 🌀";
  }
  return `Petit pépin dans le code : ${e?.message ?? e}`;
}
