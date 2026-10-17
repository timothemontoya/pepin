// =============================================================
//  etagere.js — La serre : une rangée de pots (une LISTE !)
// =============================================================
//
//  Chaque pot contient une plante d'une certaine hauteur. Les pots
//  sont numérotés à partir de 0, comme les éléments d'une liste en
//  Python : pots[0] est le premier, pots[pots.length - 1] le dernier.
//
//  Un niveau « étagère » a un objectif et plusieurs ESSAIS (plusieurs
//  étagères différentes) : le programme doit marcher pour chacune.
//  Comme ça, impossible de tricher en lisant les nombres à l'écran !
//
//    objectif 'trier'   : ranger les pots du plus petit au plus grand
//    objectif 'cible'   : obtenir exactement les hauteurs de essai.cible
//    objectif 'reponse' : répondre la bonne valeur (essai.reponse)
// =============================================================

export const POTS_MAX = 12;
export const HAUTEUR_POT_MAX = 15;
export const OBJECTIFS = ['trier', 'cible', 'reponse'];

export class Etagere {
  constructor(essai) {
    this.pots = [...essai.pots];
    this.position = 0;   // devant quel pot se tient Pépin
    this.regard = null;  // le pot que Pépin regarde
    this.reponse = null; // ce que Pépin a répondu
  }

  instantane() {
    return {
      pots: [...this.pots],
      position: this.position,
      regard: this.regard,
      reponse: this.reponse,
    };
  }

  // Renvoie un message d'erreur si `i` n'est pas un bon numéro de pot
  probleme(i) {
    if (typeof i !== 'number' || !Number.isFinite(i)) return "Ce n'est pas un numéro de pot.";
    if (!Number.isInteger(i)) return `Le numéro de pot doit être un nombre entier (pas ${arrondir(i)}).`;
    if (this.pots.length === 0) return "L'étagère est vide !";
    if (i < 0 || i >= this.pots.length) {
      return `Il n'y a pas de pot n°${i} : les pots vont de 0 à ${this.pots.length - 1}.`;
    }
    return null;
  }

  regarder(i) {
    this.position = i;
    this.regard = i;
    return this.pots[i];
  }

  echanger(i, j) {
    [this.pots[i], this.pots[j]] = [this.pots[j], this.pots[i]];
    this.position = j;
    this.regard = null;
  }

  arroser(i) {
    this.pots[i]++;
    this.position = i;
    this.regard = null;
  }

  ajouter(hauteur) {
    this.pots.push(hauteur);
    this.position = this.pots.length - 1;
    this.regard = null;
  }

  retirer() {
    const hauteur = this.pots.pop();
    this.position = Math.max(0, this.pots.length - 1);
    this.regard = null;
    return hauteur;
  }

  repondre(valeur) {
    this.reponse = valeur;
    this.regard = null;
  }
}

export function arrondir(nombre) {
  return Number.isInteger(nombre) ? String(nombre) : String(Math.round(nombre * 100) / 100);
}

const egales = (a, b) => a.length === b.length && a.every((valeur, i) => valeur === b[i]);
const estTriee = (pots) => pots.every((hauteur, i) => i === 0 || pots[i - 1] <= hauteur);
const croissant = (liste) => [...liste].sort((x, y) => x - y);
const memesValeurs = (a, b) => egales(croissant(a), croissant(b));

// Le verdict à la fin d'un essai : { gagne, message }
export function verdictEtagere(etagere, niveau, essai) {
  const pots = etagere.pots;
  switch (niveau.objectif) {
    case 'trier':
      if (!memesValeurs(pots, essai.pots)) {
        return { gagne: false, message: "Il fallait juste ranger les pots, sans changer leurs hauteurs ! 🪴" };
      }
      return estTriee(pots)
        ? { gagne: true }
        : { gagne: false, message: "Les pots ne sont pas encore rangés du plus petit au plus grand. 🪴" };
    case 'cible':
      return egales(pots, essai.cible)
        ? { gagne: true }
        : { gagne: false, message: "Les plantes n'ont pas encore les bonnes hauteurs (regarde les petits drapeaux 🚩)." };
    case 'reponse':
      if (etagere.reponse === null || etagere.reponse === undefined) {
        return { gagne: false, message: "Tu n'as rien répondu ! Utilise le bloc « répondre ». 💬" };
      }
      return Math.abs(Number(etagere.reponse) - essai.reponse) < 1e-9
        ? { gagne: true }
        : { gagne: false, message: `Tu as répondu ${formater(etagere.reponse)}, mais la bonne réponse était ${essai.reponse}. 🤔` };
    default:
      return { gagne: false, message: 'Objectif inconnu.' };
  }
}

export function formater(valeur) {
  if (typeof valeur === 'number') return arrondir(valeur);
  if (typeof valeur === 'boolean') return valeur ? 'vrai' : 'faux';
  return String(valeur);
}
