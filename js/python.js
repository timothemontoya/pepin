// =============================================================
//  python.js — Le mode difficile : du vrai Python ! 🐍
// =============================================================
//
//  Python tourne directement dans le navigateur grâce à Pyodide
//  (Python compilé en WebAssembly). On le charge seulement quand on
//  en a besoin, car c'est un gros morceau (une dizaine de Mo).
//
//  Le programme Python appelle les mêmes fonctions que les blocs
//  (avancer, echanger, pousser…). Avant chaque appel, un petit bout
//  de Python regarde la ligne en cours, les variables et la pile des
//  fonctions, et les envoie au jeu pour les afficher.
// =============================================================

import { typeDuNiveau } from './types.js';
import { ErreurPepin } from './execution.js';

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const CODEMIRROR = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';

function chargerScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`impossible de charger ${url}`));
    document.head.append(script);
  });
}

function chargerStyle(url) {
  const lien = document.createElement('link');
  lien.rel = 'stylesheet';
  lien.href = url;
  document.head.append(lien);
}

// --- Le petit bout de Python qui fait le lien avec le jeu ------------

const PRELUDE = `
import sys, json, types

_PEPIN_LIMITE_LIGNES = 200000

class _PepinTropLong(Exception):
    pass

def _pepin_valeur(v):
    if isinstance(v, bool) or v is None:
        return v
    if isinstance(v, (int, float)):
        return v if abs(v) < 1e15 else str(v)
    if isinstance(v, str):
        return v[:40]
    if isinstance(v, (list, tuple)):
        return [_pepin_valeur(x) for x in list(v)[:30]]
    return repr(v)[:40]

def _pepin_contexte(caches):
    f = sys._getframe(2)
    pile = []
    variables = {}
    ligne = None
    while f is not None:
        if f.f_code.co_filename == '<pepin>':
            if ligne is None:
                ligne = f.f_lineno
            if f.f_code.co_name == '<module>':
                for nom, valeur in f.f_globals.items():
                    if nom.startswith('_') or nom in caches or callable(valeur) or isinstance(valeur, types.ModuleType):
                        continue
                    variables[nom] = _pepin_valeur(valeur)
            else:
                code = f.f_code
                args = {}
                for nom in code.co_varnames[:code.co_argcount]:
                    if nom in f.f_locals:
                        args[nom] = _pepin_valeur(f.f_locals[nom])
                pile.append({'nom': code.co_name, 'args': args})
        f = f.f_back
    pile.reverse()
    return json.dumps({'variables': variables, 'pile': pile, 'ligne': ligne})

def _pepin_executer():
    fonctions = _pepin_fonctions
    noms = list(_pepin_noms)
    arites = list(_pepin_arites)
    contexte_js = _pepin_contexte_js
    caches = set(noms)
    module = types.ModuleType('pepin')
    espace = {'__name__': '__main__'}

    def envelopper(nom, arite):
        fonction_js = getattr(fonctions, nom)
        def appel(*args):
            if len(args) != arite:
                if arite == 0:
                    raise TypeError(f"{nom}() n'attend rien entre les parenthèses.")
                pluriel = 's' if arite > 1 else ''
                raise TypeError(f"{nom}() attend {arite} valeur{pluriel} entre les parenthèses (tu en as donné {len(args)}).")
            contexte_js(_pepin_contexte(caches))
            return fonction_js(*args)
        appel.__name__ = nom
        return appel

    for nom, arite in zip(noms, arites):
        fonction = envelopper(nom, arite)
        setattr(module, nom, fonction)
        espace[nom] = fonction
    sys.modules['pepin'] = module

    compteur = [0]
    def trace(frame, evenement, arg):
        if frame.f_code.co_filename != '<pepin>':
            return None
        if evenement == 'line':
            compteur[0] += 1
            if compteur[0] > _PEPIN_LIMITE_LIGNES:
                raise _PepinTropLong()
        return trace

    code = compile(_pepin_code, '<pepin>', 'exec')
    ancienne_limite = sys.getrecursionlimit()
    sys.setrecursionlimit(260)
    sys.settrace(trace)
    try:
        exec(code, espace)
    finally:
        sys.settrace(None)
        sys.setrecursionlimit(ancienne_limite)
`;

// --- Charger Python -------------------------------------------------

let pyodide = null;
let promessePython = null;

export function pythonEstPret() {
  return pyodide !== null;
}

export function chargerPython() {
  promessePython ??= (async () => {
    await chargerScript(`${PYODIDE}pyodide.js`);
    const instance = await window.loadPyodide({ indexURL: PYODIDE });
    instance.runPython(PRELUDE);
    pyodide = instance;
    return instance;
  })().catch((e) => {
    promessePython = null;
    throw e;
  });
  return promessePython;
}

// Le « lanceur » d'un programme Python, pour executerProgramme()
export function lanceurPython(code, niveau) {
  const correspondances = typeDuNiveau(niveau).python;
  return (api) => {
    const fonctions = {};
    const noms = [];
    const arites = [];
    for (const [nomJS, [nomPython, arite]] of Object.entries(correspondances)) {
      fonctions[nomPython] = api[nomJS];
      noms.push(nomPython);
      arites.push(arite);
    }
    const globales = pyodide.globals;
    globales.set('_pepin_fonctions', fonctions);
    globales.set('_pepin_noms', pyodide.toPy(noms));
    globales.set('_pepin_arites', pyodide.toPy(arites));
    globales.set('_pepin_contexte_js', api.contexte);
    globales.set('_pepin_code', code);
    try {
      pyodide.runPython('_pepin_executer()');
    } catch (e) {
      throw new ErreurPepin(traduireErreurPython(e));
    } finally {
      for (const nom of ['_pepin_fonctions', '_pepin_noms', '_pepin_arites', '_pepin_contexte_js', '_pepin_code']) {
        globales.delete(nom);
      }
    }
  };
}

// --- Les erreurs Python, en français ----------------------------------

export function traduireErreurPython(e) {
  const texte = String(e?.message ?? e).trim();
  if (texte.includes('_PepinTropLong')) {
    return 'Ton programme tourne beaucoup trop longtemps… une boucle infinie ? 🌀';
  }
  const lignes = [...texte.matchAll(/File "<pepin>", line (\d+)/g)];
  const ligne = lignes.length ? Number(lignes[lignes.length - 1][1]) : null;
  const derniere = texte.split('\n').pop();
  const [, type = '', detail = ''] = /^([\w.]+): ?(.*)$/.exec(derniere) ?? [];
  const ou = ligne ? `Ligne ${ligne} : ` : '';
  switch (type) {
    case '_PepinTropLong':
      return 'Ton programme tourne beaucoup trop longtemps… une boucle infinie ? 🌀';
    case 'NameError': {
      const nom = /'([^']+)'/.exec(detail)?.[1] ?? '?';
      return `${ou}je ne connais pas « ${nom} ». Vérifie l'orthographe, ou crée la variable avant de t'en servir !`;
    }
    case 'SyntaxError':
      return `${ou}il y a une faute d'écriture (« ${detail} »). Il manque peut-être « : », une parenthèse ou un guillemet ?`;
    case 'IndentationError':
    case 'TabError':
      return `${ou}problème d'indentation : vérifie les espaces au début des lignes (4 espaces par niveau).`;
    case 'TypeError':
      return `${ou}${detail}`;
    case 'ZeroDivisionError':
      return `${ou}division par zéro ! 😵`;
    case 'RecursionError':
      return "La tête me tourne… Une fonction s'appelle elle-même sans jamais s'arrêter ? 🌀";
    case 'IndexError':
      return `${ou}cet élément n'existe pas dans la liste (${detail}).`;
    default:
      return `${ou}${type || 'Erreur'} : ${detail || derniere}`;
  }
}

// --- L'éditeur de code (CodeMirror) -----------------------------------

let promesseEditeur = null;

function chargerEditeur() {
  promesseEditeur ??= (async () => {
    chargerStyle(`${CODEMIRROR}codemirror.min.css`);
    await chargerScript(`${CODEMIRROR}codemirror.min.js`);
    await chargerScript(`${CODEMIRROR}mode/python/python.min.js`);
  })().catch((e) => {
    promesseEditeur = null;
    throw e;
  });
  return promesseEditeur;
}

// (Ctrl + Entrée pour lancer est géré par toute la page, voir main.js)
export async function creerEditeurPython(conteneur, { surChangement }) {
  await chargerEditeur();
  const cm = window.CodeMirror(conteneur, {
    mode: 'python',
    theme: 'pepin',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    extraKeys: {
      Tab: (editeur) => editeur.replaceSelection('    '),
    },
  });
  cm.on('change', () => surChangement?.(cm.getValue()));
  let ligneActive = null;
  return {
    valeur: () => cm.getValue(),
    remplacer: (texte) => cm.setValue(texte),
    rafraichir: () => cm.refresh(),
    surligner(numero) {
      if (ligneActive !== null) cm.removeLineClass(ligneActive, 'background', 'ligne-active');
      ligneActive = null;
      if (numero) {
        ligneActive = numero - 1;
        cm.addLineClass(ligneActive, 'background', 'ligne-active');
      }
    },
  };
}
