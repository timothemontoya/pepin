// =============================================================
//  carnet.js — Le carnet de l'élève : qui joue ? sauvegarde, rendu
// =============================================================
//
//  Trois petites fenêtres :
//  - 👤 Qui joue ?       : le prénom et la classe
//  - 💾 Ma sauvegarde    : emporter sa progression ailleurs
//  - 📮 Rendre mon travail : un code à envoyer à son prof
// =============================================================

import {
  lireProfil, enregistrerProfil, nomComplet, fabriquerRendu, fabriquerSauvegarde,
  verifierSauvegarde, restaurerSauvegarde,
} from './classe.js';
import { encoderPaquet, decoderPaquet, PREFIXES } from './partage.js';
import { nomDeFichier } from './mondes.js';

// Les fonctions de main.js dont le carnet a besoin (voir brancherCarnet)
let app = null;

const $ = (id) => document.getElementById(id);
const el = {
  btnProfil: $('btn-profil'),
  // qui joue ?
  dialogueProfil: $('dialogue-profil'),
  profilPrenom: $('profil-prenom'),
  profilClasse: $('profil-classe'),
  profilErreur: $('profil-erreur'),
  profilValider: $('profil-valider'),
  profilAnnuler: $('profil-annuler'),
  // sauvegarde
  dialogueSauvegarde: $('dialogue-sauvegarde'),
  sauvegardeTelecharger: $('sauvegarde-telecharger'),
  sauvegardeCopier: $('sauvegarde-copier'),
  sauvegardeTexte: $('sauvegarde-texte'),
  sauvegardeMessage: $('sauvegarde-message'),
  sauvegardeFichier: $('sauvegarde-fichier'),
  sauvegardeRestaurer: $('sauvegarde-restaurer'),
  sauvegardeFermer: $('sauvegarde-fermer'),
  // rendu
  dialogueRendu: $('dialogue-rendu'),
  renduIdentite: $('rendu-identite'),
  renduPrenom: $('rendu-prenom'),
  renduClasse: $('rendu-classe'),
  renduIdentiteValider: $('rendu-identite-valider'),
  renduZone: $('rendu-code-zone'),
  renduResume: $('rendu-resume'),
  renduCode: $('rendu-code'),
  renduCopier: $('rendu-copier'),
  renduFichier: $('rendu-fichier'),
  renduFermer: $('rendu-fermer'),
};

// main.js donne : progression(), apresRestauration(resume), toast(texte),
// telechargerTexte(nomDuFichier, texte)
export function brancherCarnet(fonctions) {
  app = fonctions;
  majBoutonProfil();
}

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}

// --- 👤 Qui joue ? ---------------------------------------------------------

export function majBoutonProfil() {
  const profil = lireProfil();
  el.btnProfil.textContent = profil ? `👤 ${nomComplet(profil)}` : '👤 Qui joue ?';
}

export function ouvrirProfil() {
  const profil = lireProfil();
  el.profilPrenom.value = profil?.prenom ?? '';
  el.profilClasse.value = profil?.classe ?? '';
  el.profilErreur.hidden = true;
  el.dialogueProfil.showModal();
  el.profilPrenom.focus();
}

el.profilValider.addEventListener('click', () => {
  if (!el.profilPrenom.value.trim()) {
    el.profilErreur.hidden = false;
    return;
  }
  const profil = enregistrerProfil(el.profilPrenom.value, el.profilClasse.value);
  el.dialogueProfil.close();
  majBoutonProfil();
  app.toast(`Bonjour ${profil.prenom} ! 👋`);
});
el.profilAnnuler.addEventListener('click', () => el.dialogueProfil.close());
for (const champ of [el.profilPrenom, el.profilClasse]) {
  champ.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.profilValider.click();
  });
}

// --- 💾 Ma sauvegarde ---------------------------------------------------------

function messageSauvegarde(texte, oups = false) {
  el.sauvegardeMessage.textContent = texte;
  el.sauvegardeMessage.classList.toggle('erreur', oups);
}

export function ouvrirSauvegarde() {
  el.sauvegardeTexte.value = '';
  messageSauvegarde('');
  el.dialogueSauvegarde.showModal();
}

el.sauvegardeTelecharger.addEventListener('click', () => {
  const profil = lireProfil();
  const nom = `pepin-sauvegarde-${nomDeFichier(profil?.prenom ?? 'joueur')}.pepin`;
  app.telechargerTexte(nom, `${JSON.stringify(fabriquerSauvegarde(profil), null, 2)}\n`);
  messageSauvegarde('Sauvegarde téléchargée ✅ Garde ce fichier précieusement !');
});

el.sauvegardeCopier.addEventListener('click', async () => {
  const code = await encoderPaquet(PREFIXES.sauvegarde, fabriquerSauvegarde(lireProfil()));
  if (await copier(code)) {
    messageSauvegarde(`Code copié ✅ (${code.length} caractères) : colle-le dans un message pour toi, ou sur ton ENT.`);
  } else {
    el.sauvegardeTexte.value = code;
    el.sauvegardeTexte.select();
    messageSauvegarde('Copie ce code (Ctrl + C) et garde-le bien au chaud.');
  }
});

// Restaure une sauvegarde déjà lue (objet). Lance une erreur si elle est abîmée.
export function restaurer(donnees) {
  const erreurs = verifierSauvegarde(donnees);
  if (erreurs.length) throw new Error(erreurs.join(' · '));
  const resume = restaurerSauvegarde(donnees);
  majBoutonProfil();
  app.apresRestauration(resume);
  return resume;
}

function annoncerRestauration(resume) {
  messageSauvegarde(`Progression retrouvée ✅ (${resume.niveaux} niveau${resume.niveaux > 1 ? 'x' : ''} réussi${resume.niveaux > 1 ? 's' : ''}`
    + `${resume.mondes ? `, ${resume.mondes} monde${resume.mondes > 1 ? 's' : ''} ajouté${resume.mondes > 1 ? 's' : ''}` : ''}).`);
}

el.sauvegardeRestaurer.addEventListener('click', async () => {
  try {
    const { sorte, json } = await decoderPaquet(el.sauvegardeTexte.value);
    if (sorte !== 'sauvegarde') throw new Error("ce code n'est pas une sauvegarde");
    annoncerRestauration(restaurer(JSON.parse(json)));
  } catch (e) {
    messageSauvegarde(`Petit pépin : ${e.message}`, true);
  }
});

el.sauvegardeFichier.addEventListener('click', () => {
  const choix = document.createElement('input');
  choix.type = 'file';
  choix.accept = '.pepin,.json,application/json';
  choix.addEventListener('change', async () => {
    const fichier = choix.files[0];
    if (!fichier) return;
    try {
      annoncerRestauration(restaurer(JSON.parse(await fichier.text())));
    } catch (e) {
      messageSauvegarde(`Petit pépin dans « ${fichier.name} » : ${e.message}`, true);
    }
  });
  choix.click();
});

el.sauvegardeFermer.addEventListener('click', () => el.dialogueSauvegarde.close());

// --- 📮 Rendre mon travail ---------------------------------------------------------

let mondeRendu = null;
let renduCourant = null;

export function ouvrirRendu(monde) {
  mondeRendu = monde;
  const profil = lireProfil();
  el.renduIdentite.hidden = Boolean(profil);
  el.renduZone.hidden = !profil;
  el.renduPrenom.value = '';
  el.renduClasse.value = '';
  el.dialogueRendu.showModal();
  if (profil) preparerCode();
  else el.renduPrenom.focus();
}

async function preparerCode() {
  const profil = lireProfil();
  renduCourant = fabriquerRendu(mondeRendu, app.progression(), profil);
  const reussis = renduCourant.niveaux.filter((n) => n.reussi);
  const medailles = reussis.filter((n) => n.medaille).length;
  const enPython = reussis.filter((n) => n.python).length;
  const extras = [medailles ? `🏅 ${medailles}` : '', enPython ? `🐍 ${enPython}` : ''].filter(Boolean).join(' · ');
  el.renduResume.textContent = `${nomComplet(profil)} — « ${mondeRendu.titre} » : `
    + `${reussis.length} niveau${reussis.length > 1 ? 'x' : ''} réussi${reussis.length > 1 ? 's' : ''} `
    + `sur ${renduCourant.niveaux.length}${extras ? ` (${extras})` : ''}.`;
  el.renduCode.value = 'Je prépare ton code…';
  el.renduCode.value = await encoderPaquet(PREFIXES.rendu, renduCourant);
}

el.renduIdentiteValider.addEventListener('click', () => {
  if (!el.renduPrenom.value.trim()) {
    el.renduPrenom.focus();
    return;
  }
  enregistrerProfil(el.renduPrenom.value, el.renduClasse.value);
  majBoutonProfil();
  el.renduIdentite.hidden = true;
  el.renduZone.hidden = false;
  preparerCode();
});

el.renduCopier.addEventListener('click', async () => {
  if (await copier(el.renduCode.value)) {
    app.toast('Code copié ! Colle-le dans un message à ton prof 📮');
  } else {
    el.renduCode.select();
    app.toast('Sélectionné : fais Ctrl + C pour le copier');
  }
});

el.renduFichier.addEventListener('click', () => {
  if (!renduCourant) return;
  const { prenom, classe } = renduCourant.eleve;
  const nom = ['rendu', prenom, classe, mondeRendu.titre].filter(Boolean).map(nomDeFichier).join('-');
  app.telechargerTexte(`${nom}.pepin`, `${JSON.stringify(renduCourant, null, 2)}\n`);
});

el.renduFermer.addEventListener('click', () => el.dialogueRendu.close());
