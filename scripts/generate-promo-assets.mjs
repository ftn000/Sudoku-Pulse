import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const dist = 'C:\\GitHub\\Sudoku-Pulse\\dist';
const promoDir = 'C:\\GitHub\\Sudoku-Pulse\\yandex-promo';

// Ensure promoDir exists
if (!fs.existsSync(promoDir)) fs.mkdirSync(promoDir, { recursive: true });

// Simple static server
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
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(4455, async () => {
    console.log('Static server running on http://localhost:4455');
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    try {
        const browser = await puppeteer.launch({
            executablePath: edgePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        // 1. Desktop screenshots (16:9, 1280x720)
        const desktopPage = await browser.newPage();
        await desktopPage.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
        await desktopPage.goto('http://localhost:4455', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1000));

        // Screenshot 1: Main Menu Desktop
        await desktopPage.screenshot({ path: path.join(promoDir, 'screenshot-desktop-1.png') });
        console.log('Saved screenshot-desktop-1.png');

        // Click to start Classic game or select mode
        const playBtn = await desktopPage.$('#btn-mode-classic, #start-btn, .mode-card, button');
        if (playBtn) {
            await playBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        }

        // Screenshot 2: Gameplay Desktop
        await desktopPage.screenshot({ path: path.join(promoDir, 'screenshot-desktop-2.png') });
        console.log('Saved screenshot-desktop-2.png');

        // 2. Mobile screenshots (portrait, 1080x1920 scaled to 720x1280)
        const mobilePage = await browser.newPage();
        await mobilePage.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        await mobilePage.goto('http://localhost:4455', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1000));

        // Screenshot 3: Mobile Menu
        await mobilePage.screenshot({ path: path.join(promoDir, 'screenshot-mobile-1.png') });
        console.log('Saved screenshot-mobile-1.png');

        // Click to start game on mobile
        const mobilePlayBtn = await mobilePage.$('#btn-mode-classic, #start-btn, .mode-card, button');
        if (mobilePlayBtn) {
            await mobilePlayBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        }

        // Screenshot 4: Mobile Gameplay
        await mobilePage.screenshot({ path: path.join(promoDir, 'screenshot-mobile-2.png') });
        console.log('Saved screenshot-mobile-2.png');

        await browser.close();
        console.log('Screenshots generation completed successfully!');
    } catch (err) {
        console.error('Error during screenshot generation:', err);
    } finally {
        server.close();
        process.exit(0);
    }
});
