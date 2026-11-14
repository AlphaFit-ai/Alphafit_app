import { analyze, flatten } from '../scripts/check-i18n';

describe('translations', () => {
  const result = analyze();

  it('has the same keys and placeholders in English, French and Spanish', () => {
    expect(result.parity.missingIn).toEqual(
      expect.objectContaining({
        'fr (absent, present in en)': [],
        'es (absent, present in en)': [],
        'fr (extra, absent from en)': [],
        'es (extra, absent from en)': [],
      })
    );
    expect(result.parity.placeholderMismatch).toEqual([]);
  });

  it('defines every key the code uses, in every language', () => {
    expect(result.missingEverywhere).toEqual([]);
    expect(result.missingPerLocale).toEqual({ en: [], fr: [], es: [] });
  });

  it('has real French and Spanish text, not English copies, for the new keys', () => {
    const en = flatten(require('../i18n/locales/en.json'));
    const fr = flatten(require('../i18n/locales/fr.json'));
    const es = flatten(require('../i18n/locales/es.json'));
    // Words and short labels that are the same in all three languages are allowed.
    const sameInAllLanguages = new Set([
      'OK',
      'Error',
      'cal',
      'Superman',
      'mins', // unit abbreviation, written the same in French and Spanish
      'Reps',
      'ALPHAFIT PRO',
      '{{price}}/mo',
      '{{price}}/month',
    ]);
    const copies = Object.keys(en).filter(
      (key) =>
        en[key] === fr[key] &&
        en[key] === es[key] &&
        !sameInAllLanguages.has(en[key]) &&
        /[a-z]{4}/i.test(en[key])
    );
    expect(copies).toEqual([]);
  });

  it('keeps the interpolation names the code passes', () => {
    const en = flatten(require('../i18n/locales/en.json'));
    expect(en['profile.deleteAccountPrompt']).toContain('{{phrase}}');
    expect(en['diet.foodScan.alerts.productNotFoundMessage']).toContain('{{barcode}}');
    expect(en['home.yearsOld']).toContain('{{years}}');
  });
});
