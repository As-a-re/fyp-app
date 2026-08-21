/**
* @class Twi language module for lip-sync
* @author [your name / GitHub handle here before submitting the PR]
*
* Twi (Akan) is, like Finnish, a phonetically orthographic language: each
* letter or digraph maps consistently to one sound, so - as with
* lipsync-fi.mjs - a direct grapheme-to-phoneme-to-viseme mapping works well
* here without needing English's rule-heavy approach or a phoneme
* dictionary. This mirrors the structure of lipsync-fi.mjs and
* lipsync-en.mjs so it can be dropped straight into ./modules/lipsync-tw.mjs
* and added to the `lipsyncModules` option.
*/

class LipsyncTw {

  /**
  * @constructor
  */
  constructor() {

    // Twi vowels (7-vowel system, including the open vowels ɛ/ɔ) and
    // consonants/digraphs mapped to Oculus viseme IDs, with relative
    // duration weights (vowels get more time than consonants/glides).
    // Reference for the Oculus viseme set:
    // https://developer.oculus.com/documentation/unity/audio-ovrlipsync-viseme-reference/
    this.visemes = {
      // Vowels
      'a': 'aa', 'e': 'E', 'ɛ': 'E', 'i': 'I', 'o': 'O', 'ɔ': 'O', 'u': 'U',
      // Digraphs (checked first via longest-match, see wordsToVisemes)
      'tw': 'DD', 'dw': 'DD', 'kw': 'kk', 'gw': 'kk', 'hw': 'FF', 'nw': 'nn',
      'ky': 'CH', 'gy': 'CH', 'ny': 'nn', 'dz': 'CH', 'ts': 'CH',
      // Single consonants
      'b': 'PP', 'p': 'PP', 'm': 'PP', 'f': 'FF', 'v': 'FF', 'w': 'U',
      't': 'DD', 'd': 'DD', 'n': 'nn', 'ŋ': 'kk', 'k': 'kk', 'g': 'kk',
      's': 'SS', 'z': 'SS', 'h': 'sil', 'l': 'RR', 'r': 'RR', 'y': 'I'
    };

    this.visemeDurations = {
      'aa': 1.0, 'E': 0.9, 'I': 0.8, 'O': 0.9, 'U': 0.8,
      'DD': 0.45, 'kk': 0.45, 'FF': 0.45, 'nn': 0.45, 'CH': 0.55,
      'PP': 0.45, 'SS': 0.45, 'RR': 0.4, 'sil': 0.2
    };

    // Multi-character graphemes, longest first, checked before falling
    // back to a single character.
    this.digraphs = ['dz', 'ts', 'ky', 'gy', 'ny', 'tw', 'dw', 'kw', 'gw', 'hw', 'nw'];

    this.wordGapDuration = 0.28; // relative units, silence between words
  }

  /**
  * Preprocess text:
  * - strip combining diacritics (e.g. nasalization tildes on vowels),
  *   which don't change the mouth shape enough to matter for lip-sync
  * - collapse whitespace
  * @param {string} s Text
  * @return {string} Pre-processed text.
  */
  preProcessText(s) {
    return s
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
  * Convert words to Oculus visemes and durations.
  * @param {string} w Words
  * @return {Object} Oculus visemes and durations.
  */
  wordsToVisemes(w) {
    const words = this.preProcessText(w).split(' ').filter(Boolean);

    const o = { words: w, visemes: [], times: [], durations: [] };
    let t = 0;

    words.forEach((word, wordIndex) => {
      const lower = word.toLowerCase().replace(/[^a-zɛɔŋ]/g, '');
      let i = 0;

      while (i < lower.length) {
        const digraph = this.digraphs.find(d => lower.startsWith(d, i));
        const grapheme = digraph || lower[i];
        const viseme = this.visemes[grapheme];

        if (viseme) {
          const duration = this.visemeDurations[viseme] || 0.4;
          o.visemes.push(viseme);
          o.times.push(t);
          o.durations.push(duration);
          t += duration;
        }

        i += grapheme.length;
      }

      if (wordIndex < words.length - 1) {
        o.visemes.push('sil');
        o.times.push(t);
        o.durations.push(this.wordGapDuration);
        t += this.wordGapDuration;
      }
    });

    return o;
  }

}

export { LipsyncTw };
