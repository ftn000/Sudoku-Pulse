import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const dist = 'C:\\GitHub\\Sudoku-Pulse\\dist';
const promoDir = 'C:\\GitHub\\Sudoku-Pulse\\yandex-promo';

const server = http.createServer((req, res) => {
    let filePath = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) filePath = path.join(dist, 'index.html');
    const ext = path.extname(filePath);
    const mime = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.json': 'application/json'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(4499, async () => {
    console.log('Server running on http://localhost:4499');
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    try {
        const browser = await puppeteer.launch({
            executablePath: edgePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        // ---------------- DESKTOP (1280x720) ----------------
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('sudoku_pulse_tutorial_seen', 'true');
            // Hide daily rewards popup completely
            const style = document.createElement('style');
            style.innerHTML = '#daily-reward-modal, #modal-tutorial, #rating-modal { display: none !important; }';
            document.head ? document.head.appendChild(style) : document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
        });

        await page.goto('http://localhost:4499', { waitUntil: 'networkidle0' });
        await page.evaluate(() => {
            if (window.sudokuUI) {
                window.sudokuUI.openDailyRewardModal = () => {};
                window.sudokuUI.showScreen('menu');
            }
        });
        await new Promise(r => setTimeout(r, 600));

        // 1. Desktop: Clean Main Menu
        await page.screenshot({ path: path.join(promoDir, 'screenshot-desktop-1.png') });
        console.log('Saved screenshot-desktop-1.png (Main Menu)');

        // 2. Desktop: Mode Selection Screen
        await page.evaluate(() => {
            if (window.sudokuUI) window.sudokuUI.showScreen('mode_category');
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(promoDir, 'screenshot-desktop-3.png') });
        console.log('Saved screenshot-desktop-3.png (Mode Selection)');

        // 3. Desktop: Active Gameplay with filled cells
        await page.evaluate(() => {
            if (window.sudokuUI && window.sudokuUI.game) {
                window.sudokuUI.game.startNewGame({ difficulty: 'medium', mode: 'classic', perks: [] });
                window.sudokuUI.showScreen('game');
                const ui = window.sudokuUI;
                const game = ui.game;
                let count = 0;
                for (let r = 0; r < 9 && count < 8; r++) {
                    for (let c = 0; c < 9 && count < 8; c++) {
                        if (game.board[r][c] === 0) {
                            ui.selectCell(r, c);
                            ui.handleNumberInput(game.solution[r][c]);
                            count++;
                        }
                    }
                }
            }
        });
        await new Promise(r => setTimeout(r, 800));
        await page.screenshot({ path: path.join(promoDir, 'screenshot-desktop-2.png') });
        console.log('Saved screenshot-desktop-2.png (Active Gameplay)');

        // 4. Desktop: Tutorial / Rules modal specifically shown
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.innerHTML = '#modal-tutorial { display: flex !important; }';
            document.head.appendChild(style);
            if (window.sudokuUI) window.sudokuUI.openTutorial(0);
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(promoDir, 'screenshot-desktop-4.png') });
        console.log('Saved screenshot-desktop-4.png (Rules & Tutorial)');

        // ---------------- MOBILE (720x1280) ----------------
        const mobilePage = await browser.newPage();
        await mobilePage.setViewport({ width: 720, height: 1280, isMobile: true, hasTouch: true });
        await mobilePage.evaluateOnNewDocument(() => {
            localStorage.setItem('sudoku_pulse_tutorial_seen', 'true');
            const style = document.createElement('style');
            style.innerHTML = '#daily-reward-modal, #modal-tutorial, #rating-modal { display: none !important; }';
            document.head ? document.head.appendChild(style) : document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
        });
        await mobilePage.goto('http://localhost:4499', { waitUntil: 'networkidle0' });
        await mobilePage.evaluate(() => {
            if (window.sudokuUI) {
                window.sudokuUI.openDailyRewardModal = () => {};
                window.sudokuUI.showScreen('menu');
            }
        });
        await new Promise(r => setTimeout(r, 600));

        // 1. Mobile Menu
        await mobilePage.screenshot({ path: path.join(promoDir, 'screenshot-mobile-1.png') });
        console.log('Saved screenshot-mobile-1.png (Mobile Menu)');

        // 2. Mobile Gameplay
        await mobilePage.evaluate(() => {
            if (window.sudokuUI && window.sudokuUI.game) {
                window.sudokuUI.game.startNewGame({ difficulty: 'easy', mode: 'classic', perks: [] });
                window.sudokuUI.showScreen('game');
                const ui = window.sudokuUI;
                const game = ui.game;
                let count = 0;
                for (let r = 0; r < 9 && count < 6; r++) {
                    for (let c = 0; c < 9 && count < 6; c++) {
                        if (game.board[r][c] === 0) {
                            ui.selectCell(r, c);
                            ui.handleNumberInput(game.solution[r][c]);
                            count++;
                        }
                    }
                }
            }
        });
        await new Promise(r => setTimeout(r, 800));
        await mobilePage.screenshot({ path: path.join(promoDir, 'screenshot-mobile-2.png') });
        console.log('Saved screenshot-mobile-2.png (Mobile Gameplay)');

        await browser.close();
        console.log('Screenshots generation completed!');
    } catch (e) {
        console.error('Error generating screenshots:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
