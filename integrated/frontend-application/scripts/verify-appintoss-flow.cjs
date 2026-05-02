const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = filePath => fs.readFileSync(path.join(root, filePath), 'utf8');

const app = read('App.js');
const splash = read('src/screens/SplashScreen.js');
const auth = read('src/api/auth.js');
const devAuth = fs.existsSync(path.join(root, 'src/services/developmentAuth.js'))
  ? read('src/services/developmentAuth.js')
  : '';

assert.ok(
  !app.includes('name="Login"'),
  'App.js must not register the legacy ID/password Login route in the default Apps in Toss flow.'
);
assert.ok(
  !app.includes('name="Register"'),
  'App.js must not register the legacy Register route in the default Apps in Toss flow.'
);
assert.ok(
  !splash.includes("navigation.replace('Login')") && !splash.includes('navigation.replace("Login")'),
  'SplashScreen must not navigate to the legacy Login screen.'
);
assert.ok(
  auth.includes('exchangeTossLogin'),
  'auth.js must expose the server-side Toss login exchange helper.'
);
assert.ok(
  splash.includes('requestAppsInTossAuthorization'),
  'SplashScreen must request Apps in Toss authorization on first entry.'
);
assert.ok(
  splash.includes('EXPO_PUBLIC_DEV_BYPASS_APPINTOSS_LOGIN'),
  'SplashScreen must support an explicit local-only Apps in Toss login bypass flag.'
);
assert.ok(
  splash.includes('loginWithDevelopmentAccount'),
  'SplashScreen must log in with the local development account before entering Main.'
);
assert.ok(
  devAuth.includes('mulmuAdmin') && devAuth.includes('1234'),
  'developmentAuth.js must default to the backend local admin seed account.'
);
assert.ok(
  devAuth.includes('EXPO_PUBLIC_DEV_LOGIN_ID') && devAuth.includes('EXPO_PUBLIC_DEV_LOGIN_PASSWORD'),
  'developmentAuth.js must allow overriding local development credentials by env.'
);

console.log('Apps in Toss flow verification passed');
