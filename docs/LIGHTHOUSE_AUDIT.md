# Lighthouse Audit Guide

This guide explains how to run Lighthouse audits for the application to ensure it meets performance, accessibility, best practices, SEO, and PWA standards.

## 🎯 Target Scores

All Lighthouse categories should achieve **90+ scores**:
- ✅ **Performance**: 90+
- ✅ **Accessibility**: 90+
- ✅ **Best Practices**: 90+
- ✅ **SEO**: 90+
- ✅ **PWA**: 90+

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Lighthouse CLI** installed globally (or will be installed automatically by script)

## 🚀 Running Lighthouse Locally

### Option 1: Using npm script (Recommended)

1. **Build the app** (if not already built):
   ```bash
   cd frontend
   npm run build
   ```

2. **Run Lighthouse on preview server**:
   ```bash
   npm run lighthouse
   ```
   This will:
   - Start the preview server automatically if not running
   - Run Lighthouse audit on `http://localhost:4173`
   - Generate HTML and JSON reports
   - Display scores in terminal
   - Open HTML report in browser

3. **Run Lighthouse on a specific URL**:
   ```bash
   npm run lighthouse:url https://your-deployed-url.com
   ```

### Option 2: Manual Lighthouse CLI

1. **Install Lighthouse CLI** (if not installed):
   ```bash
   npm install -g lighthouse
   ```

2. **Start preview server**:
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

3. **Run Lighthouse**:
   ```bash
   lighthouse http://localhost:4173 \
     --output=html,json \
     --output-path=./lighthouse-report \
     --view
   ```

### Option 3: Using Lighthouse CI

1. **Install Lighthouse CI**:
   ```bash
   npm install -g @lhci/cli@latest
   ```

2. **Run Lighthouse CI** (uses config file):
   ```bash
   lhci autorun --config=./lighthouse.config.js
   ```

## 🔄 Automated Lighthouse CI

Lighthouse CI runs automatically on GitHub Actions after successful deployment to GitHub Pages.

### Workflow

1. **Deploy to GitHub Pages** (`deploy.yml` workflow runs)
2. **Lighthouse CI** (`lighthouse.yml` workflow runs after successful deployment)
3. **Scores are validated** (must meet 90+ threshold)
4. **Results are uploaded** to temporary public storage
5. **PR comments** are posted (if LHCI_GITHUB_APP_TOKEN is configured)

### Manual Trigger

You can manually trigger Lighthouse CI from GitHub Actions:
1. Go to Actions tab
2. Select "Lighthouse CI" workflow
3. Click "Run workflow"
4. Optionally provide a custom URL to test

## 📊 Understanding Lighthouse Scores

### Performance (90+ target)
- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **FID (First Input Delay)**: < 100ms (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)
- **FCP (First Contentful Paint)**: < 1.8s (Good)
- **TTFB (Time to First Byte)**: < 800ms (Good)

### Accessibility (90+ target)
- ARIA labels present
- Color contrast ratios meet WCAG AA
- Keyboard navigation works
- Screen reader support
- Semantic HTML elements

### Best Practices (90+ target)
- HTTPS enabled
- No console errors
- No deprecated APIs
- Images have alt text
- Modern web standards

### SEO (90+ target)
- Meta tags present
- Descriptive title and description
- Valid HTML
- Mobile-friendly
- Fast load times

### PWA (90+ target)
- Service worker registered
- Web app manifest present
- Installable
- Works offline
- Responsive design

## 🔧 Fixing Common Issues

### Performance Issues

**Large Bundle Size**:
- Check bundle size in Performance Metrics Dialog (Settings page)
- Use code splitting for large dependencies
- Lazy load routes/components
- Optimize images

**Slow LCP**:
- Optimize largest image
- Preload critical resources
- Reduce render-blocking resources
- Use CDN for static assets

**High CLS**:
- Set image dimensions
- Reserve space for dynamic content
- Avoid inserting content above existing content

### Accessibility Issues

**Missing ARIA Labels**:
- Add `aria-label` to interactive elements
- Use semantic HTML elements
- Ensure form inputs have labels

**Color Contrast**:
- Check contrast ratios (Settings → Accessibility)
- Use WCAG AA compliant colors
- Ensure text is readable on all backgrounds

**Keyboard Navigation**:
- Test with Tab key
- Ensure focus indicators visible
- Ensure all interactive elements accessible

### Best Practices Issues

**Console Errors**:
- Remove console.log statements in production
- Fix JavaScript errors
- Handle errors gracefully

**Deprecated APIs**:
- Update to modern APIs
- Use feature detection
- Polyfill if needed

### SEO Issues

**Missing Meta Tags**:
- Add meta description
- Add Open Graph tags
- Add Twitter Card tags

**Invalid HTML**:
- Fix HTML validation errors
- Ensure proper document structure
- Use semantic HTML

### PWA Issues

**Service Worker Not Working**:
- Ensure HTTPS (required for service workers)
- Check service worker registration
- Verify workbox configuration

**Manifest Issues**:
- Check manifest.json
- Ensure icons are present
- Verify start_url and scope

## 📝 Lighthouse Reports

Reports are saved in the project root:
- **HTML Report**: `./lighthouse-report.report.html` (view in browser)
- **JSON Report**: `./lighthouse-report.report.json` (for CI/CD)

### Viewing Reports

1. **HTML Report**: Open `lighthouse-report.report.html` in a browser
2. **JSON Report**: Can be parsed by CI/CD tools or scripts

## 🎯 Continuous Improvement

1. **Regular Audits**: Run Lighthouse before every release
2. **Monitor Scores**: Track scores over time
3. **Fix Issues**: Address issues found in audits
4. **Optimize**: Continuously optimize performance

## 📚 Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Accessibility Guide](https://web.dev/accessible/)

---

**Last Updated**: 2025-01-15  
**Status**: ✅ Active

