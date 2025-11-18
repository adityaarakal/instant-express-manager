import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';
import { trackWebVitals } from './utils/performanceMonitoring';

// Conditionally enable StrictMode only in production to avoid persist issues in development
// In development, React.StrictMode double-mounts components which can interfere with
// Zustand persist middleware rehydration and cause data loss
const isDevelopment = import.meta.env.DEV;

// Initialize accessibility testing in development
if (isDevelopment && typeof window !== 'undefined') {
  import('@axe-core/react').then((axe) => {
    // Initialize axe-core with default configuration
    // Color contrast is checked manually via AccessibilityCheck component in Settings
    axe.default(React, ReactDOM, 1000);
  }).catch(() => {
    // Silently fail if axe-core is not available
  });
}

// Initialize performance monitoring
trackWebVitals();

const app = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  isDevelopment ? app : <React.StrictMode>{app}</React.StrictMode>
);

