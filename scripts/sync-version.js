import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read version from package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const targetVersion = pkgData.version || '1.4.5';

console.log(`[Sync-Version] Synchronizing application version: v${targetVersion}...`);

// 1. Update src/version.ts
const versionTsPath = path.join(rootDir, 'src', 'version.ts');
const versionTsContent = `export const APP_VERSION = '${targetVersion}';\n`;
fs.writeFileSync(versionTsPath, versionTsContent, 'utf8');
console.log(`  ✓ Updated src/version.ts`);

// 2. Update public/version.json and public/latest.json
const publicVersionPath = path.join(rootDir, 'public', 'version.json');
if (fs.existsSync(publicVersionPath)) {
  try {
    const vJson = JSON.parse(fs.readFileSync(publicVersionPath, 'utf8'));
    vJson.version = targetVersion;
    vJson.downloadUrl = `https://github.com/brandyar/SizeGrid/releases/tag/v${targetVersion}`;
    fs.writeFileSync(publicVersionPath, JSON.stringify(vJson, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated public/version.json`);
  } catch (err) {
    console.warn(`  ! Could not update public/version.json:`, err.message);
  }
}

const publicLatestPath = path.join(rootDir, 'public', 'latest.json');
if (fs.existsSync(publicLatestPath)) {
  try {
    const latestJson = JSON.parse(fs.readFileSync(publicLatestPath, 'utf8'));
    latestJson.version = targetVersion;
    if (latestJson.platforms) {
      if (latestJson.platforms['windows-x86_64']) {
        latestJson.platforms['windows-x86_64'].url = `https://github.com/brandyar/SizeGrid/releases/download/v${targetVersion}/Tankhor_${targetVersion}_x64-setup.nsis.zip`;
      }
      if (latestJson.platforms['darwin-x86_64']) {
        latestJson.platforms['darwin-x86_64'].url = `https://github.com/brandyar/SizeGrid/releases/download/v${targetVersion}/Tankhor_${targetVersion}_x64.app.tar.gz`;
      }
      if (latestJson.platforms['darwin-aarch64']) {
        latestJson.platforms['darwin-aarch64'].url = `https://github.com/brandyar/SizeGrid/releases/download/v${targetVersion}/Tankhor_${targetVersion}_aarch64.app.tar.gz`;
      }
    }
    fs.writeFileSync(publicLatestPath, JSON.stringify(latestJson, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated public/latest.json`);
  } catch (err) {
    console.warn(`  ! Could not update public/latest.json:`, err.message);
  }
}

// 3. Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  try {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    if (tauriConf.package) {
      tauriConf.package.version = targetVersion;
    }
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated src-tauri/tauri.conf.json`);
  } catch (err) {
    console.warn(`  ! Could not update src-tauri/tauri.conf.json:`, err.message);
  }
}

// 4. Update src-tauri/Cargo.toml
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  try {
    let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
    cargoContent = cargoContent.replace(/^version\s*=\s*"[^"]*"/m, `version = "${targetVersion}"`);
    fs.writeFileSync(cargoTomlPath, cargoContent, 'utf8');
    console.log(`  ✓ Updated src-tauri/Cargo.toml`);
  } catch (err) {
    console.warn(`  ! Could not update src-tauri/Cargo.toml:`, err.message);
  }
}

console.log(`[Sync-Version] All version files synchronized to v${targetVersion} successfully!`);
