// =============================================================
//  rendu-foret.js — Dessiner la forêt fractale (la liane de Pépin)
// =============================================================
//
//  Les coordonnées du dessin sont « dans la forêt » (Pépin part de
//  (0, 0)). On calcule une « vue » qui fait tenir tout le dessin dans
//  le canvas : un zoom (echelle) et un décalage.
// =============================================================

import {
  C, LecteurBase, dessinerPepin, ellipse, lerp, douceur, rebond, preparerCanvas,
} from './rendu.js';
import { cleDuTrait } from './fractale.js';

// La vue qui fait tenir tous ces points dans un rectangle
function calculerVue(points, largeur, hauteur, marge = 34) {
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const l = Math.max(maxX - minX, 40);
  const h = Math.max(maxY - minY, 40);
  const echelle = Math.min((largeur - marge * 2) / l, (hauteur - marge * 2) / h, 3);
  const dx = (largeur - (minX + maxX) * echelle) / 2;
  const dy = (hauteur - (minY + maxY) * echelle) / 2;
  return { echelle, dx, dy, largeur, hauteur, ecran: (x, y) => [x * echelle + dx, y * echelle + dy] };
}

function pointsDesTraits(traits) {
  const points = [];
  for (const [x1, y1, x2, y2] of traits) points.push([x1, y1], [x2, y2]);
  return points;
}

function dessinerFond(ctx, vue) {
  ctx.fillStyle = C.papier;
  ctx.fillRect(0, 0, vue.largeur, vue.hauteur);
  ctx.fillStyle = C.quadrillage;
  for (let x = 12; x < vue.largeur; x += 24) {
    for (let y = 12; y < vue.hauteur; y += 24) ctx.fillRect(x, y, 2, 2);
  }
}

function dessinerModele(ctx, vue, traits) {
  ctx.save();
  ctx.strokeStyle = C.modele;
  ctx.lineWidth = Math.max(2, Math.min(4, vue.echelle * 2.5));
  ctx.lineCap = 'round';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of traits) {
    ctx.moveTo(...vue.ecran(x1, y1));
    ctx.lineTo(...vue.ecran(x2, y2));
  }
  ctx.stroke();
  ctx.restore();
}

// La liane : un trait vert, avec une petite feuille au milieu de chaque morceau
function dessinerLiane(ctx, vue, traits, nombre, dernierePart = 1) {
  if (nombre <= 0) return;
  ctx.save();
  ctx.strokeStyle = C.liane;
  ctx.lineWidth = Math.max(2.5, Math.min(5, vue.echelle * 3));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (C.nuit) {
    ctx.shadowColor = C.liane;
    ctx.shadowBlur = 8;
  }
  ctx.beginPath();
  for (let k = 0; k < nombre; k++) {
    const [x1, y1, x2, y2] = traits[k];
    const part = k === nombre - 1 ? dernierePart : 1;
    ctx.moveTo(...vue.ecran(x1, y1));
    ctx.lineTo(...vue.ecran(lerp(x1, x2, part), lerp(y1, y2, part)));
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = C.lianeClaire;
  for (let k = 0; k < nombre; k++) {
    if (k === nombre - 1 && dernierePart < 0.6) continue;
    const [x1, y1, x2, y2] = traits[k];
    const [ax, ay] = vue.ecran(x1, y1);
    const [bx, by] = vue.ecran(x2, y2);
    const longueur = Math.hypot(bx - ax, by - ay);
    if (longueur < 14) continue;
    const angle = Math.atan2(by - ay, bx - ax);
    const sens = k % 2 ? 1 : -1;
    const taille = Math.min(7, longueur * 0.16);
    const mx = (ax + bx) / 2 + Math.cos(angle + (sens * Math.PI) / 2) * taille * 0.8;
    const my = (ay + by) / 2 + Math.sin(angle + (sens * Math.PI) / 2) * taille * 0.8;
    ellipse(ctx, mx, my, taille, taille * 0.45, angle + sens * 0.6);
  }
  ctx.restore();
}

// Les bouts de branche (où pousseront les fleurs à la fin)
function boutsDesBranches(traits) {
  const compte = new Map();
  const coords = new Map();
  for (const trait of traits) {
    const [a, b] = cleDuTrait(trait).split('|');
    if (a === b) continue;
    for (const [cle, point] of [[a, [trait[0], trait[1]]], [b, [trait[2], trait[3]]]]) {
      compte.set(cle, (compte.get(cle) ?? 0) + 1);
      coords.set(cle, point);
    }
  }
  return [...compte.entries()].filter(([, n]) => n === 1).map(([cle]) => coords.get(cle)).slice(0, 120);
}

function dessinerFleurs(ctx, vue, points, p) {
  const r = Math.max(3, Math.min(7, vue.echelle * 4)) * rebond(Math.min(1, p));
  if (r <= 0) return;
  for (const [x, y] of points) {
    const [sx, sy] = vue.ecran(x, y);
    ctx.fillStyle = C.petale;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, sx + Math.cos(a) * r * 0.9, sy + Math.sin(a) * r * 0.9, r * 0.65, r * 0.65);
    }
    ctx.fillStyle = C.coeur;
    ellipse(ctx, sx, sy, r * 0.55, r * 0.55);
  }
}

function dessinerForet(ctx, vue, scene) {
  dessinerFond(ctx, vue);
  if (scene.modele) dessinerModele(ctx, vue, scene.modele);
  dessinerLiane(ctx, vue, scene.traits, scene.nombre, scene.dernierePart ?? 1);
  if (scene.fleurs) dessinerFleurs(ctx, vue, boutsDesBranches(scene.traits.slice(0, scene.nombre)), scene.fleurs);
  if (scene.pepin) {
    const { x, y, angle, humeur, saut = 0 } = scene.pepin;
    const [sx, sy] = vue.ecran(x, y);
    const radians = (angle * Math.PI) / 180;
    dessinerPepin(ctx, sx, sy - saut, 34, null, humeur, radians - Math.PI / 2, {
      fleche: true,
      regard: { dx: Math.sin(radians), dy: -Math.cos(radians) },
    });
  }
}

// --- Le lecteur de la forêt --------------------------------------------

export class LecteurForet extends LecteurBase {
  preparer({ niveau, modele }) {
    this.niveau = niveau;
    this.modele = modele?.traits ?? null;
    this.vueFixe = null;
  }

  taille() {
    const largeur = Math.min(this.place(), 760);
    return [largeur, Math.round(Math.min(460, Math.max(300, largeur * 0.72)))];
  }

  vuePour(points) {
    const [largeur, hauteur] = this.taille();
    this.dimensionner(largeur, hauteur);
    return calculerVue([...points, ...pointsDesTraits(this.modele ?? [])], largeur, hauteur);
  }

  afficher(etat, humeur = 'neutre') {
    this.etat = etat;
    const vue = this.vueFixe ? this.vuePour(this.pointsFixes) : this.vuePour([[etat.x, etat.y]]);
    dessinerForet(this.ctx, vue, {
      modele: this.modele,
      traits: etat.traits,
      nombre: etat.nbTraits,
      pepin: { x: etat.x, y: etat.y, angle: etat.angle, humeur },
    });
  }

  redessiner() {
    if (this.etat) this.afficher(this.etat);
  }

  commencer(etapes) {
    const final = etapes[etapes.length - 1].etat;
    this.pointsFixes = [...pointsDesTraits(final.traits.slice(0, final.nbTraits)), ...etapes.map((e) => [e.etat.x, e.etat.y])];
    this.vueFixe = true;
  }

  dessinerTransition(avant, apres, p) {
    const a = avant.etat;
    const b = apres.etat;
    const e = douceur(p);
    const vue = this.vuePour(this.pointsFixes);
    const virage = ((((b.angle - a.angle) % 360) + 540) % 360) - 180; // le plus court chemin
    const scene = {
      modele: this.modele,
      traits: b.traits,
      nombre: b.nbTraits,
      pepin: { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), angle: a.angle + virage * e, humeur: 'neutre' },
    };
    if (apres.evenement === 'pousser') scene.dernierePart = e;
    dessinerForet(this.ctx, vue, scene);
  }

  // Beaucoup d'étapes ? On accélère pour que le dessin ne dure pas des heures
  dureeEtape(etape, duree, total) {
    const base = Math.max(14, Math.min(duree, 11000 / total));
    return etape.evenement === 'pousser' ? base : base * 0.6;
  }

  async celebrer() {
    const jeton = ++this.jeton;
    const etat = this.etat;
    await this.animer(1300, jeton, (p) => {
      const vue = this.vuePour(this.pointsFixes ?? [[etat.x, etat.y]]);
      dessinerForet(this.ctx, vue, {
        modele: this.modele,
        traits: etat.traits,
        nombre: etat.nbTraits,
        fleurs: p,
        pepin: { x: etat.x, y: etat.y, angle: etat.angle, humeur: 'content', saut: Math.abs(Math.sin(p * Math.PI * 2)) * 8 },
      });
    });
  }
}

// Un dessin en miniature (cartes des mondes, éditeur)
export function dessinerApercuForet(canvas, traits) {
  const largeur = canvas.clientWidth;
  const hauteur = canvas.clientHeight;
  const ctx = preparerCanvas(canvas, largeur, hauteur);
  const vue = calculerVue(pointsDesTraits(traits ?? []), largeur, hauteur, 12);
  dessinerFond(ctx, vue);
  dessinerLiane(ctx, vue, traits ?? [], traits?.length ?? 0);
  dessinerFleurs(ctx, vue, boutsDesBranches(traits ?? []), 1);
}
