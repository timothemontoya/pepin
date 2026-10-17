// =============================================================
//  tableau.js — Le tableau de bord du prof 📊
// =============================================================
//
//  Le prof colle les codes rendus par ses élèves. On les garde dans
//  SON navigateur, et on affiche un tableau élèves × niveaux.
//  Chaque programme d'élève est refait tourner : ✅ = vérifié.
//  (Les programmes Python ne sont pas exécutés ici, par prudence :
//  le prof peut les lire en cliquant sur la case.)
// =============================================================

import {
  rendusEnregistres, enregistrerRendus, ajouterRendu, verifierRendu, etatCase, motDeLEtat,
  versCSV, nomComplet, identiteEleve,
} from './classe.js';
import { decoderPaquet } from './partage.js';
import { THEME, THEME_NUIT, genererCodePython } from './blocs.js';
import { estNuit } from './theme.js';
import { nomDeFichier } from './mondes.js';
import { typeDuNiveau } from './types.js';

// Les fonctions de main.js dont le tableau a besoin (voir brancherTableau)
let app = null;

const tb = { monde: null, classe: '' };
const etatsEnCache = new Map();

const $ = (id) => document.getElementById(id);
const el = {
  vue: $('vue-prof'),
  retour: $('tp-retour'),
  codes: $('tp-codes'),
  ajouter: $('tp-ajouter'),
  fichiers: $('tp-fichiers'),
  fichiersInput: $('tp-fichiers-input'),
  message: $('tp-message'),
  resultats: $('tp-resultats'),
  vide: $('tp-vide'),
  monde: $('tp-monde'),
  classe: $('tp-classe'),
  avertissement: $('tp-avertissement'),
  tableau: $('tp-tableau'),
  csv: $('tp-csv'),
  effacer: $('tp-effacer'),
  dialogue: $('dialogue-programme'),
  dialogueTitre: $('programme-titre'),
  dialogueEtat: $('programme-etat'),
  dialogueBlocs: $('programme-blocs'),
  dialoguePython: $('programme-python'),
  dialogueFermer: $('programme-fermer'),
};

function creer(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

// main.js donne : afficherVue, afficherAccueil, mondesConnus(), toast, telechargerTexte
export function brancherTableau(fonctions) {
  app = fonctions;
}

export function ouvrirTableau() {
  app.afficherVue('prof');
  afficher();
}

// --- Recevoir des rendus ---------------------------------------------------

function annoncer(texte, details = [], oups = false) {
  el.message.classList.toggle('oups', oups);
  el.message.replaceChildren(creer('p', '', texte));
  if (details.length) {
    const liste = creer('ul');
    for (const detail of details.slice(0, 12)) liste.append(creer('li', '', detail));
    if (details.length > 12) liste.append(creer('li', '', `… et ${details.length - 12} autre(s)`));
    el.message.append(liste);
  }
}

const raccourcir = (texte) => (texte.length > 24 ? `${texte.slice(0, 24)}…` : texte);

// `textes` : des codes (R1.…) ou le contenu de fichiers .pepin (du JSON)
export async function ajouterRendus(textes) {
  let liste = rendusEnregistres();
  const recus = [];
  const problemes = [];
  for (const texte of textes) {
    try {
      let donnees;
      if (texte.trim().startsWith('{')) {
        donnees = JSON.parse(texte);
      } else {
        const { sorte, json } = await decoderPaquet(texte);
        if (sorte !== 'rendu') throw new Error(sorte === 'monde' ? "c'est un monde, pas un rendu" : "c'est une sauvegarde, pas un rendu");
        donnees = JSON.parse(json);
      }
      const erreurs = verifierRendu(donnees);
      if (erreurs.length) throw new Error(erreurs[0]);
      const resultat = ajouterRendu(liste, donnees);
      liste = resultat.liste;
      recus.push(`${nomComplet(donnees.eleve)} — « ${donnees.monde.titre} »${resultat.ajoute ? '' : ' (déjà reçu)'}`);
      tb.monde = donnees.monde.id;
    } catch (e) {
      problemes.push(`${raccourcir(texte.trim())} : ${e.message}`);
    }
  }
  enregistrerRendus(liste);
  if (recus.length) {
    annoncer(`${recus.length} rendu${recus.length > 1 ? 's' : ''} reçu${recus.length > 1 ? 's' : ''} ✅`, [...recus, ...problemes.map((p) => `⚠️ ${p}`)]);
  } else if (problemes.length) {
    annoncer('Je n’ai rien pu lire 😢', problemes, true);
  }
  afficher();
}

el.ajouter.addEventListener('click', async () => {
  const texte = el.codes.value.trim();
  if (!texte) return;
  // un fichier collé en entier (JSON), ou plusieurs codes séparés par des espaces
  const morceaux = texte.startsWith('{') ? [texte] : texte.split(/\s+/).filter(Boolean);
  await ajouterRendus(morceaux);
  el.codes.value = '';
});

el.fichiers.addEventListener('click', () => el.fichiersInput.click());
el.fichiersInput.addEventListener('change', async () => {
  const textes = await Promise.all([...el.fichiersInput.files].map((fichier) => fichier.text()));
  el.fichiersInput.value = '';
  if (textes.length) await ajouterRendus(textes);
});

el.retour.addEventListener('click', () => app.afficherAccueil());

// --- Le tableau ---------------------------------------------------------------

function option(valeur, texte, choisie) {
  const element = creer('option', '', texte);
  element.value = valeur;
  element.selected = choisie;
  return element;
}

const parEleve = (a, b) => (a.eleve.classe ?? '').localeCompare(b.eleve.classe ?? '', 'fr')
  || a.eleve.prenom.localeCompare(b.eleve.prenom, 'fr');

function dateLisible(iso) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function etatDe(rendu, niveauMonde, niveauRendu) {
  const cle = `${rendu.monde.id}|${identiteEleve(rendu.eleve)}|${rendu.date}|${niveauMonde?.id ?? niveauRendu?.id}|${Boolean(niveauMonde)}`;
  if (!etatsEnCache.has(cle)) etatsEnCache.set(cle, etatCase(niveauMonde, niveauRendu));
  return etatsEnCache.get(cle);
}

// Les colonnes : les niveaux du monde (version du prof), ou ceux des rendus
function colonnesPour(monde, rendus) {
  if (monde) return monde.niveaux.map((n) => ({ id: n.id, titre: n.titre, niveau: n }));
  const colonnes = new Map();
  for (const rendu of rendus) {
    for (const n of rendu.niveaux) if (!colonnes.has(n.id)) colonnes.set(n.id, { id: n.id, titre: n.titre ?? n.id, niveau: null });
  }
  return [...colonnes.values()];
}

function afficher() {
  const rendus = rendusEnregistres();
  el.vide.hidden = rendus.length > 0;
  el.resultats.hidden = rendus.length === 0;
  if (!rendus.length) return;

  const mondes = new Map(rendus.map((r) => [r.monde.id, r.monde.titre]));
  if (!mondes.has(tb.monde)) tb.monde = rendus[rendus.length - 1].monde.id;
  el.monde.replaceChildren(...[...mondes].map(([id, titre]) => option(id, titre, id === tb.monde)));

  const duMonde = rendus.filter((r) => r.monde.id === tb.monde);
  const classes = [...new Set(duMonde.map((r) => r.eleve.classe ?? '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  if (tb.classe && !classes.includes(tb.classe)) tb.classe = '';
  el.classe.replaceChildren(option('', 'Toutes les classes', tb.classe === ''), ...classes.map((c) => option(c, c, c === tb.classe)));

  const visibles = duMonde.filter((r) => !tb.classe || (r.eleve.classe ?? '') === tb.classe).sort(parEleve);
  const monde = app.mondesConnus().find((m) => m.id === tb.monde) ?? null;
  el.avertissement.hidden = Boolean(monde);
  el.avertissement.textContent = 'Je ne connais pas ce monde sur cet ordinateur : ouvre son lien (ou importe son fichier) '
    + 'pour que je puisse revérifier les programmes. En attendant, je te montre ce que disent les rendus.';
  construireTableau(visibles, monde);
}

function construireTableau(rendus, monde) {
  const colonnes = colonnesPour(monde, rendus);

  const entete = creer('tr');
  entete.append(creer('th', '', 'Élève'));
  colonnes.forEach((colonne, i) => {
    const th = creer('th', '', `${colonne.niveau ? typeDuNiveau(colonne.niveau).icone : ''} ${i + 1}`.trim());
    th.title = colonne.titre;
    entete.append(th);
  });
  entete.append(creer('th', '', 'Total'));

  const reussisParColonne = colonnes.map(() => 0);
  const lignes = rendus.map((rendu) => {
    const ligne = creer('tr');
    const nom = creer('th');
    const nomEtDate = creer('span');
    nomEtDate.append(nomComplet(rendu.eleve), creer('span', 'date-rendu', `rendu le ${dateLisible(rendu.date)}`));
    const retirer = creer('button', 'btn-mini', '🗑');
    retirer.title = 'Retirer ce rendu';
    retirer.setAttribute('aria-label', `Retirer le rendu de ${nomComplet(rendu.eleve)}`);
    retirer.addEventListener('click', () => {
      if (!confirm(`Retirer le rendu de ${nomComplet(rendu.eleve)} ?`)) return;
      enregistrerRendus(rendusEnregistres().filter((r) => !(r.monde.id === rendu.monde.id
        && identiteEleve(r.eleve) === identiteEleve(rendu.eleve))));
      afficher();
    });
    const boite = creer('span', 'nom-eleve');
    boite.append(nomEtDate, retirer);
    nom.append(boite);
    ligne.append(nom);

    let total = 0;
    colonnes.forEach((colonne, i) => {
      const niveauRendu = rendu.niveaux.find((n) => n.id === colonne.id);
      const etat = etatDe(rendu, colonne.niveau, niveauRendu);
      if (etat.code !== 'vide' && etat.code !== 'faux') {
        total++;
        reussisParColonne[i]++;
      }
      const td = creer('td');
      const bouton = creer('button', `case ${etat.code}`, etat.symbole);
      bouton.title = `${colonne.titre} : ${etat.texte}`;
      bouton.setAttribute('aria-label', `${nomComplet(rendu.eleve)}, niveau ${i + 1} : ${etat.texte}`);
      if (etat.code !== 'vide') bouton.addEventListener('click', () => voirProgramme(rendu, colonne, niveauRendu, etat));
      td.append(bouton);
      ligne.append(td);
    });
    ligne.append(creer('td', '', `${total} / ${colonnes.length}`));
    return ligne;
  });

  const pied = creer('tr');
  pied.append(creer('th', '', 'Réussi par'));
  reussisParColonne.forEach((n) => pied.append(creer('td', '', `${n}/${rendus.length}`)));
  pied.append(creer('td', '', ''));

  const thead = creer('thead');
  thead.append(entete);
  const tbody = creer('tbody');
  tbody.append(...lignes);
  const tfoot = creer('tfoot');
  tfoot.append(pied);
  el.tableau.replaceChildren(thead, tbody, tfoot);
}

el.monde.addEventListener('change', () => {
  tb.monde = el.monde.value;
  tb.classe = '';
  afficher();
});

el.classe.addEventListener('change', () => {
  tb.classe = el.classe.value;
  afficher();
});

// --- Voir le programme d'un élève ------------------------------------------------

let espace = null;

function voirProgramme(rendu, colonne, niveauRendu, etat) {
  el.dialogueTitre.textContent = `${nomComplet(rendu.eleve)} — ${colonne.titre}`;
  el.dialogueEtat.textContent = `${etat.symbole} ${etat.texte}`;
  el.dialogue.showModal();
  espace?.dispose();
  espace = null;
  el.dialogueBlocs.replaceChildren();
  el.dialogueBlocs.hidden = !niveauRendu?.programme;
  let python = '';
  if (niveauRendu?.programme) {
    try {
      espace = Blockly.inject(el.dialogueBlocs, {
        readOnly: true,
        renderer: 'zelos',
        theme: estNuit() ? THEME_NUIT : THEME,
        zoom: { controls: true, startScale: 0.8, wheel: true },
        move: { scrollbars: true, drag: true, wheel: true },
      });
      Blockly.serialization.workspaces.load(niveauRendu.programme, espace);
      espace.zoomToFit();
      if (espace.getScale() > 0.9) espace.setScale(0.9);
      espace.scrollCenter();
      python = `# Le programme en Python\n${genererCodePython(espace)}`;
    } catch (e) {
      el.dialogueBlocs.hidden = true;
      python = `# Programme illisible (${e.message})`;
    }
  }
  if (niveauRendu?.codePython) python = `${python ? `${python}\n` : ''}# Écrit en Python par l'élève\n${niveauRendu.codePython}`;
  el.dialoguePython.textContent = python || 'Pas de programme gardé pour ce niveau.';
}

el.dialogue.addEventListener('close', () => {
  espace?.dispose();
  espace = null;
});
el.dialogueFermer.addEventListener('click', () => el.dialogue.close());

// --- Exporter et effacer -----------------------------------------------------------

el.csv.addEventListener('click', () => {
  const rendus = rendusEnregistres()
    .filter((r) => r.monde.id === tb.monde && (!tb.classe || (r.eleve.classe ?? '') === tb.classe))
    .sort(parEleve);
  if (!rendus.length) return;
  const monde = app.mondesConnus().find((m) => m.id === tb.monde) ?? null;
  const colonnes = colonnesPour(monde, rendus);
  const lignes = [['Élève', 'Classe', 'Rendu le', ...colonnes.map((c, i) => `${i + 1}. ${c.titre}`), 'Total']];
  for (const rendu of rendus) {
    let total = 0;
    const cases = colonnes.map((colonne) => {
      const niveauRendu = rendu.niveaux.find((n) => n.id === colonne.id);
      const etat = etatDe(rendu, colonne.niveau, niveauRendu);
      if (etat.code !== 'vide' && etat.code !== 'faux') total++;
      return motDeLEtat(etat, niveauRendu);
    });
    lignes.push([rendu.eleve.prenom, rendu.eleve.classe ?? '', dateLisible(rendu.date), ...cases, `${total}/${colonnes.length}`]);
  }
  const titre = rendus[0].monde.titre;
  app.telechargerTexte(`classe-${nomDeFichier(titre)}${tb.classe ? `-${nomDeFichier(tb.classe)}` : ''}.csv`, versCSV(lignes), 'text/csv;charset=utf-8');
});

el.effacer.addEventListener('click', () => {
  const rendus = rendusEnregistres();
  const aEffacer = rendus.filter((r) => r.monde.id === tb.monde);
  if (!aEffacer.length || !confirm(`Effacer les ${aEffacer.length} rendus de « ${aEffacer[0].monde.titre} » ?`)) return;
  enregistrerRendus(rendus.filter((r) => r.monde.id !== tb.monde));
  annoncer('Rendus effacés 🗑');
  afficher();
});

window.addEventListener('pepin:theme', () => espace?.setTheme(estNuit() ? THEME_NUIT : THEME));
