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

// Clean frames dir
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

server.listen(4488, async () => {
    console.log('Server started on 4488');
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    try {
        const browser = await puppeteer.launch({
            executablePath: edgePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        const page = await browser.newPage();
        // Exact 16:9 1280x720
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto('http://localhost:4488', { waitUntil: 'networkidle0' });

        let frameIdx = 0;
        const captureFrame = async () => {
            const num = String(frameIdx++).padStart(4, '0');
            await page.screenshot({ path: path.join(framesDir, `frame_${num}.png`) });
        };

        // 1. Menu view (2 seconds ~ 20 frames)
        console.log('Recording main menu...');
        for (let i = 0; i < 20; i++) {
            await captureFrame();
            await new Promise(r => setTimeout(r, 100));
        }

        // 2. Start game directly in classic easy mode
        console.log('Starting classic game...');
        await page.evaluate(() => {
            if (window.sudokuUI && window.sudokuUI.game) {
                window.sudokuUI.game.startNewGame({ difficulty: 'easy', mode: 'classic', perks: [] });
                window.sudokuUI.showScreen('game');
            }
        });

        // 3. Gameplay view before first move
        console.log('Recording active gameplay inputs...');
        for (let i = 0; i < 15; i++) {
            await captureFrame();
            await new Promise(r => setTimeout(r, 100));
        }

        // 4. Play 8 correct moves with combo streaks!
        for (let step = 0; step < 8; step++) {
            await page.evaluate(() => {
                const ui = window.sudokuUI;
                const game = ui.game;
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (game.board[r][c] === 0) {
                            ui.selectCell(r, c);
                            const correctNum = game.solution[r][c];
                            ui.handleNumberInput(correctNum);
                            return;
                        }
                    }
                }
            });

            for (let f = 0; f < 8; f++) {
                await captureFrame();
                await new Promise(r => setTimeout(r, 100));
            }
        }

        // 5. Ending hold (2 seconds ~ 20 frames)
        for (let i = 0; i < 20; i++) {
            await captureFrame();
            await new Promise(r => setTimeout(r, 100));
        }

        await browser.close();
        console.log(`Captured ${frameIdx} frames (~${(frameIdx / 10).toFixed(1)} seconds). Encoding with libx264...`);

        // Standard libx264 MP4, yuv420p for maximum web/Yandex compatibility
        const cmd = `"${ffmpegPath}" -y -framerate 10 -i "${framesDir}\\frame_%04d.png" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${outputVideo}"`;
        execSync(cmd, { stdio: 'inherit' });

        console.log('Gameplay MP4 generated successfully:', outputVideo);

        // Clean frames directory
        for (const f of fs.readdirSync(framesDir)) fs.unlinkSync(path.join(framesDir, f));
        fs.rmdirSync(framesDir);
    } catch (e) {
        console.error('Error during recording:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
