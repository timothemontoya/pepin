// =============================================================
//  rendu.js — Dessiner Pépin et le jardin (avec un <canvas>)
// =============================================================
//
//  Ce fichier contient aussi ce qui sert aux autres décors :
//  les couleurs (de jour et de nuit), Pépin lui-même, et la classe
//  LecteurBase qui sait jouer une animation image par image.
//  Les décors de la serre et de la forêt sont dans rendu-serre.js
//  et rendu-foret.js.
// =============================================================

import { DIRECTIONS } from './jardin.js';

const JOUR = {
  nuit: false,
  herbe1: '#C6E7B7',
  herbe2: '#B8DFA9',
  terre: '#C99A6B',
  terreFonce: '#9F724A',
  rocher: '#BDB7AC',
  rocherClair: '#DAD5CB',
  rocherFonce: '#958E82',
  encre: '#2F4A3A',
  contour: '#2F4A3A',
  corps: '#FBF8F1',
  ecran: '#2F4A3A',
  yeux: '#8FF0C0',
  joues: '#FFB3A7',
  feuille: '#5DB97F',
  petale: '#FF8A7A',
  coeur: '#FFD66B',
  eau: '#62B8EC',
  luciole: null,
  survol: '#2F4A3A',
  // la serre
  mur: '#FBF3E4',
  murMotif: '#F4E8D2',
  bois: '#C8955F',
  boisFonce: '#A97A47',
  pot: '#D9825B',
  potBord: '#C46A44',
  terreau: '#7A5638',
  tige: '#4FAF80',
  texte: '#2F4A3A',
  texteDoux: '#8A9A8F',
  drapeau: '#E0A030',
  lueur: 'rgba(255, 214, 107, 0.55)',
  bulle: '#FFFFFF',
  // la forêt
  papier: '#F8F2E3',
  quadrillage: '#E9DFC6',
  modele: '#C2B48F',
  liane: '#3E9A68',
  lianeClaire: '#6CC08B',
};

const NUIT = {
  ...JOUR,
  nuit: true,
  herbe1: '#2B4A3A',
  herbe2: '#264234',
  terre: '#7C5A3C',
  terreFonce: '#5C4029',
  rocher: '#5A6670',
  rocherClair: '#7C8892',
  rocherFonce: '#3F4950',
  encre: '#13201A',
  contour: '#93BFA6',
  corps: '#E9EEE6',
  ecran: '#13201A',
  yeux: '#9BFFD0',
  joues: '#E8968A',
  feuille: '#58C285',
  petale: '#FF9A8A',
  coeur: '#FFE07A',
  eau: '#7FD0FF',
  luciole: '#F6F2A0',
  survol: '#E6F2EA',
  mur: '#1A2620',
  murMotif: '#1F2D26',
  bois: '#7A5636',
  boisFonce: '#5E4128',
  pot: '#B76B49',
  potBord: '#9A5638',
  terreau: '#4A3423',
  tige: '#58C285',
  texte: '#E3F1E8',
  texteDoux: '#8FA79A',
  drapeau: '#F2C15A',
  lueur: 'rgba(255, 224, 122, 0.35)',
  bulle: '#24342B',
  papier: '#132019',
  quadrillage: '#1A2A21',
  modele: '#44604F',
  liane: '#7EE0A6',
  lianeClaire: '#B4F5CC',
};

// Les couleurs du moment (on remplit cet objet avec JOUR ou NUIT)
export const C = { ...JOUR };

export function definirNuit(nuit) {
  Object.assign(C, nuit ? NUIT : JOUR);
}

// --- Petits outils de dessin -----------------------------------

export function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rotation, 0, Math.PI * 2);
  ctx.fill();
}

export function rectArrondi(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const douceur = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const rebond = (t) => {
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

// Un nombre « au hasard » mais toujours le même pour une case donnée
const hasard = (x, y, graine = 1) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + graine * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

// Prépare un canvas net sur les écrans haute définition
export function preparerCanvas(canvas, largeur, hauteur) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${largeur}px`;
  canvas.style.height = `${hauteur}px`;
  canvas.width = Math.round(largeur * dpr);
  canvas.height = Math.round(hauteur * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// --- Les cases --------------------------------------------------

function dessinerRocher(ctx, cx, cy, t) {
  ctx.fillStyle = C.rocherFonce;
  ellipse(ctx, cx, cy + t * 0.12, t * 0.36, t * 0.24);
  ctx.fillStyle = C.rocher;
  ellipse(ctx, cx, cy + t * 0.04, t * 0.34, t * 0.25);
  ctx.fillStyle = C.rocherClair;
  ellipse(ctx, cx - t * 0.11, cy - t * 0.06, t * 0.1, t * 0.06, -0.3);
}

function dessinerGraine(ctx, cx, cy, t) {
  ctx.fillStyle = C.terre;
  ellipse(ctx, cx, cy + t * 0.14, t * 0.26, t * 0.13);
  ctx.fillStyle = C.terreFonce;
  ellipse(ctx, cx, cy + t * 0.08, t * 0.06, t * 0.09, 0.4);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ellipse(ctx, cx - t * 0.015, cy + t * 0.05, t * 0.015, t * 0.03, 0.4);
}

export function dessinerFleur(ctx, cx, cy, t, eclosion = 1, avecTerre = true, couleur = null) {
  if (avecTerre) {
    ctx.fillStyle = C.terre;
    ellipse(ctx, cx, cy + t * 0.2, t * 0.2, t * 0.09);
  }

  ctx.save();
  ctx.translate(cx, cy + t * 0.2);
  ctx.scale(eclosion, eclosion);
  ctx.strokeStyle = C.feuille;
  ctx.lineWidth = t * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -t * 0.3);
  ctx.stroke();
  ctx.fillStyle = C.feuille;
  ellipse(ctx, -t * 0.08, -t * 0.12, t * 0.08, t * 0.04, -0.5);
  ellipse(ctx, t * 0.08, -t * 0.16, t * 0.08, t * 0.04, 0.5);
  ctx.fillStyle = couleur ?? C.petale;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ellipse(ctx, Math.cos(a) * t * 0.09, -t * 0.34 + Math.sin(a) * t * 0.09, t * 0.07, t * 0.07);
  }
  ctx.fillStyle = C.coeur;
  ellipse(ctx, 0, -t * 0.34, t * 0.06, t * 0.06);
  ctx.restore();
}

function dessinerLuciole(ctx, x, y, rayon) {
  ctx.save();
  ctx.shadowColor = C.luciole;
  ctx.shadowBlur = rayon * 4;
  ctx.fillStyle = C.luciole;
  ellipse(ctx, x, y, rayon, rayon);
  ctx.restore();
}

function dessinerCase(ctx, type, x, y, t, eclosion) {
  const px = x * t;
  const py = y * t;
  ctx.fillStyle = (x + y) % 2 ? C.herbe1 : C.herbe2;
  ctx.fillRect(px, py, t, t);
  const cx = px + t / 2;
  const cy = py + t / 2;
  if (type === 'rocher') dessinerRocher(ctx, cx, cy, t);
  else if (type === 'graine') dessinerGraine(ctx, cx, cy, t);
  else if (type === 'fleur') dessinerFleur(ctx, cx, cy, t, eclosion);
  else if (C.luciole && hasard(x, y) < 0.22) {
    // la nuit, quelques lucioles se promènent dans l'herbe
    dessinerLuciole(ctx, px + t * (0.2 + 0.6 * hasard(x, y, 2)), py + t * (0.2 + 0.6 * hasard(x, y, 3)), Math.max(1.2, t * 0.03));
  }
}

// --- Pépin ! ----------------------------------------------------
//
//  direction : 0 à 3 (jardin), ou null
//  humeur    : 'neutre', 'content', 'oups' ou 'cligne'
//  angle     : l'angle de la petite flèche, en radians (null : selon la direction)
//  options   : { fleche: false } pour cacher la flèche,
//              { regard: { dx, dy } } pour choisir où regardent les yeux

export function dessinerPepin(ctx, cx, cy, taille, direction, humeur = 'neutre', angle = null, options = {}) {
  const u = taille / 100;
  const aUneDirection = direction !== null && direction !== undefined;
  const regard = options.regard ?? (aUneDirection ? DIRECTIONS[direction] : { dx: 0, dy: 0 });
  const avecFleche = options.fleche ?? (aUneDirection || angle !== null);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ombre
  ctx.fillStyle = C.nuit ? 'rgba(0,0,0,.35)' : 'rgba(47,74,58,.18)';
  ellipse(ctx, 0, 34 * u, 26 * u, 7 * u);

  // roues
  ctx.fillStyle = C.contour;
  rectArrondi(ctx, -22 * u, 21 * u, 14 * u, 11 * u, 4 * u);
  ctx.fill();
  rectArrondi(ctx, 8 * u, 21 * u, 14 * u, 11 * u, 4 * u);
  ctx.fill();

  // antenne-pousse
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(0, -27 * u);
  ctx.quadraticCurveTo(2 * u, -36 * u, 0, -41 * u);
  ctx.stroke();
  ctx.fillStyle = C.feuille;
  ellipse(ctx, -7 * u, -43 * u, 8 * u, 4.5 * u, 0.5);
  ellipse(ctx, 7 * u, -45 * u, 8 * u, 4.5 * u, -0.5);

  // corps
  ctx.fillStyle = C.corps;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 3.5 * u;
  rectArrondi(ctx, -30 * u, -28 * u, 60 * u, 54 * u, 18 * u);
  ctx.fill();
  ctx.stroke();

  // écran
  ctx.fillStyle = C.ecran;
  rectArrondi(ctx, -22 * u, -20 * u, 44 * u, 27 * u, 10 * u);
  ctx.fill();

  // yeux (ils brillent un peu la nuit)
  const ox = regard.dx * 4 * u;
  const oy = regard.dy * 3 * u;
  ctx.save();
  if (C.nuit) {
    ctx.shadowColor = C.yeux;
    ctx.shadowBlur = 8 * u;
  }
  ctx.strokeStyle = C.yeux;
  ctx.fillStyle = C.yeux;
  ctx.lineWidth = 3 * u;
  if (humeur === 'content') {
    for (const sens of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sens * 9 * u + ox, -4 * u + oy, 5 * u, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else if (humeur === 'oups') {
    for (const sens of [-1, 1]) {
      const x = sens * 9 * u;
      ctx.beginPath();
      ctx.moveTo(x - sens * 4 * u, -11 * u);
      ctx.lineTo(x + sens * 3 * u, -6 * u);
      ctx.lineTo(x - sens * 4 * u, -1 * u);
      ctx.stroke();
    }
  } else if (humeur === 'cligne') {
    for (const sens of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sens * 9 * u + ox - 4 * u, -6 * u + oy);
      ctx.lineTo(sens * 9 * u + ox + 4 * u, -6 * u + oy);
      ctx.stroke();
    }
  } else {
    ellipse(ctx, -9 * u + ox, -6 * u + oy, 4 * u, 6 * u);
    ellipse(ctx, 9 * u + ox, -6 * u + oy, 4 * u, 6 * u);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ellipse(ctx, -8 * u + ox, -8.5 * u + oy, 1.4 * u, 1.4 * u);
    ellipse(ctx, 10 * u + ox, -8.5 * u + oy, 1.4 * u, 1.4 * u);
  }
  ctx.restore();

  // joues et sourire
  ctx.fillStyle = C.joues;
  ellipse(ctx, -20 * u, 15 * u, 4.5 * u, 3.5 * u);
  ellipse(ctx, 20 * u, 15 * u, 4.5 * u, 3.5 * u);
  ctx.strokeStyle = C.encre;
  ctx.lineWidth = 2.5 * u;
  ctx.beginPath();
  if (humeur === 'oups') ctx.arc(0, 19 * u, 4 * u, Math.PI * 1.15, Math.PI * 1.85);
  else ctx.arc(0, 12 * u, 5 * u, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // la flèche qui montre où Pépin regarde (par-dessus tout le reste,
  // pour qu'on la voie même quand il regarde vers le haut)
  if (avecFleche && (angle !== null || aUneDirection)) {
    const a = angle ?? (direction * Math.PI) / 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = C.yeux;
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath();
    ctx.moveTo(48 * u, 0);
    ctx.lineTo(38 * u, -8 * u);
    ctx.lineTo(38 * u, 8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Dessine un Pépin de face dans un petit canvas (bulle, victoire, logo)
export function dessinerPortrait(canvas, humeur = 'neutre') {
  const taille = canvas.clientWidth || canvas.width;
  const ctx = preparerCanvas(canvas, taille, taille);
  ctx.clearRect(0, 0, taille, taille);
  dessinerPepin(ctx, taille / 2, taille * 0.55, taille * 0.95, null, humeur, null, { fleche: false });
}

// Un Pépin de face qui cligne des yeux de temps en temps (accueil)
export function animerPortrait(canvas) {
  let humeur = 'neutre';
  const dessiner = () => dessinerPortrait(canvas, humeur);
  dessiner();
  const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduit) return { redessiner: dessiner, humeur: (h) => { humeur = h; dessiner(); } };
  const cligner = () => {
    if (humeur === 'neutre') {
      humeur = 'cligne';
      dessiner();
      setTimeout(() => {
        if (humeur === 'cligne') humeur = 'neutre';
        dessiner();
      }, 140);
    }
    setTimeout(cligner, 2500 + Math.random() * 3000);
  };
  setTimeout(cligner, 1800);
  return {
    redessiner: dessiner,
    humeur: (h) => {
      humeur = h;
      dessiner();
    },
  };
}

// --- Aperçus et éditeur -------------------------------------------

// Dessine un jardin en miniature, centré dans le canvas
export function dessinerApercu(canvas, etat) {
  const largeur = canvas.clientWidth;
  const hauteur = canvas.clientHeight;
  const ctx = preparerCanvas(canvas, largeur, hauteur);
  const t = Math.min(largeur / etat.largeur, hauteur / etat.hauteur);
  ctx.translate((largeur - t * etat.largeur) / 2, (hauteur - t * etat.hauteur) / 2);
  for (let y = 0; y < etat.hauteur; y++) {
    for (let x = 0; x < etat.largeur; x++) {
      dessinerCase(ctx, etat.cases[y][x], x, y, t, 1);
    }
  }
  const { x, y, direction } = etat.robot;
  dessinerPepin(ctx, (x + 0.5) * t, (y + 0.5) * t, t * 0.9, direction);
}

// --- La carte postale d'un monde « jardin » (accueil) -----------------
//
//  Les cartes des niveaux sont pleines de murs : parfait pour jouer,
//  pas pour faire envie ! Pour la vitrine d'un monde, on dessine plutôt
//  un pré fleuri où Pépin arrose une graine. Chaque monde a sa variante
//  (le « hasard » dépend de son nom), toujours la même.

const COULEURS_DES_FLEURS = ['#FF8A7A', '#FFB84D', '#B48CF0', '#FF7EB6', '#7FC8F8'];

function nombreDuNom(nom) {
  let n = 7;
  for (const lettre of nom) n = (n * 31 + lettre.charCodeAt(0)) % 997;
  return n + 1;
}

function dessinerPapillon(ctx, x, y, taille, couleur, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = couleur;
  ellipse(ctx, -taille * 0.55, -taille * 0.3, taille * 0.6, taille * 0.45, -0.5);
  ellipse(ctx, taille * 0.55, -taille * 0.3, taille * 0.6, taille * 0.45, 0.5);
  ellipse(ctx, -taille * 0.4, taille * 0.35, taille * 0.4, taille * 0.32, 0.4);
  ellipse(ctx, taille * 0.4, taille * 0.35, taille * 0.4, taille * 0.32, -0.4);
  ctx.fillStyle = C.encre;
  ellipse(ctx, 0, 0, taille * 0.13, taille * 0.55);
  ctx.restore();
}

export function dessinerVitrineJardin(canvas, nom = 'pepin') {
  const largeur = canvas.clientWidth;
  const hauteur = canvas.clientHeight;
  const ctx = preparerCanvas(canvas, largeur, hauteur);
  const rangees = 3;
  const t = hauteur / rangees;
  const colonnes = Math.ceil(largeur / t);
  const graine = nombreDuNom(nom);
  // Pépin, un peu à gauche, et la graine qu'il arrose juste devant lui
  const px = Math.max(1, Math.floor(colonnes * 0.36));
  const py = 1;
  const pres = (x, y) => (y === py && x >= px - 1 && x <= px + 1) || (y === py - 1 && x === px);

  for (let y = 0; y < rangees; y++) {
    for (let x = 0; x < colonnes; x++) dessinerCase(ctx, 'herbe', x, y, t, 1);
  }
  for (let y = 0; y < rangees; y++) {
    for (let x = 0; x < colonnes; x++) {
      if (pres(x, y)) continue;
      const h = hasard(x, y, graine);
      const cx = (x + 0.5) * t;
      const cy = (y + 0.5) * t;
      if (h < 0.4) {
        const couleur = COULEURS_DES_FLEURS[Math.floor(hasard(x, y, graine + 2) * COULEURS_DES_FLEURS.length)];
        dessinerFleur(ctx, cx, cy, t, 0.8 + hasard(x, y, graine + 1) * 0.3, true, couleur);
      } else if (h < 0.46) {
        dessinerGraine(ctx, cx, cy, t);
      } else if (h < 0.49) {
        dessinerRocher(ctx, cx, cy + t * 0.06, t * 0.75);
      }
    }
  }

  // la graine arrosée, les gouttes, et Pépin tout content
  dessinerGraine(ctx, (px + 1.5) * t, (py + 0.5) * t, t);
  ctx.fillStyle = C.eau;
  for (let k = 0; k < 3; k++) {
    ellipse(ctx, (px + 1.3 + k * 0.2) * t, (py + 0.08 + (k % 2) * 0.14) * t, t * 0.04, t * 0.065);
  }
  dessinerPepin(ctx, (px + 0.5) * t, (py + 0.45) * t, t * 0.95, 1, 'content');

  // de jour, des papillons ; la nuit, les lucioles suffisent
  if (!C.nuit) {
    for (let i = 0; i < 2; i++) {
      const x = largeur * (0.55 + 0.35 * hasard(i, 1, graine + 5));
      const y = t * (0.3 + 0.6 * hasard(i, 2, graine + 6));
      const couleur = COULEURS_DES_FLEURS[(i * 2 + graine) % COULEURS_DES_FLEURS.length];
      dessinerPapillon(ctx, x, y, t * 0.17, couleur, (hasard(i, 3, graine) - 0.5) * 0.8);
    }
  }
}

//  Pour l'éditeur, on dessine directement la carte texte (et pas un
//  Jardin) : pendant qu'on la crée, elle peut être « fausse » (deux
//  Pépins, aucun Pépin…) et il faut quand même pouvoir l'afficher.
const CASES = { '.': 'herbe', '#': 'rocher', 'o': 'graine', '*': 'fleur' };
const PEPINS = { '^': 0, '>': 1, 'v': 2, '<': 3 };

function dessinerSymbole(ctx, symbole, x, y, t) {
  dessinerCase(ctx, CASES[symbole] ?? 'herbe', x, y, t, 1);
  if (symbole in PEPINS) dessinerPepin(ctx, (x + 0.5) * t, (y + 0.5) * t, t * 0.9, PEPINS[symbole]);
}

// Renvoie la taille d'une case en pixels (pour savoir où on clique)
export function dessinerCarte(canvas, carte, { survol = null, tailleMax = 60 } = {}) {
  const hauteur = carte.length;
  const largeur = Math.max(...carte.map((ligne) => ligne.length));
  const place = canvas.parentElement.clientWidth;
  const t = Math.max(18, Math.min(tailleMax, Math.floor(place / largeur)));
  const ctx = preparerCanvas(canvas, t * largeur, t * hauteur);

  carte.forEach((ligne, y) => {
    for (let x = 0; x < largeur; x++) dessinerSymbole(ctx, ligne[x] ?? '.', x, y, t);
  });

  if (survol) {
    ctx.strokeStyle = C.survol;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(survol.x * t + 2, survol.y * t + 2, t - 4, t - 4);
  }
  return t;
}

// Une petite case toute seule (boutons de la palette)
export function dessinerIcone(canvas, symbole, taille = 34) {
  const ctx = preparerCanvas(canvas, taille, taille);
  dessinerSymbole(ctx, symbole, 0, 0, taille);
}

// --- La base de tous les lecteurs d'animation ----------------------

export class LecteurBase {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.jeton = 0; // change à chaque nouvelle animation, pour arrêter l'ancienne
    this.etat = null;
  }

  place() {
    return Math.max(220, this.canvas.parentElement.clientWidth);
  }

  dimensionner(largeur, hauteur) {
    this.ctx = preparerCanvas(this.canvas, largeur, hauteur);
    this.largeur = largeur;
    this.hauteur = hauteur;
  }

  arreter() {
    this.jeton++;
  }

  animer(duree, jeton, dessinerImage) {
    return new Promise((resolve) => {
      const debut = performance.now();
      const image = (maintenant) => {
        if (jeton !== this.jeton) return resolve();
        const p = duree <= 0 ? 1 : Math.min(1, (maintenant - debut) / duree);
        dessinerImage(p);
        if (p < 1) requestAnimationFrame(image);
        else resolve();
      };
      requestAnimationFrame(image);
    });
  }

  // Joue toutes les étapes. Renvoie false si on a été interrompu.
  async jouer(etapes, { duree, surEtape }) {
    const jeton = ++this.jeton;
    this.commencer(etapes);
    this.afficher(etapes[0].etat);
    for (let i = 1; i < etapes.length; i++) {
      if (jeton !== this.jeton) return false;
      surEtape?.(etapes[i], i);
      await this.animer(this.dureeEtape(etapes[i], duree, etapes.length), jeton,
        (p) => this.dessinerTransition(etapes[i - 1], etapes[i], p));
      this.etat = etapes[i].etat;
    }
    return jeton === this.jeton;
  }

  // Le mode pas à pas : on affiche le départ, puis une étape par clic
  debuter(etapes) {
    this.jeton++;
    this.commencer(etapes);
    this.afficher(etapes[0].etat);
  }

  async jouerUneEtape(avant, apres, duree) {
    const jeton = ++this.jeton;
    await this.animer(duree, jeton, (p) => this.dessinerTransition(avant, apres, p));
    if (jeton !== this.jeton) return false;
    this.etat = apres.etat;
    return true;
  }

  commencer() {}

  dureeEtape(etape, duree) {
    return duree;
  }
}

// --- Le lecteur du jardin ------------------------------------------

export class LecteurJardin extends LecteurBase {
  preparer() {}

  dimensionnerPour(etat) {
    this.t = Math.max(24, Math.min(72, Math.floor(this.place() / etat.largeur)));
    this.dimensionner(this.t * etat.largeur, this.t * etat.hauteur);
  }

  afficher(etat, humeur = 'neutre') {
    this.etat = etat;
    this.dimensionnerPour(etat);
    const { x, y, direction } = etat.robot;
    this.dessiner(etat, { x, y, direction, humeur });
  }

  redessiner() {
    if (this.etat) this.afficher(this.etat);
  }

  dessiner(etat, robot, effets = {}) {
    const { ctx, t } = this;
    ctx.clearRect(0, 0, etat.largeur * t, etat.hauteur * t);
    for (let y = 0; y < etat.hauteur; y++) {
      for (let x = 0; x < etat.largeur; x++) {
        const eclot = effets.eclosion && effets.eclosion.x === x && effets.eclosion.y === y;
        dessinerCase(ctx, etat.cases[y][x], x, y, t, eclot ? effets.eclosion.valeur : 1);
      }
    }

    const decalage = effets.decalage ?? { x: 0, y: 0 };
    const cx = (robot.x + 0.5) * t + decalage.x;
    const cy = (robot.y + 0.5) * t + decalage.y;
    dessinerPepin(ctx, cx, cy, t * 0.9, robot.direction, robot.humeur, robot.angle ?? null);

    if (effets.arrosage !== undefined) this.dessinerGouttes(cx, cy, effets.arrosage, effets.eclosion);
  }

  dessinerGouttes(cx, cy, p, aFleuri) {
    const { ctx, t } = this;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = C.eau;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * t * 0.22;
      const y = cy - t * 0.55 + p * t * 0.35 + (i % 2) * t * 0.08;
      ellipse(ctx, x, y, t * 0.035, t * 0.055);
    }
    // une petite pluie de pétales quand la fleur pousse
    if (aFleuri) {
      ctx.fillStyle = C.petale;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = t * (0.2 + p * 0.35);
        ellipse(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, t * 0.04, t * 0.04);
      }
    }
    ctx.restore();
  }

  commencer(etapes) {
    this.dimensionnerPour(etapes[0].etat);
  }

  dessinerTransition(avant, apres, p) {
    const a = avant.etat.robot;
    const b = apres.etat.robot;
    const e = douceur(p);
    const ecart = ((b.direction - a.direction + 6) % 4) - 2; // -1, 0 ou 1
    const robot = {
      x: lerp(a.x, b.x, e),
      y: lerp(a.y, b.y, e),
      direction: p < 0.5 ? a.direction : b.direction,
      angle: ((a.direction + ecart * e) * Math.PI) / 2 - Math.PI / 2,
      humeur: 'neutre',
    };
    const effets = {};

    if (apres.evenement === 'bonk') {
      const d = DIRECTIONS[b.direction];
      const k = Math.sin(p * Math.PI) * 0.18 * this.t;
      effets.decalage = { x: d.dx * k, y: d.dy * k };
      if (p > 0.4) robot.humeur = 'oups';
    } else if (apres.evenement === 'arroser') {
      effets.arrosage = p;
      effets.eclosion = { x: b.x, y: b.y, valeur: Math.max(0, rebond(p)) };
    } else if (apres.evenement === 'arroser-rien') {
      effets.arrosage = p;
    }

    this.dessiner(apres.etat, robot, effets);
  }

  // Deux petits sauts de joie
  async celebrer() {
    const jeton = ++this.jeton;
    const etat = this.etat;
    const { x, y, direction } = etat.robot;
    await this.animer(900, jeton, (p) => {
      const saut = Math.abs(Math.sin(p * Math.PI * 2)) * 0.18 * this.t;
      this.dessiner(etat, { x, y, direction, humeur: 'content' }, { decalage: { x: 0, y: -saut } });
    });
  }
}
