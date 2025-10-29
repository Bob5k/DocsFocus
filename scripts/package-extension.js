import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);
const distDir = join(rootDir, 'dist');
const zipPath = join(distDir, 'docsfocus.zip');

mkdirSync(distDir, { recursive: true });

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

const zipArgs = ['-r', zipPath, 'extension', '-x', '*.DS_Store'];

const result = spawnSync('zip', zipArgs, { stdio: 'inherit', cwd: rootDir });

if (result.status !== 0) {
  console.error('[DocsFocus] Failed to create extension artifact.');
  process.exitCode = result.status ?? 1;
}
