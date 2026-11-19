import { describe, expect, it } from 'vitest';
import { gradeExercise } from './grading.js';
import { hasIndicScript, normalizeRoman, readingOf, romanHint, romanize, romanizedEqual } from './romanize.js';
import type { Exercise } from './content.js';

const CASES: Array<[string, string, string]> = [
  ['नमस्ते', 'namaste', 'Hindi'],
  ['धन्यवाद', 'dhanyavad', 'Hindi'],
  ['हिन्दी', 'hindi', 'Hindi'],
  ['মূল্য', 'muly', 'Bengali'],
  ['বাংলা', 'bangla', 'Bengali'],
  ['ਪੰਜਾਬੀ', 'panjabi', 'Punjabi'],
  ['ગુજરાતી', 'gujarati', 'Gujarati'],
  ['ଓଡ଼ିଆ', 'odia', 'Odia'],
  ['தமிழ்', 'tamil', 'Tamil'],
  ['తెలుగు', 'telugu', 'Telugu'],
  ['ಕನ್ನಡ', 'kannada', 'Kannada'],
  ['മലയാളം', 'malayalam', 'Malayalam'],
  ['भारत', 'bharat', 'Hindi'],
  ['स्कूल', 'skool', 'Hindi conjunct'],
  ['प्रेम', 'prem', 'Hindi conjunct'],
  ['రెండు', 'rendu', 'Telugu anusvara'],
  ['క్షమించండి', 'kshaminchandi', 'Telugu anusvara'],
  ['ಒಂದು', 'ondu', 'Kannada anusvara'],
  ['ಇಲ್ಲ', 'illa', 'Kannada final vowel'],
  ['ഒന്ന്', 'onnu', 'Malayalam final virama'],
  ['ഇല്ല', 'illa', 'Malayalam final vowel'],
  ['അഞ്ച്', 'anchu', 'Malayalam nasal'],
  ['ଦୟାକରି', 'dayakari', 'Odia ୟ'],
];

describe('romanize', () => {
  it.each(CASES)('reads %s as %s (%s)', (script, expected) => {
    // Compare through the practical normalizer so vowel-length variants pass.
    expect(readingOf(script)).toBe(normalizeRoman(expected));
  });

  it('converts native digits and keeps punctuation', () => {
    expect(romanize('२ + ३')).toBe('2 + 3');
  });

  it('leaves Latin text untouched apart from whitespace', () => {
    expect(romanize('  namaste   dost ')).toBe('namaste dost');
    expect(hasIndicScript('namaste')).toBe(false);
    expect(hasIndicScript('नमस्ते')).toBe(true);
  });

  it('produces a friendly hint only for target-script text', () => {
    expect(romanHint('नमस्ते')).toBe('namaste');
    expect(romanHint('धन्यवाद')).toBe('dhanyavaad');
    expect(romanHint('आठ')).toBe('aath');
    expect(romanHint('तीन')).toBe('teen');
    expect(romanHint('नमस्ते, दोस्त')).toBe('namaste, dost');
    expect(romanHint('hello')).toBeNull();
  });

  it('folds common spelling variants', () => {
    expect(normalizeRoman('dhanyavaad')).toBe(normalizeRoman('dhanyavad'));
    expect(normalizeRoman('namastē')).toBe('namaste');
  });

  it('does not equate different words', () => {
    expect(romanizedEqual('नमस्ते', 'dhanyavad')).toBe(false);
    expect(romanizedEqual('नमस्ते', 'namaste')).toBe(true);
  });

  it('accepts nasal endings with or without the nasal letter', () => {
    expect(romanizedEqual('माँ', 'maa')).toBe(true);
    expect(romanizedEqual('माँ', 'maan')).toBe(true);
    expect(romanizedEqual('हाँ', 'haan')).toBe(true);
    expect(romanizedEqual('हाँ', 'haa')).toBe(true);
    // Without a nasal mark on the target the relaxed form must not apply.
    expect(romanizedEqual('मा', 'maan')).toBe(false);
  });

  it('keeps the final vowel that Dravidian scripts pronounce', () => {
    expect(romanize('ഒന്ന്')).toBe('onnu');
    expect(romanize('ഇല്ല')).toBe('illa');
    expect(romanize('എട്ട്')).toBe('ettu');
    expect(romanize('ಇಲ್ಲ')).toBe('illa');
    expect(romanize('ಕನ್ನಡ')).toBe('kannada');
    expect(romanizedEqual('ഒന്ന്', 'onnu')).toBe(true);
    expect(romanizedEqual('ಎಂಟು', 'entu')).toBe(true);
  });

  it('assimilates anusvara to the consonant that follows it', () => {
    expect(romanize('రెండు')).toBe('rendu');
    expect(romanize('క్షమించండి')).toBe('kshaminchandi');
    expect(romanize('ಒಂದು')).toBe('ondu');
    expect(romanize('ಎಂಟು')).toBe('entu');
    expect(romanize('ಒಂಬತ್ತು')).toBe('ombattu');
    // A word-final anusvara is still "m".
    expect(romanize('നമസ്കാരം')).toBe('namaskaaram');
    expect(romanize('శుభోదయం')).toBe('shubhodayam');
  });

  it('reads Odia ୟ and Malayalam chillu letters', () => {
    expect(romanize('ଦୟାକରି')).toBe('dayaakari');
    expect(romanize('ଧନ୍ୟବାଦ')).toBe('dhanyabaad');
    expect(romanize('അവൻ')).toBe('avan');
    expect(romanize('അവൾ')).toBe('aval');
  });

  it('accepts common English spellings and doubled consonants', () => {
    expect(romanizedEqual('स्कूल', 'school')).toBe(true);
    expect(romanizedEqual('स्टेशन', 'station')).toBe(true);
    expect(romanizedEqual('कृपया', 'kripya')).toBe(true);
    expect(romanizedEqual('बहन', 'behen')).toBe(true);
    expect(romanizedEqual('अलविदा', 'alvida')).toBe(true);
    expect(romanizedEqual('माफ कीजिए', 'maaf kijiye')).toBe(true);
    expect(romanizedEqual('चाय', 'chai')).toBe(true);
    expect(romanizedEqual('ਅੱਠ', 'atth')).toBe(true);
  });
});

const typeExercise: Exercise = {
  id: 'test-type',
  kind: 'typeTranslation',
  prompt: 'Type "hello"',
  expected: ['नमस्ते'],
  acceptTypos: true,
};

describe('romanized grading', () => {
  it('accepts a Latin reading of the expected answer', () => {
    const result = gradeExercise(typeExercise, { kind: 'text', value: 'namaste' });
    expect(result.correct).toBe(true);
  });

  it('still accepts the target script', () => {
    const result = gradeExercise(typeExercise, { kind: 'text', value: 'नमस्ते' });
    expect(result.correct).toBe(true);
  });

  it('rejects an unrelated Latin word', () => {
    const result = gradeExercise(typeExercise, { kind: 'text', value: 'dhanyavad' });
    expect(result.correct).toBe(false);
  });
});
