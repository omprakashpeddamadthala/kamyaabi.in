/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves React root mounting and global error reporter startup.
 * - Adds global design-token/responsive CSS imports only; no app logic changes.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/responsive.css';
import { installGlobalErrorReporter } from './utils/globalErrorReporter';

installGlobalErrorReporter();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
