# Touch Targets & Interaction Guidelines

This document outlines the touch target requirements and interaction patterns for the application.

## Touch Target Requirements

### Minimum Sizes (Mobile)

All interactive elements must meet minimum touch target sizes on mobile devices (≤600px width):

- **Buttons**: Minimum 44x44px
- **Icon Buttons**: Minimum 48x48px (recommended for better usability)
- **Links**: Minimum 44x44px
- **List Item Buttons**: Minimum 48x48px
- **Clickable Chips**: Minimum 44x44px
- **Table Pagination Controls**: Minimum 44x44px

### Desktop Sizes

On desktop devices (>600px width), touch targets can be smaller but should still be comfortable:

- **Buttons**: Minimum 40x40px
- **Icon Buttons**: Minimum 40x40px or 48x48px
- **Links**: Minimum 40x40px (or natural size with padding)

## Implementation

### Global CSS Rules

The application includes global CSS rules in `frontend/src/index.css` that automatically enforce touch target requirements on mobile:

```css
@media (max-width: 600px) {
  /* Buttons, links, and interactive elements */
  button:not(.MuiIconButton-root), 
  a[role="button"], 
  [role="button"]:not(.MuiIconButton-root) {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Icon buttons should be at least 48x48px */
  .MuiIconButton-root {
    min-height: 48px;
    min-width: 48px;
    padding: 12px;
  }
  
  /* List item buttons */
  .MuiListItemButton-root {
    min-height: 48px;
  }
  
  /* Clickable chips */
  .MuiChip-root[role="button"],
  .MuiChip-clickable {
    min-height: 44px;
    padding: 8px 12px;
  }
  
  /* Links */
  a:not([role="button"]) {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 8px 4px;
  }
  
  /* Table pagination icon buttons */
  .MuiTablePagination-root .MuiIconButton-root {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Component-Level Implementation

In addition to global CSS, components should explicitly set touch target sizes using responsive `sx` props:

#### Buttons

```tsx
<Button
  sx={{
    minHeight: { xs: 44, sm: 40 },
    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
    px: { xs: 1.5, sm: 2 },
  }}
  fullWidth={isMobile}
>
  Button Text
</Button>
```

#### Icon Buttons

```tsx
<IconButton
  sx={{
    minWidth: { xs: 48, sm: 40 },
    minHeight: { xs: 48, sm: 40 },
    p: { xs: 1, sm: 0.5 },
  }}
>
  <Icon />
</IconButton>
```

#### Links

```tsx
<Link
  sx={{
    minHeight: { xs: 44, sm: 'auto' },
    display: 'inline-flex',
    alignItems: 'center',
    px: { xs: 1, sm: 0 },
  }}
>
  Link Text
</Link>
```

## Touch Feedback

### Active States

Interactive elements should provide visual feedback when touched/clicked:

```css
button:active,
.MuiIconButton-root:active,
.MuiListItemButton-root:active,
.MuiChip-clickable:active,
a:active {
  opacity: 0.7;
  transform: scale(0.98);
  transition: opacity 0.2s, transform 0.1s;
}
```

### Hover States (Desktop)

On desktop, hover states provide additional feedback:

- Buttons: Background color change, elevation change
- Icon Buttons: Background color change
- Links: Underline on hover
- List Items: Background color change

### Focus States

All interactive elements must have visible focus indicators for keyboard navigation:

- Focus rings: 2px solid primary color
- Focus outline: Visible and accessible
- Focus-visible: Only show on keyboard navigation (not mouse clicks)

## Accessibility

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical and intuitive
- Focus indicators must be clearly visible
- Skip links should be provided for main content

### Screen Readers

- All interactive elements must have appropriate ARIA labels
- Button text should be descriptive
- Icon-only buttons must have `aria-label`
- Links should have descriptive text

## Best Practices

1. **Consistent Sizing**: Use the same touch target sizes for similar elements across the application
2. **Adequate Spacing**: Ensure touch targets are spaced at least 8px apart to prevent accidental taps
3. **Visual Feedback**: Always provide immediate visual feedback on interaction
4. **Error Prevention**: Use confirmation dialogs for destructive actions
5. **Loading States**: Show loading indicators for actions that take time
6. **Disabled States**: Clearly indicate when elements are disabled

## Testing

### Manual Testing

Test touch targets on:
- Mobile devices (320px - 600px width)
- Tablets (600px - 900px width)
- Desktop (900px+ width)

### Automated Testing

Consider using tools like:
- Lighthouse accessibility audit
- axe DevTools
- WAVE browser extension

## Checklist

- [x] All buttons meet 44x44px minimum on mobile
- [x] All icon buttons meet 48x48px minimum on mobile
- [x] All links meet 44x44px minimum on mobile
- [x] All list item buttons meet 48x48px minimum
- [x] All clickable chips meet 44x44px minimum
- [x] All table pagination controls meet 44x44px minimum
- [x] Touch feedback implemented for all interactive elements
- [x] Focus states visible and accessible
- [x] Hover states implemented for desktop
- [x] Keyboard navigation works for all interactive elements
- [x] ARIA labels provided for icon-only buttons

