#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

try { execSync('lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true', { stdio: 'ignore', cwd: root }); } catch {}
try { execSync('lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true', { stdio: 'ignore', cwd: root }); } catch {}
try { execSync('lsof -ti:5174 2>/dev/null | xargs kill -9 2>/dev/null || true', { stdio: 'ignore', cwd: root }); } catch {}
try { execSync('pkill -f "tsx watch" 2>/dev/null || true', { stdio: 'ignore' }); } catch {}
try { execSync('pkill -f vite 2>/dev/null || true', { stdio: 'ignore' }); } catch {}

const concurrently = path.join(root, 'node_modules', '.bin', 'concurrently');
const hasConcurrently = fs.existsSync(concurrently);

let child;
if (hasConcurrently) {
  child = spawn(concurrently, ['npm:dev:server', 'npm:dev:client'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
} else {
  child = spawn('npm', ['run', 'dev'], { cwd: root, stdio: 'inherit', shell: true });
}
child.on('close', code => process.exit(code ?? 0));
child.on('error', err => { console.error(err); process.exit(1); });
