# Mobile-Optimized UI Documentation

## Overview

The Mobile-Optimized UI feature provides a comprehensive mobile-first experience for the Instant Express Manager application. This includes touch-friendly controls, swipe gestures, mobile-specific layouts, and bottom navigation for easy access to key features.

## Features

### 1. Bottom Navigation Bar
- **Component**: `BottomNavigation`
- **Location**: `frontend/src/components/layout/BottomNavigation.tsx`
- **Purpose**: Provides quick access to main navigation items on mobile devices
- **Features**:
  - Fixed position at the bottom of the screen
  - Shows 6 main navigation items (Dashboard, Accounts, Transactions, Planner, Analytics, Settings)
  - Auto-hides on desktop/tablet (md breakpoint and above)
  - Active route highlighting
  - Safe area inset support for devices with notches

### 2. Swipe Gestures
- **Hook**: `useSwipe`
- **Location**: `frontend/src/hooks/useSwipe.ts`
- **Purpose**: Detect and handle swipe gestures on touch devices
- **Features**:
  - Swipe left/right/up/down detection
  - Configurable threshold and velocity
  - Prevents accidental swipes
  - Works with touch events

### 3. Swipeable Card Component
- **Component**: `SwipeableCard`
- **Location**: `frontend/src/components/common/SwipeableCard.tsx`
- **Purpose**: Card component that supports swipe gestures for actions
- **Features**:
  - Swipe left/right to reveal action buttons
  - Visual feedback during swipe
  - Configurable actions (delete, edit, custom)
  - Auto-snap back if not swiped enough
  - Only active on mobile devices

### 4. Enhanced Touch-Friendly Controls
- **Location**: `frontend/src/index.css`
- **Features**:
  - Minimum 44x44px touch targets (WCAG 2.1 AA compliant)
  - Enhanced touch feedback (opacity and scale)
  - Better spacing for mobile forms
  - Improved button and list item spacing
  - Better dialog spacing on mobile
  - Safe area inset support

## Implementation Details

### Bottom Navigation

The bottom navigation bar is automatically shown on mobile devices (below md breakpoint) and hidden on desktop/tablet. It provides quick access to the most commonly used pages.

```tsx
import { BottomNavigation } from './components/layout/BottomNavigation';

// Automatically integrated into AppLayout
// Shows on mobile, hidden on desktop
```

### Swipe Gestures Hook

The `useSwipe` hook can be used to detect swipe gestures on any element:

```tsx
import { useSwipe } from '../hooks/useSwipe';

const swipeRef = useSwipe({
  onSwipeLeft: () => handleDelete(),
  onSwipeRight: () => handleEdit(),
  threshold: 50, // Minimum distance in pixels
  velocityThreshold: 0.3, // Minimum velocity
});

<div ref={swipeRef}>Swipe me!</div>
```

### Swipeable Card Component

Use the `SwipeableCard` component to create cards that support swipe gestures:

```tsx
import { SwipeableCard } from '../components/common/SwipeableCard';

<SwipeableCard
  onSwipeLeft={() => handleDelete()}
  onSwipeRight={() => handleEdit()}
  onDelete={handleDelete}
  onEdit={handleEdit}
  swipeLeftAction="delete"
  swipeRightAction="edit"
>
  <Typography>Card content</Typography>
</SwipeableCard>
```

**Props:**
- `children`: Card content
- `onSwipeLeft`: Callback when swiped left
- `onSwipeRight`: Callback when swiped right
- `onDelete`: Delete handler
- `onEdit`: Edit handler
- `swipeLeftAction`: Action for left swipe ('delete' | 'edit' | 'custom')
- `swipeRightAction`: Action for right swipe ('delete' | 'edit' | 'custom')
- `showActions`: Show action buttons when swiped (default: true)
- `disabled`: Disable swipe gestures

## Mobile-Specific Layouts

### Main Content Padding

The main content area has extra bottom padding on mobile devices to account for the bottom navigation bar:

```tsx
pb: { xs: 10, sm: 6, md: 8 } // Extra padding on mobile
```

### Touch Targets

All interactive elements meet WCAG 2.1 AA requirements for touch targets:
- Buttons: Minimum 44x44px
- Icon buttons: Minimum 48x48px
- List items: Minimum 48px height
- Clickable chips: Minimum 44px height

### Touch Feedback

All interactive elements provide visual feedback on touch:
- Opacity change (0.7)
- Scale transform (0.98)
- Smooth transitions

## Best Practices

1. **Use SwipeableCard for Lists**: Use `SwipeableCard` for transaction lists, EMI lists, etc., to enable swipe-to-delete/edit functionality.

2. **Test on Real Devices**: Always test swipe gestures on real mobile devices, as touch behavior can differ from desktop simulators.

3. **Provide Visual Feedback**: Always provide visual feedback during swipe gestures to indicate what action will be performed.

4. **Respect Safe Areas**: The bottom navigation respects safe area insets for devices with notches or home indicators.

5. **Progressive Enhancement**: Swipe gestures are a progressive enhancement - all actions should still be accessible via buttons/links.

6. **Touch Target Sizes**: Always ensure touch targets are at least 44x44px for accessibility compliance.

## Browser Compatibility

- **iOS Safari**: Full support
- **Chrome (Android)**: Full support
- **Firefox (Android)**: Full support
- **Samsung Internet**: Full support
- **Desktop browsers**: Swipe gestures disabled, bottom navigation hidden

## Known Limitations

1. **Swipe Gestures**: Only work on touch devices. Desktop users will see action buttons but cannot swipe.

2. **Bottom Navigation**: Only shows 6 main items. Less frequently used pages (Banks, EMIs, Recurring, Credit Cards) are accessible via the hamburger menu.

3. **Touch Events**: Some older browsers may not support all touch event features.

## Future Enhancements

1. **Swipe to Archive**: Add archive functionality with swipe gestures
2. **Pull to Refresh**: Implement pull-to-refresh for lists
3. **Swipe Navigation**: Swipe between pages in some contexts
4. **Haptic Feedback**: Add haptic feedback on swipe actions (where supported)
5. **Custom Swipe Actions**: Allow users to customize swipe actions per page

## Testing Checklist

- [ ] Bottom navigation appears on mobile devices
- [ ] Bottom navigation hidden on desktop/tablet
- [ ] Active route is highlighted in bottom navigation
- [ ] Swipe gestures work on touch devices
- [ ] SwipeableCard shows action buttons when swiped
- [ ] Touch targets meet minimum size requirements
- [ ] Touch feedback is visible on all interactive elements
- [ ] Safe area insets are respected on devices with notches
- [ ] All actions are still accessible without swipe gestures
- [ ] Performance is smooth on low-end devices

