import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  isFocusable,
  getFocusableElements,
  isLargeText,
} from '../accessibility';

describe('accessibility', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio correctly for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0); // Maximum contrast
    });

    it('should calculate contrast ratio correctly for white on black', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0); // Maximum contrast
    });

    it('should calculate contrast ratio for medium contrast colors', () => {
      const ratio = calculateContrastRatio('#333333', '#FFFFFF');
      expect(ratio).toBeGreaterThan(4.5); // Should meet WCAG AA
      expect(ratio).toBeLessThan(21);
    });

    it('should handle rgb format', () => {
      const ratio = calculateContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should throw error for invalid color format', () => {
      expect(() => calculateContrastRatio('invalid', '#FFFFFF')).toThrow();
    });
  });

  describe('meetsWCAGAA', () => {
    it('should return true for black on white (normal text)', () => {
      expect(meetsWCAGAA('#000000', '#FFFFFF', false)).toBe(true);
    });

    it('should return true for colors meeting AA standard for normal text', () => {
      expect(meetsWCAGAA('#333333', '#FFFFFF', false)).toBe(true);
    });

    it('should return false for low contrast colors (normal text)', () => {
      expect(meetsWCAGAA('#CCCCCC', '#FFFFFF', false)).toBe(false);
    });

    it('should return true for lower contrast if large text', () => {
      // Large text only needs 3:1 ratio
      // #888888 on white has ~3.97:1 ratio (meets AA for large text)
      expect(meetsWCAGAA('#888888', '#FFFFFF', true)).toBe(true);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should return true for black on white (normal text)', () => {
      expect(meetsWCAGAAA('#000000', '#FFFFFF', false)).toBe(true);
    });

    it('should return false for colors meeting AA but not AAA', () => {
      // #666666 on white meets AA but not AAA for normal text
      const meetsAA = meetsWCAGAA('#666666', '#FFFFFF', false);
      const meetsAAA = meetsWCAGAAA('#666666', '#FFFFFF', false);
      expect(meetsAA).toBe(true);
      expect(meetsAAA).toBe(false);
    });

    it('should return true for large text with lower ratio', () => {
      // Large text AAA only needs 4.5:1
      expect(meetsWCAGAAA('#666666', '#FFFFFF', true)).toBe(true);
    });
  });

  describe('isFocusable', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should return true for button element', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      expect(isFocusable(button)).toBe(true);
    });

    it('should return true for anchor with href', () => {
      const anchor = document.createElement('a');
      anchor.href = '#';
      container.appendChild(anchor);
      expect(isFocusable(anchor)).toBe(true);
    });

    it('should return true for element with tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      container.appendChild(div);
      expect(isFocusable(div)).toBe(true);
    });

    it('should return false for element with tabindex="-1"', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      container.appendChild(div);
      expect(isFocusable(div)).toBe(false);
    });

    it('should return false for non-focusable element', () => {
      const div = document.createElement('div');
      container.appendChild(div);
      expect(isFocusable(div)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should find all focusable elements', () => {
      const button = document.createElement('button');
      const anchor = document.createElement('a');
      anchor.href = '#';
      const input = document.createElement('input');
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');

      container.appendChild(button);
      container.appendChild(anchor);
      container.appendChild(input);
      container.appendChild(div);

      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(4);
      expect(focusable).toContain(button);
      expect(focusable).toContain(anchor);
      expect(focusable).toContain(input);
      expect(focusable).toContain(div);
    });

    it('should exclude disabled elements', () => {
      const button = document.createElement('button');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;

      container.appendChild(button);
      container.appendChild(disabledButton);

      const focusable = getFocusableElements(container);
      expect(focusable).toContain(button);
      expect(focusable).not.toContain(disabledButton);
    });

    it('should exclude hidden elements', () => {
      const button = document.createElement('button');
      const hiddenButton = document.createElement('button');
      hiddenButton.style.display = 'none';

      container.appendChild(button);
      container.appendChild(hiddenButton);

      const focusable = getFocusableElements(container);
      expect(focusable).toContain(button);
      expect(focusable).not.toContain(hiddenButton);
    });
  });

  describe('isLargeText', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should return true for text 24px or larger', () => {
      const element = document.createElement('p');
      element.style.fontSize = '24px';
      container.appendChild(element);
      expect(isLargeText(element)).toBe(true);
    });

    it('should return true for bold text 18.67px or larger', () => {
      const element = document.createElement('p');
      element.style.fontSize = '18.67px';
      element.style.fontWeight = 'bold';
      container.appendChild(element);
      expect(isLargeText(element)).toBe(true);
    });

    it('should return false for small normal text', () => {
      const element = document.createElement('p');
      element.style.fontSize = '16px';
      container.appendChild(element);
      expect(isLargeText(element)).toBe(false);
    });

    it('should return false for small bold text', () => {
      const element = document.createElement('p');
      element.style.fontSize = '16px';
      element.style.fontWeight = 'bold';
      container.appendChild(element);
      expect(isLargeText(element)).toBe(false);
    });
  });
});

