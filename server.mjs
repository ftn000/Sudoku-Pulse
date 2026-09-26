import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

function readProfiles() {
  try {
    ensureDb();
    if (!fs.existsSync(PROFILES_FILE)) return {};
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveProfiles(profiles) {
  try {
    ensureDb();
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  } catch {}
}

const authSessions = new Map();

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of authSessions.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      authSessions.delete(token);
    }
  }
}
setInterval(cleanExpiredSessions, 60 * 1000);

function findProfileByTelegram(profiles, query) {
  if (!query) return null;
  const clean = String(query).replace(/^@/, '').toLowerCase().trim();
  if (profiles[query]) return profiles[query];
  if (profiles['@' + clean]) return profiles['@' + clean];
  if (profiles['tg_' + clean]) return profiles['tg_' + clean];
  if (profiles[clean]) return profiles[clean];

  for (const p of Object.values(profiles)) {
    if (p && p.telegramUser) {
      const uName = String(p.telegramUser.username || '').toLowerCase();
      const uId = String(p.telegramUser.id || '');
      if (uName === clean || uId === clean) {
        return p;
      }
    }
  }
  return null;
}

function getIsoSeasonId(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

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
      const period = parsedUrl.searchParams.get('period') || 'all';
      const currentSeason = getIsoSeasonId();
      const requestedSeason = parsedUrl.searchParams.get('seasonId') || currentSeason;

      const allEntries = readLeaderboard();
      let filtered = allEntries;
      if (period === 'season') {
        filtered = allEntries.filter((e) => {
          const sId = e.seasonId || (e.date ? getIsoSeasonId(new Date(e.date)) : currentSeason);
          return sId === requestedSeason;
        });
      }

      const list = filtered
        .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
        .slice(0, 15);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ entries: list, leaderboard: list, seasonId: requestedSeason, currentSeason, period }));
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
          const seasonId = String(payload.seasonId || '').trim() || getIsoSeasonId();

          if (score > 0) {
            const list = readLeaderboard();
            const existingIdx = playerId
              ? list.findIndex((e) => e.playerId === playerId)
              : list.findIndex((e) => !e.playerId && e.name.toLowerCase() === name.toLowerCase());

            if (existingIdx !== -1) {
              list[existingIdx].name = name;
              if (score >= list[existingIdx].score) {
                list[existingIdx] = { playerId, name, score, timeSeconds, mode, combo, runStage, date, seasonId };
              }
            } else {
              list.push({ playerId, name, score, timeSeconds, mode, combo, runStage, date, seasonId });
            }
            const sorted = list
              .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
              .slice(0, 100);
            saveLeaderboard(sorted);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ entries: sorted.slice(0, 15), leaderboard: sorted.slice(0, 15), seasonId, currentSeason: getIsoSeasonId() }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      });
      return;
    }
  }

  // Telegram Web Auth API (Deep Link, QR Code, Polling & Widget)
  if (pathname.includes('/api/auth/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Initialize Auth Session
    if (pathname.endsWith('/api/auth/init')) {
      const token = 'tg_auth_' + crypto.randomBytes(6).toString('hex');
      const botName = process.env.BOT_USERNAME || 'sudoku_pulse_auth_bot';
      const botUrl = `https://t.me/${botName}?start=${token}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(botUrl)}`;

      authSessions.set(token, {
        token,
        status: 'pending',
        createdAt: Date.now(),
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        token,
        botUsername: botName,
        botUrl,
        qrUrl,
      }));
      return;
    }

    // 2. Poll Auth Session Status
    if (pathname.endsWith('/api/auth/poll')) {
      const token = String(parsedUrl.searchParams.get('token') || '').trim();
      const session = authSessions.get(token);

      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Session expired or not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        status: session.status,
        profile: session.profile || null,
        telegramUser: session.telegramUser || null,
      }));
      return;
    }

    // 3. Verify / Approve Auth Session (called by Bot or Webhook or GET with params)
    if (pathname.endsWith('/api/auth/verify')) {
      const handleAuth = (token, user) => {
        if (!token || !user || !user.id) return null;
        let session = authSessions.get(token);
        if (!session) {
          session = { token, createdAt: Date.now() };
          authSessions.set(token, session);
        }

        const profiles = readProfiles();
        const tgKey = `tg_${user.id}`;
        let profile = profiles[tgKey];

        if (!profile && user.username) {
          profile = profiles['@' + user.username.toLowerCase()];
        }

        if (!profile) {
          profile = {
            key: tgKey,
            playerName: user.first_name || (user.username ? `@${user.username}` : 'Игрок'),
            telegramUser: user,
            theme: 'dark',
            stats: {
              gamesPlayed: 0,
              gamesWon: 0,
              totalScore: 0,
              maxCombo: 1,
              dailyStreak: 0,
              bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
              unlockedAchievements: [],
            },
            updatedAt: new Date().toISOString(),
          };
        } else {
          profile.telegramUser = { ...profile.telegramUser, ...user };
          profile.updatedAt = new Date().toISOString();
        }

        profiles[tgKey] = profile;
        if (user.username) {
          profiles['@' + user.username.toLowerCase()] = profile;
        }
        saveProfiles(profiles);

        session.status = 'authorized';
        session.telegramUser = user;
        session.profile = profile;

        return profile;
      };

      if (req.method === 'GET') {
        const token = String(parsedUrl.searchParams.get('token') || '').trim();
        const userId = Number(parsedUrl.searchParams.get('userId') || parsedUrl.searchParams.get('id') || 0);
        const username = String(parsedUrl.searchParams.get('username') || '').trim();
        const firstName = String(parsedUrl.searchParams.get('first_name') || parsedUrl.searchParams.get('name') || '').trim();

        if (token && userId) {
          const profile = handleAuth(token, { id: userId, username, first_name: firstName });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, profile }));
          return;
        }
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const profile = handleAuth(data.token, data.user || data);
            if (profile) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: true, profile }));
              return;
            }
          } catch {}
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid verification payload' }));
        });
        return;
      }
    }

    // 4. Telegram Login Widget endpoint
    if (pathname.endsWith('/api/auth/widget')) {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try {
          const user = JSON.parse(body);
          if (!user || !user.id) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'User ID required' }));
            return;
          }

          const profiles = readProfiles();
          const tgKey = `tg_${user.id}`;
          let profile = profiles[tgKey] || (user.username ? profiles['@' + user.username.toLowerCase()] : null);

          if (!profile) {
            profile = {
              key: tgKey,
              playerName: user.first_name || (user.username ? `@${user.username}` : 'Игрок'),
              telegramUser: user,
              theme: 'dark',
              stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                maxCombo: 1,
                dailyStreak: 0,
                bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
                unlockedAchievements: [],
              },
              updatedAt: new Date().toISOString(),
            };
          } else {
            profile.telegramUser = { ...profile.telegramUser, ...user };
            profile.updatedAt = new Date().toISOString();
          }

          profiles[tgKey] = profile;
          if (user.username) {
            profiles['@' + user.username.toLowerCase()] = profile;
          }
          saveProfiles(profiles);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, profile }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }
  }

  // Cloud Sync API (Telegram ID & Sync Key)
  if (pathname.endsWith('/api/sync')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const key = String(parsedUrl.searchParams.get('key') || '').trim();
      if (!key) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Key required' }));
        return;
      }
      const profiles = readProfiles();
      let profile = profiles[key];

      if (!profile) {
        const clean = key.replace(/^@/, '').toLowerCase();
        profile = profiles['@' + clean] || profiles['tg_' + clean] || profiles[clean];

        if (!profile) {
          // Search across all profiles for matching telegramUser
          for (const p of Object.values(profiles)) {
            if (p && p.telegramUser) {
              const uName = String(p.telegramUser.username || '').toLowerCase();
              const uId = String(p.telegramUser.id || '');
              if (uName === clean || uId === clean) {
                profile = p;
                break;
              }
            }
          }
        }
      }

      if (!profile) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Profile not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, profile }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 50000) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const key = String(payload.key || payload.playerId || '').trim();
          if (!key) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Key required' }));
            return;
          }

          const profiles = readProfiles();
          let existing = profiles[key] || {};
          if (!existing.stats && payload.telegramUser?.id) {
            existing = profiles['tg_' + payload.telegramUser.id] || existing;
          }

          const incomingStats = payload.stats || {};
          const existingStats = existing.stats || {};

          // Safe merge stats (take higher values)
          const mergedStats = {
            gamesPlayed: Math.max(existingStats.gamesPlayed || 0, incomingStats.gamesPlayed || 0),
            gamesWon: Math.max(existingStats.gamesWon || 0, incomingStats.gamesWon || 0),
            totalScore: Math.max(existingStats.totalScore || 0, incomingStats.totalScore || 0),
            maxCombo: Math.max(existingStats.maxCombo || 0, incomingStats.maxCombo || 0),
            dailyStreak: Math.max(existingStats.dailyStreak || 0, incomingStats.dailyStreak || 0),
            bestRunStage: Math.max(existingStats.bestRunStage || 0, incomingStats.bestRunStage || 0),
            bestRunScore: Math.max(existingStats.bestRunScore || 0, incomingStats.bestRunScore || 0),
            surgeCaptured: Math.max(existingStats.surgeCaptured || 0, incomingStats.surgeCaptured || 0),
            feverTriggeredCount: Math.max(existingStats.feverTriggeredCount || 0, incomingStats.feverTriggeredCount || 0),
            flawlessWins: Math.max(existingStats.flawlessWins || 0, incomingStats.flawlessWins || 0),
            darkSectorWins: Math.max(existingStats.darkSectorWins || 0, incomingStats.darkSectorWins || 0),
            expertDarkSectorWins: Math.max(existingStats.expertDarkSectorWins || 0, incomingStats.expertDarkSectorWins || 0),
            bestTimeSeconds: {
              easy: incomingStats.bestTimeSeconds?.easy ?? existingStats.bestTimeSeconds?.easy ?? null,
              medium: incomingStats.bestTimeSeconds?.medium ?? existingStats.bestTimeSeconds?.medium ?? null,
              hard: incomingStats.bestTimeSeconds?.hard ?? existingStats.bestTimeSeconds?.hard ?? null,
              expert: incomingStats.bestTimeSeconds?.expert ?? existingStats.bestTimeSeconds?.expert ?? null,
            },
            unlockedAchievements: Array.from(new Set([
              ...(existingStats.unlockedAchievements || []),
              ...(incomingStats.unlockedAchievements || []),
            ])),
          };

          const mergedProfile = {
            key,
            playerName: payload.playerName || existing.playerName || 'Игрок',
            telegramUser: payload.telegramUser || existing.telegramUser || null,
            theme: payload.theme || existing.theme || 'dark',
            notificationsEnabled: typeof payload.notificationsEnabled === 'boolean'
              ? payload.notificationsEnabled
              : (typeof existing.notificationsEnabled === 'boolean' ? existing.notificationsEnabled : true),
            stats: mergedStats,
            updatedAt: new Date().toISOString(),
          };

          profiles[key] = mergedProfile;
          if (payload.telegramUser?.id) {
            profiles['tg_' + payload.telegramUser.id] = mergedProfile;
          }
          if (payload.telegramUser?.username) {
            profiles['@' + payload.telegramUser.username.toLowerCase()] = mergedProfile;
          }

          saveProfiles(profiles);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, profile: mergedProfile }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
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
    const isNoCache = ext === '.html' || filePath.endsWith('sw.js') || filePath.endsWith('manifest.json');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isNoCache ? 'no-store, no-cache, must-revalidate, max-age=0' : 'public, max-age=604800',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sudoku Pulse Server & Leaderboard API listening on port ${PORT}`);
  startTelegramBot();
});

// ==========================================
// DEDICATED TELEGRAM BOT ENGINE (@sudoku_pulse_auth_bot)
// ==========================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8957810180:AAE5BIVA8BfM9tFIF7n-YO3vp_1QT3yxaf4';
const BOT_USERNAME = process.env.BOT_USERNAME || 'sudoku_pulse_auth_bot';
const GAME_URL = process.env.GAME_URL || 'http://109.69.17.170/sudoku/';

async function tgApi(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function startTelegramBot() {
  if (!BOT_TOKEN) return;
  console.log(`Starting Telegram Bot (@${BOT_USERNAME})...`);

  // Set chat menu button to WebApp
  try {
    await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '⚡ Играть в Sudoku',
        web_app: { url: GAME_URL },
      },
    });
  } catch {}

  let offset = 0;
  async function poll() {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await handleTelegramUpdate(update);
          }
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
    setTimeout(poll, 400);
  }
  poll();
}

async function handleTelegramUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  const user = msg.from;
  const text = msg.text.trim();

  if (text.startsWith('/start')) {
    const startParam = text.replace(/^\/start(@\w+)?\s*/i, '').trim();

    // 1. Web / QR Login Session
    if (startParam && (startParam.startsWith('tg_auth_') || startParam.startsWith('auth_') || startParam.startsWith('sync_') || startParam.startsWith('PULSE-'))) {
      const token = startParam.startsWith('auth_') ? startParam.replace(/^auth_/, 'tg_auth_') : startParam;

      // Update / approve auth session
      let session = authSessions.get(token) || authSessions.get(startParam);
      if (!session) {
        session = { token, createdAt: Date.now() };
        authSessions.set(token, session);
      }

      const profiles = readProfiles();
      const tgKey = `tg_${user.id}`;
      let profile = profiles[tgKey] || (user.username ? profiles['@' + user.username.toLowerCase()] : null);

      if (!profile) {
        profile = {
          key: tgKey,
          playerName: user.username ? `@${user.username}` : (user.first_name || 'Игрок'),
          telegramUser: user,
          theme: 'dark',
          notificationsEnabled: true,
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            maxCombo: 1,
            dailyStreak: 0,
            bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
            unlockedAchievements: [],
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        profile.telegramUser = { ...profile.telegramUser, ...user };
        profile.updatedAt = new Date().toISOString();
      }

      profiles[tgKey] = profile;
      if (user.username) {
        profiles['@' + user.username.toLowerCase()] = profile;
      }
      saveProfiles(profiles);

      session.status = 'authorized';
      session.telegramUser = user;
      session.profile = profile;

      const displayTgName = user.first_name || (user.username ? `@${user.username}` : 'Игрок');
      const userHandle = user.username ? `@${user.username}` : (user.first_name || `ID ${user.id}`);

      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `⚡ <b>Успешно авторизовался!</b>\n\n👋 Привет, <b>${displayTgName}</b>!\nТвой Telegram-аккаунт (<b>${userHandle}</b>) успешно привязан к <b>Sudoku Pulse</b> на компьютере.\n\n☁️ Все рекорды, открытые трофеи и статистика теперь автоматически синхронизируются!\n\n🎮 <i>Окно в браузере обновилось, либо нажми кнопку ниже для игры прямо в Telegram:</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚡ Играть в Sudoku Pulse (Mini App)', web_app: { url: GAME_URL } }]
          ]
        }
      });
      return;
    }

    // 2. Challenge / Duel Deep-link
    if (startParam && (startParam.startsWith('c_') || startParam.startsWith('challenge_'))) {
      const challengeUrl = `${GAME_URL}?start_param=${encodeURIComponent(startParam)}`;
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `⚔️ <b>Тебе бросили вызов в Sudoku Pulse!</b>\n\n🎯 Соперник завершил расклад и бросил вызов твоей скорости и точности!\nСыграйте на одинаковом поле и докажите, кто быстрее!\n\nНажми кнопку ниже, чтобы принять дуэль:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚔️ Принять вызов (Mini App)', web_app: { url: challengeUrl } }]
          ]
        }
      });
      return;
    }

    // 3. Daily Pulse Direct
    if (startParam === 'daily') {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `📅 <b>Daily Pulse — испытание дня!</b>\n\nРеши ежедневную головоломку, поддержи серию побед (Daily Streak) и забери бонусные очки!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Решить Daily Pulse', web_app: { url: `${GAME_URL}?mode=daily` } }]
          ]
        }
      });
      return;
    }

    // Default /start greeting
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚡ <b>Добро пожаловать в Sudoku Pulse!</b>\n\nКлассическое судоку в неоновом ритме с комбо-множителем, дуэлями и спецспособностями!\n\n✨ <b>Особенности:</b>\n• ⚡ <b>Комбо и Fever Mode</b> — динамичный темп решения\n• ⚔️ <b>Дуэли и вызовы</b> — соревнования с друзьями на одинаковых сетках\n• 🌌 <b>Тёмный сектор</b> — судоку со сканером и ограниченной видимостью\n• 🚀 <b>Pulse Run</b> — забеги с прокачкой способностей\n• ☁️ <b>Облачная синхронизация</b> между ПК и телефоном\n\nНажмите кнопку ниже, чтобы начать игру:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Играть в Sudoku Pulse', web_app: { url: GAME_URL } }]
        ]
      }
    });
    return;
  }

  if (text === '/play' || text === '⚡ Играть') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚡ Нажмите кнопку ниже для запуска Sudoku Pulse:`,
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Играть в Sudoku Pulse', web_app: { url: GAME_URL } }]]
      }
    });
    return;
  }

  if (text === '/notify' || text === '/daily_reminder' || text === '🔔 Уведомления') {
    const profiles = readProfiles();
    const tgKey = `tg_${user.id}`;
    let profile = profiles[tgKey] || (user.username ? profiles['@' + user.username.toLowerCase()] : null);

    if (!profile) {
      profile = {
        key: tgKey,
        playerName: user.username ? `@${user.username}` : (user.first_name || 'Игрок'),
        telegramUser: user,
        theme: 'dark',
        notificationsEnabled: true,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          maxCombo: 1,
          dailyStreak: 0,
          bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
          unlockedAchievements: [],
        },
        updatedAt: new Date().toISOString(),
      };
    }

    const current = profile.notificationsEnabled !== false;
    const newState = !current;
    profile.notificationsEnabled = newState;
    profiles[tgKey] = profile;
    if (user.username) profiles['@' + user.username.toLowerCase()] = profile;
    saveProfiles(profiles);

    if (newState) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🔔 <b>Утренние напоминания о Daily Pulse включены!</b>\nКаждое утро в 09:00 бот будет присылать новую головоломку дня, чтобы вы не прерывали свой победный стрик.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '⚡ Играть в Sudoku', web_app: { url: GAME_URL } }]]
        }
      });
    } else {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🔕 <b>Утренние напоминания отключены.</b>\nВы всегда можете включить их снова командой /notify или в настройках игры.`,
        parse_mode: 'HTML'
      });
    }
    return;
  }

  if (text === '/stats' || text === '📊 Моя статистика') {
    const profiles = readProfiles();
    const tgKey = `tg_${user.id}`;
    const profile = profiles[tgKey] || (user.username ? profiles['@' + user.username.toLowerCase()] : null);
    const stats = profile?.stats;

    if (!stats || stats.gamesPlayed === 0) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `📊 У вас пока нет сыгранных партий. Запустите игру и установите свой первый рекорд!`,
        reply_markup: {
          inline_keyboard: [[{ text: '⚡ Начать игру', web_app: { url: GAME_URL } }]]
        }
      });
      return;
    }

    const wonRatio = Math.round((stats.gamesWon / Math.max(1, stats.gamesPlayed)) * 100);
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `📊 <b>Статистика игрока @${user.username || user.first_name}:</b>\n\n🎮 Сыграно партий: <b>${stats.gamesPlayed}</b>\n🏆 Побед: <b>${stats.gamesWon}</b> (${wonRatio}%)\n💎 Всего очков: <b>${stats.totalScore.toLocaleString('ru-RU')}</b>\n🔥 Макс. комбо: <b>x${stats.maxCombo}</b>\n📅 Серия Daily: <b>${stats.dailyStreak} дн.</b>\n🏅 Открыто трофеев: <b>${(stats.unlockedAchievements || []).length} / 10</b>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Играть', web_app: { url: GAME_URL } }]]
      }
    });
    return;
  }

  if (text === '/help') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `ℹ️ <b>Команды бота Sudoku Pulse:</b>\n\n/play — Запустить игру в Telegram Mini App\n/stats — Посмотреть свою статистику и рекорды\n/notify — Включить или отключить утренние напоминания Daily Pulse\n/start — Главное меню и авторизация веб-сессий`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Играть в Sudoku Pulse', web_app: { url: GAME_URL } }]]
      }
    });
  }
}

// ==========================================
// DAILY PULSE NOTIFICATION SCHEDULER
// ==========================================
function startDailyNotificationScheduler() {
  async function checkAndSendDailyReminders() {
    try {
      const now = new Date();
      // Moscow Time (UTC+3)
      const mskHours = (now.getUTCHours() + 3) % 24;
      const todayStr = new Date(now.getTime() + 3 * 3600 * 1000).toISOString().split('T')[0];

      // Send between 09:00 and 12:00 MSK
      if (mskHours >= 9 && mskHours <= 12) {
        const profiles = readProfiles();
        let changed = false;

        for (const [key, profile] of Object.entries(profiles)) {
          if (!profile || !profile.telegramUser?.id) continue;
          if (profile.notificationsEnabled === false) continue;
          if (profile.lastDailyReminder === todayStr) continue;

          const streak = profile.stats?.dailyStreak || 0;
          const streakText = streak > 0 ? `\n🔥 Твой текущий стрик: <b>${streak} дн.</b>` : '';
          const name = profile.telegramUser.first_name || (profile.telegramUser.username ? `@${profile.telegramUser.username}` : 'Игрок');

          await tgApi('sendMessage', {
            chat_id: profile.telegramUser.id,
            text: `🌅 <b>Новый Daily Pulse уже готов!</b>\n\n👋 Привет, <b>${name}</b>!\nСегодняшняя головоломка дня ждёт тебя. Решай быстро, поддерживай победную серию и ставь новые рекорды!${streakText}\n\nНажми кнопку ниже, чтобы начать:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📅 Решить Daily Pulse', web_app: { url: `${GAME_URL}?mode=daily` } }]
              ]
            }
          });

          profile.lastDailyReminder = todayStr;
          changed = true;
          await new Promise((r) => setTimeout(r, 100)); // small rate limit buffer
        }

        if (changed) {
          saveProfiles(profiles);
        }
      }
    } catch {}
  }

  // Check every 10 minutes
  setInterval(checkAndSendDailyReminders, 10 * 60 * 1000);
  // Initial check after 30 seconds
  setTimeout(checkAndSendDailyReminders, 30 * 1000);
}

startDailyNotificationScheduler();
