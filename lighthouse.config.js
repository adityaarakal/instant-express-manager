/**
 * Lighthouse Configuration
 * 
 * Configuration file for Lighthouse CI runs
 * Target: 90+ scores for all categories
 */

module.exports = {
  ci: {
    collect: {
      // URL to test (will be set dynamically in CI)
      url: ['http://localhost:4173'],
      // Number of runs to average
      numberOfRuns: 3,
      // Start server command (for local testing)
      startServerCommand: 'npm run build && npm run preview',
      // Wait for server to be ready
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      // Chrome settings
      chromeFlags: '--no-sandbox --disable-gpu',
    },
    assert: {
      // Assert minimum scores (90+ for all categories)
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'categories:pwa': ['error', { minScore: 0.90 }],
      },
    },
    upload: {
      // Upload results to temporary public storage (optional)
      target: 'temporary-public-storage',
    },
  },
};

