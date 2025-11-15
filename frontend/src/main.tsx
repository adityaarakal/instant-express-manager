import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

// Conditionally enable StrictMode only in production to avoid persist issues in development
// In development, React.StrictMode double-mounts components which can interfere with
// Zustand persist middleware rehydration and cause data loss
const isDevelopment = import.meta.env.DEV;

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  isDevelopment ? app : <React.StrictMode>{app}</React.StrictMode>
);

