// =============================================================
//  editeur.js — L'éditeur de mondes et de niveaux (l'interface)
// =============================================================
//
//  Deux écrans :
//  - l'éditeur de MONDE : titre, auteur… et la liste des niveaux
//  - l'éditeur de NIVEAU : selon le type, on peint le jardin, on
//    prépare les étagères de test, ou on dessine le modèle d'une
//    fractale. Puis on le teste : réussir son propre niveau
//    enregistre la solution.
//
//  Chaque modification est enregistrée tout de suite dans le
//  navigateur. Si une modification casse la solution (elle ne réussit
//  plus le niveau), la solution est effacée : il faut retester !
// =============================================================

import {
  verifierNiveau, verifierMonde, enregistrerMonMonde, LARGEUR_MAX, HAUTEUR_MAX,
} from './mondes.js';
import {
  peindre, redimensionner, nouveauNiveau, raisonsPasPartageable, compterBlocs, LARGEUR_MIN, HAUTEUR_MIN,
} from './edition.js';
import { BLOCS_PAR_TYPE, NOMS_DES_BLOCS } from './boite-a-outils.js';
import { dessinerCarte, dessinerIcone } from './rendu.js';
import { dessinerApercuSerre } from './rendu-serre.js';
import { dessinerApercuForet } from './rendu-foret.js';
import { dessinerApercuNiveau } from './apercus.js';
import { modeleFractale, problemeDeSolution } from './solutions.js';
import { mondeDUnNiveau } from './partage.js';
import { typeDuNiveau } from './types.js';

const OUTILS = [
  { symbole: '.', nom: 'Herbe' },
  { symbole: '#', nom: 'Rocher' },
  { symbole: 'o', nom: 'Graine' },
  { symbole: '^', nom: 'Pépin ↑' },
  { symbole: '>', nom: 'Pépin →' },
  { symbole: 'v', nom: 'Pépin ↓' },
  { symbole: '<', nom: 'Pépin ←' },
];
const estUnPepin = (symbole) => '^>v<'.includes(symbole);

// Les fonctions de main.js dont l'éditeur a besoin (voir brancherEditeur)
let app = null;

const ed = {
  monde: null,
  index: 0,          // le niveau en cours d'édition
  outil: '#',        // le symbole du pinceau
  peint: false,      // le bouton de la souris est-il enfoncé ?
  survol: null,      // la case sous la souris
  t: 32,             // la taille d'une case à l'écran
  essaiChoisi: 0,    // l'étagère montrée en aperçu (serre)
};

const $ = (id) => document.getElementById(id);
const el = {
  // éditeur de monde
  vueMonde: $('vue-monde'),
  mRetour: $('em-retour'),
  mTitre: $('em-titre'),
  mAuteur: $('em-auteur'),
  mDescription: $('em-description'),
  mDifficulte: $('em-difficulte'),
  mSolutions: $('em-solutions'),
  mSolutionsAide: $('em-solutions-aide'),
  mJouer: $('em-jouer'),
  mPartager: $('em-partager'),
  mExporter: $('em-exporter'),
  mEtat: $('em-etat'),
  mNiveaux: $('em-niveaux'),
  // éditeur de niveau
  vueNiveau: $('vue-niveau'),
  nRetour: $('en-retour'),
  nTitrePage: $('en-titre-page'),
  panneauJardin: $('en-jardin'),
  panneauSerre: $('en-serre'),
  panneauForet: $('en-foret'),
  nCarte: $('en-carte'),
  nPalette: $('en-palette'),
  nLargeur: $('en-largeur'),
  nHauteur: $('en-hauteur'),
  nLMoins: $('en-l-moins'),
  nLPlus: $('en-l-plus'),
  nHMoins: $('en-h-moins'),
  nHPlus: $('en-h-plus'),
  apercuSerre: $('en-apercu-serre'),
  essais: $('en-essais'),
  ajouterEssai: $('en-ajouter-essai'),
  apercuForet: $('en-apercu-foret'),
  infoForet: $('en-foret-info'),
  effacerModele: $('en-effacer-modele'),
  nTitre: $('en-titre'),
  nConcept: $('en-concept'),
  nConsigne: $('en-consigne'),
  nMaxBlocs: $('en-max-blocs'),
  nBlocs: $('en-blocs'),
  nVerification: $('en-verification'),
  nTester: $('en-tester'),
};

function creer(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

function sauvegarder() {
  enregistrerMonMonde(ed.monde);
}

// main.js donne : afficherVue, afficherAccueil, jouerMonde, tester,
// telecharger, partagerMonde
export function brancherEditeur(fonctions) {
  app = fonctions;
}

// =====================================================================
//  L'ÉDITEUR DE MONDE
// =====================================================================

export function ouvrirEditeurMonde(monde) {
  ed.monde = monde;
  app.afficherVue('monde');
  el.mTitre.value = monde.titre ?? '';
  el.mAuteur.value = monde.auteur ?? '';
  el.mDescription.value = monde.description ?? '';
  el.mDifficulte.value = String(monde.difficulte ?? 1);
  el.mSolutions.checked = monde.solutionsVisibles !== false;
  majAideSolutions();
  afficherListeNiveaux();
  majEtatMonde();
}

function majAideSolutions() {
  el.mSolutionsAide.textContent = el.mSolutions.checked
    ? "Après 3 essais ratés, l'élève peut regarder ta solution. Pratique pour s'entraîner !"
    : "🔒 Tes solutions restent sur ton ordinateur : elles ne partent ni dans le lien, ni dans le fichier. Impossible de tricher : parfait pour une évaluation !";
}

function etatNiveau(niveau, i) {
  if (verifierNiveau(niveau, i + 1).length) return { texte: '🥀 à corriger', classe: 'a-corriger' };
  if (niveau.type === 'fractale' && !niveau.solution && !niveau.modele) return { texte: '🎨 modèle à dessiner', classe: 'a-tester' };
  if (!niveau.solution) return { texte: '🧪 à tester', classe: 'a-tester' };
  return { texte: '✅ prêt', classe: 'pret' };
}

function afficherListeNiveaux() {
  const niveaux = ed.monde.niveaux;
  const aDessiner = [];

  el.mNiveaux.replaceChildren(...niveaux.map((niveau, i) => {
    const ligne = creer('li', 'ligne-niveau');

    const apercu = creer('canvas', 'mini-apercu');
    apercu.setAttribute('aria-hidden', 'true');
    aDessiner.push(() => dessinerApercuNiveau(apercu, niveau));

    const texte = creer('button', 'ligne-texte');
    const etat = etatNiveau(niveau, i);
    const icone = typeDuNiveau(niveau).icone;
    texte.append(
      creer('strong', '', `${i + 1}. ${icone} ${niveau.titre || 'Sans titre'}`),
      creer('span', `etat-niveau ${etat.classe}`, etat.texte),
    );
    texte.addEventListener('click', () => ouvrirEditeurNiveau(i));

    const actions = creer('div', 'ligne-actions');
    const bouton = (symbole, titre, desactive, action) => {
      const b = creer('button', 'btn btn-petit', symbole);
      b.title = titre;
      b.setAttribute('aria-label', titre);
      b.disabled = desactive;
      b.addEventListener('click', action);
      actions.append(b);
    };
    bouton('↑', 'Monter', i === 0, () => deplacerNiveau(i, -1));
    bouton('↓', 'Descendre', i === niveaux.length - 1, () => deplacerNiveau(i, 1));
    bouton('✏️', 'Modifier', false, () => ouvrirEditeurNiveau(i));
    bouton('🔗', 'Partager ce niveau tout seul', etat.classe !== 'pret',
      () => app.partagerMonde(mondeDUnNiveau(ed.monde, i)));
    bouton('🗑', 'Supprimer', niveaux.length === 1, () => supprimerNiveau(i));

    ligne.append(apercu, texte, actions);
    return ligne;
  }));

  for (const dessiner of aDessiner) {
    try {
      dessiner();
    } catch {
      // niveau pas encore valide : pas d'aperçu
    }
  }
}

function majEtatMonde() {
  const raisons = raisonsPasPartageable(ed.monde);
  el.mExporter.disabled = raisons.length > 0;
  el.mPartager.disabled = raisons.length > 0;
  el.mJouer.disabled = verifierMonde(ed.monde).length > 0
    || ed.monde.niveaux.some((n) => n.type === 'fractale' && !n.solution && !n.modele);

  if (!raisons.length) {
    el.mEtat.replaceChildren(creer('p', 'ok', '✅ Ton monde est prêt à être partagé !'));
    return;
  }
  const liste = creer('ul');
  for (const raison of raisons.slice(0, 4)) liste.append(creer('li', '', raison));
  if (raisons.length > 4) liste.append(creer('li', '', `… et ${raisons.length - 4} autre(s) chose(s)`));
  el.mEtat.replaceChildren(creer('p', '', 'Avant de pouvoir le partager :'), liste);
}

function deplacerNiveau(i, sens) {
  const niveaux = ed.monde.niveaux;
  [niveaux[i], niveaux[i + sens]] = [niveaux[i + sens], niveaux[i]];
  sauvegarder();
  afficherListeNiveaux();
  majEtatMonde();
}

function supprimerNiveau(i) {
  const niveau = ed.monde.niveaux[i];
  if (!confirm(`Supprimer le niveau « ${niveau.titre} » ?`)) return;
  ed.monde.niveaux.splice(i, 1);
  sauvegarder();
  afficherListeNiveaux();
  majEtatMonde();
}

function champMonde(champ, propriete, transformer = (v) => v) {
  champ.addEventListener('input', () => {
    ed.monde[propriete] = transformer(champ.value);
    sauvegarder();
    majEtatMonde();
  });
}

champMonde(el.mTitre, 'titre');
champMonde(el.mAuteur, 'auteur');
champMonde(el.mDescription, 'description');
el.mDifficulte.addEventListener('change', () => {
  ed.monde.difficulte = Number(el.mDifficulte.value);
  sauvegarder();
});
el.mSolutions.addEventListener('change', () => {
  ed.monde.solutionsVisibles = el.mSolutions.checked;
  majAideSolutions();
  sauvegarder();
});

for (const bouton of document.querySelectorAll('.ajout-niveau [data-type]')) {
  bouton.addEventListener('click', () => {
    ed.monde.niveaux.push(nouveauNiveau(ed.monde.niveaux.map((n) => n.id), bouton.dataset.type));
    sauvegarder();
    ouvrirEditeurNiveau(ed.monde.niveaux.length - 1);
  });
}

el.mRetour.addEventListener('click', () => app.afficherAccueil());
el.mJouer.addEventListener('click', () => app.jouerMonde(ed.monde));
el.mPartager.addEventListener('click', () => app.partagerMonde(ed.monde));
el.mExporter.addEventListener('click', () => app.telecharger(ed.monde));

// =====================================================================
//  L'ÉDITEUR DE NIVEAU
// =====================================================================

function niveau() {
  return ed.monde.niveaux[ed.index];
}

function ouvrirEditeurNiveau(index) {
  ed.index = index;
  ed.essaiChoisi = 0;
  app.afficherVue('niveau');
  const n = niveau();
  el.panneauJardin.hidden = n.type !== 'jardin';
  el.panneauSerre.hidden = n.type !== 'etagere';
  el.panneauForet.hidden = n.type !== 'fractale';
  el.nTitre.value = n.titre ?? '';
  el.nConcept.value = n.concept ?? '';
  el.nConsigne.value = n.consigne ?? '';
  el.nMaxBlocs.value = n.exigences?.maxBlocs ?? '';
  construireCasesBlocs();
  majTitrePage();
  dessinerType();
  if (n.type === 'etagere') remplirSerre();
  majVerification();
}

function majTitrePage() {
  const n = niveau();
  el.nTitrePage.textContent = `✏️ ${typeDuNiveau(n).icone} Niveau ${ed.index + 1} · ${n.titre || 'Sans titre'}`;
}

// Redessine la partie qui dépend du type de niveau
function dessinerType() {
  const n = niveau();
  if (n.type === 'jardin') dessinerGrille();
  else if (n.type === 'etagere') dessinerApercuEtagere();
  else if (n.type === 'fractale') dessinerModele();
}

function majVerification() {
  const n = niveau();
  const erreurs = verifierNiveau(n, ed.index + 1);
  el.nTester.disabled = erreurs.length > 0;
  el.nTester.textContent = n.solution ? '🧪 Retester mon niveau' : '🧪 Tester mon niveau';

  if (erreurs.length) {
    const liste = creer('ul');
    for (const erreur of erreurs) liste.append(creer('li', '', erreur.replace(/^Niveau \d+(, )?/, '').replace(/^ : /, '')));
    el.nVerification.className = 'verification a-corriger';
    el.nVerification.replaceChildren(creer('p', '', '🥀 À corriger avant de tester :'), liste);
  } else if (!n.solution) {
    el.nVerification.className = 'verification a-tester';
    el.nVerification.replaceChildren(creer('p', '', n.type === 'fractale'
      ? '🎨 Clique sur 🧪 Tester et dessine ton modèle avec les blocs : ton premier dessin réussi deviendra le modèle !'
      : '🧪 Ton niveau est correct ! Réussis-le toi-même pour enregistrer ta solution.'));
  } else {
    el.nVerification.className = 'verification pret';
    el.nVerification.replaceChildren(creer('p', '', '✅ Niveau correct, et ta solution est enregistrée !'));
  }
}

// Après un changement : la solution marche-t-elle encore ?
function revaliderSolution() {
  const n = niveau();
  if (!n.solution) return;
  let casse = verifierNiveau(n, 1).length > 0;
  if (!casse) casse = Boolean(problemeDeSolution(n));
  const max = n.exigences?.maxBlocs;
  if (!casse && max && compterBlocs(n.solution) > max) casse = true;
  if (casse) {
    delete n.solution;
    app.toast?.('Ta solution ne marche plus avec ce changement : reteste ton niveau 🧪');
  }
}

function apresModification({ dessiner = true } = {}) {
  revaliderSolution();
  sauvegarder();
  if (dessiner) dessinerType();
  majVerification();
}

// --- Le jardin : peindre la carte ------------------------------------------

function dessinerGrille() {
  const carte = niveau().carte;
  ed.t = dessinerCarte(el.nCarte, carte, { survol: ed.survol });
  const largeur = carte[0]?.length ?? 0;
  const hauteur = carte.length;
  el.nLargeur.textContent = largeur;
  el.nHauteur.textContent = hauteur;
  el.nLMoins.disabled = largeur <= LARGEUR_MIN;
  el.nLPlus.disabled = largeur >= LARGEUR_MAX;
  el.nHMoins.disabled = hauteur <= HAUTEUR_MIN;
  el.nHPlus.disabled = hauteur >= HAUTEUR_MAX;
}

function modifierCarte(nouvelle) {
  if (JSON.stringify(nouvelle) === JSON.stringify(niveau().carte)) return;
  niveau().carte = nouvelle;
  apresModification();
}

function choisirOutil(symbole) {
  ed.outil = symbole;
  for (const bouton of el.nPalette.children) {
    bouton.setAttribute('aria-pressed', String(bouton.dataset.symbole === symbole));
  }
}

function dessinerPalette() {
  for (const bouton of el.nPalette.children) dessinerIcone(bouton.querySelector('canvas'), bouton.dataset.symbole);
}

for (const outil of OUTILS) {
  const bouton = creer('button', 'outil');
  bouton.dataset.symbole = outil.symbole;
  bouton.title = outil.nom;
  const icone = creer('canvas');
  icone.setAttribute('aria-hidden', 'true');
  bouton.append(icone, creer('span', '', outil.nom));
  bouton.addEventListener('click', () => choisirOutil(outil.symbole));
  el.nPalette.append(bouton);
}
dessinerPalette();
choisirOutil(ed.outil);

function caseSous(evenement) {
  const rect = el.nCarte.getBoundingClientRect();
  const x = Math.floor((evenement.clientX - rect.left) / ed.t);
  const y = Math.floor((evenement.clientY - rect.top) / ed.t);
  const carte = niveau().carte;
  if (y < 0 || y >= carte.length || x < 0 || x >= carte[0].length) return null;
  return { x, y };
}

function peindreSous(evenement) {
  const c = caseSous(evenement);
  if (c) modifierCarte(peindre(niveau().carte, c.x, c.y, ed.outil));
}

el.nCarte.addEventListener('pointerdown', (evenement) => {
  el.nCarte.setPointerCapture(evenement.pointerId);
  ed.peint = true;
  peindreSous(evenement);
});

el.nCarte.addEventListener('pointermove', (evenement) => {
  const c = caseSous(evenement);
  if (c?.x !== ed.survol?.x || c?.y !== ed.survol?.y) {
    ed.survol = c;
    // on ne « traîne » pas Pépin : il se pose d'un seul clic
    if (ed.peint && !estUnPepin(ed.outil)) peindreSous(evenement);
    dessinerGrille();
  }
});

for (const fin of ['pointerup', 'pointercancel']) {
  el.nCarte.addEventListener(fin, () => {
    ed.peint = false;
  });
}

el.nCarte.addEventListener('pointerleave', () => {
  ed.survol = null;
  dessinerGrille();
});

function changerTaille(dLargeur, dHauteur) {
  const carte = niveau().carte;
  modifierCarte(redimensionner(carte, (carte[0]?.length ?? 0) + dLargeur, carte.length + dHauteur));
}

el.nLMoins.addEventListener('click', () => changerTaille(-1, 0));
el.nLPlus.addEventListener('click', () => changerTaille(1, 0));
el.nHMoins.addEventListener('click', () => changerTaille(0, -1));
el.nHPlus.addEventListener('click', () => changerTaille(0, 1));

// --- La serre : l'objectif et les étagères de test ------------------------

const lireListe = (texte) => texte.split(/[\s,;]+/).filter(Boolean).map(Number);

function dessinerApercuEtagere() {
  try {
    dessinerApercuSerre(el.apercuSerre, niveau(), ed.essaiChoisi, false);
  } catch {
    // étagère pas encore valide
  }
}

function remplirSerre() {
  const n = niveau();
  for (const choix of document.querySelectorAll('input[name="en-objectif"]')) {
    choix.checked = choix.value === n.objectif;
  }
  afficherEssais();
}

function champ(etiquette, valeur, surSaisie, type = 'text') {
  const label = creer('label');
  const entree = creer('input');
  entree.type = type;
  entree.value = valeur;
  entree.addEventListener('input', () => surSaisie(entree.value));
  label.append(creer('span', '', etiquette), entree);
  return label;
}

function afficherEssais() {
  const n = niveau();
  el.ajouterEssai.disabled = n.essais.length >= 6;
  el.essais.replaceChildren(...n.essais.map((essai, i) => {
    const ligne = creer('li', `ligne-essai${i === ed.essaiChoisi ? ' choisi' : ''}`);
    const numero = creer('button', 'numero-essai btn-texte', `${i + 1}`);
    numero.title = 'Voir cette étagère en aperçu';
    numero.addEventListener('click', () => {
      ed.essaiChoisi = i;
      afficherEssais();
      dessinerApercuEtagere();
    });
    const supprimer = creer('button', 'btn btn-petit', '🗑');
    supprimer.title = 'Supprimer cette étagère';
    supprimer.setAttribute('aria-label', `Supprimer l'étagère ${i + 1}`);
    supprimer.disabled = n.essais.length === 1;
    supprimer.addEventListener('click', () => {
      n.essais.splice(i, 1);
      ed.essaiChoisi = Math.min(ed.essaiChoisi, n.essais.length - 1);
      afficherEssais();
      apresModification();
    });

    const champs = creer('div', 'champs-essai');
    champs.append(champ('Pots', essai.pots.join(', '), (texte) => {
      essai.pots = lireListe(texte);
      ed.essaiChoisi = i;
      apresModification();
    }));
    if (n.objectif === 'cible') {
      champs.append(champ('Drapeaux 🚩', (essai.cible ?? []).join(', '), (texte) => {
        essai.cible = lireListe(texte);
        ed.essaiChoisi = i;
        apresModification();
      }));
    }
    if (n.objectif === 'reponse') {
      champs.append(champ('Réponse', essai.reponse ?? 0, (texte) => {
        essai.reponse = texte.trim() === '' ? null : Number(texte);
        apresModification({ dessiner: false });
      }, 'number'));
    }
    ligne.append(numero, champs, supprimer);
    return ligne;
  }));
}

for (const choix of document.querySelectorAll('input[name="en-objectif"]')) {
  choix.addEventListener('change', () => {
    const n = niveau();
    n.objectif = choix.value;
    for (const essai of n.essais) {
      if (n.objectif === 'cible') essai.cible ??= [...essai.pots];
      else delete essai.cible;
      if (n.objectif === 'reponse') essai.reponse ??= 0;
      else delete essai.reponse;
    }
    afficherEssais();
    apresModification();
  });
}

el.ajouterEssai.addEventListener('click', () => {
  const n = niveau();
  const modele = n.essais[n.essais.length - 1] ?? { pots: [1, 2, 3] };
  n.essais.push(structuredClone(modele));
  ed.essaiChoisi = n.essais.length - 1;
  afficherEssais();
  apresModification();
});

// --- La forêt : le modèle, c'est le dessin de la solution -----------------

function dessinerModele() {
  const n = niveau();
  const modele = modeleFractale(n);
  dessinerApercuForet(el.apercuForet, modele?.traits ?? []);
  if (n.solution) {
    el.infoForet.textContent = `Voici le modèle : c'est le dessin de ta solution (${modele?.cles.size ?? 0} traits). Pour le changer, efface-le puis reteste.`;
  } else if (n.modele) {
    el.infoForet.textContent = "Voici le modèle (reçu sans la solution de l'auteur). Réussis-le avec 🧪 Tester pour pouvoir partager ce monde.";
  } else {
    el.infoForet.textContent = "Pas encore de modèle ! Clique sur 🧪 Tester et dessine-le avec les blocs : ton premier dessin réussi deviendra le modèle. 🎨";
  }
  el.effacerModele.hidden = !n.solution && !n.modele;
}

el.effacerModele.addEventListener('click', () => {
  if (!confirm('Effacer le modèle ? Tu pourras en dessiner un nouveau avec 🧪 Tester.')) return;
  delete niveau().solution;
  delete niveau().modele;
  apresModification();
});

// --- Les textes, le défi et les blocs ---------------------------------------

el.nTitre.addEventListener('input', () => {
  niveau().titre = el.nTitre.value;
  sauvegarder();
  majTitrePage();
  majVerification();
});

el.nConcept.addEventListener('input', () => {
  niveau().concept = el.nConcept.value.trim() || null;
  sauvegarder();
});

el.nConsigne.addEventListener('input', () => {
  niveau().consigne = el.nConsigne.value;
  sauvegarder();
  majVerification();
});

el.nMaxBlocs.addEventListener('input', () => {
  const n = niveau();
  const valeur = Number.parseInt(el.nMaxBlocs.value, 10);
  if (Number.isNaN(valeur)) delete n.exigences;
  else n.exigences = { maxBlocs: valeur };
  apresModification({ dessiner: false });
});

function construireCasesBlocs() {
  const n = niveau();
  const cles = BLOCS_PAR_TYPE[n.type] ?? BLOCS_PAR_TYPE.jardin;
  el.nBlocs.replaceChildren(...cles.map((cle) => {
    const etiquette = creer('label', 'bloc-choix');
    const caseACocher = creer('input');
    caseACocher.type = 'checkbox';
    caseACocher.value = cle;
    caseACocher.checked = n.blocs.includes(cle);
    caseACocher.addEventListener('change', () => {
      n.blocs = cles.filter((c) => el.nBlocs.querySelector(`input[value="${c}"]`).checked);
      apresModification({ dessiner: false });
    });
    etiquette.append(caseACocher, ` ${NOMS_DES_BLOCS[cle]}`);
    return etiquette;
  }));
}

// --- Tester -------------------------------------------------------------

el.nTester.addEventListener('click', () => {
  const index = ed.index;
  app.tester(ed.monde, index, {
    surSolution: (solution) => {
      ed.monde.niveaux[index].solution = solution;
      // la solution dessine le modèle : plus besoin de la liste de traits
      delete ed.monde.niveaux[index].modele;
      sauvegarder();
    },
    surRetour: () => ouvrirEditeurNiveau(index),
  });
});

el.nRetour.addEventListener('click', () => ouvrirEditeurMonde(ed.monde));

// --- Redessiner quand la fenêtre ou le thème changent ----------------------

window.addEventListener('resize', () => {
  if (!el.vueNiveau.hidden) dessinerType();
});

window.addEventListener('pepin:theme', () => {
  dessinerPalette();
  if (!el.vueNiveau.hidden) dessinerType();
  if (!el.vueMonde.hidden) afficherListeNiveaux();
});
