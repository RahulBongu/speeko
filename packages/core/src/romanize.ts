/**
 * Latin transliteration for the ten Indian scripts taught in Speeko.
 *
 * This is a *practical* romanization, not a scholarly ISO transliteration:
 * it is designed to match how learners type Indian words on an English
 * keyboard ("namaste", "dhanyavad", "bangla"). It powers:
 *
 *  - the "type it in English letters" hint on typing exercises
 *  - accepting a romanized answer when the learner has an English keyboard
 *  - the voice-practice transcript checker
 *
 * The mapping is intentionally lossy (retroflex/dental pairs both become
 * t/d, long and short vowels collapse when compared) because the goal is
 * recognition, not phonemic transcription.
 */

export interface ScriptSpec {
  /** Characters at base+0x15 .. base+0x39. */
  consonants: string;
  vowels: Record<string, string>;
  matras: Record<string, string>;
  virama: string;
  marks: Record<string, string>;
  digits: string;
  /** Letters outside the base consonant block that still take an inherent "a". */
  extras?: Record<string, string>;
  /** Consonant letters that carry no inherent vowel (Bengali ৎ, Malayalam chillus). */
  standalone?: Record<string, string>;
  /** Indo-Aryan scripts leave a final inherent "a" unpronounced. */
  dropFinalSchwa?: boolean;
  /** Dravidian scripts pronounce a word-final virama with a short vowel. */
  finalViramaVowel?: string;
}

function mapChars(chars: string, values: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const list = Array.from(chars);
  for (let i = 0; i < values.length && i < list.length; i += 1) {
    const char = list[i];
    const value = values[i];
    if (char && value !== undefined) out[char] = value;
  }
  return out;
}

function vowels(map: Array<[string, string]>): Record<string, string> {
  return Object.fromEntries(map);
}

const DEVANAGARI: ScriptSpec = {
  consonants: 'कखगघङचछजझञटठडढणतथदधनऩपफबभमयरऱलळऴवशषसह',
  vowels: vowels([
    ['अ', 'a'], ['आ', 'aa'], ['इ', 'i'], ['ई', 'ee'], ['उ', 'u'], ['ऊ', 'oo'],
    ['ऋ', 'ri'], ['ऌ', 'li'], ['ऍ', 'e'], ['ऎ', 'e'], ['ए', 'e'], ['ऐ', 'ai'],
    ['ऑ', 'o'], ['ऒ', 'o'], ['ओ', 'o'], ['औ', 'au'],
  ]),
  matras: mapChars('ािीुूृॄॅॆेैॉॊोौ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'e', 'e', 'ai', 'o', 'o', 'o', 'au',
  ]),
  virama: '्',
  marks: { 'ं': 'n', 'ँ': 'n', 'ः': 'h', '़': '' },
  digits: '०१२३४५६७८९',
  extras: { 'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f', 'य़': 'y' },
  dropFinalSchwa: true,
};

const BENGALI: ScriptSpec = {
  consonants: 'কখগঘঙচছজঝঞটঠডঢণতথদধন঩পফবভমযর঱ল঳঴঵শষসহ',
  vowels: vowels([
    ['অ', 'o'], ['আ', 'aa'], ['ই', 'i'], ['ঈ', 'ee'], ['উ', 'u'], ['ঊ', 'oo'],
    ['ঋ', 'ri'], ['এ', 'e'], ['ঐ', 'oi'], ['ও', 'o'], ['ঔ', 'ou'],
  ]),
  matras: mapChars('ািীুূৃৄেৈোৌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'ai', 'o', 'au',
  ]),
  virama: '্',
  marks: { 'ং': 'ng', 'ঁ': 'n', 'ঃ': 'h', '়': '' },
  digits: '০১২৩৪৫৬৭৮৯',
  extras: { 'য়': 'y', 'ড়': 'r', 'ঢ়': 'rh' },
  standalone: { 'ৎ': 't' },
  dropFinalSchwa: true,
};

const GURMUKHI: ScriptSpec = {
  consonants: 'ਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨ਩ਪਫਬਭਮਯਰ਱ਲਲ਼਴ਵਸ਼਷ਸਹ',
  vowels: vowels([
    ['ਅ', 'a'], ['ਆ', 'aa'], ['ਇ', 'i'], ['ਈ', 'ee'], ['ਉ', 'u'], ['ਊ', 'oo'],
    ['ਏ', 'e'], ['ਐ', 'ai'], ['ਓ', 'o'], ['ਔ', 'au'],
  ]),
  matras: mapChars('ਾਿੀੁੂੇੈੋੌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'e', 'ai', 'o', 'au',
  ]),
  virama: '੍',
  marks: { 'ਂ': 'n', 'ੰ': 'n', 'ਃ': 'h', '਼': '' },
  digits: '੦੧੨੩੪੫੬੭੮੯',
  extras: { 'ਖ਼': 'kh', 'ਗ਼': 'g', 'ਜ਼': 'z', 'ਫ਼': 'f', 'ੜ': 'r' },
  dropFinalSchwa: true,
};

const GUJARATI: ScriptSpec = {
  consonants: 'કખગઘઙચછજઝઞટઠડઢણતથદધન઩પફબભમયર઱લળ઴વશષસહ',
  vowels: vowels([
    ['અ', 'a'], ['આ', 'aa'], ['ઇ', 'i'], ['ઈ', 'ee'], ['ઉ', 'u'], ['ઊ', 'oo'],
    ['ઋ', 'ri'], ['એ', 'e'], ['ઐ', 'ai'], ['ઓ', 'o'], ['ઔ', 'au'],
  ]),
  matras: mapChars('ાિીુૂૃૄેૈોૌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'ai', 'o', 'au',
  ]),
  virama: '્',
  marks: { 'ં': 'n', 'ઁ': 'n', 'ઃ': 'h', '઼': '' },
  digits: '૦૧૨૩૪૫૬૭૮૯',
  dropFinalSchwa: true,
};

const ODIA: ScriptSpec = {
  consonants: 'କଖଗଘଙଚଛଜଝଞଟଠଡଢଣତଥଦଧନ଩ପଫବଭମଯର଱ଲଳ଴ଵଶଷସହ',
  vowels: vowels([
    ['ଅ', 'a'], ['ଆ', 'aa'], ['ଇ', 'i'], ['ଈ', 'ee'], ['ଉ', 'u'], ['ଊ', 'oo'],
    ['ଋ', 'ri'], ['ଏ', 'e'], ['ଐ', 'ai'], ['ଓ', 'o'], ['ଔ', 'au'],
  ]),
  matras: mapChars('ାିୀୁୂୃେୈୋୌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'e', 'ai', 'o', 'au',
  ]),
  virama: '୍',
  marks: { 'ଂ': 'n', 'ଁ': 'n', 'ଃ': 'h', '଼': '' },
  digits: '୦୧୨୩୪୫୬୭୮୯',
  extras: { 'ୟ': 'y', 'ୱ': 'v', 'ଡ଼': 'r', 'ଢ଼': 'rh' },
  dropFinalSchwa: true,
};

const TAMIL: ScriptSpec = {
  consonants: 'க஖஗஘ஙச஛ஜ஝ஞட஠஡஢ணத஥஦஧நனப஫஬஭மயரறலளழவஶஷஸஹ',
  vowels: vowels([
    ['அ', 'a'], ['ஆ', 'aa'], ['இ', 'i'], ['ஈ', 'ee'], ['உ', 'u'], ['ஊ', 'oo'],
    ['எ', 'e'], ['ஏ', 'e'], ['ஐ', 'ai'], ['ஒ', 'o'], ['ஓ', 'o'], ['ஔ', 'au'],
  ]),
  matras: mapChars('ாிீுூ௃௄ெேைொோௌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'e', 'ai', 'o', 'o', 'au',
  ]),
  virama: '்',
  marks: { 'ஂ': 'n', 'ஃ': 'h' },
  digits: '',
};

const TELUGU: ScriptSpec = {
  consonants: 'కఖగఘఙచఛజఝఞటఠడఢణతథదధన఩పఫబభమయరఱలళఴవశషసహ',
  vowels: vowels([
    ['అ', 'a'], ['ఆ', 'aa'], ['ఇ', 'i'], ['ఈ', 'ee'], ['ఉ', 'u'], ['ఊ', 'oo'],
    ['ఋ', 'ri'], ['ఎ', 'e'], ['ఏ', 'e'], ['ఐ', 'ai'], ['ఒ', 'o'], ['ఓ', 'o'], ['ఔ', 'au'],
  ]),
  matras: mapChars('ాిీుూృౄెేైొోౌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'e', 'ai', 'o', 'o', 'au',
  ]),
  virama: '్',
  marks: { 'ం': 'm', 'ఁ': 'n', 'ః': 'h' },
  digits: '౦౧౨౩౪౫౬౭౮౯',
};

const KANNADA: ScriptSpec = {
  consonants: 'ಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನ಩ಪಫಬಭಮಯರಱಲಳ಴ವಶಷಸಹ',
  vowels: vowels([
    ['ಅ', 'a'], ['ಆ', 'aa'], ['ಇ', 'i'], ['ಈ', 'ee'], ['ಉ', 'u'], ['ಊ', 'oo'],
    ['ಋ', 'ri'], ['ಎ', 'e'], ['ಏ', 'e'], ['ಐ', 'ai'], ['ಒ', 'o'], ['ಓ', 'o'], ['ಔ', 'au'],
  ]),
  matras: mapChars('ಾಿೀುೂೃೄೆೇೈೊೋೌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'e', 'ai', 'o', 'o', 'au',
  ]),
  virama: '್',
  marks: { 'ಂ': 'm', 'ಁ': 'n', 'ಃ': 'h' },
  digits: '೦೧೨೩೪೫೬೭೮೯',
};

const MALAYALAM: ScriptSpec = {
  consonants: 'കഖഗഘങചഛജഝഞടഠഡഢണതഥദധനഩപഫബഭമയരറലളഴവശഷസഹ',
  vowels: vowels([
    ['അ', 'a'], ['ആ', 'aa'], ['ഇ', 'i'], ['ഈ', 'ee'], ['ഉ', 'u'], ['ഊ', 'oo'],
    ['ഋ', 'ri'], ['എ', 'e'], ['ഏ', 'e'], ['ഐ', 'ai'], ['ഒ', 'o'], ['ഓ', 'o'], ['ഔ', 'au'],
  ]),
  matras: mapChars('ാിീുൂൃൄെേൈൊോൌ', [
    'aa', 'i', 'ee', 'u', 'oo', 'ri', 'ri', 'e', 'e', 'ai', 'o', 'o', 'au',
  ]),
  virama: '്',
  marks: { 'ം': 'm', 'ഁ': 'n', 'ഃ': 'h' },
  digits: '൦൧൨൩൪൫൬൭൮൯',
  standalone: { 'ൺ': 'n', 'ൻ': 'n', 'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൿ': 'k' },
  finalViramaVowel: 'u',
};

interface CompiledScript {
  start: number;
  end: number;
  consonantMap: Map<string, string>;
  standaloneMap: Map<string, string>;
  vowelMap: Map<string, string>;
  matraMap: Map<string, string>;
  markMap: Map<string, string>;
  virama: string;
  digits: Map<string, string>;
  dropFinalSchwa: boolean;
  finalViramaVowel: string | null;
}

const ROMAN_CONSONANTS = [
  'k', 'kh', 'g', 'gh', 'ng', 'ch', 'chh', 'j', 'jh', 'n',
  't', 'th', 'd', 'dh', 'n', 't', 'th', 'd', 'dh', 'n',
  'n', 'p', 'ph', 'b', 'bh', 'm', 'y', 'r', 'r', 'l',
  'l', 'l', 'v', 'sh', 'sh', 's', 'h',
];

function compile(base: number, spec: ScriptSpec): CompiledScript {
  const consonantMap = new Map(Object.entries(mapChars(spec.consonants, ROMAN_CONSONANTS)));
  for (const [char, reading] of Object.entries(spec.extras ?? {})) consonantMap.set(char, reading);
  return {
    start: base,
    end: base + 0x7f,
    consonantMap,
    standaloneMap: new Map(Object.entries(spec.standalone ?? {})),
    vowelMap: new Map(Object.entries(spec.vowels)),
    matraMap: new Map(Object.entries(spec.matras)),
    markMap: new Map(Object.entries(spec.marks)),
    virama: spec.virama,
    digits: new Map(
      Array.from(spec.digits).map((char, index) => [char, String(index)] as [string, string]),
    ),
    dropFinalSchwa: spec.dropFinalSchwa ?? false,
    finalViramaVowel: spec.finalViramaVowel ?? null,
  };
}

const SCRIPTS: CompiledScript[] = [
  compile(0x0900, DEVANAGARI),
  compile(0x0980, BENGALI),
  compile(0x0a00, GURMUKHI),
  compile(0x0a80, GUJARATI),
  compile(0x0b00, ODIA),
  compile(0x0b80, TAMIL),
  compile(0x0c00, TELUGU),
  compile(0x0c80, KANNADA),
  compile(0x0d00, MALAYALAM),
];

function scriptFor(char: string): CompiledScript | null {
  const code = char.codePointAt(0);
  if (code === undefined) return null;
  for (const script of SCRIPTS) {
    if (code >= script.start && code <= script.end) return script;
  }
  return null;
}

/** True when the text contains a character from one of the taught scripts. */
export function hasIndicScript(text: string): boolean {
  return Array.from(text).some((char) => scriptFor(char) !== null);
}

const ZERO_WIDTH = /[\u200b-\u200f\u2060\ufeff]/g;

/**
 * Convert taught-script text to a practical Latin reading.
 * Latin text passes through unchanged (apart from whitespace cleanup).
 */
export function romanize(text: string): string {
  return text
    .normalize('NFC')
    .split(/(\s+)/)
    .map((chunk) => (hasIndicScript(chunk) ? romanizeWord(chunk) : chunk))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finish a word reading. Indo-Aryan scripts leave a final inherent "a"
 * unpronounced; Malayalam pronounces a word-final virama with a short "u".
 */
function finishReading(
  raw: string,
  options: { dropFinalSchwa: boolean; addFinalVowel: boolean; finalVowel: string | null },
): string {
  const match = raw.match(/^(.*?)([^\p{L}\p{N}]*)$/u);
  let core = match?.[1] ?? raw;
  const trailing = match?.[2] ?? '';
  if (options.dropFinalSchwa && /[a-z]aa$/i.test(core)) {
    core = core.slice(0, -1);
  } else if (options.dropFinalSchwa && /[a-z]a$/i.test(core)) {
    core = core.slice(0, -1);
  }
  if (options.addFinalVowel && options.finalVowel && /[^aeiou]$/i.test(core)) {
    core += options.finalVowel;
  }
  return `${core}${trailing}`;
}

function romanizeWord(word: string): string {
  const chars = Array.from(word);
  const pieces: string[] = [];
  const script = chars.map((char) => scriptFor(char)).find((value) => value !== null) ?? null;
  const lastScriptChar =
    [...chars].reverse().find((char) => scriptFor(char) !== null) ?? '';
  const addFinalVowel = Boolean(script?.finalViramaVowel) && lastScriptChar === script?.virama;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] ?? '';
    const charScript = scriptFor(char);
    if (!charScript) {
      pieces.push(char);
      continue;
    }

    const digit = charScript.digits.get(char);
    if (digit !== undefined) {
      pieces.push(digit);
      continue;
    }

    const standalone = charScript.standaloneMap.get(char);
    if (standalone !== undefined) {
      pieces.push(standalone);
      continue;
    }

    const consonant = charScript.consonantMap.get(char);
    if (consonant) {
      pieces.push(consonant);
      let lookahead = index + 1;

      // Nukta modifies the consonant; we keep the base reading.
      if (charScript.markMap.get(chars[lookahead] ?? '') === '') lookahead += 1;

      if (chars[lookahead] === charScript.virama) {
        index = lookahead;
        // A zero-width joiner after the virama is part of a conjunct.
        if (chars[index + 1] === '\u200d') index += 1;
        continue;
      }

      const matra = charScript.matraMap.get(chars[lookahead] ?? '');
      if (matra !== undefined) {
        pieces.push(matra);
        index = lookahead;
        continue;
      }

      pieces.push('a');
      // Do not consume a following mark: the outer loop emits it next.
      continue;
    }

    const vowel = charScript.vowelMap.get(char);
    if (vowel !== undefined) {
      pieces.push(vowel);
      continue;
    }

    const matra = charScript.matraMap.get(char);
    if (matra !== undefined) {
      pieces.push(matra);
      continue;
    }

    const mark = charScript.markMap.get(char);
    if (mark !== undefined) {
      // Anusvara assimilates to a following consonant: "rendu", not "remdu";
      // it stays "m" before the labials p/b/m/v.
      let reading = mark;
      if (mark === 'm') {
        const next = chars[index + 1] ?? '';
        const nextConsonant =
          charScript.consonantMap.get(next) ?? charScript.standaloneMap.get(next);
        if (nextConsonant && !/^[pbmv]/.test(nextConsonant)) reading = 'n';
      }
      pieces.push(reading);
      continue;
    }

    if (char === charScript.virama) continue;
  }

  return finishReading(pieces.join('').replace(ZERO_WIDTH, ''), {
    dropFinalSchwa: script?.dropFinalSchwa ?? false,
    addFinalVowel,
    finalVowel: script?.finalViramaVowel ?? null,
  });
}

const VOWEL_COLLAPSE: Array<[RegExp, string]> = [
  [/chh/g, 'ch'],
  [/aa/g, 'a'],
  [/ee/g, 'i'],
  [/ii/g, 'i'],
  [/oo/g, 'u'],
  [/uu/g, 'u'],
  [/sh/g, 's'],
  [/ss/g, 's'],
  [/zh/g, 'l'],
  [/z/g, 'j'],
  [/w/g, 'v'],
  [/ph/g, 'f'],
  [/([bcdfghjklmnpqrstvwxyz])\1+/g, '$1'],
];

/**
 * Common English spellings for words that are taught in a native script.
 * They are folded before comparison so a learner can type the spelling they
 * already know ("station") as well as the reading shown in the hint.
 */
const ROMAN_ALIASES: Array<[RegExp, string]> = [
  [/\bstation\b/g, 'steshan'],
  [/\bschool\b/g, 'skool'],
  [/\bkripya\b/g, 'kripaya'],
  [/\bbehen\b/g, 'bahan'],
  [/\balvida\b/g, 'alavida'],
  [/\bkijiye\b/g, 'kijie'],
  [/\bchai\b/g, 'chay'],
];

/**
 * Compare-friendly romanization. Long/short vowels collapse, common spelling
 * variants are folded, and the final inherent "a" is dropped per word
 * ("dhanyavaada" -> "dhanyavad").
 */
export function normalizeRoman(value: string): string {
  let text = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [pattern, replacement] of ROMAN_ALIASES) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of VOWEL_COLLAPSE) text = text.replace(pattern, replacement);
  return text
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => (word.length > 2 && word.endsWith('a') ? word.slice(0, -1) : word))
    .join(' ');
}

/** Romanized reading of any answer, whether it was typed in script or Latin. */
export function readingOf(value: string): string {
  return normalizeRoman(hasIndicScript(value) ? romanize(value) : value);
}

/** Anusvara, candrabindu and similar nasal marks across the taught scripts. */
const NASAL_MARKS =
  /[\u0901\u0902\u0981\u0982\u0a01\u0a02\u0a81\u0a82\u0b01\u0b02\u0b81\u0b82\u0c00\u0c01\u0c02\u0c80\u0c81\u0c82\u0c83\u0d00\u0d01\u0d02]/;

/** True when two strings are the same word once romanized and folded. */
export function romanizedEqual(a: string, b: string): boolean {
  const left = readingOf(a);
  const right = readingOf(b);
  if (left.length === 0 || right.length === 0) return false;
  if (left === right) return true;
  // Nasalized endings are often typed without the nasal: माँ -> "maa" or
  // "maan", हाँ -> "haa" or "haan". Only relax when the target really has a
  // nasal mark, so ordinary words are not conflated.
  if (NASAL_MARKS.test(a) && left.replace(/[nm]$/, '') === right) return true;
  return false;
}

/** A short, human-friendly hint for a target-language string. */
export function romanHint(value: string): string | null {
  if (!hasIndicScript(value)) return null;
  const reading = romanize(value).replace(/\s+/g, ' ').trim();
  return reading.length > 0 ? reading : null;
}
