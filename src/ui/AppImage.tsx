import { Image, ImageProps } from 'expo-image';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/** A neutral blur shown while an image loads (a blurhash of a soft grey-warm gradient). */
export const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/** What `AppImage` shows: a bundled asset (`require('...png')`), a `{ uri }`, or a list of them. */
export type AppImageSource = ImageProps['source'];

export type AppImageProps = Omit<ImageProps, 'placeholder'> & {
  /** Skip the blur placeholder (icons, logos that are bundled and instant). */
  noPlaceholder?: boolean;
};

/**
 * expo-image with the app defaults: memory and disk cache, a short fade from a placeholder, and a
 * required accessibility decision (pass `accessibilityLabel`, or `accessible={false}` for decoration).
 */
export const AppImage: React.FC<AppImageProps> = ({
  noPlaceholder = false,
  contentFit = 'cover',
  transition = 150,
  cachePolicy = 'memory-disk',
  style,
  ...rest
}) => {
  const { tokens } = useTheme();
  return (
    <Image
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      placeholder={noPlaceholder ? undefined : { blurhash: PLACEHOLDER_BLURHASH }}
      placeholderContentFit="cover"
      style={[{ backgroundColor: tokens.color.surfaceMuted }, style]}
      {...rest}
    />
  );
};
