/**
 * Accessibility utilities
 * Provides helper functions for accessibility checks and improvements
 */

/**
 * Calculate color contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 * @param color1 - First color in hex format (e.g., "#FFFFFF" or "rgb(255, 255, 255)")
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB if needed
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex (#FFFFFF) or rgb(r, g, b) format.');
  }

  // Calculate relative luminance
  const luminance1 = getRelativeLuminance(rgb1);
  const luminance2 = getRelativeLuminance(rgb2);

  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param color1 - First color
 * @param color2 - Second color
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if contrast meets WCAG AA standard
 */
export function meetsWCAGAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * @param color1 - First color
 * @param color2 - Second color
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if contrast meets WCAG AAA standard
 */
export function meetsWCAGAAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., "#FFFFFF" or "FFFFFF")
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle rgb() format
  const rgbMatch = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle hex format
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance of an RGB color
 * Formula from WCAG 2.1 specification
 * @param rgb - RGB color object
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const normalize = (value: number) => {
    value = value / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if an element is focusable
 * @param element - DOM element to check
 * @returns true if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  // Check if element has tabindex
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex !== null && tabIndex !== '-1') {
    return true;
  }

  // Check if element is naturally focusable
  const focusableElements = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'details',
    'summary',
    '[contenteditable="true"]',
  ];

  const tagName = element.tagName.toLowerCase();
  if (focusableElements.includes(tagName)) {
    return true;
  }

  // Check for contenteditable
  if (element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') !== 'false') {
    return true;
  }

  return false;
}

/**
 * Get all focusable elements within a container
 * @param container - Container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details summary',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  return elements.filter((el) => {
    // Filter out elements that are not visible
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
}

/**
 * Trap focus within a container element
 * Used for modals and dialogs to prevent focus from escaping
 * @param container - Container element to trap focus within
 * @returns Cleanup function to remove focus trap
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement) {
    return () => {}; // No focusable elements
  }

  // Focus first element
  firstElement.focus();

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') {
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab: go to previous element
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab: go to next element
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);

  return () => {
    container.removeEventListener('keydown', handleTab);
  };
}

/**
 * Check if text is large enough to qualify as "large text" for WCAG
 * Large text is 18pt (24px) or larger, or 14pt (18.67px) or larger if bold
 * @param element - Element to check
 * @returns true if text qualifies as large text
 */
export function isLargeText(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const fontSize = parseFloat(style.fontSize);
  const fontWeight = style.fontWeight;

  // Check if font size is 18pt (24px) or larger
  if (fontSize >= 24) {
    return true;
  }

  // Check if font size is 14pt (18.67px) or larger and bold
  const isBold = fontWeight === 'bold' || 
                 fontWeight === '700' || 
                 fontWeight === '800' || 
                 fontWeight === '900' ||
                 parseInt(fontWeight, 10) >= 700;
  
  if (fontSize >= 18.67 && isBold) {
    return true;
  }

  return false;
}

/**
 * Get accessibility status of an element
 * @param element - Element to check
 * @returns Object with accessibility status information
 */
export function getAccessibilityStatus(element: HTMLElement): {
  hasLabel: boolean;
  hasAriaLabel: boolean;
  hasAriaLabelledBy: boolean;
  isFocusable: boolean;
  hasRole: boolean;
  role: string | null;
  contrastRatio?: number;
  meetsWCAGAA?: boolean;
  meetsWCAGAAA?: boolean;
} {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  const hasLabel = hasAriaLabel || hasAriaLabelledBy || element.tagName.toLowerCase() === 'label';
  const hasRole = element.hasAttribute('role');
  const role = element.getAttribute('role');

  // Try to calculate contrast ratio if possible
  let contrastRatio: number | undefined;
  let meetsWCAGAA: boolean | undefined;
  let meetsWCAGAAA: boolean | undefined;

  try {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const isLarge = isLargeText(element);
      contrastRatio = calculateContrastRatio(color, backgroundColor);
      meetsWCAGAA = contrastRatio >= (isLarge ? 3 : 4.5);
      meetsWCAGAAA = contrastRatio >= (isLarge ? 4.5 : 7);
    }
  } catch {
    // Could not calculate contrast
  }

  return {
    hasLabel,
    hasAriaLabel,
    hasAriaLabelledBy,
    isFocusable: isFocusable(element),
    hasRole,
    role,
    contrastRatio,
    meetsWCAGAA,
    meetsWCAGAAA,
  };
}

