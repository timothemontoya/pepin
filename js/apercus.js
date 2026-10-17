// =============================================================
//  apercus.js — La miniature d'un niveau, quel que soit son type
// =============================================================

import { Jardin } from './jardin.js';
import { dessinerApercu, dessinerVitrineJardin } from './rendu.js';
import { dessinerApercuSerre } from './rendu-serre.js';
import { dessinerApercuForet } from './rendu-foret.js';
import { modeleFractale } from './solutions.js';

// `vitrine` : pour les cartes de l'accueil. Un monde « jardin » y est
// montré avec une jolie carte postale (dont la variante dépend de `nom`)
export function dessinerApercuNiveau(canvas, niveau, { vitrine = false, nom = niveau.id } = {}) {
  if (niveau.type === 'etagere') dessinerApercuSerre(canvas, niveau);
  else if (niveau.type === 'fractale') dessinerApercuForet(canvas, modeleFractale(niveau)?.traits ?? []);
  else if (vitrine) dessinerVitrineJardin(canvas, nom);
  else dessinerApercu(canvas, new Jardin(niveau).instantane());
}
