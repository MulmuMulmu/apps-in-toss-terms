import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'MulmuMulmu',
  brand: {
    displayName: '물무물무',
    icon: 'https://raw.githubusercontent.com/MulmuMulmu/apps-in-toss-terms/master/assets/logo.png',
    primaryColor: '#3182F6',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host 0.0.0.0',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'camera',
      access: 'access',
    },
    {
      name: 'photos',
      access: 'read',
    },
    {
      name: 'geolocation',
      access: 'access',
    },
  ],
  outdir: 'dist',
});
