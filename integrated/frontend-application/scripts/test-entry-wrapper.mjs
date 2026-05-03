import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'granite.config.ts'), 'utf8');
const envSource = fs.readFileSync(path.join(root, '.env.production'), 'utf8');

assert.match(configSource, /appName:\s*'mulmumulmu'/);
assert.match(envSource, /VITE_API_BASE_URL=https:\/\/mulmumu-backend-aqjxa3obfa-du\.a\.run\.app/);
assert.doesNotMatch(appSource, /window\.location\.(replace|assign)/);
assert.doesNotMatch(appSource, /VITE_FRONTEND_ENTRY_URL|mulmumu-frontend/);
assert.match(appSource, /from '@apps-in-toss\/web-framework'/);
assert.match(appSource, /appLogin\(\)/);
assert.match(appSource, /openCamera\(/);

console.log('entry wrapper tests passed');
