// =============================================================
//  partage.js — Partager un monde avec un lien (ou un QR code)
// =============================================================
//
//  Pas de serveur : TOUT le monde est rangé dans le lien lui-même !
//    monde (objet) → JSON (texte) → compressé (deflate) → base64url
//  Le lien ressemble à : https://…/index.html#monde=P1.eNq9V…
//
//  « base64url », c'est une façon d'écrire n'importe quelles données
//  avec seulement des lettres, des chiffres, - et _ : parfait pour
//  une adresse web.
// =============================================================

import { lireTexteMonde, FORMAT, VERSION } from './mondes.js';
import { allegerProgramme } from './edition.js';
import { modeleFractale } from './solutions.js';
import { cleDuTrait } from './fractale.js';

const PREFIXE = 'P1.';
const QR = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';

async function transformer(octets, flux) {
  const sortie = new Blob([octets]).stream().pipeThrough(flux);
  return new Uint8Array(await new Response(sortie).arrayBuffer());
}

function versBase64Url(octets) {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  }
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function depuisBase64Url(texte) {
  const base64 = texte.replace(/-/g, '+').replace(/_/g, '/');
  const binaire = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binaire, (c) => c.charCodeAt(0));
}

// Les traits d'un dessin, arrondis à 0,5 près (comme pour comparer deux
// dessins) et sans doublon : c'est tout ce qu'il faut pour le modèle
function traitsDuModele(traits) {
  const vus = new Set();
  const resultat = [];
  for (const trait of traits) {
    const arrondi = trait.map((v) => Math.round(v * 2) / 2 + 0);
    const cle = cleDuTrait(arrondi);
    const [a, b] = cle.split('|');
    if (a !== b && !vus.has(cle)) {
      vus.add(cle);
      resultat.push(arrondi);
    }
  }
  return resultat;
}

// Ce qu'on envoie aux élèves. Si le prof a caché les solutions, elles
// ne partent PAS : ni dans le lien, ni dans le fichier. Pour la forêt,
// on garde seulement le dessin à reproduire (les traits du modèle).
export function versionPourLesEleves(monde) {
  if (monde.solutionsVisibles !== false) return monde;
  return {
    ...monde,
    niveaux: monde.niveaux.map((niveau) => {
      const { solution, ...sansSolution } = niveau;
      if (niveau.type !== 'fractale') return sansSolution;
      const modele = modeleFractale(niveau);
      return modele ? { ...sansSolution, modele: traitsDuModele(modele.traits) } : sansSolution;
    }),
  };
}

// Un monde plus léger : on enlève les identifiants internes des solutions
function alleger(monde) {
  return {
    ...monde,
    niveaux: monde.niveaux.map((niveau) => (
      niveau.solution ? { ...niveau, solution: allegerProgramme(niveau.solution) } : niveau
    )),
  };
}

// Les trois sortes de codes de Pépin, reconnaissables à leur début
export const PREFIXES = {
  monde: PREFIXE,       // un monde à jouer
  sauvegarde: 'S1.',    // la progression d'un joueur
  rendu: 'R1.',         // le travail rendu par un élève à son prof
};

// N'importe quel objet → un code compact (compressé, puis en base64url)
export async function encoderPaquet(prefixe, objet) {
  const octets = new TextEncoder().encode(JSON.stringify(objet));
  const compresses = await transformer(octets, new CompressionStream('deflate-raw'));
  return prefixe + versBase64Url(compresses);
}

// Un code (ou un lien) → { sorte: 'monde' | 'sauvegarde' | 'rendu', json }
export async function decoderPaquet(saisie) {
  const texte = String(saisie).trim();
  const code = (texte.includes('#monde=') ? texte.split('#monde=')[1] : texte).trim();
  const sorte = Object.keys(PREFIXES).find((cle) => code.startsWith(PREFIXES[cle]));
  if (!sorte) throw new Error("ce n'est pas un lien ou un code de Pépin");
  try {
    const octets = await transformer(depuisBase64Url(code.slice(PREFIXES[sorte].length)), new DecompressionStream('deflate-raw'));
    return { sorte, json: new TextDecoder().decode(octets) };
  } catch {
    throw new Error('le code est abîmé ou incomplet (a-t-il été copié en entier ?)');
  }
}

export async function encoderMonde(monde) {
  return encoderPaquet(PREFIXE, alleger(versionPourLesEleves(monde)));
}

// Accepte un lien complet OU juste le code. Renvoie le monde vérifié.
export async function decoderCode(saisie) {
  const { sorte, json } = await decoderPaquet(saisie);
  if (sorte !== 'monde') throw new Error("ce code n'est pas un monde (c'est peut-être une sauvegarde ou un rendu)");
  return lireTexteMonde(json);
}

export function lienDuCode(code) {
  return `${location.origin}${location.pathname}#monde=${code}`;
}

// Un petit nombre qui résume un texte (pour fabriquer un id stable)
function empreinte(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// Pour partager UN seul niveau : on l'emballe dans un mini-monde
export function mondeDUnNiveau(monde, index) {
  const niveau = monde.niveaux[index];
  return {
    format: FORMAT,
    version: VERSION,
    id: `partage-${empreinte(JSON.stringify(niveau))}`,
    titre: niveau.titre,
    auteur: monde.auteur ?? '',
    description: `Un niveau du monde « ${monde.titre} ».`,
    difficulte: monde.difficulte ?? 1,
    solutionsVisibles: monde.solutionsVisibles !== false,
    niveaux: [niveau],
  };
}

// --- Le QR code ---------------------------------------------------------

let promesseQR = null;

function chargerQR() {
  promesseQR ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = QR;
    script.onload = resolve;
    script.onerror = () => {
      promesseQR = null;
      reject(new Error('QR indisponible'));
    };
    document.head.append(script);
  });
  return promesseQR;
}

// Renvoie un élément <svg> (ou null si le lien est trop long pour un QR)
export async function fabriquerQR(lien) {
  if (lien.length > 2300) return null;
  await chargerQR();
  const qr = window.qrcode(0, 'L');
  qr.addData(lien);
  qr.make();
  const modules = qr.getModuleCount();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `-2 -2 ${modules + 4} ${modules + 4}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR code du lien');
  const fond = document.createElementNS(NS, 'rect');
  fond.setAttribute('x', '-2');
  fond.setAttribute('y', '-2');
  fond.setAttribute('width', String(modules + 4));
  fond.setAttribute('height', String(modules + 4));
  fond.setAttribute('fill', '#ffffff');
  svg.append(fond);
  let chemin = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (qr.isDark(y, x)) chemin += `M${x} ${y}h1v1h-1z`;
    }
  }
  const points = document.createElementNS(NS, 'path');
  points.setAttribute('d', chemin);
  points.setAttribute('fill', '#1d2b23');
  svg.append(points);
  return svg;
}
