import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const configSource = read('granite.config.ts');
const envSource = read('.env.production');
const appSource = read(path.join('src', 'App.tsx'));
const apiSource = read(path.join('src', 'services', 'miniappApi.ts'));
const authSource = read(path.join('src', 'domain', 'auth.js'));
const viteSource = read('vite.config.ts');
const indexSource = read('index.html');

assert.equal(packageJson.scripts.build, 'vite build');
assert.equal(packageJson.scripts['ait:build'], 'ait build');
assert.ok(packageJson.dependencies['@apps-in-toss/web-framework']);
assert.ok(packageJson.dependencies['@toss/tds-mobile']);
assert.ok(packageJson.dependencies['@toss/tds-mobile-ait']);
assert.ok(packageJson.devDependencies.vite);

assert.match(configSource, /appName:\s*'mulmumulmu'/);
assert.match(configSource, /build:\s*'vite build'/);
assert.match(configSource, /port:\s*5173/);
assert.doesNotMatch(configSource, /build-expo-web-for-ait|expo start|expo export|_expo/);

assert.match(envSource, /VITE_API_BASE_URL=https:\/\/mulmumu-backend-aqjxa3obfa-du\.a\.run\.app/);
assert.doesNotMatch(envSource, /EXPO_PUBLIC_/);

assert.match(viteSource, /@vitejs\/plugin-react/);
assert.match(indexSource, /<div id="root"><\/div>/);
assert.match(indexSource, /maximum-scale=1/);
assert.match(indexSource, /user-scalable=no/);
assert.match(appSource, /from '@apps-in-toss\/web-framework'/);
assert.match(appSource, /appLogin\(\)/);
assert.match(appSource, /@toss\/tds-mobile/);
assert.match(apiSource, /import\.meta\.env\.VITE_API_BASE_URL/);
assert.match(apiSource, /\/auth\/toss\/login/);
assert.match(authSource, /AccessToken/);

const aitPath = path.join(root, 'mulmumulmu.ait');
if (fs.existsSync(aitPath)) {
  const entries = execFileSync('tar', ['-tf', aitPath], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  assert.ok(entries.includes('web/index.html'), 'AIT archive must include web/index.html');
  assert.ok(entries.some((entry) => /^web\/assets\/index-[^/]+\.js$/.test(entry)), 'AIT archive must include Vite JS asset');
  assert.ok(entries.some((entry) => /^web\/assets\/index-[^/]+\.css$/.test(entry)), 'AIT archive must include Vite CSS asset');
  assert.ok(!entries.some((entry) => entry.startsWith('web/_expo/')), 'AIT archive must not include Expo web assets');
  assert.ok(!entries.some((entry) => entry.includes('node_modules/expo')), 'AIT archive must not include Expo asset paths');
}

console.log('root TDS WebView contract tests passed');
