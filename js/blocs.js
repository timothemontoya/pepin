// =============================================================
//  blocs.js — Les blocs, leur look, et leur traduction en code
// =============================================================
//
//  Blockly (la bibliothèque de blocs, comme Scratch) est chargée
//  dans index.html. Ici on :
//  1. décrit nos blocs à nous (avancer, échanger, pousser…)
//  2. écrit leur TRADUCTION en JavaScript (pour que Pépin les exécute)
//     et en Python (pour l'onglet « Voir en Python »)
//  3. ajoute un petit « mouchard » au JavaScript fabriqué, pour que
//     Pépin puisse montrer les variables et la pile des fonctions
//
//  Tes TODO 7 et 9 sont ici ✅
// =============================================================

const { javascriptGenerator, Order: OrdreJS } = window.javascript;
const { pythonGenerator, Order: OrdrePy } = window.python;
export { javascriptGenerator, pythonGenerator };

// --- 1. L'apparence des blocs -------------------------------------

const DEFINITIONS = [
  {
    type: 'pepin_depart',
    message0: '🌱 quand je clique sur Lancer',
    nextStatement: null,
    style: 'depart_blocks',
    tooltip: 'Le programme commence ici.',
  },
  // --- Le jardin
  {
    type: 'pepin_avancer',
    message0: 'avancer',
    previousStatement: null,
    nextStatement: null,
    style: 'mouvement_blocks',
    tooltip: "Pépin avance d'une case.",
  },
  {
    type: 'pepin_tourner',
    message0: 'tourner %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DIR',
        options: [
          ['↻ sens horaire', 'droite'],
          ['↺ sens anti-horaire', 'gauche'],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'mouvement_blocks',
    tooltip: 'Pépin pivote sur place.',
  },
  {
    type: 'pepin_arroser',
    message0: 'arroser 💧',
    previousStatement: null,
    nextStatement: null,
    style: 'mouvement_blocks',
    tooltip: 'Pépin arrose la case où il se trouve.',
  },
  {
    type: 'pepin_devant_libre',
    message0: 'la voie est libre devant',
    output: 'Boolean',
    style: 'capteur_blocks',
    tooltip: "Vrai s'il n'y a ni rocher ni bord du jardin devant Pépin.",
  },
  {
    type: 'pepin_sur_graine',
    message0: 'je suis sur une graine',
    output: 'Boolean',
    style: 'capteur_blocks',
    tooltip: 'Vrai si Pépin est sur une graine pas encore arrosée.',
  },
  {
    type: 'pepin_gauche_libre',
    message0: 'la voie est libre à gauche ↺',
    output: 'Boolean',
    style: 'capteur_blocks',
    tooltip: "Vrai si la case à gauche de Pépin n'est ni un rocher ni le bord (sans qu'il tourne).",
  },
  {
    type: 'pepin_droite_libre',
    message0: 'la voie est libre à droite ↻',
    output: 'Boolean',
    style: 'capteur_blocks',
    tooltip: "Vrai si la case à droite de Pépin n'est ni un rocher ni le bord (sans qu'il tourne).",
  },
  // --- La serre (les listes)
  {
    type: 'serre_nombre',
    message0: 'nombre de pots',
    output: 'Number',
    style: 'serre_blocks',
    tooltip: "Combien de pots il y a sur l'étagère (la longueur de la liste).",
  },
  {
    type: 'serre_hauteur',
    message0: 'hauteur du pot n° %1',
    args0: [{ type: 'input_value', name: 'INDEX', check: 'Number' }],
    output: 'Number',
    inputsInline: true,
    style: 'serre_blocks',
    tooltip: 'La hauteur de la plante dans ce pot. Le premier pot porte le n°0 !',
  },
  {
    type: 'serre_arroser',
    message0: 'arroser le pot n° %1 💧',
    args0: [{ type: 'input_value', name: 'INDEX', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'serre_blocks',
    tooltip: 'La plante de ce pot grandit de 1.',
  },
  {
    type: 'serre_echanger',
    message0: 'échanger les pots n° %1 et n° %2',
    args0: [
      { type: 'input_value', name: 'A', check: 'Number' },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'serre_blocks',
    tooltip: 'Les deux pots changent de place.',
  },
  {
    type: 'serre_ajouter',
    message0: 'ajouter un pot de hauteur %1',
    args0: [{ type: 'input_value', name: 'HAUTEUR', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'serre_blocks',
    tooltip: "Ajoute un pot au bout de l'étagère (à la fin de la liste).",
  },
  {
    type: 'serre_retirer',
    message0: 'retirer le dernier pot',
    previousStatement: null,
    nextStatement: null,
    style: 'serre_blocks',
    tooltip: "Enlève le pot au bout de l'étagère.",
  },
  {
    type: 'serre_repondre',
    message0: 'répondre %1 💬',
    args0: [{ type: 'input_value', name: 'VALEUR' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'serre_blocks',
    tooltip: 'Pépin annonce sa réponse.',
  },
  // --- La forêt fractale
  {
    type: 'liane_pousser',
    message0: 'pousser de %1 🌿',
    args0: [{ type: 'input_value', name: 'LONGUEUR', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'mouvement_blocks',
    tooltip: 'Pépin avance en faisant pousser la liane derrière lui.',
  },
  {
    type: 'liane_reculer',
    message0: 'reculer de %1',
    args0: [{ type: 'input_value', name: 'LONGUEUR', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'mouvement_blocks',
    tooltip: 'Pépin recule sur ses pas, sans rien faire pousser.',
  },
  {
    type: 'liane_tourner',
    message0: 'tourner %1 de %2 degrés',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DIR',
        options: [
          ['↻ horaire', 'droite'],
          ['↺ anti-horaire', 'gauche'],
        ],
      },
      { type: 'input_value', name: 'ANGLE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    style: 'mouvement_blocks',
    tooltip: 'Pépin pivote sur place (90 degrés = un quart de tour).',
  },
];

// Le nom affiché dans les messages de Pépin
const NOMS = {
  pepin_depart: 'quand je clique sur Lancer',
  pepin_avancer: 'avancer',
  pepin_tourner: 'tourner',
  pepin_arroser: 'arroser',
  pepin_devant_libre: 'la voie est libre devant',
  pepin_sur_graine: 'je suis sur une graine',
  pepin_gauche_libre: 'la voie est libre à gauche',
  pepin_droite_libre: 'la voie est libre à droite',
  serre_nombre: 'nombre de pots',
  serre_hauteur: 'hauteur du pot',
  serre_arroser: 'arroser le pot',
  serre_echanger: 'échanger les pots',
  serre_ajouter: 'ajouter un pot',
  serre_retirer: 'retirer le dernier pot',
  serre_repondre: 'répondre',
  liane_pousser: 'pousser',
  liane_reculer: 'reculer',
  liane_tourner: 'tourner de',
};

export function nomDuBloc(type) {
  return NOMS[type] ?? type;
}

// --- 2. Traduction en JavaScript ----------------------------------
//
//  Pour chaque type de bloc, on écrit une fonction qui renvoie
//  le code JavaScript correspondant, sous forme de texte.
//  Les fonctions que Pépin comprend sont dans js/types.js.
//
//  Il existe deux sortes de blocs :
//  - Les blocs « instruction » (ils s'empilent) renvoient juste du texte,
//    terminé par un point-virgule et un retour à la ligne : 'avancer();\n'
//  - Les blocs « valeur » (forme arrondie, ils se glissent dans un trou)
//    renvoient un tableau [code, priorité], par exemple :
//    ['devantEstLibre()', OrdreJS.FUNCTION_CALL]

function definirTraductionsJS() {
  javascriptGenerator.forBlock['pepin_depart'] = function () {
    return ''; // le bloc de départ ne fait rien lui-même
  };

  javascriptGenerator.forBlock['pepin_avancer'] = function () {
    return 'avancer();\n';
  };

  javascriptGenerator.forBlock['pepin_arroser'] = function () {
    return 'arroser();\n';
  };

  javascriptGenerator.forBlock['pepin_tourner'] = function (bloc) {
    const dir = bloc.getFieldValue('DIR');
    return dir === 'droite' ? 'tournerDroite();\n' : 'tournerGauche();\n';
  };

  javascriptGenerator.forBlock['pepin_devant_libre'] = function () {
    return ['devantEstLibre()', OrdreJS.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock['pepin_sur_graine'] = function () {
    return ['surUneGraine()', OrdreJS.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock['pepin_gauche_libre'] = function () {
    return ['gaucheEstLibre()', OrdreJS.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock['pepin_droite_libre'] = function () {
    return ['droiteEstLibre()', OrdreJS.FUNCTION_CALL];
  };

  // La valeur branchée dans un trou (ou une valeur par défaut)
  const valeur = (bloc, generateur, trou, parDefaut = '0') => (
    generateur.valueToCode(bloc, trou, OrdreJS.NONE) || parDefaut
  );

  // La serre
  javascriptGenerator.forBlock['serre_nombre'] = () => ['nombreDePots()', OrdreJS.FUNCTION_CALL];
  javascriptGenerator.forBlock['serre_hauteur'] = (bloc, g) => [`hauteur(${valeur(bloc, g, 'INDEX')})`, OrdreJS.FUNCTION_CALL];
  javascriptGenerator.forBlock['serre_arroser'] = (bloc, g) => `arroserPot(${valeur(bloc, g, 'INDEX')});\n`;
  javascriptGenerator.forBlock['serre_echanger'] = (bloc, g) => `echanger(${valeur(bloc, g, 'A')}, ${valeur(bloc, g, 'B')});\n`;
  javascriptGenerator.forBlock['serre_ajouter'] = (bloc, g) => `ajouterPot(${valeur(bloc, g, 'HAUTEUR')});\n`;
  javascriptGenerator.forBlock['serre_retirer'] = () => 'retirerPot();\n';
  javascriptGenerator.forBlock['serre_repondre'] = (bloc, g) => `repondre(${valeur(bloc, g, 'VALEUR')});\n`;

  // La forêt fractale
  javascriptGenerator.forBlock['liane_pousser'] = (bloc, g) => `pousser(${valeur(bloc, g, 'LONGUEUR')});\n`;
  javascriptGenerator.forBlock['liane_reculer'] = (bloc, g) => `reculer(${valeur(bloc, g, 'LONGUEUR')});\n`;
  javascriptGenerator.forBlock['liane_tourner'] = (bloc, g) => {
    const fonction = bloc.getFieldValue('DIR') === 'droite' ? 'tournerDroite' : 'tournerGauche';
    return `${fonction}(${valeur(bloc, g, 'ANGLE')});\n`;
  };

  // Les fonctions : on garde la version de Blockly, mais on ajoute
  // entrer(…) et sortir() autour, pour afficher la pile d'appels.
  javascriptGenerator.forBlock['procedures_defnoreturn'] = definirFonctionJS;
  javascriptGenerator.forBlock['procedures_defreturn'] = definirFonctionJS;
}

function definirFonctionJS(bloc, g) {
  const nomAffiche = bloc.getFieldValue('NAME');
  const nom = g.getProcedureName(nomAffiche);
  let prefixe = '';
  if (g.STATEMENT_PREFIX) prefixe += g.injectId(g.STATEMENT_PREFIX, bloc);
  let piege = '';
  if (g.INFINITE_LOOP_TRAP) piege = g.injectId(g.INFINITE_LOOP_TRAP, bloc);
  const corps = bloc.getInput('STACK') ? g.statementToCode(bloc, 'STACK') : '';
  const retour = bloc.getInput('RETURN') ? (g.valueToCode(bloc, 'RETURN', OrdreJS.NONE) || '') : '';
  const parametres = bloc.getVars();
  const noms = parametres.map((parametre) => g.getVariableName(parametre));
  const valeurs = parametres.map((parametre, i) => `${JSON.stringify(parametre)}: ${noms[i]}`).join(', ');

  const dedans = prefixe + piege + corps + (retour ? `${g.INDENT}return ${retour};\n` : '');
  let code = `function ${nom}(${noms.join(', ')}) {\n`
    + `${g.INDENT}entrer(${JSON.stringify(nomAffiche)}, {${valeurs}});\n`
    + `${g.INDENT}try {\n`
    + g.prefixLines(dedans, g.INDENT)
    + `${g.INDENT}} finally {\n`
    + `${g.INDENT}${g.INDENT}sortir();\n`
    + `${g.INDENT}}\n}`;
  code = g.scrub_(bloc, code);
  g.definitions_[`%${nom}`] = code;
  return null;
}

// --- 3. Traduction en Python --------------------------------------
//
//  Même principe, mais en Python ! Les fonctions s'écrivent avec
//  des tirets bas (c'est la convention en Python).
//  Attention : en Python, pas de point-virgule à la fin des lignes.

function definirTraductionsPython() {
  pythonGenerator.forBlock['pepin_depart'] = function () {
    return ''; // le bloc de départ ne fait rien lui-même
  };

  pythonGenerator.forBlock['pepin_avancer'] = function () {
    return 'avancer()\n';
  };

  pythonGenerator.forBlock['pepin_arroser'] = function () {
    return 'arroser()\n';
  };

  pythonGenerator.forBlock['pepin_tourner'] = function (bloc) {
    const dir = bloc.getFieldValue('DIR');
    return dir === 'droite' ? 'tourner_droite()\n' : 'tourner_gauche()\n';
  };

  pythonGenerator.forBlock['pepin_devant_libre'] = function () {
    return ['devant_est_libre()', OrdrePy.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['pepin_sur_graine'] = function () {
    return ['sur_une_graine()', OrdrePy.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['pepin_gauche_libre'] = function () {
    return ['gauche_est_libre()', OrdrePy.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['pepin_droite_libre'] = function () {
    return ['droite_est_libre()', OrdrePy.FUNCTION_CALL];
  };

  const valeur = (bloc, generateur, trou, parDefaut = '0') => (
    generateur.valueToCode(bloc, trou, OrdrePy.NONE) || parDefaut
  );

  // La serre
  pythonGenerator.forBlock['serre_nombre'] = () => ['nombre_de_pots()', OrdrePy.FUNCTION_CALL];
  pythonGenerator.forBlock['serre_hauteur'] = (bloc, g) => [`hauteur(${valeur(bloc, g, 'INDEX')})`, OrdrePy.FUNCTION_CALL];
  pythonGenerator.forBlock['serre_arroser'] = (bloc, g) => `arroser_pot(${valeur(bloc, g, 'INDEX')})\n`;
  pythonGenerator.forBlock['serre_echanger'] = (bloc, g) => `echanger(${valeur(bloc, g, 'A')}, ${valeur(bloc, g, 'B')})\n`;
  pythonGenerator.forBlock['serre_ajouter'] = (bloc, g) => `ajouter_pot(${valeur(bloc, g, 'HAUTEUR')})\n`;
  pythonGenerator.forBlock['serre_retirer'] = () => 'retirer_pot()\n';
  pythonGenerator.forBlock['serre_repondre'] = (bloc, g) => `repondre(${valeur(bloc, g, 'VALEUR')})\n`;

  // « compter avec i de A à B » : en Python, on écrit for i in range(A, B + 1)
  // (Blockly fabrique sinon des fonctions compliquées : on garde sa
  // version seulement quand le pas n'est pas 1)
  const pourOriginal = pythonGenerator.forBlock['controls_for'];
  pythonGenerator.forBlock['controls_for'] = (bloc, g) => {
    const pas = valeur(bloc, g, 'BY', '1');
    if (pas !== '1') return pourOriginal(bloc, g);
    const variable = g.getVariableName(bloc.getFieldValue('VAR'));
    const debut = valeur(bloc, g, 'FROM');
    const fin = valeur(bloc, g, 'TO');
    let finComprise;
    const moins = / - (\d+)$/.exec(fin); // « n - 2 » + 1 s'écrit simplement « n - 1 »
    if (/^-?\d+$/.test(fin)) finComprise = String(Number(fin) + 1);
    else if (fin.includes('/')) finComprise = `int(${fin}) + 1`;
    else if (moins) {
      const base = fin.slice(0, moins.index);
      finComprise = moins[1] === '1' ? base : `${base} - ${Number(moins[1]) - 1}`;
    } else finComprise = `${fin} + 1`;
    const plage = debut === '0' ? `range(${finComprise})` : `range(${debut}, ${finComprise})`;
    const corps = g.addLoopTrap(g.statementToCode(bloc, 'DO') || g.PASS, bloc);
    return `for ${variable} in ${plage}:\n${corps}`;
  };

  // La forêt fractale
  pythonGenerator.forBlock['liane_pousser'] = (bloc, g) => `pousser(${valeur(bloc, g, 'LONGUEUR')})\n`;
  pythonGenerator.forBlock['liane_reculer'] = (bloc, g) => `reculer(${valeur(bloc, g, 'LONGUEUR')})\n`;
  pythonGenerator.forBlock['liane_tourner'] = (bloc, g) => {
    const fonction = bloc.getFieldValue('DIR') === 'droite' ? 'tourner_droite' : 'tourner_gauche';
    return `${fonction}(${valeur(bloc, g, 'ANGLE')})\n`;
  };
}

// --- 4. Les thèmes (couleurs et police), de jour et de nuit -------
//  (la liste des blocs proposés par niveau est dans boite-a-outils.js)

const STYLES_DE_BLOCS = {
  depart_blocks: { colourPrimary: '#F2B84B', hat: 'cap' },
  mouvement_blocks: { colourPrimary: '#4FAF80' },
  capteur_blocks: { colourPrimary: '#4E9FDB' },
  serre_blocks: { colourPrimary: '#D9825B' },
  loop_blocks: { colourPrimary: '#EF8662' },
  logic_blocks: { colourPrimary: '#8F7FD6' },
  math_blocks: { colourPrimary: '#5C8FD6' },
  variable_blocks: { colourPrimary: '#E0A030' },
  procedure_blocks: { colourPrimary: '#DC6E9E' },
};

const STYLES_DE_CATEGORIES = {
  mouvement_category: { colour: '#4FAF80' },
  serre_category: { colour: '#D9825B' },
  capteur_category: { colour: '#4E9FDB' },
  loop_category: { colour: '#EF8662' },
  logic_category: { colour: '#8F7FD6' },
  math_category: { colour: '#5C8FD6' },
  variable_category: { colour: '#E0A030' },
  procedure_category: { colour: '#DC6E9E' },
};

const POLICE = { family: '"Nunito", sans-serif', weight: '800', size: 13 };

export const THEME = Blockly.Theme.defineTheme('pepin', {
  base: Blockly.Themes.Classic,
  blockStyles: STYLES_DE_BLOCS,
  categoryStyles: STYLES_DE_CATEGORIES,
  componentStyles: {
    workspaceBackgroundColour: '#FFFDF8',
    toolboxBackgroundColour: '#F5EEE1',
    toolboxForegroundColour: '#2F4A3A',
    flyoutBackgroundColour: '#EFE6D6',
    flyoutForegroundColour: '#2F4A3A',
    flyoutOpacity: 0.97,
    scrollbarColour: '#D8CCB6',
    insertionMarkerColour: '#2F4A3A',
  },
  fontStyle: POLICE,
  startHats: true,
});

export const THEME_NUIT = Blockly.Theme.defineTheme('pepin-nuit', {
  base: Blockly.Themes.Classic,
  blockStyles: STYLES_DE_BLOCS,
  categoryStyles: STYLES_DE_CATEGORIES,
  componentStyles: {
    workspaceBackgroundColour: '#17221C',
    toolboxBackgroundColour: '#1E2C24',
    toolboxForegroundColour: '#E3F1E8',
    flyoutBackgroundColour: '#22322A',
    flyoutForegroundColour: '#E3F1E8',
    flyoutOpacity: 0.97,
    scrollbarColour: '#3E5248',
    insertionMarkerColour: '#E3F1E8',
  },
  fontStyle: POLICE,
  startHats: true,
});

// --- 5. Génération du code d'un programme -------------------------
//
//  Seuls les blocs accrochés au bloc de départ sont traduits
//  (plus les définitions de fonctions). Les blocs qui traînent
//  tout seuls dans l'espace de travail sont ignorés.

export function genererCode(workspace, generateur, avantGeneration) {
  generateur.init(workspace);
  avantGeneration?.();
  let code = '';
  for (const bloc of workspace.getTopBlocks(true)) {
    if (bloc.type === 'pepin_depart' || bloc.type.startsWith('procedures_def')) {
      let morceau = generateur.blockToCode(bloc);
      if (Array.isArray(morceau)) morceau = morceau[0];
      if (morceau) code += morceau;
    }
  }
  return generateur.finish(code);
}

// Le JavaScript à exécuter. Avant chaque bloc, on appelle
//   surligner('id du bloc', function () { return { x: x, … }; });
// pour savoir quel bloc s'exécute ET pouvoir lire les variables.
export function genererCodeJS(workspace) {
  return genererCode(workspace, javascriptGenerator, () => {
    const variables = workspace.getAllVariables();
    if (!variables.length) {
      javascriptGenerator.STATEMENT_PREFIX = 'surligner(%1);\n';
      return;
    }
    const lecture = variables
      .map((v) => `${JSON.stringify(v.name)}: ${javascriptGenerator.getVariableName(v.getId())}`)
      .join(', ');
    javascriptGenerator.STATEMENT_PREFIX = `surligner(%1, function () { return {${lecture}}; });\n`;
  });
}

// --- 6. La catégorie « Variables » --------------------------------
//
//  Blockly la remplit tout seul… mais son bloc « définir … à » arrive
//  avec un trou vide : impossible d'y mettre un nombre sans bloc
//  « nombre » ! On la remplit nous-mêmes : « définir … à » arrive avec
//  un 0 déjà branché (on peut taper n'importe quel nombre dedans), et
//  un bloc nombre est toujours proposé en bas.

// Les paramètres des fonctions (« taille » dans « carré avec taille ») :
// { nomDuParametre: nomDeLaFonction }
function parametresDesFonctions(workspace) {
  const parametres = {};
  for (const bloc of workspace.getAllBlocks(false)) {
    if (!bloc.type.startsWith('procedures_def')) continue;
    for (const nom of bloc.getVars()) parametres[nom] = bloc.getFieldValue('NAME');
  }
  return parametres;
}

export function brancherCategorieVariables(workspace) {
  workspace.registerButtonCallback('CREER_VARIABLE', (bouton) => {
    Blockly.Variables.createVariableButtonHandler(bouton.getTargetWorkspace());
  });
  workspace.registerToolboxCategoryCallback('VARIABLE', (espace) => {
    const contenu = [{ kind: 'button', text: Blockly.Msg.NEW_VARIABLE, callbackkey: 'CREER_VARIABLE' }];
    // les paramètres des fonctions n'ont rien à faire ici : ils sont rangés
    // avec leur fonction, dans la catégorie Fonctions
    const parametres = parametresDesFonctions(espace);
    const variables = espace.getVariablesOfType('')
      .filter((variable) => !(variable.name in parametres))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const champ = (variable) => ({ VAR: { name: variable.name, type: '' } });
    const ombre = (nombre) => ({ shadow: { type: 'math_number', fields: { NUM: nombre } } });
    if (variables.length) {
      contenu.push(
        { kind: 'block', type: 'variables_set', fields: champ(variables[0]), inputs: { VALUE: ombre(0) } },
        { kind: 'block', type: 'math_change', fields: champ(variables[0]), inputs: { DELTA: ombre(1) } },
        ...variables.map((variable) => ({ kind: 'block', type: 'variables_get', fields: champ(variable) })),
      );
    }
    contenu.push(
      { kind: 'label', text: 'Un nombre, à brancher où tu veux :', 'web-class': 'etiquette-boite' },
      { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
    );
    return contenu;
  });
}

// La catégorie « Fonctions » : celle de Blockly, plus, sous chaque
// fonction, ses paramètres… à utiliser DEDANS uniquement.
export function brancherCategorieFonctions(workspace) {
  const xml = Blockly.utils.xml;
  workspace.registerToolboxCategoryCallback('PROCEDURE', (espace) => {
    const contenu = Blockly.Procedures.flyoutCategory(espace);
    const parFonction = {};
    for (const [parametre, fonction] of Object.entries(parametresDesFonctions(espace))) {
      (parFonction[fonction] ??= []).push(parametre);
    }
    for (const [fonction, parametres] of Object.entries(parFonction)) {
      const etiquette = xml.createElement('label');
      etiquette.setAttribute('text', `Les paramètres de « ${fonction} » (à utiliser dedans) :`);
      etiquette.setAttribute('web-class', 'etiquette-boite');
      contenu.push(etiquette);
      for (const parametre of parametres) {
        const bloc = xml.createElement('block');
        bloc.setAttribute('type', 'variables_get');
        const champ = xml.createElement('field');
        champ.setAttribute('name', 'VAR');
        champ.textContent = parametre;
        bloc.append(champ);
        contenu.push(bloc);
      }
    }
    return contenu;
  });

  // Un paramètre utilisé en dehors de sa fonction : petit avertissement
  workspace.addChangeListener((evenement) => {
    if (evenement.isUiEvent) return;
    const parametres = parametresDesFonctions(workspace);
    for (const bloc of workspace.getBlocksByType('variables_get', false)) {
      const nom = bloc.getField('VAR')?.getText();
      const fonction = parametres[nom];
      const racine = bloc.getRootBlock();
      const dehors = fonction && !(racine.type.startsWith('procedures_def') && racine.getFieldValue('NAME') === fonction);
      bloc.setWarningText(dehors ? `« ${nom} » est un paramètre : il n'existe que dans la fonction « ${fonction} ».` : null);
    }
  });
}

// Quand une bulle est ouverte (l'engrenage ⚙ d'une fonction ou d'un
// « si »), un clic à côté la referme
export function fermerBullesAuClic(workspace) {
  workspace.addChangeListener((evenement) => {
    if (evenement.type !== Blockly.Events.CLICK) return;
    for (const bloc of workspace.getAllBlocks(false)) {
      for (const icone of bloc.getIcons()) {
        if (icone.bubbleIsVisible?.() && icone.getType?.() !== Blockly.icons.IconType.WARNING) icone.setBubbleVisible(false);
      }
    }
  });
}

// Les noms en Python (fonctions, variables) : Blockly transforme « é » en
// « _C3_A9 » ! On enlève plutôt les accents : « rangée » → « rangee ».
function nomPropre(nom) {
  if (!nom) return Blockly.Msg.UNNAMED_KEY || 'sans_nom';
  let propre = nom.normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!propre) propre = 'sans_nom';
  if (/^[0-9]/.test(propre)) propre = `n_${propre}`;
  return propre;
}

// Pareil pour les appels de fonctions à paramètres (« carré avec taille ») :
// chaque trou vide reçoit un 0 qu'on peut changer en tapant, ou remplacer
// en y branchant un bloc. Blockly recrée ces trous quand on ajoute un
// paramètre à la fonction : on surveille donc les créations et changements.
export function ajouterOmbresAuxAppels(workspace) {
  workspace.addChangeListener((evenement) => {
    if (evenement.type !== Blockly.Events.BLOCK_CREATE && evenement.type !== Blockly.Events.BLOCK_CHANGE) return;
    for (const bloc of workspace.getAllBlocks(false)) {
      if (!bloc.type.startsWith('procedures_call')) continue;
      for (const entree of bloc.inputList) {
        if (entree.name.startsWith('ARG') && entree.connection && !entree.connection.targetConnection) {
          entree.connection.setShadowState({ type: 'math_number', fields: { NUM: 0 } });
        }
      }
    }
  });
}

export function genererCodePython(workspace) {
  // (on enlève juste les lignes vides en trop, pour que ce soit joli)
  const code = genererCode(workspace, pythonGenerator).replace(/\n{3,}/g, '\n\n').trim();
  return code ? `${code}\n` : '';
}

export function definirBlocs() {
  Blockly.common.defineBlocksWithJsonArray(DEFINITIONS);
  Blockly.Names.prototype.safeName = nomPropre;
  // pas de commentaire « Décrivez cette fonction… » dans le code traduit
  Blockly.Msg.PROCEDURES_DEFNORETURN_COMMENT = '';
  Blockly.Msg.PROCEDURES_DEFRETURN_COMMENT = '';

  // Avant chaque bloc, on note lequel s'exécute (pour le surligner)
  javascriptGenerator.STATEMENT_PREFIX = 'surligner(%1);\n';
  // Dans chaque boucle, on compte les tours (voir TODO 8)
  javascriptGenerator.INFINITE_LOOP_TRAP = 'tourDeBoucle();\n';
  javascriptGenerator.addReservedWords([
    'avancer', 'tournerGauche', 'tournerDroite', 'arroser', 'devantEstLibre', 'surUneGraine',
    'gaucheEstLibre', 'droiteEstLibre',
    'nombreDePots', 'hauteur', 'arroserPot', 'echanger', 'ajouterPot', 'retirerPot', 'repondre',
    'pousser', 'reculer', 'surligner', 'tourDeBoucle', 'entrer', 'sortir', 'contexte',
  ].join(','));
  pythonGenerator.addReservedWords([
    'avancer', 'tourner_gauche', 'tourner_droite', 'arroser', 'devant_est_libre', 'sur_une_graine',
    'gauche_est_libre', 'droite_est_libre',
    'nombre_de_pots', 'hauteur', 'arroser_pot', 'echanger', 'ajouter_pot', 'retirer_pot', 'repondre',
    'pousser', 'reculer',
  ].join(','));
  // 4 espaces par niveau d'indentation : c'est la règle en Python
  pythonGenerator.INDENT = '    ';

  definirTraductionsJS();
  definirTraductionsPython();
}
