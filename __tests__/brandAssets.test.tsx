import { render, screen } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import React from 'react';
import appConfig from '../app.config';
import { ThemeProvider } from '../context/ThemeContext';
import { BrandLogo } from '../src/ui';

const ROOT = path.resolve(__dirname, '..');
const config = (appConfig as unknown as (c: { config: object }) => Record<string, any>)({
  config: {},
});

/** Width and height from a PNG header. */
function pngSize(file: string): { width: number; height: number } {
  const buffer = fs.readFileSync(path.join(ROOT, file));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('brand assets in app.config.ts', () => {
  const splash = config.plugins.find(
    (p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen'
  )[1];

  it('every referenced image exists', () => {
    const files = [
      config.icon,
      config.android.adaptiveIcon.foregroundImage,
      config.android.adaptiveIcon.backgroundImage,
      config.android.adaptiveIcon.monochromeImage,
      splash.image,
      splash.dark.image,
    ];
    for (const file of files) expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
  });

  it('the store icon and the adaptive layers are 1024 px squares', () => {
    for (const file of [
      config.icon,
      config.android.adaptiveIcon.foregroundImage,
      config.android.adaptiveIcon.backgroundImage,
      config.android.adaptiveIcon.monochromeImage,
    ]) {
      expect(pngSize(file)).toEqual({ width: 1024, height: 1024 });
    }
  });

  it('uses the brand navy for the adaptive background and the dark splash', () => {
    expect(config.android.adaptiveIcon.backgroundColor).toBe('#111827');
    expect(splash.dark.backgroundColor).toBe('#111827');
    expect(splash.backgroundColor.toLowerCase()).toBe('#ffffff');
  });

  it('keeps the brand images small', () => {
    const dir = path.join(ROOT, 'assets/images/brand');
    for (const name of fs.readdirSync(dir)) {
      expect(fs.statSync(path.join(dir, name)).size).toBeLessThan(60_000);
    }
    expect(fs.statSync(path.join(ROOT, config.icon)).size).toBeLessThan(120_000);
  });

  it('no old logo file is left behind', () => {
    expect(fs.existsSync(path.join(ROOT, 'assets/images/logo.png'))).toBe(false);
  });
});

describe('BrandLogo', () => {
  const sourceOf = (label = 'AlphaFit AI') => screen.getByLabelText(label);

  it('draws the dark-background version in dark mode and the light one in light mode', () => {
    const dark = render(
      <ThemeProvider initialTheme="dark">
        <BrandLogo />
      </ThemeProvider>
    );
    const darkSource = JSON.stringify(sourceOf().props.source);
    dark.unmount();
    render(
      <ThemeProvider initialTheme="light">
        <BrandLogo />
      </ThemeProvider>
    );
    expect(JSON.stringify(sourceOf().props.source)).not.toBe(darkSource);
  });

  it('is named for screen readers and never drawn below the brand minimum size', () => {
    render(
      <ThemeProvider initialTheme="light">
        <BrandLogo variant="symbol" height={8} />
      </ThemeProvider>
    );
    const style = Object.assign({}, ...[sourceOf().props.style].flat(5)) as { height: number };
    expect(style.height).toBe(16);
    expect(sourceOf().props.accessibilityRole).toBe('image');
  });
});
