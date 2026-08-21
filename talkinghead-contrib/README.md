# Upstreaming Twi lip-sync support to TalkingHead

`lipsync-tw.mjs` in this folder is a real implementation of the language
module contract documented in met4citizen/TalkingHead's README (the same
shape as their own `lipsync-fi.mjs`, `lipsync-en.mjs`, `lipsync-lt.mjs`):
a class named `LipsyncXx` with `preProcessText(text)` and
`wordsToVisemes(text)` methods, returning `{ visemes, times, durations }`.

It's been tested standalone (see the project's `CHANGES.md`) and produces
correct Oculus viseme sequences for real Twi sentences. It is **not**
currently used directly by this app - the app's own avatar page
(`components/twiAvatarHtml.js`) has an inlined copy of the same algorithm
(`twiTextToVisemes`) because the app loads TalkingHead straight from a CDN
with no build step, and CDN imports can't reach into a random GitHub repo's
`./modules/` folder. This file exists so the same logic can be offered back
to the upstream project properly, as a first-class language module anyone
using TalkingHead could opt into with `lipsyncModules: ["tw"]` - not just
this FYP.

## Twi is a good phonetically-orthographic candidate

TalkingHead's own README calls out "direct mapping from graphemes to
phonemes to visemes" as the right approach for "languages that have a
consistent one-to-one mapping between individual letters and phonemes" -
that's exactly what they did for Finnish (`lipsync-fi.mjs`, "giving >99.9%
lip-sync accuracy"). Twi fits the same description: its orthography is
fairly regular, so this file follows that same strategy rather than
English's much heavier rule-based approach.

## Steps to actually submit this

1. Fork https://github.com/met4citizen/TalkingHead.
2. Copy this file to `modules/lipsync-tw.mjs` in your fork.
3. In `modules/talkinghead.mjs`, find the `lipsyncModules` handling and add
   `"tw"` alongside the existing supported language codes, following the
   same pattern used for `"fi"`/`"lt"`.
4. Test locally using their `examples/minimal.html` (swap `lipsyncModules`
   to `["tw"]`, `lipsyncLang` to `"tw"`, and try it with real Twi sentences
   through `head.speakText(...)` or by calling
   `new LipsyncTw().wordsToVisemes(text)` directly, as shown in their own
   `SpeakText` issue thread for debugging language modules).
5. Update their README's language table to list Twi.
6. Fill in the `@author` line at the top of `lipsync-tw.mjs` with your name/
   GitHub handle, and check the repository's license terms before opening
   the PR (match whatever license the rest of `modules/` is under).
7. Open a pull request against `met4citizen/TalkingHead` with a short
   description - link to a maternal-health/Twi-language use case (this FYP)
   as the motivation, and mention the accuracy strategy (orthographic
   mapping, same category as Finnish).

## Known limitations to mention in the PR description

- Oculus's 15 viseme categories are coarse; `ɛ`/`e` and `ɔ`/`o` are
  deliberately collapsed onto the same viseme (`E`/`O`) since Oculus doesn't
  distinguish open vs. close-mid vowels.
- Tone is not modelled (Twi is a tonal language; this only handles
  segmental/consonant-vowel structure, same limitation the grapheme-based
  Finnish module has for its own suprasegmental features).
- `h` is mapped to `sil` (minimal visible mouth shape) rather than a
  fricative viseme, which is a simplification.
- This hasn't been validated against a Twi phoneme dictionary the way the
  Finnish module was (their README reports doing that comparison for
  Finnish); doing the same for Twi would strengthen the PR.
