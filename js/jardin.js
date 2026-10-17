// =============================================================
//  jardin.js — Le jardin de Pépin et les règles du jeu
// =============================================================
//
//  C'est TON fichier ! Les TODO 1 à 6 sont ici.
//  Vérifie ton travail en ouvrant la page tests.html :
//  chaque TODO réussi devient vert ✅.
//
//  Comment le jardin est rangé :
//  - this.cases est un tableau de rangées : this.cases[y][x]
//      y = numéro de la rangée (0 tout en haut, ça descend)
//      x = numéro de la colonne (0 tout à gauche, ça va vers la droite)
//  - Chaque case contient un mot : 'herbe', 'rocher', 'graine' ou 'fleur'
//  - this.robot = { x, y, direction }
//
//  Les directions sont des numéros :
//
//              0 (haut)
//                 ↑
//    3 (gauche) ←   → 1 (droite)
//                 ↓
//              2 (bas)
// =============================================================

// Pour chaque direction : de combien on bouge en x (dx) et en y (dy)
// quand on fait UN pas. Exemple : DIRECTIONS[1] = vers la droite.
export const DIRECTIONS = [
  { dx: 0, dy: -1 }, // 0 : haut
  { dx: 1, dy: 0 },  // 1 : droite
  { dx: 0, dy: 1 },  // 2 : bas
  { dx: -1, dy: 0 }, // 3 : gauche
];

// Les symboles utilisés pour dessiner les cartes dans niveaux.js
const SYMBOLES = { '.': 'herbe', '#': 'rocher', 'o': 'graine', '*': 'fleur' };
const SYMBOLES_ROBOT = { '^': 0, '>': 1, 'v': 2, '<': 3 };

export class Jardin {
  constructor(niveau) {
    const lignes = niveau.carte;
    this.hauteur = lignes.length;
    this.largeur = lignes[0].length;
    this.cases = [];
    this.robot = null;

    lignes.forEach((ligne, y) => {
      if (ligne.length !== this.largeur) {
        throw new Error(`la ligne ${y + 1} n'a pas la même longueur que la première`);
      }
      const rangee = [];
      [...ligne].forEach((symbole, x) => {
        if (symbole in SYMBOLES_ROBOT) {
          this.robot = { x, y, direction: SYMBOLES_ROBOT[symbole] };
          rangee.push('herbe');
        } else if (symbole in SYMBOLES) {
          rangee.push(SYMBOLES[symbole]);
        } else {
          throw new Error(`symbole inconnu « ${symbole} » (ligne ${y + 1})`);
        }
      });
      this.cases.push(rangee);
    });

    if (!this.robot) throw new Error('la carte doit contenir Pépin (^ > v ou <)');
  }

  // Une copie du jardin à un instant donné (sert à l'animation)
  instantane() {
    return {
      largeur: this.largeur,
      hauteur: this.hauteur,
      cases: this.cases.map((rangee) => [...rangee]),
      robot: { ...this.robot },
    };
  }

  // ---------------------------------------------------------
  // Tourner
  // ---------------------------------------------------------
  // Change this.robot.direction pour que Pépin pivote sur place.
  // - Tourner à droite : 0 → 1 → 2 → 3 → 0 → ...
  // - Tourner à gauche : 0 → 3 → 2 → 1 → 0 → ...
  //
  // Le piège : après 3, il faut revenir à 0 (et avant 0, aller à 3).
  // L'opérateur modulo % donne le reste d'une division : 5 % 4 vaut 1.
  // Attention : en JavaScript, -1 % 4 vaut -1 (et pas 3) 😬
  // Indice si tu bloques pour la gauche : combien vaut (0 + 3) % 4 ?
  tournerGauche() {
    this.robot.direction = (this.robot.direction + 3) % 4;
  }

  tournerDroite() {
    this.robot.direction = (this.robot.direction + 1) % 4;
  }

  // ---------------------------------------------------------
  // La case devant Pépin
  // ---------------------------------------------------------
  // Renvoie un objet { x, y } : les coordonnées de la case juste
  // devant Pépin, selon la direction où il regarde.
  // Utilise le tableau DIRECTIONS tout en haut du fichier !
  // Exemple : Pépin est en (2, 5) et regarde à droite (1)
  //           → la case devant est (3, 5)
  caseDevant() {
    return { x: this.robot.x + DIRECTIONS[this.robot.direction].dx, y: this.robot.y + DIRECTIONS[this.robot.direction].dy};
  }

  // ---------------------------------------------------------
  // Est-ce que Pépin peut aller sur cette case ?
  // ---------------------------------------------------------
  // Renvoie true si la case (x, y) existe ET n'est pas un rocher.
  // Sinon renvoie false.
  // - « Exister », c'est être dans le jardin : x entre 0 et largeur - 1,
  //   y entre 0 et hauteur - 1. Une case en dehors n'est pas libre !
  // - Vérifie bien que la case existe AVANT de lire this.cases[y][x]
  //   (sinon : erreur si la rangée y n'existe pas).
  estLibre(x, y) {
    const existe = (x >= 0 && x < this.largeur) && (y >= 0 && y < this.hauteur);
    return existe && this.cases[y][x] !== 'rocher';
  }

  // ---------------------------------------------------------
  // Avancer
  // ---------------------------------------------------------
  // Fais avancer Pépin d'une case dans sa direction.
  // - Si la case devant est libre : déplace Pépin et renvoie true.
  // - Sinon : Pépin ne bouge pas et renvoie false (il se cogne, bonk !).
  // Tu peux (et tu devrais 😉) utiliser caseDevant() et estLibre().
  avancer() {
    const nextCase = this.caseDevant();
    if (this.estLibre(nextCase.x, nextCase.y)) {
      this.robot.x = nextCase.x;
      this.robot.y = nextCase.y;
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------
  // Arroser
  // ---------------------------------------------------------
  // Si Pépin est sur une 'graine', elle devient une 'fleur' 🌸
  // et la méthode renvoie true.
  // Sinon, rien ne change et elle renvoie false.
  arroser() {
    if (this.surUneGraine()) {
      this.cases[this.robot.y][this.robot.x] = 'fleur';
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------
  // Le niveau est-il gagné ?
  // ---------------------------------------------------------
  // Renvoie true s'il ne reste plus AUCUNE 'graine' dans le jardin.
  // Il faut parcourir toutes les cases : deux boucles imbriquées
  // (une pour les rangées, une pour les cases de chaque rangée),
  // ou bien cherche ce que fait la méthode .some() des tableaux.
  estGagne() {
    return !this.cases.some(ligne => ligne.some(caseUnique => caseUnique === 'graine'))
  }

  // --- Les capteurs (déjà écrits : ils utilisent tes méthodes !) ---

  devantEstLibre() {
    const devant = this.caseDevant();
    return this.estLibre(devant.x, devant.y);
  }

  surUneGraine() {
    return this.cases[this.robot.y][this.robot.x] === 'graine';
  }

  // La case à gauche (ou à droite) de Pépin, sans qu'il tourne
  coteEstLibre(quart) {
    const { dx, dy } = DIRECTIONS[(this.robot.direction + quart) % 4];
    return this.estLibre(this.robot.x + dx, this.robot.y + dy);
  }

  gaucheEstLibre() {
    return this.coteEstLibre(3);
  }

  droiteEstLibre() {
    return this.coteEstLibre(1);
  }
}
