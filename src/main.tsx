import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './app/App.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root is missing');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.warn('Service worker registration failed', error);
      }
    });
  });
}
