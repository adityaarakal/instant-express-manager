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

// Get base path from environment or use default
// For GitHub Pages, this should be '/instant-express-manager'
// For local development, this should be '/'
const getBasePath = () => {
  // In development, always use '/'
  if (import.meta.env.DEV) {
    return '/';
  }
  
  // In production, check if we're on GitHub Pages
  // GitHub Pages serves from /instant-express-manager/ subdirectory
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  // Check if we're on GitHub Pages (github.io domain or path starts with /instant-express-manager)
  if (hostname.includes('github.io') || pathname.startsWith('/instant-express-manager')) {
    return '/instant-express-manager';
  }
  
  // Default to root for other production deployments
  return '/';
};

// Handle GitHub Pages 404.html redirect
// When GitHub Pages serves 404.html, it stores the original path in sessionStorage
// We restore it here before React Router initializes
const handleGitHubPagesRedirect = () => {
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    const redirectPath = sessionStorage.getItem('github-pages-redirect');
    if (redirectPath) {
      // Clear the stored path
      sessionStorage.removeItem('github-pages-redirect');
      
      // Get the base path
      const basePath = getBasePath();
      
      // Update the URL to the original path before React Router loads
      // This allows React Router to see the correct pathname
      const newPath = basePath + redirectPath;
      if (window.location.pathname + window.location.search + window.location.hash !== newPath) {
        window.history.replaceState(null, '', newPath);
      }
    }
  }
};

// Handle GitHub Pages redirect before initializing the app
handleGitHubPagesRedirect();

const app = (
    <BrowserRouter basename={getBasePath()}>
      <App />
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  isDevelopment ? app : <React.StrictMode>{app}</React.StrictMode>
);

