// =============================================================
//  solutions.js — Faire tourner les solutions « en coulisses »
// =============================================================
//
//  La solution d'un niveau est un programme Blockly sauvegardé.
//  On peut la charger dans un espace de travail invisible (sans
//  dessin), la traduire en JavaScript et l'exécuter. Ça sert à :
//  - vérifier qu'une solution reçue (fichier, lien) marche vraiment ;
//  - dessiner le modèle en pointillés des niveaux « fractale ».
// =============================================================

import { genererCodeJS } from './blocs.js';
import { typesAutorises, nomDuType } from './boite-a-outils.js';
import { executer } from './execution.js';
import { clesDesTraits } from './fractale.js';

// Charge un programme dans un espace invisible et le traduit.
// Renvoie { code, interdits } (interdits : les blocs pas autorisés).
export function traduireProgramme(programme, cles) {
  const espace = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(programme, espace);
    const autorises = typesAutorises(cles);
    const interdits = [...new Set(espace.getAllBlocks(false)
      .filter((bloc) => !bloc.isShadow() && !autorises.has(bloc.type))
      .map((bloc) => nomDuType(bloc.type)))];
    return { code: interdits.length ? null : genererCodeJS(espace), interdits };
  } finally {
    espace.dispose();
  }
}

// Le dessin modèle d'un niveau fractale (en cache : il ne change pas).
// Il vient de la solution… ou, pour un monde reçu sans les solutions,
// directement de la liste de traits `modele`.
const modeles = new WeakMap();

export function modeleFractale(niveau) {
  const source = niveau.solution ?? niveau.modele;
  if (!source) return null;
  const enCache = modeles.get(niveau);
  if (enCache && enCache.source === source) return enCache;

  let traits = niveau.modele;
  if (niveau.solution) {
    const { code } = traduireProgramme(niveau.solution, niveau.blocs);
    if (!code) return null;
    const resultat = executer(code, niveau, { cibleFractale: null });
    if (resultat.erreur) return null;
    traits = resultat.essais[0].monde.traits;
  }
  const modele = { source, traits, cles: clesDesTraits(traits) };
  modeles.set(niveau, modele);
  return modele;
}

// Les options d'exécution d'un niveau (le modèle, pour les fractales)
export function optionsDuNiveau(niveau) {
  if (niveau.type !== 'fractale') return {};
  return { cibleFractale: modeleFractale(niveau)?.cles ?? null };
}

// Vérifie la solution d'un niveau. Renvoie null si tout va bien,
// sinon un message qui explique le problème.
export function problemeDeSolution(niveau) {
  if (!niveau.solution) return null;
  let traduction;
  try {
    traduction = traduireProgramme(niveau.solution, niveau.blocs);
  } catch (e) {
    return `la solution est illisible (${e.message})`;
  }
  if (traduction.interdits.length) {
    return `la solution utilise des blocs qui ne sont pas proposés : ${traduction.interdits.join(', ')}`;
  }
  try {
    if (niveau.type === 'fractale') {
      return modeleFractale(niveau)?.cles.size ? null : 'la solution ne dessine rien';
    }
    const resultat = executer(traduction.code, niveau, optionsDuNiveau(niveau));
    if (resultat.gagne) return null;
    return `la solution ne réussit pas le niveau (${resultat.message ?? 'raté'})`;
  } catch (e) {
    return `la solution plante (${e.message})`;
  }
}

// Toutes les erreurs de solutions d'un monde, prêtes à afficher
export function problemesDeSolutions(monde) {
  const problemes = [];
  monde.niveaux.forEach((niveau, i) => {
    const probleme = problemeDeSolution(niveau);
    if (probleme) problemes.push(`Niveau ${i + 1} (« ${niveau.titre} ») : ${probleme}.`);
    if (niveau.type === 'fractale' && !modeleFractale(niveau)?.cles.size) {
      problemes.push(`Niveau ${i + 1} (« ${niveau.titre} ») : il manque le modèle de ce dessin.`);
    }
  });
  return problemes;
}
