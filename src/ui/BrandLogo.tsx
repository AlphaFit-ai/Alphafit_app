import React from 'react';
import { StyleProp } from 'react-native';
import type { ImageStyle } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { AppImage } from './AppImage';

/**
 * The AlphaFit AI brand mark (concept "Summit": a chevron A with a four-point spark). `symbol` alone
 * is for small spots, `horizontal` is the lockup with the wordmark. There is a version drawn for light
 * backgrounds and one for dark ones; never put the light one on navy. Files: `assets/images/brand`.
 * Rules (clear space, minimum size, no recolouring) are in the brand kit README of the landing repo.
 */
const SOURCES = {
  symbol: {
    light: require('../../assets/images/brand/symbol-light.png'),
    dark: require('../../assets/images/brand/symbol-dark.png'),
  },
  horizontal: {
    light: require('../../assets/images/brand/horizontal-light.png'),
    dark: require('../../assets/images/brand/horizontal-dark.png'),
  },
} as const;

/** Width / height of the exported files. */
const RATIO = { symbol: 1, horizontal: 5 } as const;

export interface BrandLogoProps {
  variant?: 'symbol' | 'horizontal';
  /** Rendered height in dp: at least 16 for the symbol and 24 for the lockup. */
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  height = 28,
  style,
}) => {
  const { tokens } = useTheme();
  const min = variant === 'symbol' ? 16 : 24;
  const h = Math.max(min, height);
  return (
    <AppImage
      source={SOURCES[variant][tokens.mode]}
      noPlaceholder
      contentFit="contain"
      accessible
      accessibilityLabel="AlphaFit AI"
      accessibilityRole="image"
      style={[{ width: h * RATIO[variant], height: h, backgroundColor: 'transparent' }, style]}
    />
  );
};
