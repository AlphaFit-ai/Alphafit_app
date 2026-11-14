import { contrastRatio, darkTokens, lightTokens, TEXT_PAIRS } from '../src/theme/tokens';

describe.each([
  ['light', lightTokens],
  ['dark', darkTokens],
])('%s tokens', (_name, tokens) => {
  it.each(TEXT_PAIRS.map(([fg, bg]) => [fg, bg]))('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    const ratio = contrastRatio(
      tokens.color[fg as keyof typeof tokens.color],
      tokens.color[bg as keyof typeof tokens.color]
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('control outlines are at least 3:1 against the surfaces they sit on', () => {
    expect(contrastRatio(tokens.color.borderStrong, tokens.color.surface)).toBeGreaterThanOrEqual(
      3
    );
    expect(contrastRatio(tokens.color.borderStrong, tokens.color.bg)).toBeGreaterThanOrEqual(3);
  });

  it('every colour is a plain #rrggbb or an rgba scrim (no stray values)', () => {
    Object.entries(tokens.color).forEach(([key, value]) => {
      expect(value).toMatch(/^(#[0-9A-Fa-f]{6}|rgba\(.+\))$/);
      expect(key).toBeTruthy();
    });
  });
});

it('light and dark define exactly the same token names', () => {
  expect(Object.keys(darkTokens.color).sort()).toEqual(Object.keys(lightTokens.color).sort());
});

it('white text on the coral accent fails AA, which is why onAccent is dark navy', () => {
  expect(contrastRatio('#FFFFFF', lightTokens.color.accent)).toBeLessThan(4.5);
  expect(
    contrastRatio(lightTokens.color.onAccent, lightTokens.color.accent)
  ).toBeGreaterThanOrEqual(4.5);
});
