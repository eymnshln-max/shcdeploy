import React from 'react';
import './online-adapter.js';
import { createRoot } from 'react-dom/client';
import App from './App';
import './test-shell.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found.');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
