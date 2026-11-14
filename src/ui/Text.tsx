import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import type { ColorTokens, TypeVariant } from '../theme/tokens';

export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onAction'
  | 'onAccent';

const TONE_TOKEN: Record<TextTone, keyof ColorTokens> = {
  default: 'text',
  muted: 'textMuted',
  subtle: 'textSubtle',
  accent: 'accentText',
  success: 'successText',
  warning: 'warningText',
  danger: 'dangerText',
  onAction: 'onAction',
  onAccent: 'onAccent',
};

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: TextTone;
}

/** Large system font sizes are honoured up to this factor so layouts bend instead of breaking. */
export const MAX_FONT_SCALE = 1.5;

/** The one Text component: a type-scale variant and a colour tone, both from the design tokens. */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}) => {
  const { tokens } = useTheme();
  const spec = tokens.type[variant];
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        {
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          fontFamily: Fonts[spec.family],
          color: tokens.color[TONE_TOKEN[tone]],
        },
        style,
      ]}
    />
  );
};
