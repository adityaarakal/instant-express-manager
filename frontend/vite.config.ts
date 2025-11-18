import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs'

// Read version from root package.json (source of truth for version)
const packageJson = JSON.parse(readFileSync('../package.json', 'utf-8'))
const version = packageJson.version

// Vite plugin to inject version into HTML meta tag and update version.json
function injectVersionMeta() {
  return {
    name: 'inject-version-meta',
    buildStart() {
      // Update version.json in public folder on build start
      const versionFile = path.resolve(__dirname, 'public/version.json');
      writeFileSync(versionFile, JSON.stringify({ version }, null, 2) + '\n');
    },
    configureServer(server) {
      // Middleware to serve version dynamically from package.json at runtime
      // This reads the file fresh on every request, so it always reflects the current package.json
      server.middlewares.use('/api/version', (req, res, next) => {
        try {
          // Always read fresh from package.json (no caching)
          const packageJsonPath = path.resolve(__dirname, '../package.json');
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          
          // Set headers to prevent any caching
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          res.end(JSON.stringify({ version: packageJson.version }));
        } catch (error) {
          console.error('Error reading version:', error);
          next();
        }
      });
    },
    transformIndexHtml(html: string) {
      return html.replace(
        '<head>',
        `<head>\n    <meta name="app-version" content="${version}" />`
      )
    },
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Vite plugin to analyze and inject bundle size information
 * Analyzes dist folder after build completes
 */
function bundleSizeAnalyzer() {
  return {
    name: 'bundle-size-analyzer',
    closeBundle() {
      // This runs after all bundles are written
      // Use setTimeout to ensure files are fully written to disk
      setTimeout(() => {
        try {
          const outputDir = path.resolve(__dirname, 'dist');
          const assetsDir = path.resolve(outputDir, 'assets');
          
          // Check if assets directory exists
          let files: string[] = [];
          try {
            const assetsFiles = readdirSync(assetsDir);
            files = assetsFiles.map(f => `assets/${f}`);
          } catch {
            // Assets directory doesn't exist or can't read
          }
          
          const bundleInfo: {
            chunks: Array<{ name: string; size: number; sizeFormatted: string; type: string }>;
            totalSize: number;
            totalSizeFormatted: string;
            chunksCount: number;
          } = {
            chunks: [],
            totalSize: 0,
            totalSizeFormatted: '',
            chunksCount: 0,
          };

          // Analyze JS files in dist/assets
          files.forEach((file: string) => {
            if (typeof file === 'string' && file.endsWith('.js')) {
              try {
                const filePath = path.resolve(outputDir, file);
                const stats = statSync(filePath);
                const size = stats.size;
                const fileName = file.split('/').pop() || file;
                const type = fileName.includes('vendor') ? 'vendor' : 
                            fileName.includes('index') && !fileName.includes('.es') ? 'main' : 'chunk';
                
                bundleInfo.chunks.push({
                  name: fileName,
                  size,
                  sizeFormatted: formatBytes(size),
                  type,
                });
                bundleInfo.totalSize += size;
              } catch {
                // File doesn't exist or error reading
              }
            }
          });

          bundleInfo.totalSizeFormatted = formatBytes(bundleInfo.totalSize);
          bundleInfo.chunksCount = bundleInfo.chunks.length;

          // Sort chunks by size (largest first)
          bundleInfo.chunks.sort((a, b) => b.size - a.size);

          // Write bundle info to public folder for runtime access
          const bundleInfoFile = path.resolve(__dirname, 'public/bundle-info.json');
          writeFileSync(bundleInfoFile, JSON.stringify(bundleInfo, null, 2) + '\n');
          
          if (bundleInfo.chunksCount > 0) {
            console.log(`📦 Bundle size: ${bundleInfo.totalSizeFormatted} (${bundleInfo.chunksCount} chunks)`);
          }
        } catch (error) {
          // Silently fail - bundle analysis is optional
        }
      }, 500); // Increased delay to ensure files are written
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  // GitHub Pages deployment - uncomment and set to your repository name
  // base: process.env.NODE_ENV === 'production' ? '/instant-express-manager/' : '/',
  base: '/', // For root domain or custom domain, use '/' instead
  plugins: [
    injectVersionMeta(),
    bundleSizeAnalyzer(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Instant Express Manager',
        short_name: 'IEM',
        description: 'Track, manage, and analyze your finances - A comprehensive standalone financial management app',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false, // Disable PWA in dev to avoid build issues
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-persist-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
    server: {
    port: 7001,
    strictPort: true, // Prevent port changes - IndexedDB is origin-scoped (includes port)
    // If port 7001 is in use, Vite will fail instead of trying another port
    // This ensures consistent IndexedDB access across restarts
    watch: {
      // Watch package.json for version changes
      ignored: ['!**/package.json'],
    },
    proxy: {
      // Don't proxy /api/version - let the middleware handle it
      '^(?!/api/version)/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
