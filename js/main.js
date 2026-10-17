// =============================================================
//  main.js — Le chef d'orchestre : relie l'accueil, les mondes,
//  le jeu, l'éditeur, le partage, les réglages et la progression.
// =============================================================

import { initialiserTheme, basculerTheme, estNuit } from './theme.js';
import { executer, executerProgramme } from './execution.js';
import { typeDuNiveau, TYPES } from './types.js';
import { LecteurJardin, dessinerPortrait, animerPortrait } from './rendu.js';
import { LecteurSerre, dessinerApercuSerre } from './rendu-serre.js';
import { dessinerApercuNiveau } from './apercus.js';
import {
  definirBlocs, genererCodeJS, genererCodePython, nomDuBloc, THEME, THEME_NUIT, brancherCategorieVariables,
  ajouterOmbresAuxAppels, brancherCategorieFonctions, fermerBullesAuClic,
} from './blocs.js';
import { creerToolbox, toolboxEnCategories, typesAutorises, nomDuType } from './boite-a-outils.js';
import { stockage } from './stockage.js';
import {
  chargerBibliotheque, lireTexteMonde, texteDuMonde, nomDeFichier, verifierMonde, ErreurMonde,
  mesMondes, enregistrerMonMonde, retirerMonMonde,
} from './mondes.js';
import { nouveauMonde, copierMonde, raisonsPasPartageable, compterBlocs, allegerProgramme } from './edition.js';
import { brancherEditeur, ouvrirEditeurMonde } from './editeur.js';
import { modeleFractale, optionsDuNiveau, problemesDeSolutions } from './solutions.js';
import { chargerPython, pythonEstPret, lanceurPython, creerEditeurPython } from './python.js';
import { encoderMonde, decoderPaquet, lienDuCode, fabriquerQR, versionPourLesEleves } from './partage.js';
import { jouer as jouerSon, sonDeLEtape, sonsActifs, activerSons } from './sons.js';
import { formater } from './etagere.js';
import { indicationsDuModele, Fractale } from './fractale.js';
import { creerBacASable, TERRAINS, ID_BAC_A_SABLE } from './bac-a-sable.js';
import { LecteurForet, dessinerApercuForet } from './rendu-foret.js';
import { retenirProgrammeGagnant, lireProfil, FORMAT_RENDU, FORMAT_SAUVEGARDE } from './classe.js';
import {
  brancherCarnet, ouvrirProfil, ouvrirSauvegarde, ouvrirRendu, restaurer,
} from './carnet.js';
import { brancherTableau, ouvrirTableau, ajouterRendus } from './tableau.js';

initialiserTheme();

const VITESSES = [
  { nom: '🐢 Lent', duree: 750 },
  { nom: '🚶 Normal', duree: 420 },
  { nom: '🐇 Rapide', duree: 160 },
];

const DIFFICULTES = { 1: '🌱 Débutant', 2: '🌿 Intermédiaire', 3: '🌳 Avancé', 4: '🔥 Expert' };

// --- État du jeu ------------------------------------------------------

// La progression est rangée sous la forme 'idDuMonde/idDuNiveau'.
// (Les anciennes sauvegardes, d'avant les mondes, sont rangées dans 'bases'.)
const lireEnsemble = (cle) => new Set(stockage.lire(cle, []));
const lireReussis = () => new Set(stockage.lire('pepin.reussis', []).map((cle) => (cle.includes('/') ? cle : `bases/${cle}`)));

const jeu = {
  bibliotheque: [], // liste de { monde } ou { fichier, erreur }
  monde: null,      // le monde en cours
  index: 0,         // le niveau en cours dans ce monde
  enCours: false,
  vitesse: 1,
  reussis: lireReussis(),
  medailles: lireEnsemble('pepin.medailles'),
  enPython: lireEnsemble('pepin.python'),
  chargement: false,
  test: null,       // en mode test (depuis l'éditeur) : { surSolution, surRetour }
  mode: stockage.lire('pepin.mode', 'blocs'), // 'blocs' ou 'python'
  echecs: new Map(), // nombre d'essais ratés par niveau (pour la langue au chat)
  essaiVu: 0,        // l'étagère montrée dans la serre (avant de lancer)
  resultatsEssais: [], // ✓ / ✗ de chaque étagère, au dernier lancer
  pasAPas: null,       // en mode pas à pas : { resultat, essais, essai, etape, anime, enAttente, essaiFini }
};

let workspace = null;
let workspaceEnCategories = null;
let editeurPython = null;
let lecteur = null;
const lecteurs = {};

// --- Éléments de la page ----------------------------------------------

const $ = (id) => document.getElementById(id);
const el = {
  logo: $('logo'),
  accueilBouton: $('btn-accueil'),
  btnProfil: $('btn-profil'),
  btnSauvegarde: $('btn-sauvegarde'),
  btnRendre: $('btn-rendre'),
  btnTableau: $('btn-tableau'),
  btnMondes: $('btn-mondes'),
  btnSon: $('btn-son'),
  btnTheme: $('btn-theme'),
  bulleAccueil: $('bulle-accueil'),
  portraitAccueil: $('portrait-accueil'),
  stats: $('stats'),
  grilleBibliotheque: $('grille-bibliotheque'),
  grilleMesMondes: $('grille-mes-mondes'),
  grilleBac: $('grille-bac'),
  rechercheTexte: $('recherche-texte'),
  rechercheFiltres: $('recherche-filtres'),
  rechercheResume: $('recherche-resume'),
  rechercheEffacer: $('recherche-effacer'),
  rechercheNiveaux: $('recherche-niveaux'),
  fichier: $('fichier-monde'),
  nomMonde: $('nom-monde'),
  jardin: $('jardin'),
  titre: $('titre-niveau'),
  concept: $('concept'),
  bulle: $('bulle-texte'),
  portrait: $('portrait'),
  objectif: $('objectif'),
  defi: $('defi'),
  plateau: $('plateau'),
  essais: $('essais'),
  lancer: $('btn-lancer'),
  etape: $('btn-etape'),
  reset: $('btn-reset'),
  vitesse: $('btn-vitesse'),
  terrain: $('btn-terrain'),
  chat: $('btn-chat'),
  memoire: $('memoire'),
  bocaux: $('bocaux'),
  pile: $('pile'),
  modeBlocs: $('mode-blocs'),
  modePython: $('mode-python'),
  blockly: $('blockly'),
  zonePython: $('zone-python'),
  editeurPython: $('editeur-python'),
  aidePython: $('aide-python'),
  python: $('code-python'),
  traduction: $('traduction'),
  victoire: $('victoire'),
  victoireTitre: $('victoire-titre'),
  victoireTexte: $('victoire-texte'),
  victoireBonus: $('victoire-bonus'),
  petales: $('petales'),
  suivant: $('btn-suivant'),
  rejouer: $('btn-rejouer'),
  dialogueSolution: $('dialogue-solution'),
  solutionBlocs: $('solution-blocs'),
  solutionPython: $('solution-python'),
  solutionCopier: $('solution-copier'),
  solutionFermer: $('solution-fermer'),
  dialoguePartage: $('dialogue-partage'),
  partageTitre: $('partage-titre'),
  partageLien: $('partage-lien'),
  partageCopier: $('partage-copier'),
  partageQr: $('partage-qr'),
  partageInfo: $('partage-info'),
  partageFichier: $('partage-fichier'),
  partageComplet: $('partage-complet'),
  partageExplication: $('partage-explication'),
  partageFermer: $('partage-fermer'),
  dialogueOuvrir: $('dialogue-ouvrir'),
  ouvrirTexte: $('ouvrir-texte'),
  ouvrirErreur: $('ouvrir-erreur'),
  ouvrirValider: $('ouvrir-valider'),
  ouvrirAnnuler: $('ouvrir-annuler'),
  toast: $('toast'),
};

const VUES = {
  accueil: $('vue-accueil'),
  jeu: $('vue-jeu'),
  monde: $('vue-monde'),
  niveau: $('vue-niveau'),
  prof: $('vue-prof'),
};

definirBlocs();
dessinerPortrait(el.logo, 'content');
const portraitAccueil = animerPortrait(el.portraitAccueil);
let humeurPepin = 'neutre';

// Petit raccourci pour fabriquer un élément HTML.
// On met toujours le texte avec textContent (et jamais innerHTML) :
// un fichier importé pourrait contenir du code HTML piégé !
function creer(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

let minuteurToast = null;
function toast(texte) {
  el.toast.textContent = texte;
  el.toast.classList.add('visible');
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => el.toast.classList.remove('visible'), 2600);
}

const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function afficherVue(nom) {
  arreter();
  if (el.victoire.open) el.victoire.close();
  for (const [cle, vue] of Object.entries(VUES)) vue.hidden = cle !== nom;
  el.btnMondes.hidden = nom === 'accueil' || Boolean(jeu.test);
  window.scrollTo(0, 0);
}

function tousLesIds() {
  return [
    ...jeu.bibliotheque.map((entree) => entree.monde?.id),
    ...mesMondes().map((monde) => monde?.id),
  ].filter(Boolean);
}

function erreursDe(e) {
  return e instanceof ErreurMonde ? e.erreurs : [e.message];
}

// =====================================================================
//  ÉCRAN D'ACCUEIL
// =====================================================================

function parlerAccueil(texte, humeur = 'neutre', details = []) {
  el.bulleAccueil.replaceChildren(creer('p', '', texte));
  if (details.length) {
    const liste = creer('ul');
    for (const detail of details.slice(0, 8)) liste.append(creer('li', '', detail));
    if (details.length > 8) liste.append(creer('li', '', `… et ${details.length - 8} autre(s)`));
    el.bulleAccueil.append(liste);
  }
  portraitAccueil.humeur(humeur);
}

function majStats() {
  const stat = (texte) => creer('li', '', texte);
  const fleurs = jeu.reussis.size;
  el.stats.replaceChildren(
    stat(`🌷 ${fleurs} fleur${fleurs > 1 ? 's' : ''}`),
    stat(`🏅 ${jeu.medailles.size} défi${jeu.medailles.size > 1 ? 's' : ''}`),
    stat(`🐍 ${jeu.enPython.size} en Python`),
    stat(`🎒 ${mesMondes().length} monde${mesMondes().length > 1 ? 's' : ''} à moi`),
  );
}

function progression(monde) {
  return monde.niveaux.filter((n) => jeu.reussis.has(`${monde.id}/${n.id}`)).length;
}

// Une carte pour un monde. Les dessins sont faits après l'ajout dans la
// page (le canvas doit avoir une taille), d'où la liste `aDessiner`.
function carteMonde(monde, source, aDessiner) {
  const carte = creer('article', 'carte-monde');
  const apercu = creer('canvas', 'apercu');
  apercu.setAttribute('aria-hidden', 'true');
  // la « vitrine » : le niveau montré sur la carte (le premier, sauf avis contraire)
  const vitrine = monde.niveaux[monde.vitrine] ?? monde.niveaux[0];
  aDessiner.push(() => dessinerApercuNiveau(apercu, vitrine, { vitrine: true, nom: monde.id }));

  const corps = creer('div', 'carte-corps');
  const titre = creer('h3', '', monde.titre);
  if (stockage.lire('pepin.dernierMonde', null) === monde.id) {
    titre.append(' ', creer('span', 'badge', 'reprendre'));
  }
  corps.append(titre);
  if (monde.auteur) corps.append(creer('p', 'auteur', `par ${monde.auteur}`));

  const etiquettes = creer('div', 'etiquettes');
  if (DIFFICULTES[monde.difficulte]) etiquettes.append(creer('span', 'etiquette', DIFFICULTES[monde.difficulte]));
  const types = [...new Set(monde.niveaux.map((n) => typeDuNiveau(n)))];
  for (const type of types) etiquettes.append(creer('span', 'etiquette', `${type.icone} ${type.nom}`));
  if (monde.solutionsVisibles === false) {
    const cadenas = creer('span', 'etiquette', '🔒 Solutions cachées');
    cadenas.title = 'Les solutions ne sont pas partagées : idéal pour une évaluation';
    etiquettes.append(cadenas);
  }
  corps.append(etiquettes);
  if (monde.description) corps.append(creer('p', 'description', monde.description));

  const faits = progression(monde);
  const ligne = creer('p', 'progression', `🌷 ${faits} / ${monde.niveaux.length}`);
  const barre = creer('span', 'barre-progression');
  const remplissage = creer('span');
  remplissage.style.width = `${(faits / monde.niveaux.length) * 100}%`;
  barre.append(remplissage);
  ligne.append(barre);
  corps.append(ligne);

  const actions = creer('div', 'carte-actions');
  const bouton = (texte, classe, titreBouton, action) => {
    const b = creer('button', `btn btn-petit ${classe}`, texte);
    if (titreBouton) {
      b.title = titreBouton;
      b.setAttribute('aria-label', `${titreBouton} : ${monde.titre}`);
    }
    b.addEventListener('click', action);
    actions.append(b);
    return b;
  };

  bouton('▶ Jouer', 'btn-principal', '', () => jouerMonde(monde));
  if (source === 'perso') {
    bouton('✏️ Modifier', '', 'Modifier ce monde et ses niveaux', () => ouvrirEditeurMonde(monde));
  } else {
    bouton('📝 Copier', '', 'Créer ta propre copie de ce monde, pour la modifier', () => {
      const copie = copierMonde(monde, tousLesIds());
      enregistrerMonMonde(copie);
      ouvrirEditeurMonde(copie);
    });
  }
  bouton('🔗', '', 'Partager par un lien', () => partagerSiPret(monde));
  bouton('⬇', '', 'Télécharger le fichier .pepin', () => telechargerSiPret(monde));

  if (source === 'perso') {
    const retirer = creer('button', 'btn btn-petit btn-retirer', '🗑');
    retirer.title = 'Supprimer ce monde';
    retirer.setAttribute('aria-label', `Supprimer le monde ${monde.titre}`);
    retirer.addEventListener('click', () => {
      if (confirm(`Supprimer « ${monde.titre} » ? Pense à le télécharger avant si tu veux le garder !`)) {
        retirerMonMonde(monde.id);
        afficherCartes();
      }
    });
    carte.append(retirer);
  }

  corps.append(actions);
  carte.append(apercu, corps);
  return carte;
}

function carteAbimee(nom, erreurs, idARetirer) {
  const carte = creer('article', 'carte-monde carte-abimee');
  const corps = creer('div', 'carte-corps');
  corps.append(creer('h3', '', `🥀 ${nom}`), creer('p', 'description', 'Ce monde a un petit pépin :'));
  const liste = creer('ul', 'erreurs');
  for (const erreur of erreurs.slice(0, 5)) liste.append(creer('li', '', erreur));
  if (erreurs.length > 5) liste.append(creer('li', '', `… et ${erreurs.length - 5} autre(s)`));
  corps.append(liste);
  if (idARetirer !== undefined) {
    const retirer = creer('button', 'btn btn-petit', '🗑 Supprimer');
    retirer.addEventListener('click', () => {
      retirerMonMonde(idARetirer);
      afficherCartes();
    });
    corps.append(retirer);
  }
  carte.append(corps);
  return carte;
}

function carteAction(icone, texte, petit, action) {
  const bouton = creer('button', 'carte-monde carte-action');
  bouton.append(creer('span', 'grand', icone), creer('span', '', texte), creer('span', 'petit', petit));
  bouton.addEventListener('click', action);
  return bouton;
}

// Fabrique une carte sans jamais planter : un monde abîmé
// devient une « carte abîmée » au lieu de casser tout l'accueil.
function carteSure(monde, source, aDessiner) {
  const dessins = [];
  try {
    const carte = carteMonde(monde, source, dessins);
    aDessiner.push(...dessins);
    return carte;
  } catch (e) {
    const nom = typeof monde?.titre === 'string' ? monde.titre : 'Monde sans nom';
    return carteAbimee(nom, [e.message], source === 'perso' ? monde?.id : undefined);
  }
}

// Le bac à sable : une carte par terrain libre
function cartesBacASable(aDessiner) {
  const descriptions = ['avancer, tourner, arroser…', 'des pots à ranger comme tu veux', 'une feuille blanche à dessiner'];
  return creerBacASable().niveaux.map((niveau, i) => {
    const carte = creer('button', 'carte-monde carte-bac');
    const apercu = creer('canvas', 'apercu');
    apercu.setAttribute('aria-hidden', 'true');
    const corps = creer('div', 'carte-corps');
    corps.append(creer('h3', '', `${typeDuNiveau(niveau).icone} ${niveau.titre}`), creer('span', 'petit', descriptions[i]));
    carte.append(apercu, corps);
    carte.addEventListener('click', () => ouvrirBacASable(i));
    aDessiner.push(() => (niveau.type === 'fractale'
      ? dessinerApercuForet(apercu, gribouillis())
      : dessinerApercuNiveau(apercu, niveau)));
    return carte;
  });
}

// Un petit dessin pour la carte de la forêt libre : une spirale
function gribouillis() {
  const liane = new Fractale();
  for (let longueur = 4; longueur < 90; longueur += 4) {
    liane.pousser(longueur);
    liane.tourner(91);
  }
  return liane.traits;
}

function ouvrirBacASable(index) {
  stockage.ecrire(`pepin.dernier.${ID_BAC_A_SABLE}`, index);
  ouvrirMonde(creerBacASable());
}

function afficherCartes() {
  const aDessiner = [];
  el.grilleBac.replaceChildren(...cartesBacASable(aDessiner));

  cartesDesMondes.length = 0;
  const carteRetenue = (monde, source) => {
    const carte = carteSure(monde, source, aDessiner);
    cartesDesMondes.push({ monde, carte });
    return carte;
  };
  el.grilleBibliotheque.replaceChildren(...jeu.bibliotheque.map((entree) => (
    entree.monde
      ? carteRetenue(entree.monde, 'bibliotheque')
      : carteAbimee(entree.fichier, entree.erreur)
  )));

  el.grilleMesMondes.replaceChildren(
    ...mesMondes().map((monde) => carteRetenue(monde, 'perso')),
    carteAction('✨', 'Créer un monde', 'avec tes propres niveaux', creerMonde),
    carteAction('🔗', 'Ouvrir un lien', "qu'on t'a envoyé", ouvrirDialogueLien),
    carteAction('📥', 'Importer un fichier', 'un fichier .pepin', () => el.fichier.click()),
  );

  for (const dessiner of aDessiner) {
    try {
      dessiner();
    } catch {
      // pas d'aperçu, tant pis
    }
  }
  majStats();
  appliquerRecherche(); // après les dessins : une carte cachée n'aurait pas de taille
}

// --- La recherche : texte, difficulté, type, progression -----------------

const cartesDesMondes = []; // { monde, carte } de l'accueil
const recherche = { texte: '', difficulte: null, type: null, etat: null };

const FILTRES = [
  { cle: 'difficulte', nom: 'Difficulté', choix: Object.entries(DIFFICULTES).map(([n, texte]) => [Number(n), texte]) },
  { cle: 'type', nom: 'Type', choix: Object.entries(TYPES).map(([id, type]) => [id, `${type.icone} ${type.nom}`]) },
  { cle: 'etat', nom: 'Progression', choix: [['nouveau', '✨ À découvrir'], ['encours', '🌿 En cours'], ['fini', '🌷 Terminés']] },
];
const IDEES = ['boucle', 'condition', 'variable', 'fonction', 'liste', 'tri', 'récursivité', 'angle',
  'labyrinthe', 'modulo', 'déboguer', 'dichotomie'];

const sansAccents = (texte) => String(texte ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const motsCherches = () => sansAccents(recherche.texte).split(/\s+/).filter(Boolean);
// Un mot court (« tri », « si ») doit être un mot entier : « tri » ne doit pas trouver « triangle »
const contientMot = (texte, mot) => (mot.length <= 3
  ? new RegExp(`(^|[^a-z0-9])${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(texte)
  : texte.includes(mot));

function etatDuMonde(monde) {
  const reussis = progression(monde);
  if (reussis === 0) return 'nouveau';
  return reussis === monde.niveaux.length ? 'fini' : 'encours';
}

// Les filtres (sans le texte) : difficulté, type, progression
function passeLesFiltres(monde) {
  if (recherche.difficulte && (monde.difficulte ?? 1) !== recherche.difficulte) return false;
  if (recherche.type && !monde.niveaux.some((n) => n.type === recherche.type)) return false;
  return !recherche.etat || etatDuMonde(monde) === recherche.etat;
}

function texteDuNiveau(niveau) {
  return sansAccents([niveau.titre, niveau.concept, niveau.consigne, typeDuNiveau(niveau).nom].join(' '));
}

function correspond(monde) {
  if (!passeLesFiltres(monde)) return false;
  const mots = motsCherches();
  if (!mots.length) return true;
  const texte = sansAccents([monde.titre, monde.description, monde.auteur].join(' '))
    + monde.niveaux.map(texteDuNiveau).join(' ');
  return mots.every((mot) => contientMot(texte, mot));
}

function creerFiltres() {
  const groupes = FILTRES.map(({ cle, nom, choix }) => {
    const groupe = creer('div', 'groupe-filtres');
    groupe.setAttribute('role', 'group');
    groupe.setAttribute('aria-label', nom);
    groupe.append(creer('span', 'groupe-filtres-nom', nom));
    for (const [valeur, texte] of [[null, 'Tous'], ...choix]) {
      const puce = creer('button', 'puce', texte);
      puce.dataset.cle = cle;
      puce.addEventListener('click', () => {
        recherche[cle] = valeur;
        appliquerRecherche();
      });
      puce.valeur = valeur;
      groupe.append(puce);
    }
    return groupe;
  });
  const idees = creer('div', 'groupe-filtres');
  idees.append(creer('span', 'groupe-filtres-nom', '💡 Idées'));
  for (const idee of IDEES) {
    const puce = creer('button', 'puce puce-idee', idee);
    puce.addEventListener('click', () => {
      recherche.texte = recherche.texte === idee ? '' : idee;
      el.rechercheTexte.value = recherche.texte;
      appliquerRecherche();
    });
    idees.append(puce);
  }
  el.rechercheFiltres.replaceChildren(...groupes, idees);
}

function appliquerRecherche() {
  let visibles = 0;
  let total = 0;
  for (const { monde, carte } of cartesDesMondes) {
    const garde = correspond(monde);
    carte.hidden = !garde;
    total++;
    if (garde) visibles++;
  }
  // un message si la bibliothèque n'a plus aucune carte visible
  el.grilleBibliotheque.querySelector('.aucun-monde')?.remove();
  if (![...el.grilleBibliotheque.children].some((carte) => !carte.hidden)) {
    el.grilleBibliotheque.append(creer('p', 'aucun-monde', 'Aucun monde de la bibliothèque ne correspond… Essaie un autre mot ! 🌱'));
  }

  for (const puce of el.rechercheFiltres.querySelectorAll('.puce')) {
    const choisie = puce.classList.contains('puce-idee')
      ? sansAccents(recherche.texte) === sansAccents(puce.textContent)
      : recherche[puce.dataset.cle] === puce.valeur;
    puce.setAttribute('aria-pressed', String(choisie));
  }
  const actif = Boolean(recherche.texte.trim() || recherche.difficulte || recherche.type || recherche.etat);
  el.rechercheEffacer.hidden = !actif;
  el.rechercheResume.textContent = actif
    ? `${visibles} monde${visibles > 1 ? 's' : ''} sur ${total} 🌍`
    : `${total} mondes à explorer 🌍`;
  afficherNiveauxTrouves();
}

// Les niveaux dont le titre, la notion ou la consigne contiennent les mots cherchés
function afficherNiveauxTrouves() {
  const mots = motsCherches();
  const trouves = [];
  if (mots.length) {
    for (const { monde } of cartesDesMondes) {
      if (!passeLesFiltres(monde)) continue;
      monde.niveaux.forEach((niveau, index) => {
        const texte = texteDuNiveau(niveau);
        if (mots.every((mot) => contientMot(texte, mot))) trouves.push({ monde, niveau, index });
      });
    }
  }
  el.rechercheNiveaux.hidden = trouves.length === 0;
  if (!trouves.length) return;
  const liste = creer('div', 'niveaux-trouves');
  for (const { monde, niveau, index } of trouves.slice(0, 12)) {
    const bouton = creer('button', 'resultat-niveau');
    const textes = creer('span');
    textes.append(creer('strong', '', niveau.titre),
      creer('small', '', `${niveau.concept ? `${niveau.concept} · ` : ''}${monde.titre}, niveau ${index + 1}`));
    bouton.append(creer('span', 'grand', typeDuNiveau(niveau).icone), textes);
    bouton.addEventListener('click', () => {
      stockage.ecrire(`pepin.dernier.${monde.id}`, index);
      jouerMonde(monde);
    });
    liste.append(bouton);
  }
  const plus = trouves.length > 12 ? ` (les 12 premiers sur ${trouves.length})` : '';
  el.rechercheNiveaux.replaceChildren(creer('h3', '', `🎯 Niveaux trouvés${plus}`), liste);
}

el.rechercheTexte.addEventListener('input', () => {
  recherche.texte = el.rechercheTexte.value;
  appliquerRecherche();
});

el.rechercheEffacer.addEventListener('click', () => {
  Object.assign(recherche, { texte: '', difficulte: null, type: null, etat: null });
  el.rechercheTexte.value = '';
  appliquerRecherche();
  el.rechercheTexte.focus();
});

creerFiltres();

function afficherAccueil() {
  jeu.test = null;
  afficherVue('accueil');
  afficherCartes();
  parlerAccueil('Choisis un monde à faire fleurir ! 🌱');
}

function creerMonde() {
  const monde = nouveauMonde(tousLesIds());
  enregistrerMonMonde(monde);
  ouvrirEditeurMonde(monde);
}

// --- Importer, exporter et partager ------------------------------------

// Range un monde reçu (fichier ou lien) dans « Mes mondes ».
// Renvoie le monde à ouvrir (celui de la bibliothèque s'il existe déjà).
function accueillirMonde(monde) {
  const dejaDansLaBibliotheque = jeu.bibliotheque.find((entree) => entree.monde?.id === monde.id);
  if (dejaDansLaBibliotheque) return { monde: dejaDansLaBibliotheque.monde, message: `« ${monde.titre} » est déjà dans la bibliothèque ! 📚` };
  const problemes = problemesDeSolutions(monde);
  if (problemes.length) throw new ErreurMonde(problemes);
  const dejaLa = mesMondes().some((m) => m?.id === monde.id);
  enregistrerMonMonde(monde);
  return {
    monde,
    message: dejaLa ? `« ${monde.titre} » a été mis à jour ! 🎒` : `Youpi, « ${monde.titre} » est maintenant dans tes mondes ! 🎒`,
  };
}

// Un fichier .pepin peut contenir un monde, une sauvegarde ou un rendu
function formatDuTexte(texte) {
  try {
    return JSON.parse(texte)?.format ?? null;
  } catch {
    return null;
  }
}

el.fichier.addEventListener('change', async () => {
  const fichier = el.fichier.files[0];
  el.fichier.value = ''; // pour pouvoir réimporter le même fichier
  if (!fichier) return;
  const texte = await fichier.text();
  try {
    const format = formatDuTexte(texte);
    if (format === FORMAT_SAUVEGARDE) {
      const resume = restaurer(JSON.parse(texte));
      parlerAccueil(`Progression retrouvée : ${resume.niveaux} niveau${resume.niveaux > 1 ? 'x' : ''} réussi${resume.niveaux > 1 ? 's' : ''} ! 💾`, 'content');
    } else if (format === FORMAT_RENDU) {
      await ajouterRendus([texte]);
      ouvrirTableau();
    } else {
      const { message } = accueillirMonde(lireTexteMonde(texte));
      afficherCartes();
      parlerAccueil(message, 'content');
    }
  } catch (e) {
    parlerAccueil(`Petit pépin dans le fichier « ${fichier.name} » :`, 'oups', erreursDe(e));
  }
});

function telechargerTexte(nomDuFichier, texte, type = 'application/json') {
  const fichier = new Blob([texte], { type });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(fichier);
  lien.download = nomDuFichier;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  toast('Fichier téléchargé ⬇');
}

// Par défaut, la version pour les élèves (sans les solutions si le prof
// les a cachées). La version complète ne sert qu'au prof lui-même.
function telecharger(monde, { complet = false } = {}) {
  const contenu = complet ? monde : versionPourLesEleves(monde);
  const suffixe = complet && monde.solutionsVisibles === false ? '-complet' : '';
  telechargerTexte(`${nomDeFichier(monde.titre)}${suffixe}.pepin`, texteDuMonde(contenu));
}

// Les mondes de la bibliothèque se partagent tels quels. Les tiens doivent
// d'abord être complets : chaque niveau réussi au moins une fois par toi.
function pretAPartager(monde) {
  const estAMoi = mesMondes().some((m) => m?.id === monde.id);
  const raisons = estAMoi ? raisonsPasPartageable(monde) : [];
  if (raisons.length && !VUES.accueil.hidden) {
    parlerAccueil(`« ${monde.titre} » n'est pas encore prêt à être partagé :`, 'oups', raisons);
    el.bulleAccueil.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return raisons.length === 0;
}

function telechargerSiPret(monde) {
  if (pretAPartager(monde)) telecharger(monde);
}

function partagerSiPret(monde) {
  if (pretAPartager(monde)) partagerMonde(monde);
}

let mondePartage = null;

async function partagerMonde(monde) {
  mondePartage = monde;
  const protege = monde.solutionsVisibles === false;
  el.partageTitre.textContent = monde.titre;
  el.partageExplication.textContent = protege
    ? '🔒 Solutions cachées : ce lien contient tout le monde… sauf tes solutions. Tes élèves ne pourront pas tricher !'
    : 'Envoie ce lien : il contient tout le monde, solutions comprises. Pas besoin de compte !';
  el.partageComplet.hidden = !protege;
  el.partageLien.value = 'Je prépare le lien…';
  el.partageQr.replaceChildren();
  el.partageInfo.textContent = '';
  el.dialoguePartage.showModal();
  try {
    const lien = lienDuCode(await encoderMonde(monde));
    el.partageLien.value = lien;
    const qr = await fabriquerQR(lien).catch(() => null);
    if (qr) {
      el.partageQr.replaceChildren(qr);
      el.partageInfo.textContent = 'Ou scanne ce QR code avec une tablette ou un téléphone 📱';
    } else {
      el.partageInfo.textContent = `Ce lien est long (${lien.length} caractères) : envoie-le par message, ou envoie plutôt le fichier.`;
    }
  } catch (e) {
    el.partageLien.value = '';
    el.partageInfo.textContent = `Impossible de fabriquer le lien (${e.message}).`;
  }
}

el.partageCopier.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(el.partageLien.value);
  } catch {
    el.partageLien.select();
    document.execCommand('copy');
  }
  toast('Lien copié ! 📋');
});
el.partageFichier.addEventListener('click', () => mondePartage && telecharger(mondePartage));
el.partageComplet.addEventListener('click', () => mondePartage && telecharger(mondePartage, { complet: true }));
el.partageFermer.addEventListener('click', () => el.dialoguePartage.close());

function ouvrirDialogueLien() {
  el.ouvrirTexte.value = '';
  el.ouvrirErreur.hidden = true;
  el.dialogueOuvrir.showModal();
  el.ouvrirTexte.focus();
}

// Un lien ou un code : un monde à jouer, une sauvegarde, ou le rendu d'un élève
async function ouvrirCode(code) {
  const { sorte, json } = await decoderPaquet(code);
  if (sorte === 'sauvegarde') {
    const resume = restaurer(JSON.parse(json));
    afficherAccueil();
    parlerAccueil(`Progression retrouvée : ${resume.niveaux} niveau${resume.niveaux > 1 ? 'x' : ''} réussi${resume.niveaux > 1 ? 's' : ''} ! 💾`, 'content');
    return;
  }
  if (sorte === 'rendu') {
    await ajouterRendus([code]);
    ouvrirTableau();
    return;
  }
  const { monde, message } = accueillirMonde(lireTexteMonde(json));
  ouvrirMonde(monde);
  toast(message);
}

el.ouvrirValider.addEventListener('click', async () => {
  try {
    await ouvrirCode(el.ouvrirTexte.value);
    el.dialogueOuvrir.close();
  } catch (e) {
    el.ouvrirErreur.hidden = false;
    el.ouvrirErreur.textContent = `Petit pépin : ${erreursDe(e).slice(0, 3).join(' · ')}`;
  }
});
el.ouvrirAnnuler.addEventListener('click', () => el.dialogueOuvrir.close());

// Un lien de partage ouvert directement : …/index.html#monde=P1.…
async function ouvrirDepuisAdresse() {
  if (!location.hash.startsWith('#monde=')) return;
  const code = location.hash.slice('#monde='.length);
  history.replaceState(null, '', location.pathname + location.search);
  try {
    await ouvrirCode(code);
  } catch (e) {
    afficherAccueil();
    parlerAccueil('Ce lien de partage a un petit pépin :', 'oups', erreursDe(e));
  }
}

function jouerMonde(monde) {
  const erreurs = [...verifierMonde(monde)];
  if (!erreurs.length) erreurs.push(...problemesDeSolutions(monde));
  if (erreurs.length) {
    afficherAccueil();
    parlerAccueil(`« ${monde.titre} » a encore des choses à corriger :`, 'oups', erreurs);
    return;
  }
  ouvrirMonde(monde);
}

// =====================================================================
//  ÉCRAN DE JEU
// =====================================================================

function niveaux() {
  return jeu.monde.niveaux;
}

function niveauCourant() {
  return jeu.monde.niveaux[jeu.index];
}

function cleNiveau(index = jeu.index) {
  return `${jeu.monde.id}/${niveaux()[index].id}`;
}

function lecteurPour(type) {
  const Classe = { jardin: LecteurJardin, etagere: LecteurSerre, fractale: LecteurForet }[type] ?? LecteurJardin;
  lecteurs[type] ??= new Classe(el.plateau);
  if (lecteur && lecteur !== lecteurs[type]) lecteur.arreter();
  lecteur = lecteurs[type];
  return lecteur;
}

// L'espace des blocs. On le recrée quand on passe d'une boîte à outils
// « toujours ouverte » à une boîte à catégories (Blockly ne sait pas
// changer de l'une à l'autre).
function assurerWorkspace(cles, valeurs = {}) {
  const enCategories = toolboxEnCategories(cles);
  if (workspace && enCategories === workspaceEnCategories) {
    workspace.updateToolbox(creerToolbox(cles, valeurs));
    return;
  }
  if (workspace) {
    workspace.dispose();
    el.blockly.replaceChildren();
  }
  workspace = Blockly.inject(el.blockly, {
    renderer: 'zelos',
    theme: estNuit() ? THEME_NUIT : THEME,
    toolbox: creerToolbox(cles, valeurs),
    trashcan: true,
    // la molette fait défiler ; Ctrl + molette (ou le pincement) zoome
    zoom: { controls: true, startScale: window.innerWidth < 640 ? 0.7 : 0.85, wheel: true, maxScale: 2, minScale: 0.35 },
    grid: { spacing: 28, length: 3, colour: 'rgba(140, 150, 120, 0.25)', snap: true },
    move: { scrollbars: true, drag: true, wheel: true },
    maxInstances: { pepin_depart: 1 },
  });
  workspaceEnCategories = enCategories;
  brancherCategorieVariables(workspace);
  ajouterOmbresAuxAppels(workspace);
  brancherCategorieFonctions(workspace);
  fermerBullesAuClic(workspace);
  workspace.addChangeListener((evenement) => {
    if (evenement.isUiEvent || jeu.chargement || !jeu.monde) return;
    quitterPasAPas();
    const programme = Blockly.serialization.workspaces.save(workspace);
    stockage.ecrire(`pepin.programme.${cleNiveau()}`, programme);
    majPython();
    majDefi(programme);
  });
}

function preparerJeu(monde) {
  jeu.monde = monde;
  afficherVue('jeu');
}

function ouvrirMonde(monde) {
  try {
    jeu.test = null;
    if (!monde.libre) stockage.ecrire('pepin.dernierMonde', monde.id);
    preparerJeu(monde);
    el.nomMonde.textContent = monde.libre ? `🏖️ ${monde.titre}` : `🌍 ${monde.titre}`;
    const dernier = stockage.lire(`pepin.dernier.${monde.id}`, 0);
    chargerNiveau(Math.min(dernier, niveaux().length - 1));
  } catch (e) {
    afficherAccueil();
    parlerAccueil(`Je n'arrive pas à ouvrir « ${monde.titre} » : ${e.message}`, 'oups');
  }
}

// Le mode test : on joue UN niveau de l'éditeur. Le réussir enregistre la solution.
function tester(monde, index, { surSolution, surRetour }) {
  jeu.test = { surSolution, surRetour };
  preparerJeu({ id: `test-${monde.id}`, titre: monde.titre, solutionsVisibles: false, niveaux: [monde.niveaux[index]] });
  el.nomMonde.textContent = '🧪 Test de ton niveau';
  chargerNiveau(0);
}

function quitterTest() {
  const { surRetour } = jeu.test;
  jeu.test = null;
  if (el.victoire.open) el.victoire.close();
  surRetour();
}

function assurerDepart() {
  let depart = workspace.getBlocksByType('pepin_depart', false)[0];
  if (!depart) {
    depart = workspace.newBlock('pepin_depart');
    depart.initSvg();
    depart.render();
    depart.moveBy(40, 40);
  }
  depart.setDeletable(false);
}

function chargerProgramme() {
  jeu.chargement = true;
  workspace.clear();
  const niveau = niveauCourant();
  const sauvegarde = stockage.lire(`pepin.programme.${cleNiveau()}`, null)
    // les programmes d'avant les mondes étaient rangés sans l'id du monde
    ?? (jeu.monde.id === 'bases' ? stockage.lire(`pepin.programme.${niveau.id}`, null) : null)
    // en test, on repart de la solution déjà trouvée par l'auteur
    ?? (jeu.test ? niveau.solution : null)
    // un programme de départ (à compléter ou à déboguer 🐛)
    ?? niveau.depart ?? null;
  if (sauvegarde) {
    try {
      Blockly.serialization.workspaces.load(sauvegarde, workspace);
    } catch {
      workspace.clear();
    }
  }
  assurerDepart();
  jeu.chargement = false;
}

// --- Pépin parle --------------------------------------------------------

function parler(texte, humeur = 'neutre') {
  el.bulle.textContent = texte;
  humeurPepin = humeur;
  dessinerPortrait(el.portrait, humeur);
}

function messageTraduction(erreur, langue) {
  const trouve = /block type "([^"]+)"/.exec(erreur.message);
  if (trouve) return `Le bloc « ${nomDuBloc(trouve[1])} » ne sait pas encore se traduire en ${langue}.`;
  return `Petit pépin pendant la traduction en ${langue} : ${erreur.message}`;
}

function majPython() {
  if (!workspace) return;
  try {
    const code = genererCodePython(workspace);
    el.python.textContent = `# Programme de Pépin 🌱\nfrom pepin import *\n\n${code}`;
  } catch (erreur) {
    el.python.textContent = `# 🌱 ${messageTraduction(erreur, 'Python')}`;
  }
}

// --- Les informations autour de la scène ------------------------------

function majPots() {
  el.btnRendre.hidden = Boolean(jeu.test) || Boolean(jeu.monde.libre);
  if (jeu.test) {
    const retour = creer('button', 'btn btn-petit', "← Retour à l'éditeur");
    retour.addEventListener('click', quitterTest);
    el.jardin.replaceChildren(retour);
    return;
  }
  el.jardin.replaceChildren(
    ...niveaux().map((niveau, i) => {
      const cle = cleNiveau(i);
      const reussi = jeu.reussis.has(cle);
      const pot = creer('button', 'pot');
      if (reussi) pot.classList.add('reussi');
      if (i === jeu.index) pot.classList.add('actuel');
      pot.title = niveau.titre;
      pot.setAttribute('aria-label', `Niveau ${i + 1} : ${niveau.titre}${reussi ? ' (réussi)' : ''}`);
      const plante = reussi ? '🌷' : typeDuNiveau(niveau).icone;
      pot.append(creer('span', 'pot-plante', plante), creer('span', 'pot-num', `${i + 1}`));
      const badges = `${jeu.medailles.has(cle) ? '🏅' : ''}${jeu.enPython.has(cle) ? '🐍' : ''}`;
      if (badges) pot.append(creer('span', 'pot-badges', badges));
      pot.addEventListener('click', () => chargerNiveau(i));
      return pot;
    }),
  );
}

function majDefi(programme) {
  const niveau = niveauCourant();
  const max = niveau.exigences?.maxBlocs;
  el.defi.hidden = !max;
  if (!max) return;
  if (jeu.mode === 'python') {
    el.defi.textContent = `🏅 Défi bonus (avec les blocs) : ${max} blocs maximum`;
    el.defi.classList.remove('depasse');
    return;
  }
  const n = compterBlocs(programme ?? Blockly.serialization.workspaces.save(workspace));
  el.defi.textContent = `🏅 Défi bonus : ${max} blocs maximum · tu en utilises ${n}`;
  el.defi.classList.toggle('depasse', n > max);
}

function majChat() {
  if (!jeu.monde || jeu.test) {
    el.chat.hidden = true;
    return;
  }
  const niveau = niveauCourant();
  const permis = jeu.monde.solutionsVisibles !== false && Boolean(niveau.solution);
  const reussi = jeu.reussis.has(cleNiveau());
  const echecs = jeu.echecs.get(cleNiveau()) ?? 0;
  const etaitCache = el.chat.hidden;
  el.chat.hidden = !(permis && (reussi || echecs >= 3));
  el.chat.textContent = reussi ? "👀 Voir la solution de l'auteur" : '🐱 Je donne ma langue au chat';
  if (etaitCache && !el.chat.hidden && !reussi) toast('Tu bloques ? Tu peux donner ta langue au chat 🐱');
}

function memoireUtile(niveau) {
  return jeu.mode === 'python' || ['variables', 'pour', 'fonctions'].some((cle) => niveau.blocs.includes(cle));
}

function formaterValeur(valeur) {
  if (valeur === null || valeur === undefined) return '—';
  if (Array.isArray(valeur)) return `[${valeur.map(formaterValeur).join(', ')}]`;
  if (typeof valeur === 'string') return `"${valeur}"`;
  return formater(valeur);
}

let valeursAffichees = {};

function afficherMemoire(etape) {
  if (el.memoire.hidden) return;
  const variables = Object.entries(etape?.variables ?? {});
  el.bocaux.replaceChildren(...(variables.length
    ? variables.map(([nom, valeur]) => {
      const texte = formaterValeur(valeur);
      const bocal = creer('div', 'bocal');
      if (etape && nom in valeursAffichees && valeursAffichees[nom] !== texte) bocal.classList.add('change');
      bocal.append(creer('span', 'bocal-nom', nom), creer('span', 'bocal-valeur', texte));
      return bocal;
    })
    : [creer('p', 'vide', 'Pas encore de variable.')]));
  valeursAffichees = Object.fromEntries(variables.map(([nom, valeur]) => [nom, formaterValeur(valeur)]));

  const pile = etape?.pile ?? [];
  const appels = [...pile].reverse().map((appel, k) => {
    const args = Object.entries(appel.args ?? {}).map(([nom, valeur]) => `${nom} = ${formaterValeur(valeur)}`);
    return creer('li', k === 0 ? 'sommet' : '', `${appel.nom}(${args.join(', ')})`);
  });
  el.pile.replaceChildren(...appels, creer('li', pile.length ? '' : 'sommet', 'programme principal'));
}

// Le nom d'un essai : une étagère dans la serre, un jardin sinon
const nomDEssai = (niveau) => (niveau.type === 'etagere' ? 'Étagère' : 'Jardin');

// Les essais (étagères de la serre, jardins de test) : une miniature cliquable pour chacun.
// `courant` : celle qu'on est en train de jouer (ou null)
// `resultats` : true / false pour celles déjà jouées
function afficherEssais(total, courant, resultats) {
  el.essais.hidden = total <= 1;
  if (total <= 1) return;
  const niveau = niveauCourant();
  const essais = typeDuNiveau(niveau).essais(niveau);
  const dessins = [];
  const liste = creer('div', 'essais-liste');
  for (let i = 0; i < total; i++) {
    const bouton = creer('button', 'essai');
    if (i === (courant ?? jeu.essaiVu)) bouton.classList.add('choisi');
    if (i === courant) bouton.classList.add('en-cours');
    if (resultats[i] === true) bouton.classList.add('reussi');
    if (resultats[i] === false) bouton.classList.add('rate');
    const apercu = creer('canvas', 'essai-apercu');
    apercu.setAttribute('aria-hidden', 'true');
    let statut = '';
    if (resultats[i] === true) statut = ' ✓';
    if (resultats[i] === false) statut = ' ✗';
    bouton.append(apercu, creer('span', 'essai-nom', `${nomDEssai(niveau)} ${i + 1}${statut}`));
    bouton.title = `Voir : ${nomDEssai(niveau).toLowerCase()} ${i + 1}`;
    bouton.addEventListener('click', () => {
      if (jeu.enCours) return;
      jeu.essaiVu = i;
      afficherDepart();
    });
    dessins.push(() => (niveau.type === 'etagere'
      ? dessinerApercuSerre(apercu, niveau, i)
      : dessinerApercuNiveau(apercu, { ...niveau, carte: essais[i].carte })));
    liste.append(bouton);
  }
  const lesquels = niveau.type === 'etagere' ? 'toutes ces étagères' : 'tous ces jardins';
  el.essais.replaceChildren(creer('p', 'essais-titre', `Ton programme sera testé sur ${lesquels} (clique pour les voir) :`), liste);
  for (const dessiner of dessins) dessiner();
}

function surlignerEtape(etape) {
  if (jeu.mode === 'python') editeurPython?.surligner(etape?.ligne ?? null);
  else workspace?.highlightBlock(etape?.bloc ?? null);
}

// --- Les niveaux --------------------------------------------------------

function afficherDepart() {
  quitterPasAPas();
  const niveau = niveauCourant();
  const type = typeDuNiveau(niveau);
  const essais = type.essais(niveau);
  const essai = essais[jeu.essaiVu] ?? essais[0];
  lecteurPour(niveau.type).preparer({
    niveau,
    essai,
    modele: niveau.type === 'fractale' ? modeleFractale(niveau) : null,
  });
  lecteur.afficher(type.creer(niveau, essai).instantane());
  afficherEssais(essais.length, null, jeu.resultatsEssais);
  afficherMemoire(null);
}

function chargerNiveau(index) {
  arreter();
  if (el.victoire.open) el.victoire.close();
  jeu.index = index;
  jeu.essaiVu = 0;
  jeu.resultatsEssais = [];
  if (!jeu.test) stockage.ecrire(`pepin.dernier.${jeu.monde.id}`, index);
  const niveau = niveauCourant();

  el.titre.textContent = jeu.test || niveau.libre ? niveau.titre : `Niveau ${index + 1} · ${niveau.titre}`;
  el.concept.hidden = !niveau.concept;
  el.concept.textContent = niveau.concept ? `✨ Nouveau : ${niveau.concept}` : '';
  el.objectif.textContent = niveau.libre
    ? '🎨 Pas de but ici : invente, essaie, amuse-toi !'
    : typeDuNiveau(niveau).objectif?.(niveau) ?? '';
  el.terrain.hidden = !(niveau.libre && TERRAINS[niveau.type]);

  // L'atelier (on ne dessine jamais Blockly dans une zone cachée)
  const blocsCaches = el.blockly.hidden;
  el.blockly.hidden = false;
  // forêt : les blocs arrivent réglés sur les longueurs et angles du modèle
  const modele = niveau.type === 'fractale' ? modeleFractale(niveau) : null;
  assurerWorkspace(niveau.blocs, modele ? indicationsDuModele(modele.traits) : {});
  chargerProgramme();
  el.blockly.hidden = blocsCaches;
  if (jeu.mode === 'python') chargerCodePython();

  majPots();
  majPython();
  majDefi();
  majChat();
  el.memoire.hidden = !memoireUtile(niveau);
  majAidePython();

  try {
    afficherDepart();
    parler(jeu.test
      ? `Montre-moi que ton niveau est faisable : réussis-le et ta solution sera enregistrée ! (Consigne : ${niveau.consigne})`
      : consigneDuNiveau(niveau));
  } catch (erreur) {
    parler(`Petit pépin dans ce niveau : ${erreur.message}`, 'oups');
  }
}

// Dans la forêt, Pépin donne aussi les tailles du modèle
function consigneDuNiveau(niveau) {
  const modele = niveau.type === 'fractale' ? modeleFractale(niveau) : null;
  const indice = modele ? indiceDesTailles(indicationsDuModele(modele.traits)) : '';
  return indice ? `${niveau.consigne}\n${indice}` : niveau.consigne;
}

function indiceDesTailles({ longueur, angle, premier, plusPetit }) {
  if (!premier) return '';
  const morceaux = premier === plusPetit && premier === longueur
    ? [`tous les traits du modèle mesurent ${premier}`]
    : [`premier trait du modèle : ${premier}`, `plus petit : ${plusPetit}`];
  if (angle) morceaux.push(`virages de ${angle}°`);
  const texte = morceaux.join(' · ');
  return `📏 ${texte[0].toUpperCase()}${texte.slice(1)}.`;
}

// --- Le mode Python ---------------------------------------------------------

function majAidePython() {
  if (!jeu.monde) return;
  const aide = typeDuNiveau(niveauCourant()).aide ?? [];
  el.aidePython.replaceChildren(...aide.map(([signature, explication]) => {
    const ligne = creer('li');
    ligne.append(creer('code', '', signature), ` — ${explication}`);
    return ligne;
  }));
}

async function assurerEditeurPython() {
  if (editeurPython) return editeurPython;
  el.editeurPython.replaceChildren(creer('p', 'chargement', "Je prépare l'éditeur Python… 🐍"));
  try {
    const editeur = await creerEditeurPython(el.editeurPython, {
      surChangement: (texte) => {
        if (jeu.chargement || !jeu.monde) return;
        quitterPasAPas();
        stockage.ecrire(`pepin.python.${cleNiveau()}`, texte);
      },
    });
    el.editeurPython.querySelector('.chargement')?.remove();
    editeurPython = editeur;
  } catch (e) {
    el.editeurPython.replaceChildren(creer('p', 'chargement', `Impossible de charger l'éditeur (${e.message}). Vérifie ta connexion !`));
  }
  return editeurPython;
}

function codePythonDeDepart() {
  let traduction = '';
  try {
    traduction = genererCodePython(workspace).trim();
  } catch {
    // pas de traduction possible : on part d'une page blanche
  }
  return '# Mode difficile : écris ton programme en Python ! 🐍\n'
    + '# Les fonctions de Pépin sont rappelées juste en dessous.\n'
    + 'from pepin import *\n\n'
    + (traduction ? `${traduction}\n` : '');
}

function chargerCodePython() {
  if (!editeurPython || !jeu.monde) return;
  jeu.chargement = true;
  editeurPython.remplacer(stockage.lire(`pepin.python.${cleNiveau()}`, null) ?? codePythonDeDepart());
  jeu.chargement = false;
}

async function changerMode(mode) {
  arreter();
  jeu.mode = mode;
  stockage.ecrire('pepin.mode', mode);
  el.modeBlocs.setAttribute('aria-pressed', String(mode === 'blocs'));
  el.modePython.setAttribute('aria-pressed', String(mode === 'python'));
  el.blockly.hidden = mode !== 'blocs';
  el.traduction.hidden = mode !== 'blocs';
  el.zonePython.hidden = mode !== 'python';
  if (mode === 'python') {
    await assurerEditeurPython();
    chargerCodePython();
    editeurPython?.rafraichir();
    majAidePython();
    chargerPython().catch(() => {}); // on commence à télécharger Python en douce
    if (jeu.monde && !VUES.jeu.hidden) toast('Mode difficile : écris du vrai Python ! 🐍');
  } else if (workspace) {
    Blockly.svgResize(workspace);
  }
  if (jeu.monde) {
    majDefi();
    el.memoire.hidden = !memoireUtile(niveauCourant());
    afficherMemoire(null);
  }
}

// --- Lancer le programme ------------------------------------------------

function majBoutons() {
  el.lancer.disabled = jeu.enCours;
  el.lancer.textContent = jeu.enCours && !jeu.pasAPas ? '🌱 En cours…' : '▶ Lancer';
  el.etape.disabled = jeu.enCours;
  el.etape.textContent = jeu.pasAPas ? '⏭ Étape suivante' : '👣 Pas à pas';
  el.etape.classList.toggle('btn-principal', Boolean(jeu.pasAPas));
}

function quitterPasAPas() {
  if (!jeu.pasAPas) return;
  jeu.pasAPas = null;
  lecteur?.arreter();
  surlignerEtape(null);
  majBoutons();
}

function arreter() {
  jeu.pasAPas = null;
  lecteur?.arreter();
  surlignerEtape(null);
  jeu.enCours = false;
  majBoutons();
}

async function executerLeProgramme(niveau) {
  const options = optionsDuNiveau(niveau);
  if (jeu.mode === 'python') {
    await assurerEditeurPython();
    if (!pythonEstPret()) {
      parler('Je réveille le serpent Python… 🐍 La première fois, ça peut prendre quelques secondes.', 'neutre');
      await chargerPython();
    }
    return executerProgramme(lanceurPython(editeurPython?.valeur() ?? '', niveau), niveau, options);
  }
  return executer(genererCodeJS(workspace), niveau, options);
}

// Exécute le programme (sans l'animer). Renvoie null en cas de souci.
async function executerPourJouer(niveau) {
  jeu.enCours = true;
  majBoutons();
  try {
    return await executerLeProgramme(niveau);
  } catch (e) {
    parler(jeu.mode === 'python'
      ? `Je n'arrive pas à charger Python 😢 (${e.message}). Vérifie ta connexion internet !`
      : messageTraduction(e, 'JavaScript'), 'oups');
    return null;
  } finally {
    jeu.enCours = false;
    majBoutons();
  }
}

const modeleDe = (niveau) => (niveau.type === 'fractale' ? modeleFractale(niveau) : null);

async function lancer() {
  if (jeu.enCours || VUES.jeu.hidden || !jeu.monde) return;
  quitterPasAPas();
  const niveau = niveauCourant();
  const resultat = await executerPourJouer(niveau);
  if (!resultat) return;
  jeu.enCours = true;
  majBoutons();

  parler("C'est parti ! 🌱", 'content');
  const essais = typeDuNiveau(niveau).essais(niveau);
  const modele = modeleDe(niveau);
  const vitesse = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 2 : jeu.vitesse;
  for (let i = 0; i < resultat.essais.length; i++) {
    afficherEssais(essais.length, i, resultat.essais.slice(0, i).map((r) => r.gagne));
    lecteurPour(niveau.type).preparer({ niveau, essai: essais[i], modele });
    const termine = await lecteur.jouer(resultat.essais[i].etapes, {
      duree: VITESSES[vitesse].duree,
      surEtape: (etape) => {
        surlignerEtape(etape);
        afficherMemoire(etape);
        sonDeLEtape(etape.evenement);
      },
    });
    if (!termine) return; // on a cliqué sur Recommencer pendant l'animation
    if (resultat.essais[i].gagne && i < resultat.essais.length - 1) await pause(380);
  }
  await conclure(niveau, resultat, essais);
}

// La fin du programme (après l'animation) : bravo, ou ce qui ne va pas
async function conclure(niveau, resultat, essais) {
  surlignerEtape(null);
  jeu.resultatsEssais = resultat.essais.map((r) => r.gagne);
  jeu.essaiVu = resultat.essais.length - 1; // la dernière étagère jouée reste affichée
  afficherEssais(essais.length, null, jeu.resultatsEssais);

  if (niveau.libre) {
    if (!resultat.erreur && resultat.etapes.length > 1) {
      jeu.enCours = true;
      majBoutons();
      await lecteur.celebrer(); // la petite fête, même sans niveau à réussir
    }
    jeu.enCours = false;
    majBoutons();
    if (resultat.erreur) parler(resultat.erreur, 'oups');
    else if (resultat.etapes.length <= 1) parler("Je n'ai rien fait… Accroche des blocs sous « quand je clique sur Lancer » !", 'neutre');
    else parler(`Et voilà ! J'ai fait ${resultat.etapes.length - 1} action${resultat.etapes.length > 2 ? 's' : ''}. ✨ Qu'est-ce qu'on essaie maintenant ?`, 'content');
    return;
  }

  if (resultat.gagne) {
    jeu.enCours = true;
    majBoutons();
    await lecteur.celebrer();
    jeu.enCours = false;
    majBoutons();
    if (jeu.test) enregistrerSolution();
    else gagner();
    return;
  }

  jeu.enCours = false;
  majBoutons();
  jouerSon('rate');
  jeu.echecs.set(cleNiveau(), (jeu.echecs.get(cleNiveau()) ?? 0) + 1);
  const prefixe = essais.length > 1 ? `${nomDEssai(niveau)} ${resultat.essais.length} : ` : '';
  if (resultat.erreur) {
    parler(prefixe + resultat.erreur, 'oups');
  } else if (niveau.type === 'jardin' && resultat.etapes.length <= 1) {
    parler("Je n'ai rien à faire… Accroche des blocs sous « quand je clique sur Lancer » !", 'neutre');
  } else {
    parler(prefixe + resultat.message, 'neutre');
  }
  majChat();
}

// --- Le mode pas à pas : un clic = une action ---------------------------

const PHRASES_DES_ETAPES = {
  avancer: "J'avance d'une case.",
  bonk: 'Bonk ! Je me cogne… 💥',
  arroser: "J'arrose : une fleur pousse ! 🌷",
  'arroser-rien': "J'arrose… mais il n'y a pas de graine ici.",
  regarder: ({ i }) => `Je regarde la hauteur du pot n°${i}.`,
  echanger: ({ i, j }) => `J'échange les pots n°${i} et n°${j}.`,
  arroserPot: ({ i }) => `J'arrose le pot n°${i}.`,
  ajouterPot: "J'ajoute un pot au bout de l'étagère.",
  retirerPot: 'Je retire le dernier pot.',
  repondre: ({ valeur }) => `Je réponds : ${valeur}.`,
};

function phraseDeLEtape(avant, apres) {
  const a = avant.etat;
  const b = apres.etat;
  const distance = () => Math.round(Math.hypot(b.x - a.x, b.y - a.y) * 10) / 10;
  if (apres.evenement === 'pousser') return `La liane pousse de ${distance()} ! 🌿`;
  if (apres.evenement === 'reculer') return `Je recule de ${distance()}, sans dessiner.`;
  if (apres.evenement === 'tourner') {
    if (typeof b.angle !== 'number') return 'Je tourne.';
    const virage = ((((b.angle - a.angle) % 360) + 540) % 360) - 180;
    if (virage === 0) return 'Je fais un tour complet sur moi-même !';
    return `Je tourne de ${Math.abs(Math.round(virage * 10) / 10)}° ${virage > 0 ? '↻ (horaire)' : '↺ (antihoraire)'}.`;
  }
  const phrase = PHRASES_DES_ETAPES[apres.evenement];
  return typeof phrase === 'function' ? phrase(apres.details ?? {}) : (phrase ?? 'Je fais une action.');
}

function debuterEssaiPasAPas(niveau) {
  const pas = jeu.pasAPas;
  afficherEssais(pas.essais.length, pas.essai, pas.resultat.essais.slice(0, pas.essai).map((r) => r.gagne));
  lecteurPour(niveau.type).preparer({ niveau, essai: pas.essais[pas.essai], modele: modeleDe(niveau) });
  lecteur.debuter(pas.resultat.essais[pas.essai].etapes);
  afficherMemoire(null);
}

async function unPas() {
  if (jeu.pasAPas?.anime) {
    jeu.pasAPas.enAttente = true; // clic rapide : on enchaîne dès que l'étape est finie
    return;
  }
  if (jeu.enCours || VUES.jeu.hidden || !jeu.monde) return;
  const niveau = niveauCourant();
  if (!jeu.pasAPas) {
    lecteur?.arreter();
    const resultat = await executerPourJouer(niveau);
    if (!resultat) return;
    const essais = typeDuNiveau(niveau).essais(niveau);
    jeu.pasAPas = { resultat, essais, essai: 0, etape: 0, anime: false, enAttente: false, essaiFini: false };
    majBoutons();
    debuterEssaiPasAPas(niveau);
  } else if (jeu.pasAPas.essaiFini) {
    const pas = jeu.pasAPas;
    pas.essai++;
    pas.etape = 0;
    pas.essaiFini = false;
    debuterEssaiPasAPas(niveau);
    parler(`${nomDEssai(niveau)} ${pas.essai + 1} : on reprend ton programme depuis le début ! 👣`);
    if (pas.resultat.essais[pas.essai].etapes.length > 1) return;
  }

  const pas = jeu.pasAPas;
  const etapes = pas.resultat.essais[pas.essai].etapes;
  if (pas.etape < etapes.length - 1) {
    const avant = etapes[pas.etape];
    const apres = etapes[pas.etape + 1];
    surlignerEtape(apres);
    afficherMemoire(apres);
    sonDeLEtape(apres.evenement);
    parler(`👣 Étape ${pas.etape + 1} sur ${etapes.length - 1} : ${phraseDeLEtape(avant, apres)}`);
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pas.anime = true;
    const fini = await lecteur.jouerUneEtape(avant, apres, reduit ? 0 : Math.min(VITESSES[jeu.vitesse].duree, 450));
    pas.anime = false;
    if (!fini || jeu.pasAPas !== pas) return; // on a changé de niveau, recommencé…
    pas.etape++;
    if (pas.etape < etapes.length - 1) {
      if (pas.enAttente) {
        pas.enAttente = false;
        unPas();
      }
      return;
    }
  }

  // Cette étagère est finie
  if (pas.essai < pas.resultat.essais.length - 1) {
    pas.essaiFini = true;
    afficherEssais(pas.essais.length, pas.essai, pas.resultat.essais.slice(0, pas.essai + 1).map((r) => r.gagne));
    const nom = nomDEssai(niveau);
    parler(`${el.bulle.textContent}\n✓ ${nom} ${pas.essai + 1} réussi${nom === 'Étagère' ? 'e' : ''} ! Clique encore pour passer au suivant (${nom.toLowerCase()} ${pas.essai + 2}).`, 'content');
    return;
  }
  jeu.pasAPas = null;
  majBoutons();
  await conclure(niveau, pas.resultat, pas.essais);
}

const BRAVOS = {
  jardin: 'Une nouvelle fleur a poussé dans ton jardin. 🌷',
  etagere: 'Toutes les étagères sont parfaites ! 🪴',
  fractale: 'La liane a fleuri, exactement comme le modèle ! 🌀',
};

function montrerVictoire({ titre = 'Bravo !', texte, bonus = null, suivant }) {
  el.victoireTitre.textContent = titre;
  el.victoireTexte.textContent = texte;
  el.victoireBonus.hidden = !bonus;
  el.victoireBonus.textContent = bonus ?? '';
  el.suivant.textContent = suivant;
  const couleurs = ['#FF8A7A', '#FFD66B', '#4FAF80', '#8F7FD6'];
  el.petales.replaceChildren(...Array.from({ length: 22 }, (_, i) => {
    const petale = creer('span', 'petale');
    petale.style.left = `${Math.random() * 100}%`;
    petale.style.animationDelay = `${Math.random() * 0.8}s`;
    petale.style.background = couleurs[i % couleurs.length];
    return petale;
  }));
  el.victoire.showModal();
  dessinerPortrait($('portrait-victoire'), 'content');
}

function gagner() {
  const niveau = niveauCourant();
  const cle = cleNiveau();
  jeu.reussis.add(cle);
  stockage.ecrire('pepin.reussis', [...jeu.reussis]);
  // On garde le programme gagnant : il partira dans le rendu au prof 📮
  if (jeu.mode === 'python') retenirProgrammeGagnant(cle, { python: editeurPython?.valeur() ?? '' });
  else retenirProgrammeGagnant(cle, { blocs: allegerProgramme(Blockly.serialization.workspaces.save(workspace)) });

  let bonus = null;
  let medaille = false;
  const max = niveau.exigences?.maxBlocs;
  if (jeu.mode === 'python') {
    jeu.enPython.add(cle);
    stockage.ecrire('pepin.python', [...jeu.enPython]);
    bonus = '🐍 Réussi en Python : chapeau !';
  } else if (max) {
    const n = compterBlocs(Blockly.serialization.workspaces.save(workspace));
    if (n <= max) {
      medaille = true;
      jeu.medailles.add(cle);
      stockage.ecrire('pepin.medailles', [...jeu.medailles]);
      bonus = `🏅 Défi réussi : ${n} bloc${n > 1 ? 's' : ''} pour ${max} au maximum !`;
    } else {
      bonus = `🏅 Défi bonus : tu as utilisé ${n} blocs. Sauras-tu le faire en ${max} ?`;
    }
  }

  majPots();
  majChat();
  parler('Youpi ! Réussi ! 🌸', 'content');
  jouerSon('victoire');
  if (medaille) setTimeout(() => jouerSon('medaille'), 450);

  const dernier = jeu.index === niveaux().length - 1;
  const rendre = lireProfil()?.classe ? ' Tu peux rendre ton travail à ton prof avec 📮.' : '';
  montrerVictoire({
    texte: dernier ? `Tu as terminé le monde « ${jeu.monde.titre} » ! 🌻${rendre}` : BRAVOS[niveau.type] ?? BRAVOS.jardin,
    bonus,
    suivant: dernier ? '🌍 Autres mondes' : 'Niveau suivant →',
  });
}

// En mode test : la solution ne compte que si elle utilise les blocs du
// niveau (et respecte le défi, s'il y en a un)
function enregistrerSolution() {
  const niveau = niveauCourant();
  if (jeu.mode === 'python') {
    parler("Bravo ! Mais la solution d'un niveau s'enregistre avec les blocs 🧩 : les joueurs pourront la regarder. Repasse en mode Blocs !", 'neutre');
    return;
  }
  const programme = Blockly.serialization.workspaces.save(workspace);
  const autorises = typesAutorises(niveau.blocs);
  const interdits = new Set(workspace.getAllBlocks(false)
    .filter((bloc) => !bloc.isShadow() && !autorises.has(bloc.type))
    .map((bloc) => nomDuType(bloc.type)));
  if (interdits.size) {
    const noms = [...interdits].map((nom) => `« ${nom} »`).join(', ');
    parler(`Bravo, mais ta solution utilise ${noms}, qui n'est pas dans les blocs de ce niveau. Enlève-le, ou ajoute-le dans l'éditeur !`, 'oups');
    return;
  }
  const max = niveau.exigences?.maxBlocs;
  const n = compterBlocs(programme);
  if (max && n > max) {
    parler(`Ton niveau est faisable, mais avec ${n} blocs : ton défi en demande ${max} au maximum. Trouve plus court, ou change le défi !`, 'oups');
    return;
  }

  jeu.test.surSolution(allegerProgramme(programme));
  parler('Ton niveau est faisable : ta solution est enregistrée ! ✅', 'content');
  jouerSon('victoire');
  montrerVictoire({
    titre: 'Niveau validé !',
    texte: niveau.type === 'fractale' && !niveau.solution && !niveau.modele
      ? 'Ton dessin devient le modèle du niveau ✅'
      : 'Ta solution est enregistrée : ton niveau est prêt à être partagé ✅',
    suivant: "← Retour à l'éditeur",
  });
}

// --- La langue au chat 🐱 ------------------------------------------------

let espaceSolution = null;

function ouvrirSolution() {
  const niveau = niveauCourant();
  if (!niveau.solution) return;
  el.dialogueSolution.showModal();
  espaceSolution?.dispose();
  el.solutionBlocs.replaceChildren();
  espaceSolution = Blockly.inject(el.solutionBlocs, {
    readOnly: true,
    renderer: 'zelos',
    theme: estNuit() ? THEME_NUIT : THEME,
    zoom: { controls: true, startScale: 0.8, wheel: true },
    move: { scrollbars: true, drag: true, wheel: true },
  });
  Blockly.serialization.workspaces.load(niveau.solution, espaceSolution);
  espaceSolution.zoomToFit();
  if (espaceSolution.getScale() > 0.9) espaceSolution.setScale(0.9);
  espaceSolution.scrollCenter();
  el.solutionPython.textContent = `# La solution en Python\nfrom pepin import *\n\n${genererCodePython(espaceSolution)}`;
}

function fermerSolution() {
  el.dialogueSolution.close();
}

el.dialogueSolution.addEventListener('close', () => {
  espaceSolution?.dispose();
  espaceSolution = null;
});

el.solutionCopier.addEventListener('click', () => {
  const niveau = niveauCourant();
  if (jeu.mode === 'python') {
    if (editeurPython && confirm('Remplacer ton code Python par la solution ?')) {
      editeurPython.remplacer(el.solutionPython.textContent.replace('# La solution en Python', '# La solution de l’auteur'));
    }
  } else if (confirm('Remplacer ton programme par la solution ?')) {
    workspace.clear();
    Blockly.serialization.workspaces.load(niveau.solution, workspace);
    assurerDepart();
  }
  fermerSolution();
});
el.solutionFermer.addEventListener('click', fermerSolution);

// --- Boutons --------------------------------------------------------------

el.lancer.addEventListener('click', lancer);
el.etape.addEventListener('click', unPas);

el.reset.addEventListener('click', () => {
  arreter();
  try {
    afficherDepart();
  } catch {
    // niveau abîmé : le message est déjà affiché
  }
  parler(consigneDuNiveau(niveauCourant()));
});

el.vitesse.addEventListener('click', () => {
  jeu.vitesse = (jeu.vitesse + 1) % VITESSES.length;
  el.vitesse.textContent = VITESSES[jeu.vitesse].nom;
});

el.chat.addEventListener('click', ouvrirSolution);

el.terrain.addEventListener('click', () => {
  const niveau = niveauCourant();
  if (!niveau.libre || !TERRAINS[niveau.type]) return;
  arreter();
  TERRAINS[niveau.type].tirer(niveau);
  afficherDepart();
  parler(niveau.type === 'jardin' ? 'Tout nouveau jardin ! 🌱 Où va-t-on ?' : 'Une nouvelle étagère ! 🪴 Que fait-on de ces pots ?', 'content');
});

el.suivant.addEventListener('click', () => {
  if (jeu.test) quitterTest();
  else if (jeu.index === niveaux().length - 1) afficherAccueil();
  else chargerNiveau(jeu.index + 1);
});

el.rejouer.addEventListener('click', () => {
  el.victoire.close();
  afficherDepart();
});

el.modeBlocs.addEventListener('click', () => changerMode('blocs'));
el.modePython.addEventListener('click', () => changerMode('python'));

el.btnMondes.addEventListener('click', afficherAccueil);
el.accueilBouton.addEventListener('click', afficherAccueil);

el.traduction.addEventListener('toggle', () => workspace && Blockly.svgResize(workspace));

document.addEventListener('keydown', (evenement) => {
  if ((evenement.ctrlKey || evenement.metaKey) && evenement.key === 'Enter' && !VUES.jeu.hidden) {
    evenement.preventDefault();
    lancer();
  }
});

let minuteurRedimension = null;
window.addEventListener('resize', () => {
  clearTimeout(minuteurRedimension);
  minuteurRedimension = setTimeout(() => {
    if (workspace) Blockly.svgResize(workspace);
    if (!VUES.jeu.hidden && !jeu.enCours) lecteur?.redessiner();
  }, 120);
});

// --- Le son et la nuit ------------------------------------------------------

function majBoutonSon() {
  el.btnSon.textContent = sonsActifs() ? '🔊' : '🔇';
  el.btnSon.title = sonsActifs() ? 'Couper les sons' : 'Activer les sons';
  el.btnSon.setAttribute('aria-pressed', String(sonsActifs()));
}

el.btnSon.addEventListener('click', () => {
  activerSons(!sonsActifs());
  majBoutonSon();
});

function majBoutonTheme() {
  el.btnTheme.textContent = estNuit() ? '☀️' : '🌙';
  el.btnTheme.title = estNuit() ? 'Mode jour' : 'Mode nuit';
}

el.btnTheme.addEventListener('click', basculerTheme);

window.addEventListener('pepin:theme', () => {
  majBoutonTheme();
  workspace?.setTheme(estNuit() ? THEME_NUIT : THEME);
  espaceSolution?.setTheme(estNuit() ? THEME_NUIT : THEME);
  dessinerPortrait(el.logo, 'content');
  portraitAccueil.redessiner();
  dessinerPortrait(el.portrait, humeurPepin);
  if (!VUES.jeu.hidden && !jeu.enCours) lecteur?.redessiner();
  if (!VUES.accueil.hidden) afficherCartes();
});

// --- On branche l'éditeur ---------------------------------------------------

brancherEditeur({
  afficherVue,
  afficherAccueil,
  jouerMonde,
  tester,
  telecharger,
  partagerMonde,
  toast,
});

// --- Le carnet de l'élève et le tableau du prof ------------------------------

// Après une restauration de sauvegarde : on relit la progression
function apresRestauration() {
  jeu.reussis = lireReussis();
  jeu.medailles = lireEnsemble('pepin.medailles');
  jeu.enPython = lireEnsemble('pepin.python');
  if (!VUES.accueil.hidden) afficherCartes();
  if (!VUES.jeu.hidden && jeu.monde) majPots();
}

brancherCarnet({
  progression: () => ({ reussis: jeu.reussis, medailles: jeu.medailles, enPython: jeu.enPython }),
  apresRestauration,
  toast,
  telechargerTexte,
});

brancherTableau({
  afficherVue,
  afficherAccueil,
  mondesConnus: () => [...jeu.bibliotheque.map((entree) => entree.monde).filter(Boolean), ...mesMondes()],
  toast,
  telechargerTexte,
});

el.btnProfil.addEventListener('click', ouvrirProfil);
el.btnSauvegarde.addEventListener('click', ouvrirSauvegarde);
el.btnRendre.addEventListener('click', () => jeu.monde && ouvrirRendu(jeu.monde));
el.btnTableau.addEventListener('click', ouvrirTableau);

// --- C'est parti ! ----------------------------------------------------------

el.vitesse.textContent = VITESSES[jeu.vitesse].nom;
majBoutonSon();
majBoutonTheme();
if (jeu.mode === 'python') changerMode('python');
afficherAccueil();
parlerAccueil('Je prépare les mondes… 🌱');

try {
  const bibliotheque = await chargerBibliotheque();
  // On vérifie aussi que les solutions de la bibliothèque marchent
  jeu.bibliotheque = bibliotheque.map((entree) => {
    if (!entree.monde) return entree;
    const problemes = problemesDeSolutions(entree.monde);
    return problemes.length ? { fichier: entree.monde.titre, erreur: problemes } : entree;
  });
  afficherCartes();
  parlerAccueil('Choisis un monde à faire fleurir ! Ou crée le tien ✨');
} catch (e) {
  parlerAccueil("Je n'arrive pas à charger la bibliothèque des mondes 😢", 'oups', [
    e.message,
    'As-tu bien ouvert le jeu avec un serveur local (Live Server) ? Voir PARCOURS.md.',
  ]);
}

ouvrirDepuisAdresse();
window.addEventListener('hashchange', ouvrirDepuisAdresse);
