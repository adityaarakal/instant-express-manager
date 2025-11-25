# PWA Features Documentation

## Overview

Instant Expense Manager is a Progressive Web App (PWA) that provides an app-like experience on mobile and desktop devices. This document covers PWA-specific features and functionality.

## Installation

### Mobile Devices (iOS/Android)

1. **Open the app** in your mobile browser (Safari on iOS, Chrome on Android)
2. **Look for the install prompt** or use the browser menu:
   - **iOS Safari**: Tap the Share button → "Add to Home Screen"
   - **Android Chrome**: Tap the menu (three dots) → "Install app" or "Add to Home Screen"
3. **Confirm installation** when prompted
4. The app will appear on your home screen like a native app

### Desktop (Chrome/Edge)

1. **Open the app** in Chrome or Edge
2. **Look for the install icon** in the address bar (or menu)
3. **Click "Install"** when prompted
4. The app will open in its own window

## Update Notifications

### Automatic Update Detection

The app automatically checks for updates every 5 minutes when:
- The app is open and active
- A new version has been deployed to production

### Update Notification Popup

When a new version is available, you'll see an update notification at the bottom of the screen:

- **Background**: Solid, visible background (white in light mode, dark in dark mode)
- **Visibility**: Enhanced with shadows and borders for clear visibility on all devices
- **Responsive**: Optimized for mobile and desktop screens
- **Actions**:
  - **"Update"** button: Immediately refreshes the app to apply the update
  - **"Later"** button: Dismisses the notification (it will reappear when you refresh)

### Update Process

1. **Detection**: The app detects a new service worker version
2. **Notification**: Update popup appears with solid, visible background
3. **User Action**: Click "Update" to refresh, or "Later" to dismiss
4. **Refresh**: The app reloads and applies the new version

### Visual Design

The update notification is designed for maximum visibility:
- **Solid background** (not transparent) for clear readability
- **Box shadow** for depth and visibility
- **Border** for definition
- **Backdrop filter** for a modern glassmorphism effect
- **Responsive sizing** for mobile and desktop
- **Theme-aware** colors for light and dark modes

## Offline Support

The app works offline using service workers:
- **Cached resources**: Pages and assets are cached for offline access
- **Background sync**: Some operations can sync when connection is restored
- **Offline indicator**: The app gracefully handles offline scenarios

## Service Worker

### Automatic Updates

The service worker:
- **Checks for updates** every 5 minutes
- **Downloads new versions** in the background
- **Notifies users** when updates are ready
- **Applies updates** on user confirmation

### Update Strategy

- **Stale-while-revalidate**: Serves cached content while fetching updates
- **Cache-first**: Uses cached resources when available
- **Network-first**: Fetches fresh content when online

## Best Practices

### For Users

1. **Keep the app updated**: Click "Update" when notified for the latest features and fixes
2. **Install the app**: Add to home screen for the best experience
3. **Allow notifications**: Enable browser notifications for important updates
4. **Check periodically**: The app checks for updates automatically, but you can refresh manually

### For Developers

1. **Version bumping**: Always bump version before deploying
2. **Service worker**: Updates are handled automatically by Vite PWA plugin
3. **Testing**: Test update notifications on mobile devices
4. **Visibility**: Ensure update notifications are clearly visible with solid backgrounds

## Troubleshooting

### Update Notification Not Appearing

- **Check service worker**: Ensure service worker is registered
- **Clear cache**: Clear browser cache and reload
- **Check version**: Verify new version is deployed
- **Wait for check**: Updates are checked every 5 minutes

### Update Notification Not Visible

- **Background issue**: Fixed in version 1.0.115 - update notification now has solid background
- **Theme issue**: Ensure proper theme colors are applied
- **Mobile view**: Check responsive sizing on mobile devices

### App Not Updating

- **Force refresh**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Clear cache**: Clear browser cache and service worker
- **Reinstall**: Uninstall and reinstall the PWA

## Technical Details

### Update Notification Component

Located at: `frontend/src/components/pwa/PWAUpdateNotification.tsx`

**Features**:
- Automatic update detection
- Service worker event listeners
- Periodic update checks (every 5 minutes)
- User-friendly notification UI
- Solid background for visibility
- Responsive design

### Service Worker Configuration

Located at: `frontend/vite.config.ts`

**Configuration**:
- **Scope**: `/instant-express-manager/`
- **Start URL**: `/instant-express-manager/index.html`
- **Update strategy**: Stale-while-revalidate
- **Cache**: Precaches 65 entries (~2.7 MB)

## Version History

- **v1.0.115**: Fixed transparent background issue on update notification
  - Added solid background color
  - Enhanced visibility with shadows and borders
  - Improved responsive design for mobile
  - Added backdrop filter for modern appearance

## Related Documentation

- [GitHub Pages Setup](./GITHUB_PAGES_SETUP.md)
- [User Guide](./USER_GUIDE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)

