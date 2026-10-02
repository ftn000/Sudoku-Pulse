import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Auto-load local .env file if present
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx).trim();
          const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}
loadEnv();

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

const TEST_PVP_NAMES = new Set(['cybervalkyrie', 'shadowpulse', 'gridmaster_99', 'neonsamurai', 'quantumbyte']);

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
    const arr = Array.isArray(list) ? list : DEFAULT_LEADERBOARD;
    const cleaned = arr.filter((e) => {
      const name = String(e.name || '').toLowerCase().trim();
      return !TEST_PVP_NAMES.has(name);
    });
    if (cleaned.length !== arr.length) {
      try { saveLeaderboard(cleaned); } catch {}
    }
    return cleaned;
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
  '.apk': 'application/vnd.android.package-archive',
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

function evaluateAchievements(stats) {
  if (!stats) return [];
  if (!Array.isArray(stats.unlockedAchievements)) {
    stats.unlockedAchievements = [];
  }
  const set = new Set(stats.unlockedAchievements);
  if ((stats.gamesWon || 0) >= 1) set.add('first_win');
  if ((stats.maxCombo || 0) >= 8) set.add('combo_8');
  if ((stats.feverTriggeredCount || 0) >= 5) set.add('fever_master');
  if ((stats.flawlessWins || 0) >= 1) set.add('flawless');
  if ((stats.darkSectorWins || 0) >= 1) set.add('dark_navigator');
  if ((stats.expertDarkSectorWins || 0) >= 1) set.add('blind_flight');
  if ((stats.bestRunStage || 0) >= 3) set.add('run_stage_3');
  if ((stats.surgeCaptured || 0) >= 5) set.add('surge_hunter');
  if ((stats.dailyStreak || 0) >= 3) set.add('streak_3');
  if ((stats.totalScore || 0) >= 50000) set.add('grandmaster');
  stats.unlockedAchievements = Array.from(set);
  return stats.unlockedAchievements;
}

// ==========================================
// 1v1 LIVE MULTIPLAYER LOBBY SYSTEM
// ==========================================
const liveLobbies = new Map();

function generateLobbyCode() {
  for (let i = 0; i < 50; i++) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    let collision = false;
    for (const lobby of liveLobbies.values()) {
      if (lobby.code === code && (lobby.status === 'waiting' || lobby.status === 'countdown')) {
        collision = true;
        break;
      }
    }
    if (!collision) return code;
  }
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function cleanupOldLobbies() {
  const now = Date.now();
  for (const [id, lobby] of liveLobbies.entries()) {
    if (now - lobby.createdAt > 30 * 60 * 1000 || (lobby.status === 'finished' && now - (lobby.finishedAt || 0) > 5 * 60 * 1000)) {
      liveLobbies.delete(id);
    }
  }
}
setInterval(cleanupOldLobbies, 60 * 1000);

function deduplicateLeaderboardEntries(entries) {
  const seenIds = new Set();
  const seenNames = new Set();
  const deduped = [];
  for (const entry of entries) {
    const idKey = entry.playerId ? String(entry.playerId).trim() : '';
    const nameKey = entry.name ? String(entry.name).toLowerCase().trim() : '';

    if ((idKey && seenIds.has(idKey)) || (nameKey && seenNames.has(nameKey))) {
      continue;
    }
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    deduped.push(entry);
  }
  return deduped;
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
      const myPlayerId = parsedUrl.searchParams.get('playerId') || '';
      const requestedMode = parsedUrl.searchParams.get('mode') || 'all';

      const allEntries = readLeaderboard();

      // Merge profiles with duel stats into pvp_duel entries
      const profiles = readProfiles();
      const pvpEntriesFromProfiles = [];
      const seenPvpIds = new Set();
      const seenPvpNames = new Set();
      for (const e of allEntries) {
        if (e.mode === 'pvp_duel') {
          if (e.playerId) seenPvpIds.add(String(e.playerId).trim());
          if (e.name) seenPvpNames.add(String(e.name).toLowerCase().trim());
        }
      }
      for (const [key, p] of Object.entries(profiles)) {
        if (!p || !p.stats) continue;
        const pId = String(p.key || key || '').trim();
        const pName = String(p.playerName || (p.telegramUser?.username ? `@${p.telegramUser.username}` : '')).trim();
        const normName = pName.toLowerCase();
        if ((pId && seenPvpIds.has(pId)) || (normName && seenPvpNames.has(normName))) continue;
        if (TEST_PVP_NAMES.has(normName)) continue;
        const s = p.stats;
        if ((s.duelWins && s.duelWins > 0) || (s.duelLosses && s.duelLosses > 0) || (s.duelElo && s.duelElo !== 1000)) {
          if (pId) seenPvpIds.add(pId);
          if (normName) seenPvpNames.add(normName);
          pvpEntriesFromProfiles.push({
            playerId: pId,
            name: pName || 'Игрок',
            score: s.duelElo || 1000,
            duelElo: s.duelElo || 1000,
            duelWins: s.duelWins || 0,
            duelLosses: s.duelLosses || 0,
            mode: 'pvp_duel',
            seasonId: s.duelSeasonId || currentSeason,
            date: p.updatedAt ? p.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          });
        }
      }

      let combined = [...allEntries, ...pvpEntriesFromProfiles];
      let filtered = combined;
      if (period === 'season') {
        filtered = combined.filter((e) => {
          const sId = e.seasonId || (e.date ? getIsoSeasonId(new Date(e.date)) : currentSeason);
          return sId === requestedSeason;
        });
      }
      if (requestedMode === 'all') {
        filtered = filtered.filter((e) => e.mode !== 'pvp_duel');
      } else if (requestedMode) {
        filtered = filtered.filter((e) => (e.mode || 'classic') === requestedMode);
      }

      const sorted = filtered
        .sort((a, b) => b.score - a.score || (a.timeSeconds || 0) - (b.timeSeconds || 0));

      const deduplicated = deduplicateLeaderboardEntries(sorted);

      let myRankInfo = null;
      if (myPlayerId) {
        const pIdx = deduplicated.findIndex((e) => e.playerId === myPlayerId);
        if (pIdx !== -1) {
          myRankInfo = {
            rank: pIdx + 1,
            entry: deduplicated[pIdx],
          };
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        entries: deduplicated.slice(0, 300),
        leaderboard: deduplicated.slice(0, 30),
        totalPlayers: deduplicated.length,
        myRank: myRankInfo,
        seasonId: requestedSeason,
        currentSeason,
        period,
      }));
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
            let renamedAny = false;
            list.forEach((e) => {
              if (e.playerId && e.playerId === playerId) {
                e.name = name;
                renamedAny = true;
              }
            });
            if (renamedAny) {
              saveLeaderboard(list);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ entries: list.slice(0, 30), leaderboard: list.slice(0, 30) }));
            return;
          }

          const score = Math.max(0, Math.min(9999999, Number(payload.score) || 0));
          const timeSeconds = Math.max(0, Number(payload.timeSeconds) || 0);
          const mode = String(payload.mode || 'classic').slice(0, 16);
          const combo = Math.max(1, Number(payload.combo) || 1);
          const runStage = Math.max(1, Number(payload.runStage) || 1);
          const duelElo = Number(payload.duelElo) || (mode === 'pvp_duel' ? score : undefined);
          const duelWins = Number(payload.duelWins) || 0;
          const duelLosses = Number(payload.duelLosses) || 0;
          const date = new Date().toISOString().split('T')[0];
          const seasonId = String(payload.seasonId || '').trim() || getIsoSeasonId();

          if (score > 0) {
            const list = readLeaderboard();
            const existingIdx = playerId
              ? list.findIndex((e) => (e.playerId === playerId || e.name.toLowerCase() === name.toLowerCase()) && (e.mode || 'classic') === mode && (!e.seasonId || e.seasonId === seasonId))
              : list.findIndex((e) => e.name.toLowerCase() === name.toLowerCase() && (e.mode || 'classic') === mode && (!e.seasonId || e.seasonId === seasonId));

            const newEntry = {
              playerId,
              name,
              score,
              timeSeconds,
              mode,
              combo,
              runStage,
              date,
              seasonId,
              ...(duelElo !== undefined ? { duelElo, duelWins, duelLosses } : {}),
            };

            if (existingIdx !== -1) {
              list[existingIdx].name = name;
              if (mode === 'pvp_duel' || score >= list[existingIdx].score) {
                list[existingIdx] = newEntry;
              }
            } else {
              list.push(newEntry);
            }
            const sorted = list
              .sort((a, b) => b.score - a.score || (a.timeSeconds || 0) - (b.timeSeconds || 0))
              .slice(0, 500);
            saveLeaderboard(sorted);

            const deduplicated = deduplicateLeaderboardEntries(sorted);

            let myRankInfo = null;
            if (playerId) {
              const pIdx = deduplicated.findIndex((e) => e.playerId === playerId);
              if (pIdx !== -1) {
                myRankInfo = {
                  rank: pIdx + 1,
                  entry: deduplicated[pIdx],
                };
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              entries: deduplicated.slice(0, 300),
              leaderboard: deduplicated.slice(0, 30),
              totalPlayers: deduplicated.length,
              myRank: myRankInfo,
              seasonId,
              currentSeason: getIsoSeasonId(),
            }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      });
      return;
    }
  }

  // 1v1 Live Multiplayer Lobby API
  if (pathname.includes('/api/lobby/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Create Lobby
    if (pathname.endsWith('/api/lobby/create') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const hostId = String(payload.hostId || 'p_' + crypto.randomBytes(4).toString('hex'));
          const hostName = String(payload.hostName || 'Игрок 1').slice(0, 18);
          const hostElo = Number(payload.elo) || 1000;
          const difficulty = ['easy', 'medium', 'hard', 'expert'].includes(payload.difficulty) ? payload.difficulty : 'medium';
          const seed = Math.floor(100000 + Math.random() * 900000);
          const code = generateLobbyCode();
          const avatarUrl = payload.avatarUrl ? String(payload.avatarUrl).slice(0, 300) : null;
          const lobbyId = 'lob_' + crypto.randomBytes(6).toString('hex');

          const lobby = {
            id: lobbyId,
            code,
            seed,
            difficulty,
            createdAt: Date.now(),
            status: 'waiting', // waiting, countdown, in_game, finished, abandoned
            countdownStartedAt: null,
            startedAt: null,
            finishedAt: null,
            winner: null,
            abandonedBy: null,
            isPaused: false,
            pausedBy: null,
            pausedAt: null,
            host: {
              id: hostId,
              name: hostName,
              avatarUrl,
              elo: hostElo,
              filled: 0,
              total: 45,
              mistakes: 0,
              combo: 1,
              score: 0,
              finished: false,
              finishTime: 0,
              lastPing: Date.now(),
            },
            guest: null,
          };

          liveLobbies.set(lobbyId, lobby);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, lobbyId, code, seed, difficulty, hostName, hostElo }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }

    // 1b. Quick Matchmaking (Find open waiting room or create new one)
    if (pathname.endsWith('/api/lobby/quick-match') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const playerId = String(payload.playerId || 'p_' + crypto.randomBytes(4).toString('hex'));
          const playerName = String(payload.playerName || 'Игрок').slice(0, 18);
          const playerElo = Number(payload.elo) || 1000;
          const difficulty = ['easy', 'medium', 'hard', 'expert'].includes(payload.difficulty) ? payload.difficulty : 'medium';
          const now = Date.now();

          // Search for existing waiting room with alive host (not same player)
          let targetLobby = null;
          for (const l of liveLobbies.values()) {
            if (l.status === 'waiting' && l.host && l.host.id !== playerId && (now - l.host.lastPing < 12000)) {
              if (!targetLobby || l.difficulty === difficulty) {
                targetLobby = l;
                if (l.difficulty === difficulty) break;
              }
            }
          }

          const avatarUrl = payload.avatarUrl ? String(payload.avatarUrl).slice(0, 300) : null;

          if (targetLobby) {
            // Join as guest immediately
            targetLobby.guest = {
              id: playerId,
              name: playerName,
              avatarUrl,
              elo: playerElo,
              filled: 0,
              total: targetLobby.host.total || 45,
              mistakes: 0,
              combo: 1,
              score: 0,
              finished: false,
              finishTime: 0,
              lastPing: now,
            };
            targetLobby.status = 'countdown';
            targetLobby.countdownStartedAt = now;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              matched: true,
              role: 'guest',
              lobbyId: targetLobby.id,
              code: targetLobby.code,
              seed: targetLobby.seed,
              difficulty: targetLobby.difficulty,
              hostName: targetLobby.host.name,
              hostElo: targetLobby.host.elo || 1000,
              guestName: playerName,
              guestElo: playerElo,
            }));
            return;
          }

          // No open waiting room: create a new waiting room
          const seed = Math.floor(100000 + Math.random() * 900000);
          const code = generateLobbyCode();
          const lobbyId = 'lob_' + crypto.randomBytes(6).toString('hex');

          const lobby = {
            id: lobbyId,
            code,
            seed,
            difficulty,
            createdAt: now,
            status: 'waiting',
            isQuickMatch: true,
            countdownStartedAt: null,
            startedAt: null,
            finishedAt: null,
            winner: null,
            abandonedBy: null,
            isPaused: false,
            pausedBy: null,
            pausedAt: null,
            host: {
              id: playerId,
              name: playerName,
              avatarUrl,
              elo: playerElo,
              filled: 0,
              total: 45,
              mistakes: 0,
              combo: 1,
              score: 0,
              finished: false,
              finishTime: 0,
              lastPing: now,
            },
            guest: null,
          };

          liveLobbies.set(lobbyId, lobby);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            matched: false,
            role: 'host',
            lobbyId,
            code,
            seed,
            difficulty,
            hostName: playerName,
            hostElo: playerElo,
          }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }

    // 2. Join Lobby by Code or ID
    if (pathname.endsWith('/api/lobby/join') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const codeInput = String(payload.code || '').trim();
          const guestId = String(payload.guestId || 'p_' + crypto.randomBytes(4).toString('hex'));
          const guestName = String(payload.guestName || 'Игрок 2').slice(0, 18);
          const guestElo = Number(payload.elo || payload.guestElo) || 1000;

          let targetLobby = null;
          for (const l of liveLobbies.values()) {
            if ((l.code === codeInput || l.id === codeInput) && l.status === 'waiting') {
              targetLobby = l;
              break;
            }
          }

          if (!targetLobby) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Комната не найдена или уже заполнена' }));
            return;
          }

          const avatarUrl = payload.avatarUrl ? String(payload.avatarUrl).slice(0, 300) : null;
          targetLobby.guest = {
            id: guestId,
            name: guestName,
            avatarUrl,
            elo: guestElo,
            filled: 0,
            total: targetLobby.host.total || 45,
            mistakes: 0,
            combo: 1,
            score: 0,
            finished: false,
            finishTime: 0,
            lastPing: Date.now(),
          };
          targetLobby.status = 'countdown';
          targetLobby.countdownStartedAt = Date.now();

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            lobbyId: targetLobby.id,
            code: targetLobby.code,
            seed: targetLobby.seed,
            difficulty: targetLobby.difficulty,
            hostName: targetLobby.host.name,
            hostElo: targetLobby.host.elo || 1000,
            guestName,
            guestElo,
          }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }

    // 3. Lobby Status (Polling)
    if (pathname.endsWith('/api/lobby/status') && req.method === 'GET') {
      const lobbyId = parsedUrl.searchParams.get('id');
      const playerId = parsedUrl.searchParams.get('playerId');
      const lobby = liveLobbies.get(lobbyId);

      if (!lobby) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Lobby not found' }));
        return;
      }

      const now = Date.now();
      const isHost = lobby.host && lobby.host.id === playerId;
      const isGuest = lobby.guest && lobby.guest.id === playerId;

      if (isHost) lobby.host.lastPing = now;
      if (isGuest) lobby.guest.lastPing = now;

      // Handle countdown transition
      if (lobby.status === 'countdown' && lobby.countdownStartedAt) {
        if (now - lobby.countdownStartedAt >= 3200) {
          lobby.status = 'in_game';
          lobby.startedAt = now;
        }
      }

      // Check abandonment
      if (lobby.status === 'in_game') {
        if (isHost && lobby.guest && now - lobby.guest.lastPing > 15000 && !lobby.guest.finished) {
          lobby.status = 'finished';
          lobby.winner = 'host';
          lobby.abandonedBy = 'guest';
        } else if (isGuest && lobby.host && now - lobby.host.lastPing > 15000 && !lobby.host.finished) {
          lobby.status = 'finished';
          lobby.winner = 'guest';
          lobby.abandonedBy = 'host';
        }
      }

      const countdownRemainingMs = lobby.countdownStartedAt ? Math.max(0, 3200 - (now - lobby.countdownStartedAt)) : 0;

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        id: lobby.id,
        code: lobby.code,
        status: lobby.status,
        difficulty: lobby.difficulty,
        seed: lobby.seed,
        countdownRemainingMs,
        host: lobby.host,
        guest: lobby.guest,
        winner: lobby.winner,
        abandonedBy: lobby.abandonedBy || null,
        rematchRequestedBy: lobby.rematchRequestedBy || null,
        rematchState: lobby.rematchState || null,
        lastReaction: lobby.lastReaction || null,
        isPaused: lobby.isPaused || false,
        pausedBy: lobby.pausedBy || null,
        isHost,
        isGuest,
      }));
      return;
    }

    // 4. Lobby Action / Progress update / Reactions / Rematch / Pause
    if (pathname.endsWith('/api/lobby/action') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const lobby = liveLobbies.get(payload.lobbyId);
          if (!lobby) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Lobby not found' }));
            return;
          }

          const isHost = lobby.host && lobby.host.id === payload.playerId;
          const playerObj = isHost ? lobby.host : (lobby.guest && lobby.guest.id === payload.playerId ? lobby.guest : null);

          if (!playerObj) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Player not in lobby' }));
            return;
          }

          playerObj.lastPing = Date.now();

          if (payload.action === 'reaction') {
            const emoji = String(payload.emoji || '⚡').slice(0, 4);
            lobby.lastReaction = {
              from: payload.playerId,
              emoji,
              timestamp: Date.now(),
            };
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, reaction: lobby.lastReaction }));
            return;
          }

          if (payload.action === 'pause') {
            lobby.isPaused = true;
            lobby.pausedBy = payload.playerId;
            lobby.pausedAt = Date.now();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, isPaused: true, pausedBy: lobby.pausedBy }));
            return;
          }

          if (payload.action === 'resume') {
            lobby.isPaused = false;
            lobby.pausedBy = null;
            lobby.pausedAt = null;
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, isPaused: false }));
            return;
          }

          if (payload.action === 'rematch_request') {
            if (!lobby.rematchState) lobby.rematchState = { hostReady: false, guestReady: false };
            if (isHost) lobby.rematchState.hostReady = true;
            else lobby.rematchState.guestReady = true;
            lobby.rematchRequestedBy = payload.playerId;

            if (lobby.rematchState.hostReady && lobby.rematchState.guestReady) {
              lobby.seed = Math.floor(100000 + Math.random() * 900000);
              lobby.status = 'countdown';
              lobby.countdownStartedAt = Date.now();
              lobby.startedAt = null;
              lobby.finishedAt = null;
              lobby.winner = null;
              lobby.abandonedBy = null;
              lobby.rematchRequestedBy = null;
              lobby.rematchState = { hostReady: false, guestReady: false };
              lobby.lastReaction = null;
              lobby.isPaused = false;
              lobby.pausedBy = null;
              lobby.pausedAt = null;
              lobby.host.filled = 0;
              lobby.host.mistakes = 0;
              lobby.host.combo = 1;
              lobby.host.score = 0;
              lobby.host.finished = false;
              lobby.host.finishTime = 0;
              lobby.host.lastPing = Date.now();
              if (lobby.guest) {
                lobby.guest.filled = 0;
                lobby.guest.mistakes = 0;
                lobby.guest.combo = 1;
                lobby.guest.score = 0;
                lobby.guest.finished = false;
                lobby.guest.finishTime = 0;
                lobby.guest.lastPing = Date.now();
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              rematchState: lobby.rematchState,
              rematchRequestedBy: lobby.rematchRequestedBy,
              status: lobby.status,
              seed: lobby.seed,
            }));
            return;
          }

          if (payload.action === 'progress') {
            if (typeof payload.filled === 'number') playerObj.filled = payload.filled;
            if (typeof payload.total === 'number') playerObj.total = payload.total;
            if (typeof payload.mistakes === 'number') playerObj.mistakes = payload.mistakes;
            if (typeof payload.combo === 'number') playerObj.combo = payload.combo;
            if (typeof payload.score === 'number') playerObj.score = payload.score;
          } else if (payload.action === 'finish') {
            playerObj.finished = true;
            playerObj.finishTime = Number(payload.time) || 0;
            playerObj.score = Number(payload.score) || playerObj.score;
            playerObj.filled = playerObj.total;

            if (!lobby.winner) {
              lobby.winner = isHost ? 'host' : 'guest';
              lobby.status = 'finished';
              lobby.finishedAt = Date.now();
            }
          } else if (payload.action === 'leave' || payload.action === 'abandon') {
            lobby.status = 'finished';
            lobby.winner = isHost ? 'guest' : 'host';
            lobby.abandonedBy = isHost ? 'host' : 'guest';
            lobby.finishedAt = Date.now();
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, status: lobby.status, winner: lobby.winner }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
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

          const currentSeason = getIsoSeasonId();
          let duelSeasonId = incomingStats.duelSeasonId || existingStats.duelSeasonId || currentSeason;
          let duelElo = incomingStats.duelElo !== undefined ? Number(incomingStats.duelElo) : (existingStats.duelElo !== undefined ? Number(existingStats.duelElo) : 1000);
          let seasonDuelWins = incomingStats.seasonDuelWins !== undefined ? Number(incomingStats.seasonDuelWins) : (existingStats.seasonDuelWins || 0);
          let seasonDuelLosses = incomingStats.seasonDuelLosses !== undefined ? Number(incomingStats.seasonDuelLosses) : (existingStats.seasonDuelLosses || 0);

          if (duelSeasonId !== currentSeason) {
            duelElo = 1000;
            seasonDuelWins = 0;
            seasonDuelLosses = 0;
            duelSeasonId = currentSeason;
          }

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
            duelElo,
            duelSeasonId,
            seasonDuelWins,
            seasonDuelLosses,
            duelWins: Math.max(existingStats.duelWins || 0, incomingStats.duelWins || 0),
            duelLosses: Math.max(existingStats.duelLosses || 0, incomingStats.duelLosses || 0),
            duelMatches: Math.max(existingStats.duelMatches || 0, incomingStats.duelMatches || 0),
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
          evaluateAchievements(mergedStats);

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
    const isNoCache = ext === '.html' || ext === '.apk' || filePath.endsWith('sw.js') || filePath.endsWith('manifest.json');
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isNoCache ? 'no-store, no-cache, must-revalidate, max-age=0' : 'public, max-age=604800',
    };
    if (ext === '.apk') {
      headers['Content-Disposition'] = 'attachment; filename="SudokuPulse.apk"';
    }
    res.writeHead(200, headers);
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
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.BOT_USERNAME || 'sudoku_pulse_auth_bot';
const GAME_URL = process.env.GAME_URL || 'https://109.69.17.170.sslip.io/sudoku/';

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

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '⚡ Играть в Sudoku Pulse', web_app: { url: GAME_URL } }],
    [{ text: '📱 Скачать APK' }, { text: '📊 Статистика' }],
    [{ text: '🔔 Напоминания' }, { text: 'ℹ️ Помощь' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

async function startTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot polling disabled.');
    return;
  }
  console.log(`Starting Telegram Bot (@${BOT_USERNAME})...`);

  // 1. Set chat menu button to WebApp (bottom-left button in Telegram chat input)
  try {
    const res = await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '⚡ Играть в Sudoku Pulse',
        web_app: { url: GAME_URL },
      },
    });
    console.log('setChatMenuButton result:', res);
  } catch (e) {
    console.error('Failed to set chat menu button:', e);
  }

  // 2. Set Bot Commands list
  try {
    await tgApi('setMyCommands', {
      commands: [
        { command: 'play', description: '⚡ Запустить игру в Telegram Mini App' },
        { command: 'apk', description: '📱 Скачать оффлайн Android APK' },
        { command: 'stats', description: '📊 Рекорды и статистика профиля' },
        { command: 'notify', description: '🔔 Вкл/выкл утренние напоминания Daily Pulse' },
        { command: 'help', description: 'ℹ️ Правила и команды игры' },
      ],
    });
  } catch {}

  // 3. Set Bot Description & Short Description
  try {
    await tgApi('setMyDescription', {
      description: '⚡ Sudoku Pulse — динамичное неоновое судоку с комбо, дуэлями против друзей и ИИ, Тёмным сектором и забегами Pulse Run!\n\n🎮 Играй прямо в Telegram или скачай Android APK для игры без интернета.',
    });
    await tgApi('setMyShortDescription', {
      short_description: '⚡ Неоновое судоку с комбо-множителем, дуэлями и Telegram Mini App!',
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
      text: `⚡ <b>Добро пожаловать в Sudoku Pulse!</b>\n\nКлассическое судоку в неоновом ритме с комбо-множителем, дуэлями и спецспособностями!\n\n✨ <b>Особенности:</b>\n• ⚡ <b>Комбо и Fever Mode</b> — динамичный темп решения\n• ⚔️ <b>Дуэли и вызовы</b> — соревнования с друзьями на одинаковых сетках\n• 🌌 <b>Тёмный сектор</b> — судоку со сканером и ограниченной видимостью\n• 🚀 <b>Pulse Run</b> — забеги с прокачкой способностей\n• ☁️ <b>Облачная синхронизация</b> между ПК и телефоном\n\nНажмите кнопку ниже или меню внизу слева, чтобы запустить игру:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Играть в Sudoku Pulse (Mini App)', web_app: { url: GAME_URL } }],
          [{ text: '📥 Скачать Android APK (офлайн)', url: `${GAME_URL}SudokuPulse.apk` }]
        ]
      }
    });

    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `🎮 Быстрое меню управления:`,
      reply_markup: MAIN_KEYBOARD
    });
    return;
  }

  const isApkRequest = /apk|апк|билд|билда|скачать|установить|build|android|приложение/i.test(text);
  if (text === '/apk' || isApkRequest) {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `📱 <b>Установка Sudoku Pulse на Android (APK)</b>\n\nСвежая версия игры готова к загрузке!\n\n✨ <b>Преимущества приложения:</b>\n• Работает на 100% без интернета в любой точке мира\n• Мгновенный запуск и сверхплавный игровой процесс\n• Полноэкранный режим без элементов браузера\n• Сохранение всех рекордов, трофеев и скинов оффлайн\n\n📋 <b>Инструкция по установке:</b>\n1️⃣ Нажмите кнопку <b>«📥 Скачать SudokuPulse.apk»</b> ниже.\n2️⃣ Если браузер или Telegram покажет предупреждение <i>«Файл может быть опасным»</i>, нажмите <b>«Всё равно скачать»</b> (стандартное уведомление системы для APK вне Google Play).\n3️⃣ Откройте загруженный файл в панели уведомлений или папке «Загрузки».\n4️⃣ Нажмите <b>«Установить»</b> (при необходимости разрешите установку приложений из этого источника в настройках Android).\n5️⃣ Запустите игру и наслаждайтесь!\n\n<i>Прямая ссылка на актуальный файл:</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 Скачать SudokuPulse.apk', url: `${GAME_URL}SudokuPulse.apk` }],
          [{ text: '⚡ Играть онлайн в Mini App', web_app: { url: GAME_URL } }]
        ]
      }
    });
    return;
  }

  if (text === '/play' || text === '⚡ Играть' || text === '⚡ Играть в Sudoku Pulse' || text === 'играть') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚡ Нажмите кнопку ниже для запуска Sudoku Pulse в Telegram:`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Запустить Mini App', web_app: { url: GAME_URL } }],
          [{ text: '📥 Скачать Android APK', url: `${GAME_URL}SudokuPulse.apk` }]
        ]
      }
    });
    return;
  }

  if (text === '/notify' || text === '/daily_reminder' || text === '🔔 Уведомления' || text === '🔔 Напоминания') {
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

  if (text === '/stats' || text === '📊 Моя статистика' || text === '📊 Статистика' || text === 'статистика') {
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

    evaluateAchievements(stats);
    const wonRatio = Math.round((stats.gamesWon / Math.max(1, stats.gamesPlayed)) * 100);
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `📊 <b>Статистика игрока @${user.username || user.first_name}:</b>\n\n🎮 Сыграно партий: <b>${stats.gamesPlayed}</b>\n🏆 Побед: <b>${stats.gamesWon}</b> (${wonRatio}%)\n💎 Всего очков: <b>${stats.totalScore.toLocaleString('ru-RU')}</b>\n🔥 Макс. комбо: <b>x${stats.maxCombo}</b>\n📅 Серия Daily: <b>${stats.dailyStreak} дн.</b>\n🏅 Открыто трофеев: <b>${(stats.unlockedAchievements || []).length} / 10</b>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Играть в Sudoku Pulse', web_app: { url: GAME_URL } }]]
      }
    });
    return;
  }

  if (text === '/help' || text === 'ℹ️ Помощь' || text === 'помощь' || text === 'справка' || text === 'меню') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `ℹ️ <b>Команды бота Sudoku Pulse:</b>\n\n/play — Запустить игру в Telegram Mini App\n/stats — Посмотреть свою статистику и рекорды\n/notify — Включить или отключить утренние напоминания Daily Pulse\n/apk — Скачать оффлайн-версию для Android\n/start — Главное меню и авторизация веб-сессий`,
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
  if (!BOT_TOKEN) return;
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
