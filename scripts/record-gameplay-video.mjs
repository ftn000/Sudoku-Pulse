import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';

const dist = 'C:\\GitHub\\Sudoku-Pulse\\dist';
const promoDir = 'C:\\GitHub\\Sudoku-Pulse\\yandex-promo';
const framesDir = 'C:\\GitHub\\Sudoku-Pulse\\yandex-promo\\frames';
const outputVideo = path.join(promoDir, 'gameplay-horizontal.mp4');

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
for (const f of fs.readdirSync(framesDir)) fs.unlinkSync(path.join(framesDir, f));

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

server.listen(4433, async () => {
    console.log('Server started on 4433');
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    try {
        const browser = await puppeteer.launch({
            executablePath: edgePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        // Suppress automatic modals (daily reward, tutorial)
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('sudoku_pulse_tutorial_seen', 'true');
            const style = document.createElement('style');
            style.innerHTML = '#daily-reward-modal, #modal-tutorial, #rating-modal { display: none !important; }';
            document.head ? document.head.appendChild(style) : document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
        });

        await page.goto('http://localhost:4433', { waitUntil: 'networkidle0' });
        await page.evaluate(() => {
            if (window.sudokuUI) {
                window.sudokuUI.openDailyRewardModal = () => {};
                window.sudokuUI.showScreen('menu');
            }
        });

        let frameIdx = 0;
        const capture = async (ms = 100) => {
            const num = String(frameIdx++).padStart(4, '0');
            await page.screenshot({ path: path.join(framesDir, `frame_${num}.png`) });
            if (ms > 0) await new Promise(r => setTimeout(r, ms));
        };

        // 1. Showcase Main Menu (2.5 seconds ~ 25 frames)
        console.log('Phase 1: Recording Main Menu...');
        for (let i = 0; i < 25; i++) {
            await capture();
        }

        // 2. Click Play / Start Game Transition (1.5 seconds)
        console.log('Phase 2: Transition to Game...');
        await page.evaluate(() => {
            if (window.sudokuUI && window.sudokuUI.game) {
                window.sudokuUI.game.startNewGame({ difficulty: 'easy', mode: 'classic', perks: [] });
                window.sudokuUI.showScreen('game');
            }
        });
        for (let i = 0; i < 15; i++) {
            await capture();
        }

        // 3. Active Solving: Make 7 consecutive correct moves with combo streaks
        console.log('Phase 3: Active Solving moves...');
        for (let step = 0; step < 7; step++) {
            await page.evaluate(() => {
                const ui = window.sudokuUI;
                const game = ui.game;
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (game.board[r][c] === 0) {
                            ui.selectCell(r, c);
                            ui.handleNumberInput(game.solution[r][c]);
                            return;
                        }
                    }
                }
            });

            // Capture the ripple animation and number entry (8 frames per move)
            for (let f = 0; f < 8; f++) {
                await capture();
            }
        }

        // 4. Showcase Notes / Pencil mode (1.5 seconds)
        console.log('Phase 4: Pencil Notes demonstration...');
        await page.evaluate(() => {
            const ui = window.sudokuUI;
            const game = ui.game;
            // Find empty cell
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (game.board[r][c] === 0) {
                        ui.selectCell(r, c);
                        ui.toggleNotes();
                        ui.handleNumberInput(2);
                        ui.handleNumberInput(7);
                        return;
                    }
                }
            }
        });
        for (let i = 0; i < 15; i++) {
            await capture();
        }

        // 5. Final Hold (2 seconds ~ 20 frames)
        console.log('Phase 5: Ending hold...');
        for (let i = 0; i < 20; i++) {
            await capture();
        }

        await browser.close();
        console.log(`Captured total ${frameIdx} frames (~${(frameIdx / 10).toFixed(1)}s). Encoding video...`);

        // Encode to H.264 MP4 with 10 fps
        const cmd = `"${ffmpegPath}" -y -framerate 10 -i "${framesDir}\\frame_%04d.png" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${outputVideo}"`;
        execSync(cmd, { stdio: 'inherit' });

        console.log('SUCCESS! Video generated at:', outputVideo);

        // Cleanup frames
        for (const f of fs.readdirSync(framesDir)) fs.unlinkSync(path.join(framesDir, f));
        fs.rmdirSync(framesDir);
    } catch (e) {
        console.error('Error during video creation:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
