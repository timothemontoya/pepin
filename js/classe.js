// =============================================================
//  classe.js — Suivre la progression : profil, sauvegarde, rendus
// =============================================================
//
//  Pas de serveur, pas de compte : tout reste dans les navigateurs.
//  - Le PROFIL : le prénom et la classe du joueur (rien d'autre).
//  - La SAUVEGARDE : toute la progression dans un fichier ou un code,
//    pour la retrouver sur un autre ordinateur.
//  - Le RENDU : ce qu'un élève envoie à son prof pour un monde : les
//    niveaux réussis ET les programmes gagnants. Le prof les colle
//    dans son tableau de bord, qui REFAIT TOURNER chaque programme :
//    impossible de tricher en modifiant le code du rendu !
// =============================================================

import { stockage } from './stockage.js';
import { verifierMonde } from './mondes.js';
import { executer } from './execution.js';
import { traduireProgramme, optionsDuNiveau } from './solutions.js';

export const FORMAT_SAUVEGARDE = 'pepin-sauvegarde';
export const FORMAT_RENDU = 'pepin-rendu';
const VERSION = 1;

const estUnObjet = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const estUnTexte = (v, max) => typeof v === 'string' && v.length <= max;
const estUneListeDeTextes = (v, max) => Array.isArray(v) && v.length <= max && v.every((x) => estUnTexte(x, 300));

// --- Le profil ------------------------------------------------------------

export function lireProfil() {
  const profil = stockage.lire('pepin.profil', null);
  return estUnObjet(profil) && estUnTexte(profil.prenom, 40) && profil.prenom.trim() ? profil : null;
}

export function enregistrerProfil(prenom, classe) {
  const profil = { prenom: prenom.trim().slice(0, 30), classe: classe.trim().slice(0, 15) };
  stockage.ecrire('pepin.profil', profil);
  return profil;
}

export function nomComplet(eleve) {
  return eleve.classe ? `${eleve.prenom} (${eleve.classe})` : eleve.prenom;
}

// --- Les programmes gagnants -------------------------------------------------
//  Quand on réussit un niveau, on garde le programme qui a gagné :
//  { blocs: programme Blockly } et/ou { python: "code" }

export function programmeGagnant(cle) {
  return stockage.lire(`pepin.gagnant.${cle}`, null);
}

export function retenirProgrammeGagnant(cle, morceau) {
  stockage.ecrire(`pepin.gagnant.${cle}`, { ...(programmeGagnant(cle) ?? {}), ...morceau });
}

// --- Le rendu d'un élève ------------------------------------------------------

export function fabriquerRendu(monde, progression, profil, date = new Date()) {
  return {
    format: FORMAT_RENDU,
    version: VERSION,
    date: date.toISOString(),
    eleve: { prenom: profil.prenom, classe: profil.classe ?? '' },
    monde: { id: monde.id, titre: monde.titre },
    niveaux: monde.niveaux.map((niveau) => {
      const cle = `${monde.id}/${niveau.id}`;
      const reussi = progression.reussis.has(cle);
      const gagnant = reussi ? programmeGagnant(cle) : null;
      return {
        id: niveau.id,
        titre: niveau.titre,
        reussi,
        medaille: progression.medailles.has(cle),
        python: progression.enPython.has(cle),
        programme: gagnant?.blocs ?? null,
        codePython: gagnant?.python ?? null,
      };
    }),
  };
}

// Un rendu vient de l'extérieur : on vérifie tout, comme pour un monde
export function verifierRendu(rendu) {
  if (!estUnObjet(rendu)) return ["Ce n'est pas un rendu."];
  const erreurs = [];
  if (rendu.format !== FORMAT_RENDU || rendu.version !== VERSION) {
    erreurs.push("Ce n'est pas un rendu de Pépin (format inconnu).");
  }
  const eleve = rendu.eleve;
  if (!estUnObjet(eleve) || !estUnTexte(eleve.prenom, 40) || !eleve.prenom.trim()) {
    erreurs.push("Le prénom de l'élève manque.");
  } else if (eleve.classe !== undefined && !estUnTexte(eleve.classe, 20)) {
    erreurs.push('La classe est illisible.');
  }
  if (!estUnObjet(rendu.monde) || !estUnTexte(rendu.monde.id, 100) || !estUnTexte(rendu.monde.titre, 100)) {
    erreurs.push('Le monde rendu est illisible.');
  }
  if (typeof rendu.date !== 'string' || Number.isNaN(Date.parse(rendu.date))) {
    erreurs.push('La date du rendu est illisible.');
  }
  if (!Array.isArray(rendu.niveaux) || rendu.niveaux.length > 300) {
    erreurs.push('La liste des niveaux manque.');
    return erreurs;
  }
  rendu.niveaux.forEach((niveau, i) => {
    const valide = estUnObjet(niveau)
      && estUnTexte(niveau.id, 100)
      && typeof niveau.reussi === 'boolean'
      && (niveau.programme === null || niveau.programme === undefined || estUnObjet(niveau.programme))
      && (niveau.codePython === null || niveau.codePython === undefined || estUnTexte(niveau.codePython, 20000));
    if (!valide) erreurs.push(`Niveau ${i + 1} du rendu : illisible.`);
  });
  return erreurs;
}

// --- Les rendus reçus par le prof (gardés dans son navigateur) -----------------

const CLE_RENDUS = 'pepin.rendus';

export const identiteEleve = (eleve) => `${eleve.prenom.trim().toLowerCase()}|${(eleve.classe ?? '').trim().toLowerCase()}`;

export function rendusEnregistres() {
  return stockage.lire(CLE_RENDUS, []).filter((rendu) => verifierRendu(rendu).length === 0);
}

export function enregistrerRendus(liste) {
  stockage.ecrire(CLE_RENDUS, liste);
}

// Ajoute un rendu (un élève qui rend deux fois : on garde le plus récent)
export function ajouterRendu(liste, rendu) {
  const meme = (r) => r.monde.id === rendu.monde.id && identiteEleve(r.eleve) === identiteEleve(rendu.eleve);
  const ancien = liste.find(meme);
  if (ancien && Date.parse(ancien.date) >= Date.parse(rendu.date)) return { liste, ajoute: false };
  return { liste: [...liste.filter((r) => !meme(r)), rendu], ajoute: true };
}

// --- Vérifier le travail d'un élève ----------------------------------------------

// Refait tourner le programme d'un élève sur le niveau (version du prof)
export function verifierProgrammeEleve(niveau, programme) {
  try {
    const { code, interdits } = traduireProgramme(programme, niveau.blocs);
    if (!code) return { ok: false, raison: `il utilise des blocs non proposés (${interdits.join(', ')})` };
    const resultat = executer(code, niveau, optionsDuNiveau(niveau));
    return resultat.gagne
      ? { ok: true }
      : { ok: false, raison: `son programme ne réussit pas le niveau (${resultat.message ?? 'raté'})` };
  } catch (e) {
    return { ok: false, raison: `son programme est illisible (${e.message})` };
  }
}

// L'état d'une case du tableau du prof.
// `niveau` : le niveau dans la version du prof (null si inconnu)
export function etatCase(niveau, niveauRendu) {
  if (!niveauRendu?.reussi) return { code: 'vide', symbole: '·', texte: 'pas encore réussi' };
  const bonus = `${niveauRendu.medaille ? '🏅' : ''}${niveauRendu.python ? '🐍' : ''}`;
  if (niveauRendu.programme && niveau) {
    const verification = verifierProgrammeEleve(niveau, niveauRendu.programme);
    return verification.ok
      ? { code: 'ok', symbole: `✅${bonus}`, texte: 'réussi (programme revérifié)' }
      : { code: 'faux', symbole: '⚠️', texte: `réussi d'après le rendu, mais ${verification.raison}` };
  }
  if (niveauRendu.codePython) {
    return { code: 'python', symbole: `🐍${niveauRendu.medaille ? '🏅' : ''}`, texte: 'réussi en Python (programme à lire)' };
  }
  if (niveauRendu.programme) {
    return { code: 'inconnu', symbole: '☑️', texte: 'réussi (impossible de vérifier : tu n’as pas ce monde)' };
  }
  return { code: 'sans-programme', symbole: `❔${bonus}`, texte: "réussi, mais le programme n'a pas été gardé" };
}

const MOTS_DES_ETATS = {
  vide: '',
  ok: 'réussi',
  faux: 'à vérifier',
  python: 'réussi (Python)',
  inconnu: 'réussi (non vérifié)',
  'sans-programme': 'réussi (sans programme)',
};

export function motDeLEtat(etat, niveauRendu) {
  const mot = MOTS_DES_ETATS[etat.code] ?? '';
  return niveauRendu?.medaille && mot ? `${mot} + défi` : mot;
}

// Un tableau → du texte pour un tableur (séparateur ; comme en France)
export function versCSV(lignes) {
  const echapper = (valeur) => {
    const texte = String(valeur ?? '');
    return /[;"\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
  };
  const bom = String.fromCharCode(0xFEFF); // pour qu'Excel lise bien les accents
  return bom + lignes.map((ligne) => ligne.map(echapper).join(';')).join('\r\n');
}

// --- La sauvegarde de toute la progression -------------------------------------

function lireTout(prefixe) {
  return Object.fromEntries(stockage.cles(prefixe).map((cle) => [cle.slice(prefixe.length), stockage.lire(cle, null)]));
}

const PREFIXES_DE_PROGRAMMES = {
  gagnants: 'pepin.gagnant.',
  programmes: 'pepin.programme.',
  codesPython: 'pepin.python.',
};

export function fabriquerSauvegarde(profil, date = new Date()) {
  const sauvegarde = {
    format: FORMAT_SAUVEGARDE,
    version: VERSION,
    date: date.toISOString(),
    profil: profil ?? null,
    reussis: stockage.lire('pepin.reussis', []),
    medailles: stockage.lire('pepin.medailles', []),
    python: stockage.lire('pepin.python', []),
    mondes: stockage.lire('pepin.mondes', []),
  };
  for (const [champ, prefixe] of Object.entries(PREFIXES_DE_PROGRAMMES)) sauvegarde[champ] = lireTout(prefixe);
  return sauvegarde;
}

export function verifierSauvegarde(sauvegarde) {
  if (!estUnObjet(sauvegarde)) return ["Ce n'est pas une sauvegarde."];
  const erreurs = [];
  if (sauvegarde.format !== FORMAT_SAUVEGARDE || sauvegarde.version !== VERSION) {
    erreurs.push("Ce n'est pas une sauvegarde de Pépin (format inconnu).");
  }
  for (const champ of ['reussis', 'medailles', 'python']) {
    if (!estUneListeDeTextes(sauvegarde[champ], 10000)) erreurs.push(`La liste « ${champ} » est illisible.`);
  }
  for (const champ of Object.keys(PREFIXES_DE_PROGRAMMES)) {
    if (!estUnObjet(sauvegarde[champ])) erreurs.push(`Les programmes (« ${champ} ») sont illisibles.`);
  }
  if (!Array.isArray(sauvegarde.mondes)) erreurs.push('La liste des mondes est illisible.');
  return erreurs;
}

// Mélange la sauvegarde avec ce qu'il y a déjà : on n'efface jamais rien !
export function restaurerSauvegarde(sauvegarde) {
  const unir = (cle, liste) => stockage.ecrire(cle, [...new Set([...stockage.lire(cle, []), ...liste])]);
  unir('pepin.reussis', sauvegarde.reussis);
  unir('pepin.medailles', sauvegarde.medailles);
  unir('pepin.python', sauvegarde.python);

  for (const [champ, prefixe] of Object.entries(PREFIXES_DE_PROGRAMMES)) {
    for (const [cle, valeur] of Object.entries(sauvegarde[champ])) {
      if (cle.length <= 300 && stockage.lire(prefixe + cle, null) === null) stockage.ecrire(prefixe + cle, valeur);
    }
  }

  const mesMondes = stockage.lire('pepin.mondes', []);
  let mondesAjoutes = 0;
  for (const monde of sauvegarde.mondes) {
    if (verifierMonde(monde).length === 0 && !mesMondes.some((m) => m?.id === monde.id)) {
      mesMondes.push(monde);
      mondesAjoutes++;
    }
  }
  stockage.ecrire('pepin.mondes', mesMondes);

  const profil = sauvegarde.profil;
  if (!lireProfil() && estUnObjet(profil) && estUnTexte(profil.prenom, 40) && profil.prenom.trim()) {
    enregistrerProfil(profil.prenom, estUnTexte(profil.classe, 20) ? profil.classe : '');
  }
  return { niveaux: new Set(sauvegarde.reussis).size, mondes: mondesAjoutes };
}
