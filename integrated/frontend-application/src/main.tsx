import React from 'react';
import { createRoot } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import './styles.css';

const LazyApp = React.lazy(() => import('./App'));

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TDSMobileAITProvider>
      <React.Suspense fallback={<div className="app-loading" aria-label="앱 로딩 중" />}>
        <LazyApp />
      </React.Suspense>
    </TDSMobileAITProvider>
  </React.StrictMode>
);
