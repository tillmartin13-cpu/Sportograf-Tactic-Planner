import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';

// Reload when a new SW version deploys
registerSW({ immediate: true });

// Reload automatically when a chunk fails to load (stale SW cache after deploy)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
