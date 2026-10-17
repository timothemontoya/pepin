// =============================================================
//  theme.js — Le mode jour ☀️ et le mode nuit 🌙
// =============================================================
//
//  Les couleurs de la page sont des variables CSS qui changent selon
//  l'attribut data-theme de la balise <html>. Les dessins (canvas)
//  et les blocs, eux, doivent être prévenus : on envoie un événement
//  « pepin:theme » à toute la page.
// =============================================================

import { stockage } from './stockage.js';
import { definirNuit } from './rendu.js';

const prefereNuit = window.matchMedia('(prefers-color-scheme: dark)');

export function estNuit() {
  return document.documentElement.dataset.theme === 'dark';
}

function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  definirNuit(theme === 'dark');
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14201A' : '#FFF8EC');
  window.dispatchEvent(new CustomEvent('pepin:theme', { detail: { nuit: theme === 'dark' } }));
}

export function initialiserTheme() {
  const choix = stockage.lire('pepin.theme', null);
  appliquerTheme(choix ?? (prefereNuit.matches ? 'dark' : 'light'));
  // si le joueur n'a rien choisi, on suit les réglages de l'ordinateur
  prefereNuit.addEventListener('change', (e) => {
    if (!stockage.lire('pepin.theme', null)) appliquerTheme(e.matches ? 'dark' : 'light');
  });
}

export function basculerTheme() {
  const theme = estNuit() ? 'light' : 'dark';
  stockage.ecrire('pepin.theme', theme);
  appliquerTheme(theme);
}
