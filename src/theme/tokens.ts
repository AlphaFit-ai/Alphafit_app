/**
 * Semantic design tokens. Screens and components read these through `useTheme().tokens`; they never
 * pick a palette colour by `isDarkMode`. Values come from `constants/Colors.ts` (dark navy, coral
 * accent #FF6B4A) and every text/background pair listed in `TEXT_PAIRS` meets WCAG AA (4.5:1),
 * which `__tests__/tokens.test.ts` checks.
 */
import { Colors } from '../../constants/Colors';

export interface ColorTokens {
  /** Screen background. */
  bg: string;
  /** Slightly different background behind grouped content. */
  bgSubtle: string;
  /** Cards, sheets, dialogs. */
  surface: string;
  /** A control sitting on a surface (chips, icon circles, unselected option). */
  surfaceMuted: string;
  /** Decorative separators and card outlines. */
  border: string;
  /** Outlines of controls (inputs): at least 3:1 against the surface. */
  borderStrong: string;

  text: string;
  /** Secondary text. */
  textMuted: string;
  /** Hints and captions; still 4.5:1 on every surface. */
  textSubtle: string;

  /** Primary action fill (the black or white pill) and the text on it. */
  action: string;
  onAction: string;

  /** Brand coral for fills, icons and highlights. Text on it is `onAccent` (never white). */
  accent: string;
  onAccent: string;
  /** Soft coral background (badges, selected rows). */
  accentSoft: string;
  /** Coral as text or a thin line on `bg`/`surface`. */
  accentText: string;

  success: string;
  successText: string;
  successSoft: string;
  warning: string;
  warningText: string;
  warningSoft: string;
  danger: string;
  dangerText: string;
  dangerSoft: string;
  info: string;

  /** Dimmed backdrop behind dialogs and sheets. */
  scrim: string;
  /** Placeholder blocks while content loads. */
  skeleton: string;
  skeletonHighlight: string;
  /** Disabled fill and its text. */
  disabled: string;
  onDisabled: string;
  /** Gold of the premium badge, and the text on it. */
  premium: string;
  onPremium: string;
}

const light: ColorTokens = {
  bg: Colors.white,
  bgSubtle: Colors.gray[50],
  surface: Colors.white,
  surfaceMuted: Colors.gray[100],
  border: Colors.gray[200],
  borderStrong: Colors.gray[500],

  text: Colors.gray[900],
  textMuted: Colors.gray[600],
  textSubtle: '#5B6472',

  action: Colors.black,
  onAction: Colors.white,

  accent: Colors.primary,
  onAccent: Colors.gray[900],
  accentSoft: '#FFE9E3',
  accentText: '#B93A1C',

  success: Colors.success,
  successText: '#047857',
  successSoft: '#D1FAE5',
  warning: Colors.warning,
  warningText: '#B45309',
  warningSoft: '#FEF3C7',
  danger: Colors.error,
  dangerText: '#B91C1C',
  dangerSoft: '#FEE2E2',
  info: Colors.info,

  scrim: 'rgba(17, 24, 39, 0.5)',
  skeleton: Colors.gray[200],
  skeletonHighlight: Colors.gray[100],
  disabled: Colors.gray[200],
  onDisabled: Colors.gray[600],
  premium: Colors.gold,
  onPremium: Colors.gray[900],
};

const dark: ColorTokens = {
  bg: Colors.backgroundDark,
  bgSubtle: '#182235',
  surface: Colors.gray[800],
  surfaceMuted: Colors.gray[700],
  border: Colors.gray[700],
  borderStrong: Colors.gray[400],

  text: Colors.white,
  textMuted: Colors.gray[300],
  textSubtle: '#AEB5C0',

  action: Colors.white,
  onAction: Colors.black,

  accent: Colors.primary,
  onAccent: Colors.gray[900],
  accentSoft: '#3B2420',
  accentText: Colors.primaryLight,

  success: Colors.success,
  successText: '#34D399',
  successSoft: '#12332B',
  warning: Colors.warning,
  warningText: '#FBBF24',
  warningSoft: '#3A2D10',
  danger: Colors.error,
  dangerText: '#FCA5A5',
  dangerSoft: '#3B1D1F',
  info: Colors.secondaryLight,

  scrim: 'rgba(0, 0, 0, 0.6)',
  skeleton: Colors.gray[700],
  skeletonHighlight: Colors.gray[600],
  disabled: Colors.gray[700],
  onDisabled: Colors.gray[300],
  premium: Colors.gold,
  onPremium: Colors.gray[900],
};

/** Pairs that carry text; the contrast test checks each one in both themes. */
export const TEXT_PAIRS: readonly (readonly [keyof ColorTokens, keyof ColorTokens])[] = [
  ['text', 'bg'],
  ['text', 'bgSubtle'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textMuted', 'bg'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceMuted'],
  ['textSubtle', 'bg'],
  ['textSubtle', 'bgSubtle'],
  ['textSubtle', 'surface'],
  ['textSubtle', 'surfaceMuted'],
  ['onAction', 'action'],
  ['onAccent', 'accent'],
  ['accentText', 'bg'],
  ['accentText', 'surface'],
  ['accentText', 'accentSoft'],
  ['successText', 'bg'],
  ['successText', 'surface'],
  ['successText', 'successSoft'],
  ['warningText', 'bg'],
  ['warningText', 'warningSoft'],
  ['dangerText', 'bg'],
  ['dangerText', 'surface'],
  ['dangerText', 'dangerSoft'],
  ['onDisabled', 'disabled'],
  ['onPremium', 'premium'],
];

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  /** Side padding of every screen. */
  screen: 20,
  /** Smallest touch target (points). */
  touch: 44,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Type scale. `lineHeight` is generous so large system font sizes do not clip. */
export const type = {
  display: { fontSize: 32, lineHeight: 40, family: 'bold' },
  title: { fontSize: 28, lineHeight: 36, family: 'bold' },
  heading: { fontSize: 20, lineHeight: 28, family: 'semiBold' },
  subheading: { fontSize: 17, lineHeight: 24, family: 'semiBold' },
  body: { fontSize: 16, lineHeight: 24, family: 'regular' },
  bodyStrong: { fontSize: 16, lineHeight: 24, family: 'semiBold' },
  label: { fontSize: 14, lineHeight: 20, family: 'medium' },
  caption: { fontSize: 13, lineHeight: 18, family: 'regular' },
  metric: { fontSize: 26, lineHeight: 32, family: 'bold' },
} as const;

export type TypeVariant = keyof typeof type;

/** Shadows (iOS shadow props plus Android elevation). Cards in dark mode rely on borders instead. */
export const elevation = {
  none: {},
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

export interface Tokens {
  mode: 'light' | 'dark';
  color: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  elevation: typeof elevation;
}

export const lightTokens: Tokens = {
  mode: 'light',
  color: light,
  spacing,
  radius,
  type,
  elevation,
};
export const darkTokens: Tokens = { mode: 'dark', color: dark, spacing, radius, type, elevation };

/** WCAG relative-luminance contrast ratio of two `#rrggbb` colours. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const channel = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, bl] = channel.map((v) =>
      v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
