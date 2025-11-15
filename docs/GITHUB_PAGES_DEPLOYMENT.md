# GitHub Pages Deployment Guide

## IndexedDB on GitHub Pages

**Yes, IndexedDB will work perfectly on GitHub Pages, including on mobile devices!**

### How IndexedDB Works with GitHub Pages

1. **Origin-Scoped Storage**: IndexedDB is tied to the origin (protocol + domain + port)
   - GitHub Pages URL: `https://username.github.io/repository-name`
   - All data stored on this origin will persist across sessions
   - Data is isolated per origin (different repositories = different data)

2. **Mobile Browser Support**: 
   - ✅ iOS Safari (iPhone/iPad)
   - ✅ Android Chrome
   - ✅ Android Firefox
   - ✅ Samsung Internet
   - All modern mobile browsers support IndexedDB

3. **HTTPS Required**: 
   - GitHub Pages automatically serves over HTTPS
   - Required for Service Workers and IndexedDB
   - Works seamlessly on mobile

### Deployment Steps

#### Option 1: Deploy from `main` branch (Recommended)

1. **Update Vite Config for GitHub Pages**:
   ```typescript
   // frontend/vite.config.ts
   export default defineConfig({
     base: '/repository-name/', // Replace with your actual repository name
     // ... rest of config
   })
   ```

2. **Build the app**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to GitHub Pages**:
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: Select "GitHub Actions" or "Deploy from a branch"
   - If using branch: Select `main` branch and `/frontend/dist` folder
   - Save

4. **Create GitHub Actions Workflow** (Recommended - automated deployment):
   
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   permissions:
     contents: read
     pages: write
     id-token: write
   
   concurrency:
     group: "pages"
     cancel-in-progress: false
   
   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
             cache-dependency-path: frontend/package-lock.json
         
         - name: Install dependencies
           run: |
             npm install
             cd frontend && npm install
         
         - name: Build
           run: cd frontend && npm run build
         
         - name: Setup Pages
           uses: actions/configure-pages@v4
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './frontend/dist'
         
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

#### Option 2: Deploy from `gh-pages` branch

1. **Update Vite config** (same as above)

2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deployment script** to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "cd frontend && npm run build",
       "deploy": "gh-pages -d frontend/dist"
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### Important Notes

1. **Base Path**: Must match your repository name
   - If repository is `instant-express-manager`, set `base: '/instant-express-manager/'`
   - If using custom domain, set `base: '/'`

2. **Data Persistence**:
   - IndexedDB data is stored locally on the device
   - Each GitHub Pages URL has its own IndexedDB database
   - Data persists even after closing the browser
   - Data is cleared if user clears browser data

3. **Mobile PWA**:
   - Users can "Add to Home Screen" on mobile
   - Works offline (once cached by Service Worker)
   - Behaves like a native app

4. **Testing**:
   - Test on actual mobile devices, not just desktop
   - Test offline functionality
   - Verify data persistence across browser restarts

### Troubleshooting

**Issue**: Blank page after deployment
- **Solution**: Check `base` path in `vite.config.ts` matches repository name

**Issue**: Service Worker not working
- **Solution**: Ensure HTTPS is enabled (GitHub Pages does this automatically)

**Issue**: IndexedDB not persisting
- **Solution**: Check browser settings allow storage for the site
- Clear site data and try again

**Issue**: Routing not working
- **Solution**: GitHub Pages needs `404.html` that redirects to `index.html`
- Vite PWA plugin should handle this automatically

### Repository Name Consideration

If your repository name changes:
1. Update `base` in `vite.config.ts`
2. Update GitHub Pages settings
3. Users will lose IndexedDB data (different origin = different storage)

### Custom Domain

If using a custom domain:
- Set `base: '/'` in vite.config.ts
- Configure custom domain in GitHub Pages settings
- Update DNS records as instructed by GitHub
- IndexedDB will still work the same way

