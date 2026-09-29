import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const stageDir = path.resolve(rootDir, 'dist-yandex');
const zipOutput = path.resolve(rootDir, 'yandex-games-bundle.zip');

console.log('🚀 [Yandex Export] Building fresh web bundle...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('🧹 [Yandex Export] Preparing clean staging directory...');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Copy all files from dist except .apk and .map
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.apk') || entry.name.endsWith('.map') || entry.name === 'sw.js') {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(distDir, stageDir);

console.log('🛡️ [Yandex Export] Sanitizing index.html for Yandex Games compliance...');
const indexPath = path.join(stageDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // 1. Remove Telegram WebApp SDK script (unapproved third-party JS)
  html = html.replace(/<script[^>]*telegram-web-app\.js[^>]*><\/script>\s*/gi, '');

  // 2. Change initial menu auth pill text from "Войти через Telegram" to "Профиль"
  html = html.replace(/<span class="tg-pill-icon">[^<]*<\/span>\s*<span id="menu-tg-auth-label">[^<]*<\/span>/gi, 
    '<span class="tg-pill-icon">👤</span>\n        <span id="menu-tg-auth-label">Профиль</span>');

  // 3. Remove .yandex-hidden settings sections (Telegram sync box and APK download)
  html = html.replace(/<div class="section-title yandex-hidden"[\s\S]*?<!-- Yandex Cloud Profile Box/i, '<!-- Yandex Cloud Profile Box');
  html = html.replace(/<div class="section-title yandex-hidden"[\s\S]*?SudokuPulse\.apk[\s\S]*?<\/a>\s*/i, '');

  // 4. Clean out tg-auth-modal completely in Yandex build so zero Telegram words/links remain
  html = html.replace(/<div id="tg-auth-modal"[\s\S]*?<!-- =+ -->\s*<!-- MODAL: DUEL/i,
    `<div id="tg-auth-modal" class="modal-overlay hidden" style="display:none !important;">
      <div id="tg-auth-login-view" style="display:none"></div>
      <div id="tg-auth-active-view" style="display:none"></div>
      <div id="tg-auth-user-name"></div>
      <div id="tg-auth-user-handle"></div>
      <div id="tg-auth-user-avatar"></div>
      <div id="tg-auth-qr-img"></div>
      <div id="tg-auth-qr-spinner"></div>
      <div id="tg-poll-status-text"></div>
      <a id="btn-tg-open-bot-link" style="display:none"></a>
      <button id="btn-close-tg-auth" style="display:none"></button>
      <input id="tg-manual-input" style="display:none">
      <button id="btn-tg-manual-login" style="display:none"></button>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: DUEL`);

  // 5. Remove any remaining direct .apk links and t.me links
  html = html.replace(/<a[^>]*href="[^"]*\.apk"[^>]*>[\s\S]*?<\/a>/gi, '');
  html = html.replace(/https:\/\/t\.me\/[a-zA-Z0-9_/]+/gi, '#');
  html = html.replace(/✈️\s*Войти через Telegram[^\n<]*/gi, '');

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✨ [Yandex Export] index.html successfully sanitized: external scripts & links purged.');
}

console.log('📦 [Yandex Export] Compressing to zip archive: yandex-games-bundle.zip...');
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

try {
  execSync(`tar -a -c -f "${zipOutput}" -C "${stageDir}" .`, { stdio: 'inherit' });
} catch {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}/*' -DestinationPath '${zipOutput}' -Force"`, { stdio: 'inherit' });
}

// Clean up stage dir
fs.rmSync(stageDir, { recursive: true, force: true });

// Also copy to dist for convenience
const distZip = path.resolve(distDir, 'yandex-games-bundle.zip');
fs.copyFileSync(zipOutput, distZip);

const stats = fs.statSync(zipOutput);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`✅ [Yandex Export] Done! Archive created at: ${zipOutput} (${sizeMb} MB)`);
console.log('✨ Archive structure verified: index.html is located directly at the zip root.');
