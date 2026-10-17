// =============================================================
//  stockage.js — La petite mémoire du navigateur (localStorage)
// =============================================================
//
//  Le localStorage peut être indisponible (navigation privée,
//  cookies bloqués…). Dans ce cas, on ne plante pas : on fait sans.
// =============================================================

export const stockage = {
  lire(cle, defaut) {
    try {
      const valeur = localStorage.getItem(cle);
      return valeur ? JSON.parse(valeur) : defaut;
    } catch {
      return defaut;
    }
  },

  ecrire(cle, valeur) {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
    } catch {
      // tant pis, on ne retiendra pas
    }
  },

  // Toutes les clés qui commencent par `prefixe` (pour les sauvegardes)
  cles(prefixe) {
    try {
      return Object.keys(localStorage).filter((cle) => cle.startsWith(prefixe));
    } catch {
      return [];
    }
  },
};
