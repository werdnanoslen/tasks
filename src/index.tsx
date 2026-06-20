import React from 'react';
import { createRoot } from 'react-dom/client';
import './normalize.css';
import './index.css';
import App from './App';

// Suppress benign ResizeObserver loop notification from masonry layout
window.addEventListener(
  'error',
  (e) => {
    if (e.message?.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation();
    }
  },
  true
);

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
