// =============================================================
//  fractale.js — La forêt fractale : Pépin fait pousser une liane
// =============================================================
//
//  Pépin se déplace sur une grande feuille et laisse derrière lui
//  une liane (comme la « tortue » du langage Logo, ou turtle en
//  Python). Le but : reproduire le modèle dessiné en pointillés.
//
//  Le modèle, c'est simplement le dessin de la SOLUTION du niveau.
//  On compare les traits sans s'occuper de l'ordre dans lequel ils
//  ont été dessinés : il y a souvent plusieurs bonnes solutions !
//
//  Les angles sont en degrés : 0 = vers le haut, et tourner dans le
//  sens des aiguilles d'une montre (horaire) ajoute des degrés.
// =============================================================

export const TRAITS_MAX = 4000;
export const LONGUEUR_MAX = 2000;

export class Fractale {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.traits = []; // chaque trait : [x1, y1, x2, y2]
  }

  // Les traits ne font que s'ajouter : on partage le tableau entre
  // les photos et on retient juste combien il y en avait.
  instantane() {
    return { x: this.x, y: this.y, angle: this.angle, traits: this.traits, nbTraits: this.traits.length };
  }

  probleme(nombre, quoi) {
    if (typeof nombre !== 'number' || !Number.isFinite(nombre)) return `Il me faut un nombre pour ${quoi}.`;
    if (Math.abs(nombre) > LONGUEUR_MAX) return `${Math.round(nombre)}, c'est beaucoup trop grand pour ${quoi} !`;
    return null;
  }

  deplacer(longueur) {
    const radians = (this.angle * Math.PI) / 180;
    this.x += Math.sin(radians) * longueur;
    this.y -= Math.cos(radians) * longueur;
  }

  pousser(longueur) {
    const depart = [this.x, this.y];
    this.deplacer(longueur);
    if (longueur !== 0) this.traits.push([...depart, this.x, this.y]);
  }

  reculer(longueur) {
    this.deplacer(-longueur);
  }

  tourner(degres) {
    this.angle = (this.angle + degres) % 360;
  }
}

// Une « clé » par trait, pour comparer deux dessins comme des ensembles.
// On arrondit à 0,5 près et on range les deux bouts dans le même ordre :
// un trait dessiné dans un sens ou dans l'autre, c'est le même trait.
const arrondi = (v) => (Math.round(v * 2) / 2 + 0).toFixed(1);

export function cleDuTrait([x1, y1, x2, y2]) {
  const a = `${arrondi(x1)},${arrondi(y1)}`;
  const b = `${arrondi(x2)},${arrondi(y2)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function clesDesTraits(traits) {
  const cles = new Set();
  for (const trait of traits) {
    const cle = cleDuTrait(trait);
    const [a, b] = cle.split('|');
    if (a !== b) cles.add(cle);
  }
  return cles;
}

// Les indications d'un modèle : la longueur de trait et l'angle de
// virage les plus fréquents (valeurs par défaut des blocs « pousser
// de … » et « tourner de … degrés »), la longueur du tout premier
// trait (la « taille de départ ») et celle du plus petit.
function plusFrequent(valeurs) {
  const compte = new Map();
  for (const v of valeurs) compte.set(v, (compte.get(v) ?? 0) + 1);
  let meilleur = null;
  for (const [v, n] of compte) if (meilleur === null || n > compte.get(meilleur)) meilleur = v;
  return meilleur;
}

const longueurDe = ([x1, y1, x2, y2]) => Math.round(Math.hypot(x2 - x1, y2 - y1));

export function indicationsDuModele(traits) {
  const uniques = new Map();
  for (const trait of traits) if (longueurDe(trait) > 0) uniques.set(cleDuTrait(trait), trait);
  const longueurs = [...uniques.values()].map(longueurDe);
  const voisins = new Map();
  for (const [x1, y1, x2, y2] of uniques.values()) {
    for (const [p, q] of [[[x1, y1], [x2, y2]], [[x2, y2], [x1, y1]]]) {
      const cle = `${Math.round(p[0] * 2)},${Math.round(p[1] * 2)}`;
      if (!voisins.has(cle)) voisins.set(cle, { point: p, autres: [] });
      voisins.get(cle).autres.push(q);
    }
  }
  // un virage : entre deux traits qui partent du même point (un coin
  // de carré, une fourche d'arbre…)
  const angles = [];
  for (const { point, autres } of voisins.values()) {
    if (autres.length < 2 || autres.length > 4) continue;
    const directions = autres.map(([x, y]) => [x - point[0], y - point[1]]);
    for (let i = 0; i < directions.length; i++) {
      for (let j = i + 1; j < directions.length; j++) {
        const [a, b] = [directions[i], directions[j]];
        const cosinus = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
        const virage = Math.round(180 - (Math.acos(Math.max(-1, Math.min(1, cosinus))) * 180) / Math.PI);
        if (virage >= 2 && virage <= 178) angles.push(virage);
      }
    }
  }
  return {
    longueur: plusFrequent(longueurs),
    angle: plusFrequent(angles),
    premier: longueurs.length ? longueurDe(traits.find((trait) => longueurDe(trait) > 0)) : null,
    plusPetit: longueurs.length ? Math.min(...longueurs) : null,
  };
}

// `cible` : l'ensemble des clés du modèle (ou null s'il n'y a pas
// encore de modèle : en test dans l'éditeur, le premier dessin réussi
// devient le modèle).
export function verdictFractale(fractale, cible) {
  const dessin = clesDesTraits(fractale.traits);
  if (!cible) {
    return dessin.size > 0
      ? { gagne: true }
      : { gagne: false, message: "Je n'ai encore rien dessiné : utilise le bloc « pousser » ! 🌿" };
  }
  let bons = 0;
  for (const cle of dessin) if (cible.has(cle)) bons++;
  const enTrop = dessin.size - bons;
  if (bons === cible.size && enTrop === 0) return { gagne: true };
  const details = enTrop > 0 ? `, et ${enTrop} trait${enTrop > 1 ? 's' : ''} en trop` : '';
  return {
    gagne: false,
    message: `Ce n'est pas encore le modèle : ${bons} trait${bons > 1 ? 's' : ''} sur ${cible.size} bien placé${bons > 1 ? 's' : ''}${details}. 🌀`,
  };
}
