// =============================================================
//  rendu-serre.js — Dessiner la serre : l'étagère et ses pots
// =============================================================
//
//  Chaque pot est un élément de la liste. Son numéro (son INDEX)
//  est écrit en dessous, à partir de 0 comme en Python. La hauteur
//  de la plante est écrite sur le pot.
// =============================================================

import {
  C, LecteurBase, dessinerPepin, ellipse, rectArrondi, lerp, douceur, rebond, preparerCanvas,
} from './rendu.js';

const HAUTEUR_SCENE = 320;
const POLICE = '"Fredoka", "Nunito", sans-serif';

// Où se trouve chaque pot (pour une étagère de `nbPots` pots au plus)
function miseEnPage(largeur, hauteur, nbPots, hMax, compact = false) {
  const nb = Math.max(nbPots, compact ? 1 : 3);
  const slot = Math.min(compact ? 46 : 88, (largeur - (compact ? 16 : 48)) / nb);
  const gauche = (largeur - slot * nbPots) / 2;
  const planche = hauteur - (compact ? 16 : 96);
  const potH = Math.min(slot * 0.62, compact ? 26 : 50);
  const potW = Math.min(slot * 0.74, compact ? 32 : 56);
  const unite = (planche - potH - (compact ? 10 : 30)) / Math.max(hMax, 1);
  return { slot, gauche, planche, potH, potW, unite, largeur, hauteur, compact, x: (i) => gauche + slot * (i + 0.5) };
}

function dessinerFond(ctx, vue) {
  ctx.fillStyle = C.mur;
  ctx.fillRect(0, 0, vue.largeur, vue.hauteur);
  // un papier peint à rayures, très doux
  ctx.fillStyle = C.murMotif;
  for (let x = 0; x < vue.largeur; x += 28) ctx.fillRect(x, 0, 12, vue.hauteur);
  // la planche
  const debut = vue.gauche - 18;
  const fin = vue.largeur - vue.gauche + 18;
  ctx.fillStyle = C.bois;
  rectArrondi(ctx, debut, vue.planche, fin - debut, vue.compact ? 6 : 12, 3);
  ctx.fill();
  ctx.fillStyle = C.boisFonce;
  ctx.fillRect(debut + 4, vue.planche + (vue.compact ? 6 : 12), fin - debut - 8, vue.compact ? 2 : 4);
}

// Une plante dans son pot. `hauteur` peut être décimale (pendant qu'elle pousse)
function dessinerPot(ctx, vue, x, hauteur, options = {}) {
  const { potW, potH, planche, unite } = vue;
  const haut = planche - potH + (options.dy ?? 0);
  const bas = planche + (options.dy ?? 0);
  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;

  if (options.lueur) {
    ctx.save();
    ctx.globalAlpha = (options.alpha ?? 1) * options.lueur;
    ctx.fillStyle = C.lueur;
    ellipse(ctx, x, haut - Math.max(1, hauteur) * unite * 0.5, potW * 0.95, (Math.max(1, hauteur) * unite) / 2 + potH);
    ctx.restore();
  }

  // la tige et ses feuilles
  const sommet = haut - hauteur * unite;
  if (hauteur > 0) {
    ctx.strokeStyle = C.tige;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, potW * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, haut);
    ctx.lineTo(x, sommet);
    ctx.stroke();
    ctx.fillStyle = C.feuille;
    const taille = Math.max(2.5, Math.min(9, unite * 0.42, potW * 0.17));
    for (let k = 1; k <= Math.floor(hauteur); k++) {
      const sens = k % 2 ? 1 : -1;
      const y = haut - (k - 0.5) * unite;
      ellipse(ctx, x + sens * taille * 0.9, y, taille, taille * 0.5, sens * -0.5);
    }
    // un petit bouton de fleur au sommet
    const r = Math.max(2.5, potW * 0.09) * (options.fleur ?? 1);
    ctx.fillStyle = C.petale;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, x + Math.cos(a) * r * 0.9, sommet + Math.sin(a) * r * 0.9, r * 0.7, r * 0.7);
    }
    ctx.fillStyle = C.coeur;
    ellipse(ctx, x, sommet, r * 0.6, r * 0.6);
  }

  // le pot
  ctx.fillStyle = C.terreau;
  ellipse(ctx, x, haut + potH * 0.08, potW * 0.42, potH * 0.1);
  ctx.fillStyle = C.pot;
  ctx.beginPath();
  ctx.moveTo(x - potW * 0.48, haut + potH * 0.12);
  ctx.lineTo(x + potW * 0.48, haut + potH * 0.12);
  ctx.lineTo(x + potW * 0.36, bas);
  ctx.lineTo(x - potW * 0.36, bas);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.potBord;
  rectArrondi(ctx, x - potW * 0.52, haut, potW * 1.04, potH * 0.2, 3);
  ctx.fill();

  // la hauteur, écrite sur le pot
  if (!vue.compact) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${Math.round(potH * 0.42)}px ${POLICE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(hauteur)), x, haut + potH * 0.6);
  }
  ctx.restore();
}

function dessinerDrapeau(ctx, vue, x, hauteur, atteint) {
  const y = vue.planche - vue.potH - hauteur * vue.unite;
  ctx.save();
  ctx.strokeStyle = atteint ? C.tige : C.drapeau;
  ctx.fillStyle = atteint ? C.tige : C.drapeau;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x - vue.potW * 0.45, y);
  ctx.lineTo(x + vue.potW * 0.45, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x + vue.potW * 0.45, y);
  ctx.lineTo(x + vue.potW * 0.45, y - 12);
  ctx.lineTo(x + vue.potW * 0.45 + 9, y - 8);
  ctx.lineTo(x + vue.potW * 0.45, y - 4);
  ctx.fill();
  ctx.restore();
}

function dessinerBulle(ctx, vue, x, y, texte, p) {
  ctx.save();
  ctx.font = `600 16px ${POLICE}`;
  const largeur = ctx.measureText(texte).width + 22;
  const aDroite = x + 34 + largeur < vue.largeur - 6;
  const bx = aDroite ? x + 30 : x - 30 - largeur;
  const by = y - 34;
  ctx.translate(aDroite ? bx : bx + largeur, by + 15);
  ctx.scale(rebond(Math.min(1, p)), rebond(Math.min(1, p)));
  ctx.translate(-(aDroite ? bx : bx + largeur), -(by + 15));
  ctx.fillStyle = C.bulle;
  ctx.strokeStyle = C.texte;
  ctx.lineWidth = 2;
  rectArrondi(ctx, bx, by, largeur, 30, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.texte;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texte, bx + largeur / 2, by + 16);
  ctx.restore();
}

function dessinerCroix(ctx, vue, x) {
  ctx.save();
  ctx.strokeStyle = '#E25C4B';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const y = vue.planche - vue.potH * 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 10);
  ctx.lineTo(x + 10, y + 10);
  ctx.moveTo(x + 10, y - 10);
  ctx.lineTo(x - 10, y + 10);
  ctx.stroke();
  ctx.restore();
}

// Dessine toute la scène. `scene` décrit ce qui bouge en ce moment.
function dessinerSerre(ctx, vue, scene) {
  dessinerFond(ctx, vue);
  const pots = scene.pots;

  // les drapeaux de l'objectif (où doivent arriver les plantes)
  if (scene.cible) {
    scene.cible.forEach((hauteur, i) => dessinerDrapeau(ctx, vue, vue.x(i), hauteur, pots[i] === hauteur));
  }

  pots.forEach((hauteur, i) => {
    if (scene.echange && (i === scene.echange.i || i === scene.echange.j)) return;
    const options = { fleur: scene.fleurs ?? 1 };
    if (scene.regard?.i === i) options.lueur = scene.regard.p;
    if (scene.apparition?.i === i) {
      options.alpha = scene.apparition.p;
      options.dy = (1 - scene.apparition.p) * 24;
    }
    if (scene.disparition?.i === i) {
      options.alpha = 1 - scene.disparition.p;
      options.dy = scene.disparition.p * 24;
    }
    const h = scene.croissance?.i === i ? scene.croissance.hauteur : hauteur;
    dessinerPot(ctx, vue, vue.x(i), h, options);
  });

  // deux pots qui échangent leur place, en sautant l'un par-dessus l'autre
  if (scene.echange) {
    const { i, j, p } = scene.echange;
    const e = douceur(p);
    dessinerPot(ctx, vue, lerp(vue.x(j), vue.x(i), e), pots[j], { dy: -Math.sin(Math.PI * e) * 18 });
    dessinerPot(ctx, vue, lerp(vue.x(i), vue.x(j), e), pots[i], { dy: -Math.sin(Math.PI * e) * 46 });
  }

  if (scene.arrosage) {
    const { i, p } = scene.arrosage;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = C.eau;
    const x = vue.x(i);
    for (let k = 0; k < 3; k++) {
      ellipse(ctx, x + (k - 1) * 9, vue.planche - vue.potH - 60 + p * 40 + (k % 2) * 8, 3, 5);
    }
    ctx.restore();
  }

  if (scene.croix !== undefined) dessinerCroix(ctx, vue, vue.x(Math.max(-0.5, Math.min(scene.croix, pots.length))));

  if (vue.compact) return;

  // les numéros des pots (les index !)
  ctx.save();
  ctx.font = `600 15px ${POLICE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.texteDoux;
  const yNumeros = vue.planche + 30;
  for (let i = 0; i < Math.max(pots.length, scene.cible?.length ?? 0); i++) {
    ctx.fillText(`${i}`, vue.x(i), yNumeros);
  }
  ctx.font = `600 12px ${POLICE}`;
  ctx.textAlign = 'right';
  ctx.fillText('n°', vue.gauche - 6, yNumeros);
  ctx.restore();

  // Pépin, qui regarde les pots
  if (scene.pepin) {
    const { position, humeur, secousse = 0 } = scene.pepin;
    const x = lerp(vue.x(0), vue.x(1), position) + secousse;
    const y = vue.hauteur - 34;
    dessinerPepin(ctx, x, y, 50, null, humeur, null, { fleche: false, regard: { dx: 0, dy: -1 } });
    if (scene.bulle) dessinerBulle(ctx, vue, x, y, scene.bulle.texte, scene.bulle.p);
  }
}

// Les dimensions qui ne changent pas pendant toute l'animation
function bornes(etats, essai) {
  let nbPots = essai?.cible?.length ?? 0;
  let hMax = 6;
  for (const etat of etats) {
    nbPots = Math.max(nbPots, etat.pots.length);
    hMax = Math.max(hMax, ...etat.pots);
  }
  for (const h of essai?.cible ?? []) hMax = Math.max(hMax, h);
  return { nbPots: Math.max(1, nbPots), hMax: hMax + 1 };
}

const texteReponse = (valeur) => `Réponse : ${valeur}`;

// --- Le lecteur de la serre ------------------------------------------

export class LecteurSerre extends LecteurBase {
  preparer({ niveau, essai }) {
    this.niveau = niveau;
    this.essai = essai;
    this.bornesFixes = null;
  }

  dimensionnerScene(lesBornes) {
    const largeur = Math.min(this.place(), 760);
    this.dimensionner(largeur, HAUTEUR_SCENE);
    this.vue = miseEnPage(largeur, HAUTEUR_SCENE, lesBornes.nbPots, lesBornes.hMax);
  }

  cible() {
    return this.niveau?.objectif === 'cible' ? this.essai?.cible : null;
  }

  afficher(etat, humeur = 'neutre') {
    this.etat = etat;
    this.dimensionnerScene(this.bornesFixes ?? bornes([etat], this.essai));
    dessinerSerre(this.ctx, this.vue, {
      pots: etat.pots,
      cible: this.cible(),
      pepin: { position: etat.position, humeur },
      bulle: etat.reponse !== null ? { texte: texteReponse(etat.reponse), p: 1 } : null,
    });
  }

  redessiner() {
    if (this.etat) this.afficher(this.etat);
  }

  commencer(etapes) {
    this.bornesFixes = bornes(etapes.map((e) => e.etat), this.essai);
  }

  dessinerTransition(avant, apres, p) {
    const a = avant.etat;
    const b = apres.etat;
    const { i, j } = apres.details;
    const scene = {
      pots: b.pots,
      cible: this.cible(),
      pepin: { position: lerp(a.position, b.position, douceur(Math.min(1, p * 1.7))), humeur: 'neutre' },
      bulle: b.reponse !== null ? { texte: texteReponse(b.reponse), p: 1 } : null,
    };
    switch (apres.evenement) {
      case 'regarder':
        scene.regard = { i, p: Math.sin(Math.PI * Math.min(1, p * 1.2)) * 0.9 + 0.1 };
        break;
      case 'echanger':
        scene.pots = a.pots;
        scene.echange = { i, j, p };
        if (p >= 1) {
          scene.pots = b.pots;
          scene.echange = null;
        }
        break;
      case 'arroserPot':
        scene.croissance = { i, hauteur: lerp(a.pots[i], b.pots[i], Math.max(0, rebond(p))) };
        scene.arrosage = { i, p };
        break;
      case 'ajouterPot':
        scene.apparition = { i, p };
        break;
      case 'retirerPot':
        scene.pots = p < 1 ? a.pots : b.pots;
        scene.disparition = { i, p };
        break;
      case 'repondre':
        scene.bulle = { texte: texteReponse(apres.details.valeur), p };
        break;
      case 'bonk':
        scene.croix = i ?? a.pots.length;
        scene.pepin.humeur = p > 0.3 ? 'oups' : 'neutre';
        scene.pepin.secousse = Math.sin(p * Math.PI * 6) * (1 - p) * 8;
        break;
      default:
        break;
    }
    this.dimensionnerScene(this.bornesFixes);
    dessinerSerre(this.ctx, this.vue, scene);
  }

  dureeEtape(etape, duree, total) {
    return Math.max(70, Math.min(duree, 16000 / total));
  }

  async celebrer() {
    const jeton = ++this.jeton;
    const etat = this.etat;
    await this.animer(1000, jeton, (p) => {
      this.dimensionnerScene(this.bornesFixes ?? bornes([etat], this.essai));
      dessinerSerre(this.ctx, this.vue, {
        pots: etat.pots,
        cible: this.cible(),
        fleurs: 1 + Math.sin(Math.PI * p) * 0.8,
        pepin: { position: etat.position, humeur: 'content', secousse: 0 },
        bulle: etat.reponse !== null ? { texte: texteReponse(etat.reponse), p: 1 } : null,
      });
    });
  }
}

// Une étagère en miniature (cartes des mondes, éditeur)
export function dessinerApercuSerre(canvas, niveau, numeroEssai = 0, compact = true) {
  const essai = niveau.essais?.[numeroEssai];
  if (!essai) return;
  const largeur = canvas.clientWidth;
  const hauteur = canvas.clientHeight;
  const ctx = preparerCanvas(canvas, largeur, hauteur);
  const lesBornes = bornes([{ pots: essai.pots }], essai);
  const vue = miseEnPage(largeur, hauteur, lesBornes.nbPots, lesBornes.hMax, compact);
  dessinerSerre(ctx, vue, {
    pots: essai.pots,
    cible: niveau.objectif === 'cible' ? essai.cible : null,
    pepin: compact ? null : { position: 0, humeur: 'neutre' },
  });
}
