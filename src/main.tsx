import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from './App';

// The app started, so the "did not start" fallback in index.html is no longer needed.
document.getElementById('boot-help')?.remove();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
