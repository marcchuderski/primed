import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.tsx';
import { registerServiceWorker } from './pwa/registerServiceWorker.ts';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();

// iOS Safari only applies :active (press feedback, D-187) once the document listens for touches.
document.addEventListener('touchstart', () => undefined, { passive: true });
