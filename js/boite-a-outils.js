// =============================================================
//  boite-a-outils.js — Les blocs qu'un niveau peut proposer
// =============================================================
//
//  Chaque niveau choisit ses blocs avec ces noms (champ "blocs"
//  dans les fichiers de mondes). Si tu inventes un nouveau bloc,
//  c'est ici qu'il faut l'ajouter pour qu'un niveau puisse l'utiliser.
// =============================================================

// Une petite valeur grise par défaut (une « ombre ») dans un trou
const ombre = (nombre) => ({ shadow: { type: 'math_number', fields: { NUM: nombre } } });

const CATALOGUE = {
  // --- Jardin
  avancer:       { categorie: 'mouvements', bloc: { kind: 'block', type: 'pepin_avancer' } },
  tourner:       { categorie: 'mouvements', bloc: { kind: 'block', type: 'pepin_tourner' } },
  arroser:       { categorie: 'mouvements', bloc: { kind: 'block', type: 'pepin_arroser' } },
  devantLibre:   { categorie: 'capteurs', bloc: { kind: 'block', type: 'pepin_devant_libre' } },
  surGraine:     { categorie: 'capteurs', bloc: { kind: 'block', type: 'pepin_sur_graine' } },
  gaucheLibre:   { categorie: 'capteurs', bloc: { kind: 'block', type: 'pepin_gauche_libre' } },
  droiteLibre:   { categorie: 'capteurs', bloc: { kind: 'block', type: 'pepin_droite_libre' } },
  // --- Serre (listes)
  nombreDePots:  { categorie: 'serre', bloc: { kind: 'block', type: 'serre_nombre' } },
  hauteur:       { categorie: 'serre', bloc: { kind: 'block', type: 'serre_hauteur', inputs: { INDEX: ombre(0) } } },
  arroserPot:    { categorie: 'serre', bloc: { kind: 'block', type: 'serre_arroser', inputs: { INDEX: ombre(0) } } },
  echanger:      { categorie: 'serre', bloc: { kind: 'block', type: 'serre_echanger', inputs: { A: ombre(0), B: ombre(1) } } },
  ajouterPot:    { categorie: 'serre', bloc: { kind: 'block', type: 'serre_ajouter', inputs: { HAUTEUR: ombre(1) } } },
  retirerPot:    { categorie: 'serre', bloc: { kind: 'block', type: 'serre_retirer' } },
  repondre:      { categorie: 'serre', bloc: { kind: 'block', type: 'serre_repondre', inputs: { VALEUR: ombre(0) } } },
  // --- Forêt fractale
  pousser:       { categorie: 'mouvements', bloc: { kind: 'block', type: 'liane_pousser', inputs: { LONGUEUR: ombre(50) } } },
  reculer:       { categorie: 'mouvements', bloc: { kind: 'block', type: 'liane_reculer', inputs: { LONGUEUR: ombre(50) } } },
  tournerDe:     { categorie: 'mouvements', bloc: { kind: 'block', type: 'liane_tourner', inputs: { ANGLE: ombre(90) } } },
  // --- Boucles
  repeter:       { categorie: 'boucles', bloc: { kind: 'block', type: 'controls_repeat', fields: { TIMES: 3 } } },
  repeterNombre: { categorie: 'boucles', bloc: { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: ombre(4) } } },
  pour:          { categorie: 'boucles', bloc: { kind: 'block', type: 'controls_for', inputs: { FROM: ombre(0), TO: ombre(3), BY: ombre(1) } } },
  tantQue:       { categorie: 'boucles', bloc: { kind: 'block', type: 'controls_whileUntil' } },
  // --- Conditions
  si:            { categorie: 'conditions', bloc: { kind: 'block', type: 'controls_if' } },
  siSinon:       { categorie: 'conditions', bloc: { kind: 'block', type: 'controls_if', extraState: { hasElse: true } } },
  comparer:      { categorie: 'conditions', bloc: { kind: 'block', type: 'logic_compare', inputs: { A: ombre(0), B: ombre(0) } } },
  etOu:          { categorie: 'conditions', bloc: { kind: 'block', type: 'logic_operation' } },
  non:           { categorie: 'conditions', bloc: { kind: 'block', type: 'logic_negate' } },
  // --- Calculs
  nombre:        { categorie: 'calculs', bloc: { kind: 'block', type: 'math_number', fields: { NUM: 0 } } },
  calcul:        { categorie: 'calculs', bloc: { kind: 'block', type: 'math_arithmetic', inputs: { A: ombre(1), B: ombre(1) } } },
  modulo:        { categorie: 'calculs', bloc: { kind: 'block', type: 'math_modulo', inputs: { DIVIDEND: ombre(7), DIVISOR: ombre(2) } } },
  arrondi:       { categorie: 'calculs', bloc: { kind: 'block', type: 'math_round', fields: { OP: 'ROUNDDOWN' }, inputs: { NUM: ombre(3.5) } } },
};

const CATEGORIES = [
  { id: 'mouvements', nom: 'Mouvements', style: 'mouvement_category' },
  { id: 'serre', nom: 'Serre', style: 'serre_category' },
  { id: 'capteurs', nom: 'Capteurs', style: 'capteur_category' },
  { id: 'boucles', nom: 'Boucles', style: 'loop_category' },
  { id: 'conditions', nom: 'Conditions', style: 'logic_category' },
  { id: 'calculs', nom: 'Calculs', style: 'math_category' },
];

// Ces deux-là sont des catégories « magiques » de Blockly, qui se
// remplissent toutes seules (bouton « Créer une variable », fonctions…)
const SPECIAUX = {
  variables: { kind: 'category', name: 'Variables', categorystyle: 'variable_category', custom: 'VARIABLE' },
  fonctions: { kind: 'category', name: 'Fonctions', categorystyle: 'procedure_category', custom: 'PROCEDURE' },
};

// Tous les noms de blocs autorisés dans un niveau
export const BLOCS_DISPONIBLES = [...Object.keys(CATALOGUE), ...Object.keys(SPECIAUX)];

// Comment on les présente dans l'éditeur de niveaux
export const NOMS_DES_BLOCS = {
  avancer: 'avancer',
  tourner: 'tourner',
  arroser: 'arroser',
  devantLibre: 'la voie est libre devant',
  surGraine: 'je suis sur une graine',
  gaucheLibre: 'la voie est libre à gauche',
  droiteLibre: 'la voie est libre à droite',
  nombreDePots: 'nombre de pots',
  hauteur: 'hauteur du pot n°…',
  arroserPot: 'arroser le pot n°…',
  echanger: 'échanger deux pots',
  ajouterPot: 'ajouter un pot',
  retirerPot: 'retirer le dernier pot',
  repondre: 'répondre',
  pousser: 'pousser de …',
  reculer: 'reculer de …',
  tournerDe: 'tourner de … degrés',
  repeter: 'répéter 3 fois',
  repeterNombre: 'répéter (nombre) fois',
  pour: 'compter avec i de … à …',
  tantQue: 'répéter tant que',
  si: 'si … alors',
  siSinon: 'si … sinon',
  comparer: 'comparer (=, <, >…)',
  etOu: 'et / ou',
  non: 'non',
  nombre: 'un nombre',
  calcul: 'calcul (+, −, ×, ÷)',
  modulo: 'reste de la division (modulo)',
  arrondi: 'arrondir',
  variables: 'variables 🫙',
  fonctions: 'fonctions',
};

// Les blocs qui ont du sens pour chaque type de niveau (éditeur)
const COMMUNS = ['repeter', 'repeterNombre', 'pour', 'tantQue', 'si', 'siSinon', 'comparer', 'etOu', 'non',
  'nombre', 'calcul', 'modulo', 'arrondi', 'variables', 'fonctions'];
export const BLOCS_PAR_TYPE = {
  jardin: ['avancer', 'tourner', 'arroser', 'devantLibre', 'gaucheLibre', 'droiteLibre', 'surGraine', ...COMMUNS],
  etagere: ['nombreDePots', 'hauteur', 'arroserPot', 'echanger', 'ajouterPot', 'retirerPot', 'repondre', ...COMMUNS],
  fractale: ['pousser', 'reculer', 'tournerDe', ...COMMUNS],
};

// La boucle « compter avec i » a besoin de la catégorie Variables :
// c'est là qu'on trouve le petit bloc « i » pour s'en servir.
const avecVariables = (cles) => cles.includes('variables') || cles.includes('pour');

// Peu de blocs et pas de catégorie magique : on affiche tout, tout le
// temps (plus simple pour les petits). Sinon : des catégories.
export function toolboxEnCategories(cles) {
  return cles.some((cle) => cle in SPECIAUX) || avecVariables(cles) || cles.length > 9;
}

// `valeurs` (forêt) : { longueur, angle } — les blocs « pousser de … » et
// « tourner de … degrés » arrivent réglés sur les valeurs du modèle
function blocAvecValeurs(cle, valeurs) {
  const bloc = CATALOGUE[cle].bloc;
  if (valeurs.longueur && (cle === 'pousser' || cle === 'reculer')) {
    return { ...bloc, inputs: { LONGUEUR: ombre(valeurs.longueur) } };
  }
  if (valeurs.angle && cle === 'tournerDe') return { ...bloc, inputs: { ANGLE: ombre(valeurs.angle) } };
  return bloc;
}

export function creerToolbox(cles, valeurs = {}) {
  const CATALOGUE_REGLE = Object.fromEntries(Object.keys(CATALOGUE).map((cle) => [
    cle, { ...CATALOGUE[cle], bloc: blocAvecValeurs(cle, valeurs) },
  ]));
  return creerToolboxAvec(cles, CATALOGUE_REGLE);
}

function creerToolboxAvec(cles, catalogue) {
  if (!toolboxEnCategories(cles)) {
    const contents = [];
    for (const categorie of CATEGORIES) {
      const blocs = cles.filter((cle) => catalogue[cle]?.categorie === categorie.id);
      if (!blocs.length) continue;
      contents.push({ kind: 'label', text: categorie.nom, 'web-class': 'etiquette-boite' });
      contents.push(...blocs.map((cle) => catalogue[cle].bloc));
    }
    return { kind: 'flyoutToolbox', contents };
  }

  const contents = [];
  for (const categorie of CATEGORIES) {
    const blocs = cles
      .filter((cle) => catalogue[cle]?.categorie === categorie.id)
      .map((cle) => catalogue[cle].bloc);
    if (blocs.length) {
      contents.push({ kind: 'category', name: categorie.nom, categorystyle: categorie.style, contents: blocs });
    }
  }
  if (avecVariables(cles)) contents.push(SPECIAUX.variables);
  if (cles.includes('fonctions')) contents.push(SPECIAUX.fonctions);
  return { kind: 'categoryToolbox', contents };
}

const TYPES_FONCTIONS = [
  'procedures_defnoreturn', 'procedures_defreturn',
  'procedures_callnoreturn', 'procedures_callreturn', 'procedures_ifreturn',
];
// (la catégorie Variables propose aussi un bloc nombre, voir blocs.js)
const TYPES_VARIABLES = ['variables_get', 'variables_set', 'math_change', 'math_number'];

// Les types de blocs Blockly qu'un niveau autorise
export function typesAutorises(cles) {
  const types = new Set(['pepin_depart']);
  for (const cle of cles) {
    if (CATALOGUE[cle]) types.add(CATALOGUE[cle].bloc.type);
  }
  if (cles.includes('fonctions')) {
    TYPES_FONCTIONS.forEach((type) => types.add(type));
    types.add('variables_get'); // les paramètres des fonctions
  }
  if (cles.includes('variables')) TYPES_VARIABLES.forEach((type) => types.add(type));
  if (cles.includes('pour')) types.add('variables_get'); // le compteur i
  return types;
}

// Le nom lisible d'un type de bloc Blockly
export function nomDuType(type) {
  if (TYPES_FONCTIONS.includes(type)) return NOMS_DES_BLOCS.fonctions;
  if (TYPES_VARIABLES.includes(type)) return NOMS_DES_BLOCS.variables;
  const cle = Object.keys(CATALOGUE).find((c) => CATALOGUE[c].bloc.type === type);
  return NOMS_DES_BLOCS[cle] ?? type;
}
