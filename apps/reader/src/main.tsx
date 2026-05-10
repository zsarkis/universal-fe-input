import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

ReactDOM.createRoot(root).render(
  // StrictMode mounts twice in dev — perception adapters must be idempotent.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
