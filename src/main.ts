import { SudokuGame } from './game';
import { SudokuUI } from './ui';
import { haptics } from './haptics';
import { yandexBridge } from './yandex';
import './style.css';

// Dynamic Visual Viewport Height tracking (taking browser address & search bar into account)
export function updateViewportHeight() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  const vh = h * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--app-height', `${h}px`);
}

updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateViewportHeight);
  window.visualViewport.addEventListener('scroll', updateViewportHeight);
}

document.addEventListener('DOMContentLoaded', () => {
  updateViewportHeight();
  // Initialize Telegram WebApp bridge
  haptics.initTelegram();

  // Initialize Yandex Games SDK
  yandexBridge.init().catch(() => {});

  // Lock to portrait orientation if supported
  try {
    if (screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock('portrait').catch(() => {});
    }
  } catch {}

  // Register PWA Service Worker and purge outdated caches
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'http:')) {
    navigator.serviceWorker.register('./sw.js?v=1.7.0').then((reg) => {
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
