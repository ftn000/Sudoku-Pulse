import { SudokuGame } from './game';
import { SudokuUI } from './ui';
import { haptics } from './haptics';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Telegram WebApp bridge
  haptics.initTelegram();

  // Register PWA Service Worker and purge outdated caches
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'http:')) {
    navigator.serviceWorker.register('./sw.js?v=1.6.6').then((reg) => {
      reg.update().catch(() => {});
    }).catch(() => {});
  }

  const game = new SudokuGame('medium');

  // Try to restore saved game if exists
  game.loadFromStorage();

  // Create UI
  const ui = new SudokuUI(game);

  // Expose to window for testing / debugging
  (window as any).sudokuGame = game;
  (window as any).sudokuUI = ui;
});
