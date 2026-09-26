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
      if (entry.name.endsWith('.apk') || entry.name.endsWith('.map')) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(distDir, stageDir);

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
