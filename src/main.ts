import { SudokuGame } from './game';
import { SudokuUI } from './ui';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const game = new SudokuGame('medium');

  // Try to restore saved game if exists
  game.loadFromStorage();

  // Create UI
  const ui = new SudokuUI(game);

  // Expose to window for testing / debugging
  (window as any).sudokuGame = game;
  (window as any).sudokuUI = ui;
});
