# Responsive Typography & Spacing System

This document outlines the consistent typography and spacing system used throughout the application for responsive design.

## Typography Scale

### Headings

#### H4 (Page Titles)
- **Mobile (xs)**: `1.5rem` (24px)
- **Tablet (sm)**: `2rem` (32px)
- **Desktop (md+)**: `2.125rem` (34px)
- **Usage**: Main page titles (e.g., "Dashboard", "Transactions", "Settings")
- **Example**:
  ```tsx
  <Typography 
    variant="h4" 
    sx={{ 
      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
      fontWeight: 700,
    }}
  >
    Page Title
  </Typography>
  ```

#### H5 (Section Headings)
- **Mobile (xs)**: `1.125rem` (18px)
- **Tablet (sm)**: `1.25rem` (20px)
- **Desktop (md+)**: `1.5rem` (24px)
- **Usage**: Section headings within pages
- **Example**:
  ```tsx
  <Typography 
    variant="h5"
    sx={{
      fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
      fontWeight: 600,
    }}
  >
    Section Title
  </Typography>
  ```

#### H6 (Subsection Headings)
- **Mobile (xs)**: `1rem` (16px)
- **Tablet (sm)**: `1.25rem` (20px)
- **Desktop (md+)**: `1.25rem` (20px)
- **Usage**: Subsection headings, card titles
- **Example**:
  ```tsx
  <Typography 
    variant="h6"
    sx={{
      fontSize: { xs: '1rem', sm: '1.25rem' },
      fontWeight: 600,
    }}
  >
    Subsection Title
  </Typography>
  ```

### Body Text

#### Body1 (Default Body)
- **Mobile (xs)**: `0.875rem` (14px)
- **Tablet (sm)**: `0.875rem` (14px)
- **Desktop (md+)**: `1rem` (16px)
- **Usage**: Default body text, descriptions
- **Example**:
  ```tsx
  <Typography 
    variant="body1"
    sx={{
      fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
    }}
  >
    Body text content
  </Typography>
  ```

#### Body2 (Secondary Body)
- **Mobile (xs)**: `0.8125rem` (13px)
- **Tablet (sm)**: `0.875rem` (14px)
- **Desktop (md+)**: `0.875rem` (14px)
- **Usage**: Secondary text, helper text, descriptions
- **Example**:
  ```tsx
  <Typography 
    variant="body2"
    sx={{
      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
    }}
  >
    Secondary text content
  </Typography>
  ```

### Caption Text

#### Caption
- **Mobile (xs)**: `0.6875rem` (11px)
- **Tablet (sm)**: `0.75rem` (12px)
- **Desktop (md+)**: `0.75rem` (12px)
- **Usage**: Captions, metadata, timestamps, helper text
- **Example**:
  ```tsx
  <Typography 
    variant="caption"
    sx={{
      fontSize: { xs: '0.6875rem', sm: '0.75rem' },
    }}
  >
    Caption text
  </Typography>
  ```

## Spacing System

### Stack Spacing

#### Main Container Spacing
- **Mobile (xs)**: `2` (16px)
- **Tablet (sm)**: `3` (24px)
- **Desktop (md+)**: `3` (24px)
- **Usage**: Main page containers, top-level sections
- **Example**:
  ```tsx
  <Stack spacing={{ xs: 2, sm: 3 }}>
    {/* Content */}
  </Stack>
  ```

#### Section Spacing
- **Mobile (xs)**: `1.5` (12px)
- **Tablet (sm)**: `2` (16px)
- **Desktop (md+)**: `2` (16px)
- **Usage**: Sections within pages, form fields, card content
- **Example**:
  ```tsx
  <Stack spacing={{ xs: 1.5, sm: 2 }}>
    {/* Section content */}
  </Stack>
  ```

#### Compact Spacing
- **Mobile (xs)**: `1` (8px)
- **Tablet (sm)**: `1.5` (12px)
- **Desktop (md+)**: `1.5` (12px)
- **Usage**: Tight spacing, button groups, inline elements
- **Example**:
  ```tsx
  <Stack spacing={{ xs: 1, sm: 1.5 }}>
    {/* Compact content */}
  </Stack>
  ```

### Padding

#### Paper/Card Padding
- **Mobile (xs)**: `1.5` (12px) or `2` (16px)
- **Tablet (sm)**: `2` (16px) or `3` (24px)
- **Desktop (md+)**: `3` (24px) or `4` (32px)
- **Usage**: Paper components, Cards, Dialogs
- **Example**:
  ```tsx
  <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
    {/* Content */}
  </Paper>
  ```

#### Dialog Padding
- **Mobile (xs)**: `2` (16px)
- **Tablet (sm)**: `3` (24px)
- **Desktop (md+)**: `3` (24px)
- **Usage**: DialogContent, DialogActions
- **Example**:
  ```tsx
  <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
    {/* Content */}
  </DialogContent>
  ```

### Margins

#### Section Margins
- **Mobile (xs)**: `0.75` (6px) to `1` (8px)
- **Tablet (sm)**: `1` (8px) to `2` (16px)
- **Desktop (md+)**: `1` (8px) to `2` (16px)
- **Usage**: Margins between sections, typography margins
- **Example**:
  ```tsx
  <Typography sx={{ mb: { xs: 0.75, sm: 1 } }}>
    Title
  </Typography>
  ```

## Component-Specific Patterns

### Buttons

#### Button Sizing
- **Mobile (xs)**: 
  - `minHeight: 44px` (touch target requirement)
  - `fontSize: 0.8125rem`
  - `px: 1.5`
- **Tablet (sm)**: 
  - `minHeight: 40px`
  - `fontSize: 0.875rem`
  - `px: 2`
- **Desktop (md+)**: 
  - `minHeight: 40px`
  - `fontSize: 0.875rem`
  - `px: 2`

#### Button Layout
- **Mobile (xs)**: Full width (`fullWidth={isMobile}`)
- **Tablet (sm)**: Auto width
- **Desktop (md+)**: Auto width

### Tables

#### Table Cell Padding
- **Mobile (xs)**: `8px 4px`
- **Tablet (sm)**: `16px`
- **Desktop (md+)**: `16px`

#### Table Font Sizes
- **Mobile (xs)**: `0.75rem` (12px)
- **Tablet (sm)**: `0.875rem` (14px)
- **Desktop (md+)**: `0.875rem` (14px)

### Chips

#### Chip Sizing
- **Mobile (xs)**: 
  - `height: 24px`
  - `fontSize: 0.6875rem`
  - `px: 0.75`
- **Tablet (sm)**: 
  - `height: 28px`
  - `fontSize: 0.75rem`
  - `px: 1`
- **Desktop (md+)**: 
  - `height: 28px`
  - `fontSize: 0.75rem`
  - `px: 1`

### Icons

#### Icon Sizing
- **Mobile (xs)**: `20px` to `24px`
- **Tablet (sm)**: `24px` to `32px`
- **Desktop (md+)**: `24px` to `32px`

## Breakpoints

The application uses Material-UI's default breakpoints:
- **xs**: 0px - 600px (Mobile)
- **sm**: 600px - 900px (Tablet)
- **md**: 900px - 1200px (Small Desktop)
- **lg**: 1200px - 1536px (Desktop)
- **xl**: 1536px+ (Large Desktop)

## Best Practices

1. **Always use responsive values**: Use the `sx` prop with responsive objects for typography and spacing
2. **Consistent spacing**: Use the spacing system consistently across all pages
3. **Touch targets**: Ensure all interactive elements meet minimum 44x44px on mobile
4. **Text wrapping**: Always enable `wordWrap: 'break-word'` and `overflowWrap: 'break-word'` for long text
5. **Readability**: Maintain minimum font sizes (0.6875rem / 11px) for captions, 0.75rem / 12px for body text on mobile
6. **Consistent patterns**: Follow the established patterns for similar components across pages

## Implementation Checklist

- [x] All page titles use H4 with responsive sizing
- [x] All section headings use H6 with responsive sizing
- [x] All body text uses Body2 with responsive sizing
- [x] All captions use Caption with responsive sizing
- [x] All Stack components use responsive spacing
- [x] All Paper/Card components use responsive padding
- [x] All Dialog components use responsive padding and fullScreen on mobile
- [x] All Buttons use responsive sizing and fullWidth on mobile
- [x] All Tables use responsive cell padding and font sizes
- [x] All Chips use responsive sizing
- [x] All Icons use responsive sizing

