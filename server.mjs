import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 80;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'leaderboard.json');

const DEFAULT_LEADERBOARD = [
  { name: 'NeoPulse', score: 14500, timeSeconds: 185, mode: 'run', combo: 12, date: '2026-09-24' },
  { name: 'CyberGhost', score: 11200, timeSeconds: 210, mode: 'daily', combo: 9, date: '2026-09-24' },
  { name: 'Valkyrie_X', score: 9800, timeSeconds: 164, mode: 'classic', combo: 8, date: '2026-09-24' },
  { name: 'MatrixRunner', score: 8400, timeSeconds: 240, mode: 'fog', combo: 7, date: '2026-09-24' },
  { name: 'SynthWave88', score: 6900, timeSeconds: 195, mode: 'daily', combo: 6, date: '2026-09-24' },
];

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_LEADERBOARD, null, 2), 'utf-8');
  }
}

function readLeaderboard() {
  try {
    ensureDb();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : DEFAULT_LEADERBOARD;
  } catch {
    return DEFAULT_LEADERBOARD;
  }
}

function saveLeaderboard(list) {
  try {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for API
  if (pathname.endsWith('/api/leaderboard')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const list = readLeaderboard()
        .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
        .slice(0, 15);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ entries: list, leaderboard: list }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 10000) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const playerId = String(payload.playerId || '').trim().slice(0, 48);
          const name = String(payload.name || 'Аноним').trim().slice(0, 18) || 'Аноним';

          if (payload.action === 'rename' && playerId) {
            const list = readLeaderboard();
            const existingIdx = list.findIndex((e) => e.playerId && e.playerId === playerId);
            if (existingIdx !== -1) {
              list[existingIdx].name = name;
              saveLeaderboard(list);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ entries: list.slice(0, 15), leaderboard: list.slice(0, 15) }));
            return;
          }

          const score = Math.max(0, Math.min(9999999, Number(payload.score) || 0));
          const timeSeconds = Math.max(1, Number(payload.timeSeconds) || 999);
          const mode = String(payload.mode || 'classic').slice(0, 12);
          const combo = Math.max(1, Number(payload.combo) || 1);
          const runStage = Math.max(1, Number(payload.runStage) || 1);
          const date = new Date().toISOString().split('T')[0];

          if (score > 0) {
            const list = readLeaderboard();
            const existingIdx = playerId
              ? list.findIndex((e) => e.playerId === playerId)
              : list.findIndex((e) => !e.playerId && e.name.toLowerCase() === name.toLowerCase());

            if (existingIdx !== -1) {
              list[existingIdx].name = name;
              if (score >= list[existingIdx].score) {
                list[existingIdx] = { playerId, name, score, timeSeconds, mode, combo, runStage, date };
              }
            } else {
              list.push({ playerId, name, score, timeSeconds, mode, combo, runStage, date });
            }
            const sorted = list
              .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
              .slice(0, 50);
            saveLeaderboard(sorted);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ entries: sorted.slice(0, 15), leaderboard: sorted.slice(0, 15) }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      });
      return;
    }
  }

  // Serve static files from DIST_DIR
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(DIST_DIR, safePath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=604800',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sudoku Pulse Server & Leaderboard API listening on port ${PORT}`);
});
