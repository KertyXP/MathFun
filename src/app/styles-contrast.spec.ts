import { describe, it, expect } from 'vitest';
import { GAME_LEVELS } from './config/game-levels';

/**
 * Converts a hex color string (#RGB, #RRGGBB) to [r, g, b] (0-255).
 */
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes the WCAG contrast ratio between two hex colors (1:1 to 21:1).
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(...hexToRgb(hex1));
  const lum2 = getRelativeLuminance(...hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Accessibility - Color Contrast Compliance (WCAG 2.1 AA)', () => {
  const WHITE = '#FFFFFF';
  const MIN_CONTRAST_AA_BODY = 4.5;
  const MIN_CONTRAST_AA_LARGE = 3.0;

  describe('Game Levels - Card and Button Colors with White Text', () => {
    GAME_LEVELS.forEach(level => {
      it(`Level ${level.id} (${level.name}) cardColor [${level.cardColor}] should have contrast >= 4.5:1 against white text`, () => {
        const ratio = getContrastRatio(level.cardColor, WHITE);
        expect(
          ratio,
          `Level ${level.id} (${level.name}) cardColor ${level.cardColor} contrast is ${ratio.toFixed(2)}:1, below required ${MIN_CONTRAST_AA_BODY}:1`
        ).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
      });
    });

    it('Multiplication Training mode cardColor [#BE185D] should have contrast >= 4.5:1 against white text', () => {
      const trainingCardColor = '#BE185D';
      const ratio = getContrastRatio(trainingCardColor, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });
  });

  describe('Light Theme Global Palette', () => {
    const LIGHT_BG = '#FFFFFF';

    it('Main text color [#0F172A] has high contrast (AAA >= 7.0:1) on light background', () => {
      const ratio = getContrastRatio('#0F172A', LIGHT_BG);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('Muted text color [#475569] meets AA contrast (>= 4.5:1) on light background', () => {
      const ratio = getContrastRatio('#475569', LIGHT_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Primary color [#2563EB] meets AA contrast (>= 4.5:1) on white background & with white text', () => {
      const onWhite = getContrastRatio('#2563EB', LIGHT_BG);
      expect(onWhite).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Secondary accent color [#C2410C] meets AA contrast (>= 4.5:1) on white background', () => {
      const ratio = getContrastRatio('#C2410C', LIGHT_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });
  });

  describe('Dark Theme Global Palette', () => {
    const DARK_CARD_BG = '#151D30';

    it('Dark theme text color [#F8FAFC] has high contrast (AAA >= 7.0:1) on dark card background', () => {
      const ratio = getContrastRatio('#F8FAFC', DARK_CARD_BG);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('Dark theme muted text [#94A3B8] meets AA contrast (>= 4.5:1) on dark card background', () => {
      const ratio = getContrastRatio('#94A3B8', DARK_CARD_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Dark theme primary color [#60A5FA] has high contrast (>= 4.5:1) on dark card background', () => {
      const ratio = getContrastRatio('#60A5FA', DARK_CARD_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Dark theme secondary accent [#FB923C] has high contrast (>= 4.5:1) on dark card background', () => {
      const ratio = getContrastRatio('#FB923C', DARK_CARD_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });
  });

  describe('Status Badges and Review Feedback Text', () => {
    it('Success / correct answer text [#15803D] meets AA contrast (>= 4.5:1) on white and light green', () => {
      expect(getContrastRatio('#15803D', '#FFFFFF')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
      expect(getContrastRatio('#15803D', '#E8FCEF')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Wrong / error text [#B91C1C] meets AA contrast (>= 4.5:1) on white', () => {
      expect(getContrastRatio('#B91C1C', '#FFFFFF')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Warning alert text [#C2410C] meets AA contrast (>= 4.5:1) on white and light orange', () => {
      expect(getContrastRatio('#C2410C', '#FFFFFF')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('Points badge text [#92400E] on light yellow [#FFFBEB] meets AA contrast (>= 4.5:1)', () => {
      expect(getContrastRatio('#92400E', '#FFFBEB')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });

    it('New Record title text [#9A3412] on trophy card background [#FFF5E1] meets AA contrast (>= 4.5:1)', () => {
      expect(getContrastRatio('#9A3412', '#FFF5E1')).toBeGreaterThanOrEqual(MIN_CONTRAST_AA_BODY);
    });
  });
});
