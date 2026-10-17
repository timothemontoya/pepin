// =============================================================
//  tests.js — Vérifie automatiquement le moteur du jeu : tes TODO,
//  les nouveaux mondes (serre, forêt), le partage par lien… et que
//  chaque solution de la bibliothèque réussit bien son niveau.
//  Ouvre tests.html dans le navigateur pour voir les résultats.
// =============================================================

import { Jardin } from './jardin.js';
import { verifierNiveau, verifierMonde, nomDeFichier, chargerBibliotheque } from './mondes.js';
import { executer } from './execution.js';
import { peindre, redimensionner, nouvelId, compterBlocs, allegerProgramme } from './edition.js';
import { Etagere, verdictEtagere } from './etagere.js';
import { Fractale, clesDesTraits, verdictFractale } from './fractale.js';
import { definirBlocs } from './blocs.js';
import { problemesDeSolutions } from './solutions.js';
import {
  encoderMonde, decoderCode, mondeDUnNiveau, encoderPaquet, decoderPaquet, PREFIXES, versionPourLesEleves,
} from './partage.js';
import { traduireProgramme, optionsDuNiveau } from './solutions.js';
import { creerBacASable, jardinAuHasard, potsAuHasard } from './bac-a-sable.js';
import {
  verifierRendu, etatCase, ajouterRendu, versCSV, fabriquerSauvegarde, verifierSauvegarde,
} from './classe.js';

const groupes = new Map();

function test(todo, description, fonction) {
  if (!groupes.has(todo)) groupes.set(todo, []);
  groupes.get(todo).push({ description, fonction });
}

function attendu(valeur, attendue, explication) {
  const a = JSON.stringify(valeur);
  const b = JSON.stringify(attendue);
  if (a !== b) throw new Error(`${explication} : on attendait ${b}, on a obtenu ${a}`);
}

const jardin = (...carte) => new Jardin({ carte });

// --- TODO 1 ---------------------------------------------------------
test('TODO 1 — Tourner', 'tourner à droite depuis la droite (1) → bas (2)', () => {
  const m = jardin('>.');
  m.tournerDroite();
  attendu(m.robot.direction, 2, 'direction');
});
test('TODO 1 — Tourner', 'quatre fois à droite → on revient au départ', () => {
  const m = jardin('>.');
  for (let i = 0; i < 4; i++) m.tournerDroite();
  attendu(m.robot.direction, 1, 'direction');
});
test('TODO 1 — Tourner', 'tourner à gauche depuis le haut (0) → gauche (3)', () => {
  const m = jardin('^.');
  m.tournerGauche();
  attendu(m.robot.direction, 3, 'direction');
});
test('TODO 1 — Tourner', 'tourner ne déplace pas Pépin', () => {
  const m = jardin('.v.');
  m.tournerGauche();
  m.tournerDroite();
  attendu([m.robot.x, m.robot.y], [1, 0], 'position');
});

// --- TODO 2 ---------------------------------------------------------
test('TODO 2 — La case devant', 'Pépin en (1, 1) regarde à droite → (2, 1)', () => {
  attendu(jardin('...', '.>.', '...').caseDevant(), { x: 2, y: 1 }, 'case devant');
});
test('TODO 2 — La case devant', 'Pépin en (1, 1) regarde en haut → (1, 0)', () => {
  attendu(jardin('...', '.^.', '...').caseDevant(), { x: 1, y: 0 }, 'case devant');
});
test('TODO 2 — La case devant', 'Pépin en (1, 1) regarde à gauche → (0, 1)', () => {
  attendu(jardin('...', '.<.', '...').caseDevant(), { x: 0, y: 1 }, 'case devant');
});
test('TODO 2 — La case devant', 'Pépin en (1, 1) regarde en bas → (1, 2)', () => {
  attendu(jardin('...', '.v.', '...').caseDevant(), { x: 1, y: 2 }, 'case devant');
});

// --- TODO 3 ---------------------------------------------------------
test('TODO 3 — Case libre ?', "l'herbe, les graines et les fleurs sont libres", () => {
  const m = jardin('>o*');
  attendu([m.estLibre(0, 0), m.estLibre(1, 0), m.estLibre(2, 0)], [true, true, true], 'estLibre');
});
test('TODO 3 — Case libre ?', "un rocher n'est pas libre", () => {
  attendu(jardin('>#').estLibre(1, 0), false, 'estLibre(1, 0)');
});
test('TODO 3 — Case libre ?', 'en dehors du jardin, ce n\'est pas libre', () => {
  const m = jardin('>.', '..');
  attendu(
    [m.estLibre(-1, 0), m.estLibre(2, 0), m.estLibre(0, -1), m.estLibre(0, 2)],
    [false, false, false, false],
    'estLibre aux 4 bords',
  );
});

// --- TODO 4 ---------------------------------------------------------
test('TODO 4 — Avancer', "avancer sur l'herbe déplace Pépin et renvoie true", () => {
  const m = jardin('>..');
  attendu(m.avancer(), true, 'valeur renvoyée');
  attendu([m.robot.x, m.robot.y], [1, 0], 'position');
});
test('TODO 4 — Avancer', 'avancer vers le bas augmente y', () => {
  const m = jardin('v', '.');
  m.avancer();
  attendu([m.robot.x, m.robot.y], [0, 1], 'position');
});
test('TODO 4 — Avancer', 'contre un rocher : Pépin ne bouge pas et renvoie false', () => {
  const m = jardin('>#');
  attendu(m.avancer(), false, 'valeur renvoyée');
  attendu([m.robot.x, m.robot.y], [0, 0], 'position');
});
test('TODO 4 — Avancer', 'au bord du jardin : Pépin ne bouge pas et renvoie false', () => {
  const m = jardin('.<');
  m.avancer();
  attendu(m.avancer(), false, 'valeur renvoyée au 2e pas');
  attendu([m.robot.x, m.robot.y], [0, 0], 'position');
});

// --- TODO 5 ---------------------------------------------------------
test('TODO 5 — Arroser', 'arroser une graine la transforme en fleur', () => {
  const m = jardin('>o');
  m.avancer();
  attendu(m.arroser(), true, 'valeur renvoyée');
  attendu(m.cases[0][1], 'fleur', 'case (1, 0)');
});
test('TODO 5 — Arroser', "arroser l'herbe ne change rien", () => {
  const m = jardin('>o');
  attendu(m.arroser(), false, 'valeur renvoyée');
  attendu(m.cases[0], ['herbe', 'graine'], 'rangée 0');
});

// --- TODO 6 ---------------------------------------------------------
test('TODO 6 — Gagné ?', 'pas gagné tant qu\'il reste une graine', () => {
  attendu(jardin('>.', '.o').estGagne(), false, 'estGagne');
});
test('TODO 6 — Gagné ?', 'gagné quand il ne reste que des fleurs', () => {
  attendu(jardin('>*', '.*').estGagne(), true, 'estGagne');
});
test('TODO 6 — Gagné ?', 'gagné après avoir tout arrosé', () => {
  const m = jardin('>oo');
  m.avancer(); m.arroser(); m.avancer(); m.arroser();
  attendu(m.estGagne(), true, 'estGagne');
});

// --- TODO 8 ---------------------------------------------------------
test('TODO 8 — Boucles infinies', 'une boucle géante est arrêtée avec un message', () => {
  const resultat = executer('for (let i = 0; i < 1e6; i++) { tourDeBoucle(); }', { carte: ['>o'] });
  if (!resultat.erreur) throw new Error("le programme n'a pas été arrêté");
});
test('TODO 8 — Boucles infinies', 'une petite boucle normale fonctionne toujours', () => {
  const resultat = executer('for (let i = 0; i < 5; i++) { tourDeBoucle(); }', { carte: ['>o'] });
  attendu(resultat.erreur, null, 'erreur');
});

// --- Outils pour les TODO 11 et 12 ------------------------------------

const niveauValide = (changements = {}) => ({
  id: 'test',
  type: 'jardin',
  titre: 'Un niveau',
  consigne: 'Arrose la graine !',
  blocs: ['avancer', 'arroser'],
  carte: ['>o'],
  ...changements,
});

const mondeValide = (changements = {}) => ({
  format: 'pepin-monde',
  version: 1,
  id: 'mon-monde',
  titre: 'Mon monde',
  niveaux: [niveauValide()],
  ...changements,
});

function trouveDesErreurs(erreurs) {
  if (!Array.isArray(erreurs)) throw new Error(`il faut renvoyer un tableau, pas ${JSON.stringify(erreurs)}`);
  if (erreurs.length === 0) throw new Error("aucune erreur trouvée, alors qu'il y a un problème");
}

// --- TODO 11 --------------------------------------------------------
test('TODO 11 — Vérifier un niveau', 'un niveau correct → aucune erreur', () => {
  attendu(verifierNiveau(niveauValide(), 1), [], 'erreurs');
});
test('TODO 11 — Vérifier un niveau', 'les messages commencent par le numéro du niveau', () => {
  const erreurs = verifierNiveau(niveauValide({ titre: '' }), 3);
  trouveDesErreurs(erreurs);
  if (!erreurs[0].startsWith('Niveau 3')) throw new Error(`message reçu : « ${erreurs[0]} »`);
});
test('TODO 11 — Vérifier un niveau', 'a) titre absent ou consigne vide', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ titre: undefined }), 1));
  trouveDesErreurs(verifierNiveau(niveauValide({ consigne: '   ' }), 1));
});
test('TODO 11 — Vérifier un niveau', 'b) type inconnu', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ type: 'espace' }), 1));
});
test('TODO 11 — Vérifier un niveau', "c) blocs n'est pas un tableau, ou contient un bloc inconnu", () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ blocs: 'avancer' }), 1));
  trouveDesErreurs(verifierNiveau(niveauValide({ blocs: ['avancer', 'voler'] }), 1));
});
test('TODO 11 — Vérifier un niveau', "d) carte qui n'est pas un tableau (sans planter !)", () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: '>o' }), 1));
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: undefined }), 1));
});
test('TODO 11 — Vérifier un niveau', 'd) jardin trop grand', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['>o..............'] }), 1));
});
test('TODO 11 — Vérifier un niveau', 'e) carte illisible (lignes de longueurs différentes, symbole inconnu)', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['>o', '...'] }), 1));
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['>oX'] }), 1));
});
test('TODO 11 — Vérifier un niveau', 'e) pas de Pépin', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['.o'] }), 1));
});
test('TODO 11 — Vérifier un niveau', 'f) deux Pépins', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['>o<'] }), 1));
});
test('TODO 11 — Vérifier un niveau', 'g) aucune graine', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ carte: ['>.*'] }), 1));
});

// --- TODO 12 --------------------------------------------------------
test('TODO 12 — Vérifier un monde', 'un monde correct → aucune erreur', () => {
  attendu(verifierMonde(mondeValide()), [], 'erreurs');
});
test('TODO 12 — Vérifier un monde', "ce n'est pas un objet : null, 42, un tableau (sans planter !)", () => {
  trouveDesErreurs(verifierMonde(null));
  trouveDesErreurs(verifierMonde(42));
  trouveDesErreurs(verifierMonde([]));
});
test('TODO 12 — Vérifier un monde', 'a) mauvais format ou mauvaise version', () => {
  trouveDesErreurs(verifierMonde(mondeValide({ format: 'scratch' })));
  trouveDesErreurs(verifierMonde(mondeValide({ version: 99 })));
});
test('TODO 12 — Vérifier un monde', 'b) id avec des majuscules, espaces ou symboles', () => {
  trouveDesErreurs(verifierMonde(mondeValide({ id: 'Mon Monde !' })));
});
test('TODO 12 — Vérifier un monde', 'c) titre manquant', () => {
  trouveDesErreurs(verifierMonde(mondeValide({ titre: '' })));
});
test('TODO 12 — Vérifier un monde', "d) niveaux absents ou vides", () => {
  trouveDesErreurs(verifierMonde(mondeValide({ niveaux: [] })));
  trouveDesErreurs(verifierMonde(mondeValide({ niveaux: undefined })));
});
test('TODO 12 — Vérifier un monde', 'e) un niveau abîmé est signalé avec son numéro', () => {
  const erreurs = verifierMonde(mondeValide({
    niveaux: [niveauValide({ id: 'a' }), niveauValide({ id: 'b', carte: ['>..'] })],
  }));
  trouveDesErreurs(erreurs);
  if (!erreurs.some((e) => e.startsWith('Niveau 2'))) throw new Error(`erreurs reçues : ${JSON.stringify(erreurs)}`);
});
test('TODO 12 — Vérifier un monde', 'f) deux niveaux avec le même id', () => {
  trouveDesErreurs(verifierMonde(mondeValide({ niveaux: [niveauValide(), niveauValide()] })));
});

// --- TODO 13 --------------------------------------------------------
test('TODO 13 — Nom de fichier', "'La Forêt des Boucles !' → 'la-foret-des-boucles'", () => {
  attendu(nomDeFichier('La Forêt des Boucles !'), 'la-foret-des-boucles', 'nom');
});
test('TODO 13 — Nom de fichier', "'  Été 2026 ' → 'ete-2026'", () => {
  attendu(nomDeFichier('  Été 2026 '), 'ete-2026', 'nom');
});
test('TODO 13 — Nom de fichier', "'Pépin & Cie' → 'pepin-cie'", () => {
  attendu(nomDeFichier('Pépin & Cie'), 'pepin-cie', 'nom');
});
test('TODO 13 — Nom de fichier', "'!!!' → 'mon-monde'", () => {
  attendu(nomDeFichier('!!!'), 'mon-monde', 'nom');
});

// --- TODO 14 --------------------------------------------------------
test('TODO 14 — Le pinceau', 'peindre un rocher en (1, 0)', () => {
  attendu(peindre(['...', '...'], 1, 0, '#'), ['.#.', '...'], 'carte');
});
test('TODO 14 — Le pinceau', 'peindre une graine sur la dernière case', () => {
  attendu(peindre(['>..', '...'], 2, 1, 'o'), ['>..', '..o'], 'carte');
});
test('TODO 14 — Le pinceau', 'la carte de départ ne doit pas changer', () => {
  const carte = ['>..'];
  peindre(carte, 1, 0, '#');
  attendu(carte, ['>..'], 'carte de départ');
});
test('TODO 14 — Le pinceau', "poser Pépin efface l'ancien Pépin", () => {
  attendu(peindre(['>..', '...'], 2, 1, 'v'), ['...', '..v'], 'carte');
});
test('TODO 14 — Le pinceau', 'reposer Pépin au même endroit le fait tourner', () => {
  attendu(peindre(['.>.'], 1, 0, '^'), ['.^.'], 'carte');
});
test('TODO 14 — Le pinceau', 'en dehors de la carte : rien ne change', () => {
  attendu(peindre(['>.'], 5, 0, '#'), ['>.'], 'carte');
  attendu(peindre(['>.'], 0, 3, '#'), ['>.'], 'carte');
});

// --- TODO 15 --------------------------------------------------------
test('TODO 15 — Redimensionner', 'agrandir : les nouvelles cases sont de l\'herbe', () => {
  attendu(redimensionner(['>o'], 3, 2), ['>o.', '...'], 'carte');
});
test('TODO 15 — Redimensionner', 'rétrécir : ce qui dépasse est coupé', () => {
  attendu(redimensionner(['>o..', '....', '....'], 2, 1), ['>o'], 'carte');
});
test('TODO 15 — Redimensionner', 'plus large mais moins haut', () => {
  attendu(redimensionner(['>o', '..'], 3, 1), ['>o.'], 'carte');
});
test('TODO 15 — Redimensionner', 'la carte de départ ne doit pas changer', () => {
  const carte = ['>o'];
  redimensionner(carte, 4, 3);
  attendu(carte, ['>o'], 'carte de départ');
});

// --- TODO 16 --------------------------------------------------------
test('TODO 16 — Un id unique', "'Le Virage' sans id existant → 'le-virage'", () => {
  attendu(nouvelId('Le Virage', []), 'le-virage', 'id');
});
test('TODO 16 — Un id unique', "'le-virage' est pris → 'le-virage-2'", () => {
  attendu(nouvelId('Le Virage', ['le-virage']), 'le-virage-2', 'id');
});
test('TODO 16 — Un id unique', "'le-virage' et 'le-virage-2' sont pris → 'le-virage-3'", () => {
  attendu(nouvelId('Le Virage', ['le-virage', 'le-virage-2', 'escalier']), 'le-virage-3', 'id');
});

// --- La serre (listes) ---------------------------------------------------
const essaiSerre = (pots, extra = {}) => ({ pots, ...extra });

test('La serre', "les pots sont copiés : l'essai de départ ne change pas", () => {
  const essai = essaiSerre([3, 1]);
  const etagere = new Etagere(essai);
  etagere.arroser(0);
  attendu(essai.pots, [3, 1], 'essai');
  attendu(etagere.pots, [4, 1], 'étagère');
});
test('La serre', 'échanger deux pots', () => {
  const etagere = new Etagere(essaiSerre([1, 2, 3]));
  etagere.echanger(0, 2);
  attendu(etagere.pots, [3, 2, 1], 'pots');
});
test('La serre', 'un mauvais numéro de pot est refusé (avec un message)', () => {
  const etagere = new Etagere(essaiSerre([1, 2, 3]));
  attendu([etagere.probleme(0), etagere.probleme(2)], [null, null], 'numéros valides');
  for (const mauvais of [3, -1, 1.5, '1']) {
    if (!etagere.probleme(mauvais)) throw new Error(`le numéro ${JSON.stringify(mauvais)} aurait dû être refusé`);
  }
});
test('La serre', "objectif 'trier' : rangé ET mêmes hauteurs", () => {
  const niveau = { objectif: 'trier' };
  const triee = new Etagere(essaiSerre([1, 2, 3]));
  attendu(verdictEtagere(triee, niveau, essaiSerre([3, 1, 2])).gagne, true, 'triée');
  const tricheuse = new Etagere(essaiSerre([1, 1, 1]));
  attendu(verdictEtagere(tricheuse, niveau, essaiSerre([3, 1, 2])).gagne, false, 'hauteurs changées');
});
test('La serre', "objectif 'reponse'", () => {
  const niveau = { objectif: 'reponse' };
  const etagere = new Etagere(essaiSerre([4, 9]));
  attendu(verdictEtagere(etagere, niveau, essaiSerre([4, 9], { reponse: 9 })).gagne, false, 'sans réponse');
  etagere.repondre(9);
  attendu(verdictEtagere(etagere, niveau, essaiSerre([4, 9], { reponse: 9 })).gagne, true, 'bonne réponse');
});
test('La serre', 'un programme est testé sur toutes les étagères', () => {
  const niveau = {
    type: 'etagere',
    objectif: 'cible',
    essais: [essaiSerre([1, 2], { cible: [2, 2] }), essaiSerre([5, 5, 5], { cible: [6, 5, 5] })],
  };
  attendu(executer('arroserPot(0);', niveau).gagne, true, 'arroser le pot n°0');
  const rate = executer('arroserPot(1);', niveau);
  attendu([rate.gagne, rate.essais.length], [false, 1], 'arrêt au premier essai raté');
});
test('La serre', 'sortir de l\'étagère donne une erreur gentille', () => {
  const niveau = { type: 'etagere', objectif: 'cible', essais: [essaiSerre([1], { cible: [1] })] };
  const resultat = executer('arroserPot(5);', niveau);
  if (!/n°5/.test(resultat.erreur ?? '')) throw new Error(`message reçu : ${resultat.erreur}`);
});

// --- La forêt fractale ------------------------------------------------------
test('La forêt fractale', 'pousser vers le haut puis tourner à droite', () => {
  const foret = new Fractale();
  foret.pousser(10);
  foret.tourner(90);
  foret.pousser(10);
  attendu([...clesDesTraits(foret.traits)].sort(), ['0.0,-10.0|0.0,0.0', '0.0,-10.0|10.0,-10.0'], 'traits');
});
test('La forêt fractale', 'un trait dessiné dans les deux sens compte une seule fois', () => {
  attendu(clesDesTraits([[0, 0, 5, 0], [5, 0, 0, 0]]).size, 1, 'nombre de traits');
});
test('La forêt fractale', 'reculer ne dessine rien', () => {
  const foret = new Fractale();
  foret.reculer(30);
  attendu([foret.traits.length, foret.y], [0, 30], 'traits et position');
});
test('La forêt fractale', 'gagner = exactement le modèle, ni plus ni moins', () => {
  const modele = clesDesTraits([[0, 0, 0, -10]]);
  const bon = new Fractale();
  bon.pousser(10);
  attendu(verdictFractale(bon, modele).gagne, true, 'même dessin');
  const enTrop = new Fractale();
  enTrop.pousser(20);
  attendu(verdictFractale(enTrop, modele).gagne, false, 'dessin différent');
});

// --- Le moteur ----------------------------------------------------------------
test('Le moteur', 'compter les blocs (sans le départ ni les ombres)', () => {
  const programme = {
    blocks: {
      blocks: [{
        type: 'pepin_depart',
        next: {
          block: {
            type: 'controls_repeat_ext',
            inputs: { TIMES: { shadow: { type: 'math_number' } }, DO: { block: { type: 'pepin_avancer' } } },
          },
        },
      }],
    },
  };
  attendu(compterBlocs(programme), 2, 'nombre de blocs');
});
test('Le moteur', "alléger un programme enlève les id des blocs, pas ceux des variables", () => {
  const leger = allegerProgramme({ blocks: { blocks: [{ type: 'a', id: 'x', fields: { VAR: { id: 'v1' } } }] } });
  attendu(leger, { blocks: { blocks: [{ type: 'a', fields: { VAR: { id: 'v1' } } }] } }, 'programme');
});
test('Le moteur', 'la pile des fonctions est enregistrée à chaque étape', () => {
  const code = 'function f(n) { entrer("f", {n: n}); try { avancer(); } finally { sortir(); } } f(3);';
  const resultat = executer(code, { carte: ['>.o'] });
  attendu(resultat.etapes[1].pile, [{ nom: 'f', args: { n: 3 } }], 'pile');
});
test('Le moteur', 'les variables sont lues à chaque étape', () => {
  const code = 'var x = 0; surligner("b1", function () { return { x: x }; }); x = 7; avancer();';
  attendu(executer(code, { carte: ['>.o'] }).etapes[1].variables, { x: 7 }, 'variables');
});
test('Le moteur', 'une récursion infinie est arrêtée', () => {
  const code = 'function f() { entrer("f", {}); try { f(); } finally { sortir(); } } f();';
  if (!executer(code, { carte: ['>o'] }).erreur) throw new Error("la récursion n'a pas été arrêtée");
});

// --- Vérifier les nouveaux niveaux ---------------------------------------------
test('Vérifier les nouveaux niveaux', 'une serre correcte → aucune erreur', () => {
  const niveau = {
    id: 's', type: 'etagere', titre: 'Serre', consigne: 'Range !', blocs: ['echanger'],
    objectif: 'trier', essais: [{ pots: [2, 1] }],
  };
  attendu(verifierNiveau(niveau, 1), [], 'erreurs');
});
test('Vérifier les nouveaux niveaux', 'une serre sans étagère, ou avec des hauteurs bizarres → erreurs', () => {
  const base = { id: 's', type: 'etagere', titre: 'Serre', consigne: 'Range !', blocs: [], objectif: 'trier' };
  trouveDesErreurs(verifierNiveau({ ...base, essais: [] }, 1));
  trouveDesErreurs(verifierNiveau({ ...base, essais: [{ pots: [1, -2] }] }, 1));
  trouveDesErreurs(verifierNiveau({ ...base, objectif: 'cible', essais: [{ pots: [1] }] }, 1));
});
test('Vérifier les nouveaux niveaux', 'un bloc de la serre dans un jardin → erreur', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ blocs: ['avancer', 'echanger'] }), 1));
});
test('Vérifier les nouveaux niveaux', 'un défi bonus mal écrit → erreur', () => {
  trouveDesErreurs(verifierNiveau(niveauValide({ exigences: { maxBlocs: 0 } }), 1));
  trouveDesErreurs(verifierNiveau(niveauValide({ exigences: 'six' }), 1));
  attendu(verifierNiveau(niveauValide({ exigences: { maxBlocs: 6 } }), 1), [], 'défi correct');
});

// --- Le partage par lien (asynchrone) -------------------------------------------
test('Le partage par lien', 'un monde encodé puis décodé revient identique', async () => {
  const monde = mondeValide({ titre: 'Été à la serre 🪴' });
  const code = await encoderMonde(monde);
  if (!code.startsWith('P1.') || /[^A-Za-z0-9._-]/.test(code)) throw new Error(`code bizarre : ${code}`);
  attendu(await decoderCode(`https://exemple.fr/index.html#monde=${code}`), monde, 'monde');
});
test('Le partage par lien', 'un code abîmé est refusé', async () => {
  let refuse = false;
  try {
    await decoderCode('P1.abimeabime');
  } catch {
    refuse = true;
  }
  if (!refuse) throw new Error('le code abîmé a été accepté');
});
test('Le partage par lien', 'partager un seul niveau donne un mini-monde valide', () => {
  attendu(verifierMonde(mondeDUnNiveau(mondeValide(), 0)), [], 'erreurs');
});

// --- La bibliothèque : toutes les solutions doivent réussir leur niveau -----------
definirBlocs();
const bibliotheque = await chargerBibliotheque();
for (const entree of bibliotheque) {
  const nom = entree.monde?.titre ?? entree.fichier;
  test('La bibliothèque', `« ${nom} » est un monde valide`, () => {
    if (entree.erreur) throw new Error(entree.erreur.join(' · '));
  });
  if (!entree.monde) continue;
  test('La bibliothèque', `« ${nom} » : chaque solution réussit son niveau`, () => {
    const sansSolution = entree.monde.niveaux.filter((n) => !n.solution).map((n) => n.titre);
    if (sansSolution.length) throw new Error(`niveaux sans solution : ${sansSolution.join(', ')}`);
    const problemes = problemesDeSolutions(entree.monde);
    if (problemes.length) throw new Error(problemes.join(' · '));
  });
}

// --- Le suivi de la classe : rendus et sauvegardes ----------------------------------
const bases = bibliotheque.find((entree) => entree.monde?.id === 'bases')?.monde;

const renduDe = (niveaux, eleve = { prenom: 'Léa', classe: '5e B' }, date = '2026-10-17T10:00:00.000Z') => ({
  format: 'pepin-rendu', version: 1, date, eleve, monde: { id: 'bases', titre: 'Les bases' }, niveaux,
});

test('Le suivi de la classe', 'un rendu passe dans un code et revient identique', async () => {
  const rendu = renduDe([{ id: 'premiers-pas', titre: 'Premiers pas', reussi: true, medaille: false, python: false, programme: null, codePython: null }]);
  const { sorte, json } = await decoderPaquet(await encoderPaquet(PREFIXES.rendu, rendu));
  attendu([sorte, JSON.parse(json)], ['rendu', rendu], 'rendu décodé');
});
test('Le suivi de la classe', 'un rendu bizarre est refusé', () => {
  trouveDesErreurs(verifierRendu(null));
  trouveDesErreurs(verifierRendu(renduDe('pas une liste')));
  trouveDesErreurs(verifierRendu(renduDe([], { prenom: '' })));
  attendu(verifierRendu(renduDe([])), [], 'rendu vide mais correct');
});
test('Le suivi de la classe', 'un vrai programme gagnant est vérifié ✅', () => {
  const niveau = bases.niveaux[0];
  const etat = etatCase(niveau, { id: niveau.id, reussi: true, programme: niveau.solution });
  attendu(etat.code, 'ok', 'état');
});
test('Le suivi de la classe', 'un rendu trafiqué (mauvais programme) est repéré ⚠️', () => {
  const niveau = bases.niveaux[1]; // le virage, avec la solution des premiers pas
  const etat = etatCase(niveau, { id: niveau.id, reussi: true, programme: bases.niveaux[0].solution });
  attendu(etat.code, 'faux', 'état');
});
test('Le suivi de la classe', 'un élève qui rend deux fois : on garde le plus récent', () => {
  const ancien = renduDe([], undefined, '2026-10-01T10:00:00.000Z');
  const recent = renduDe([], undefined, '2026-10-02T10:00:00.000Z');
  let { liste } = ajouterRendu([], recent);
  const encore = ajouterRendu(liste, ancien);
  attendu([encore.ajoute, encore.liste.length], [false, 1], 'ancien refusé');
  liste = ajouterRendu([ancien], recent).liste;
  attendu([liste.length, liste[0].date], [1, recent.date], 'récent gardé');
});
test('Le suivi de la classe', 'export pour tableur : séparateur ; et guillemets échappés', () => {
  const csv = versCSV([['Élève', 'Note'], ['Léa "la pro"', 'réussi; bravo']]);
  attendu(csv.slice(1), 'Élève;Note\r\n"Léa ""la pro""";"réussi; bravo"', 'csv');
});
test('Le suivi de la classe', 'une sauvegarde fabriquée est valide', () => {
  attendu(verifierSauvegarde(fabriquerSauvegarde({ prenom: 'Léa', classe: '5e B' })), [], 'erreurs');
  trouveDesErreurs(verifierSauvegarde({ format: 'pepin-sauvegarde', version: 1 }));
});

// --- Les solutions cachées (pour les évaluations) --------------------------------
const foret = bibliotheque.find((entree) => entree.monde?.id === 'foret-fractale')?.monde;

test('Les solutions cachées', 'solutions visibles : le monde partagé garde ses solutions', () => {
  attendu(versionPourLesEleves(bases), bases, 'monde');
});
test('Les solutions cachées', 'solutions cachées : plus aucune solution dans ce qui part chez les élèves', async () => {
  const protege = versionPourLesEleves({ ...foret, solutionsVisibles: false });
  if (protege.niveaux.some((n) => 'solution' in n)) throw new Error('une solution est restée');
  const { json } = await decoderPaquet(await encoderMonde({ ...bases, solutionsVisibles: false }));
  if (json.includes('"solution"')) throw new Error('le lien contient encore une solution');
});
test('Les solutions cachées', 'la forêt reste jouable : on garde juste le modèle à dessiner', () => {
  const protege = versionPourLesEleves({ ...foret, solutionsVisibles: false });
  attendu(verifierMonde(protege), [], 'erreurs du monde protégé');
  attendu(problemesDeSolutions(protege), [], 'problèmes');
  // la solution de l'auteur réussit toujours le niveau protégé (le flocon)
  const original = foret.niveaux[6];
  const { code } = traduireProgramme(original.solution, original.blocs);
  attendu(executer(code, protege.niveaux[6], optionsDuNiveau(protege.niveaux[6])).gagne, true, 'flocon réussi');
});
test('Les solutions cachées', 'un modèle de dessin abîmé est refusé', () => {
  const niveau = { id: 'f', type: 'fractale', titre: 'Forêt', consigne: 'Dessine !', blocs: ['pousser'] };
  trouveDesErreurs(verifierNiveau({ ...niveau, modele: [[0, 0, 'x', 1]] }, 1));
  trouveDesErreurs(verifierNiveau({ ...niveau, modele: 'carré' }, 1));
  attendu(verifierNiveau({ ...niveau, modele: [[0, 0, 0, -10]] }, 1), [], 'modèle correct');
});

// --- Les nouveautés du moteur ------------------------------------------------
test('Le moteur (suite)', 'les capteurs gauche / droite regardent sans tourner', () => {
  const j = jardin('.#.', '.>.', '...');
  attendu([j.gaucheEstLibre(), j.droiteEstLibre(), j.robot.direction], [false, true, 1], 'Pépin regarde à droite');
  const bord = jardin('^..');
  attendu([bord.gaucheEstLibre(), bord.droiteEstLibre()], [false, true], 'le bord du jardin compte comme un mur');
});

test('Le moteur (suite)', 'un jardin peut être testé sur plusieurs cartes', () => {
  const niveau = { type: 'jardin', carte: ['>.o'], autresCartes: [['>o'], ['>..o']] };
  const r = executer('while (!surUneGraine()) { avancer(); } arroser();', niveau);
  attendu([r.gagne, r.essais.length], [true, 3], 'les 3 jardins réussis');
  const triche = executer('avancer(); avancer(); arroser();', niveau);
  attendu([triche.gagne, triche.essais.length], [false, 2], 'un programme « par cœur » rate le 2e jardin');
});

test('Le moteur (suite)', 'maxRegards : on ne peut pas regarder plus de pots que permis', () => {
  const niveau = { type: 'etagere', objectif: 'reponse', maxRegards: 2, essais: [{ pots: [1, 2, 3], reponse: 3 }] };
  const ok = executer('repondre(hauteur(2));', niveau);
  attendu(ok.gagne, true, 'un seul regard : gagné');
  const trop = executer('hauteur(0); hauteur(1); repondre(hauteur(2));', niveau);
  attendu([trop.gagne, /maximum/.test(trop.erreur)], [false, true], 'trois regards : refusé');
});

test('Le moteur (suite)', 'le programme de départ et la difficulté « expert » sont acceptés', () => {
  const niveau = { id: 'x', type: 'jardin', titre: 'x', consigne: 'x', blocs: ['avancer'], carte: ['>o'], depart: { blocks: {} } };
  attendu(verifierNiveau(niveau, 1), [], 'programme de départ valide');
  attendu(verifierNiveau({ ...niveau, depart: 'cassé' }, 1).length, 1, 'programme de départ illisible');
  const monde = { format: 'pepin-monde', version: 1, id: 'x', titre: 'x', difficulte: 4, niveaux: [{ ...niveau }] };
  attendu(verifierMonde(monde), [], 'difficulté 4');
});

// --- Bac à sable ------------------------------------------------------------
test('Bac à sable', 'un jardin tiré au hasard est toujours un jardin valide', () => {
  for (let i = 0; i < 50; i++) {
    const carte = jardinAuHasard();
    if (verifierNiveau({ id: 'x', type: 'jardin', titre: 'x', consigne: 'x', blocs: ['avancer'], carte }, 1).length) {
      throw new Error(`jardin invalide : ${carte.join(' / ')}`);
    }
  }
});

test('Bac à sable', 'une étagère tirée au hasard a entre 4 et 8 pots', () => {
  for (let i = 0; i < 50; i++) {
    const pots = potsAuHasard();
    if (pots.length < 4 || pots.length > 8 || pots.some((h) => h < 1)) throw new Error(`étagère bizarre : ${pots}`);
  }
});

test('Bac à sable', 'dans un jardin libre, Pépin continue après la dernière graine', () => {
  const code = 'avancer(); arroser(); avancer();';
  const normal = executer(code, { type: 'jardin', carte: ['>o.'] });
  const libre = executer(code, { type: 'jardin', carte: ['>o.'], libre: true });
  attendu(normal.gagne, true, 'niveau normal gagné');
  attendu(normal.etapes.length, 3, 'niveau normal : on s’arrête à la victoire');
  attendu(libre.etapes.length, 4, 'niveau libre : tout le programme est joué');
  attendu([libre.gagne, libre.erreur, libre.message], [false, null, null], 'ni gagné, ni raté');
});

test('Bac à sable', 'les 3 terrains du bac à sable sont des niveaux valides', () => {
  const monde = creerBacASable();
  for (const [i, niveau] of monde.niveaux.entries()) {
    const erreurs = verifierNiveau(niveau, i + 1).filter((e) => !/solution|modèle|objectif/i.test(e));
    if (erreurs.length) throw new Error(erreurs.join(' ; '));
  }
});

// --- Affichage ----------------------------------------------------------

const zone = document.getElementById('resultats');
let reussis = 0;
let total = 0;

for (const [todo, tests] of groupes) {
  const section = document.createElement('section');
  const liste = document.createElement('ul');
  let tousBons = true;
  for (const { description, fonction } of tests) {
    total++;
    const ligne = document.createElement('li');
    try {
      await fonction();
      reussis++;
      ligne.textContent = `✅ ${description}`;
    } catch (e) {
      tousBons = false;
      ligne.textContent = `❌ ${description}`;
      const detail = document.createElement('span');
      detail.className = 'detail';
      detail.textContent = e.message;
      ligne.append(detail);
    }
    liste.append(ligne);
  }
  const titre = document.createElement('h2');
  titre.textContent = `${tousBons ? '🌷' : '🌱'} ${todo}`;
  section.append(titre, liste);
  zone.append(section);
}

document.getElementById('resume').textContent =
  reussis === total ? `Tout est vert ! ${reussis}/${total} 🎉` : `${reussis}/${total} tests réussis`;
