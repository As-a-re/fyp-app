/**
 * Builds the standalone HTML page that hosts the TalkingHead 3D avatar
 * (https://github.com/met4citizen/TalkingHead). It is rendered:
 *   - on web: inside an <iframe srcDoc={...}>
 *   - on native: inside a react-native-webview <WebView source={{ html: ... }}>
 *
 * The host (TwiAIComponent) talks to this page purely via postMessage so the
 * avatar rendering code stays fully decoupled from React Native:
 *
 *   host -> avatar:  { type: "speak", audioBase64, mime, text, words, wtimes, wdurations }
 *   host -> avatar:  { type: "idle" }
 *   avatar -> host:  { type: "ready" }
 *   avatar -> host:  { type: "speaking-start" | "speaking-end" }
 *   avatar -> host:  { type: "error", message }
 *
 * LIP-SYNC: GhanaNLP's Twi TTS returns raw audio only (no phoneme/viseme
 * timestamps), and TalkingHead doesn't ship a built-in Twi lip-sync module
 * (only en/fi/etc). Rather than borrowing the English module's rules on Twi
 * text (which would misread Twi-specific graphemes like ɛ, ɔ, and digraphs
 * such as tw/ky/gy/dz), this page implements a small Twi-specific
 * grapheme-to-viseme engine (twiTextToVisemes below) and feeds the result
 * straight into TalkingHead's documented `visemes/vtimes/vdurations`
 * low-level API — the same mechanism the built-in language modules use
 * internally, just computed here instead of inside the library.
 *
 * Twi is a fairly phonetically regular (orthographic) language — each
 * letter/digraph maps consistently to one sound — so this direct
 * grapheme->viseme approach is the same strategy TalkingHead's own README
 * recommends for orthographic languages (it's what they used for Finnish),
 * rather than the rule-heavy approach needed for English. It won't be
 * perfect (Oculus's 15 viseme categories are coarse, and this doesn't do
 * full phonemic analysis), but it reads Twi's actual letters instead of
 * pretending they're English ones, and timing is scaled to the *real*
 * synthesized audio duration rather than an even per-word guess.
 *
 * This is a good candidate to upstream as an official `lipsync-tw.mjs`
 * module in the TalkingHead repo itself (see CONTRIBUTING notes in their
 * README) — a real, tested implementation of that exact module contract
 * (class LipsyncTw with preProcessText/wordsToVisemes) lives at
 * /talkinghead-contrib/lipsync-tw.mjs in this project, along with a README
 * on how to actually submit it upstream. It's kept as a separate file
 * (rather than imported here) because this page loads TalkingHead from a
 * CDN with no build step, and the logic below is an inlined copy of the
 * same algorithm for that reason.
 */

// IMPORTANT UPDATE: Ready Player Me was acquired by Netflix in December
// 2025 and its entire public platform - the avatar creator, PlayerZero,
// the developer APIs, and the models.readyplayer.me CDN that served avatar
// GLB files by URL - was shut down on January 31, 2026. Any
// models.readyplayer.me URL (including the one previously used here) is
// permanently dead; the domain no longer resolves at all. This is not a
// typo or a stale avatar ID, it's a full platform shutdown - see
// https://github.com/met4citizen/TalkingHead's own README, which now
// documents this and points to alternatives (Avaturn, AvatarSDK/
// MetaPerson, VRoid Studio, or Blender with the MPFB extension).
//
// This project now uses the example avatar GLB file that TalkingHead
// ships directly inside its own GitHub repository (avatars/brunette.glb) -
// independent of Ready Player Me entirely, so it can't be taken down by a
// third party's business decision the way the old URL was. Verified this
// resolves and is a valid, complete GLB file with the required ARKit +
// Oculus viseme blend shapes already baked in (no query-string parameters
// needed, unlike the old RPM API-driven URL).
//
// It's still a Ready-Player-Me-created asset under RPM's original
// CC BY-NC 4.0 non-commercial license (per TalkingHead's own README
// asset-credits section), so it's fine for development/demo/FYP use but
// not for a commercial release - for the shipped app, create your own
// avatar with one of the actively-maintained tools above (e.g. Avaturn is
// free for non-commercial use and TalkingHead-compatible out of the box)
// and swap the URL below, or pass `avatarUrl` as a prop through
// TwiAIComponent -> TwiAvatarView.
const DEFAULT_AVATAR_URL =
  "https://raw.githubusercontent.com/met4citizen/TalkingHead/main/avatars/brunette.glb";

export function buildTalkingHeadHtml({ avatarUrl = DEFAULT_AVATAR_URL } = {}) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }
  #avatar { width: 100%; height: 100%; }
  #status {
    position: absolute; bottom: 8px; left: 0; right: 0; text-align: center;
    font-family: -apple-system, sans-serif; font-size: 12px; color: #94a3b8;
  }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js/+esm",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
    "talkinghead": "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.7/modules/talkinghead.mjs"
  }
}
</script>
</head>
<body>
<div id="avatar"></div>
<div id="status">Loading avatar…</div>
<script type="module">
  import { TalkingHead } from "talkinghead";

  const statusEl = document.getElementById("status");
  const isNative = !!(window.ReactNativeWebView && window.ReactNativeWebView.postMessage);

  function post(msg) {
    if (isNative) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    } else if (window.parent) {
      window.parent.postMessage(msg, "*");
    }
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  // ---------------------------------------------------------------------
  // Twi grapheme -> Oculus viseme engine.
  //
  // Oculus viseme set (what TalkingHead's morph targets are keyed to):
  //   aa, E, I, O, U, PP, FF, TH, DD, kk, CH, SS, nn, RR, sil
  // Reference: https://developer.oculus.com/documentation/unity/audio-ovrlipsync-viseme-reference/
  //
  // relDuration is in the same "relative units" TalkingHead's own language
  // modules use — vowels get more time than consonants, which is what makes
  // the mouth actually look like it's forming syllables instead of just
  // flapping evenly. These get linearly scaled to the real audio duration
  // once we know it (see scaleToAudioDuration below).
  // ---------------------------------------------------------------------
  const TWI_VISEME_TABLE = {
    // Vowels (7-vowel Twi system, incl. open vowels ɛ/ɔ)
    a: { viseme: "aa", dur: 1.0 },
    e: { viseme: "E", dur: 0.9 },
    "ɛ": { viseme: "E", dur: 1.0 },
    i: { viseme: "I", dur: 0.8 },
    o: { viseme: "O", dur: 0.9 },
    "ɔ": { viseme: "O", dur: 1.0 },
    u: { viseme: "U", dur: 0.8 },
    // Digraphs / labialized & palatalized consonants (checked before
    // single letters — see longest-match tokenizer below)
    tw: { viseme: "DD", dur: 0.55 },
    dw: { viseme: "DD", dur: 0.55 },
    kw: { viseme: "kk", dur: 0.55 },
    gw: { viseme: "kk", dur: 0.55 },
    hw: { viseme: "FF", dur: 0.45 },
    nw: { viseme: "nn", dur: 0.5 },
    ky: { viseme: "CH", dur: 0.55 },
    gy: { viseme: "CH", dur: 0.55 },
    ny: { viseme: "nn", dur: 0.5 },
    dz: { viseme: "CH", dur: 0.5 },
    ts: { viseme: "CH", dur: 0.5 },
    // Single consonants
    b: { viseme: "PP", dur: 0.45 },
    p: { viseme: "PP", dur: 0.45 },
    m: { viseme: "PP", dur: 0.5 },
    f: { viseme: "FF", dur: 0.45 },
    v: { viseme: "FF", dur: 0.45 },
    w: { viseme: "U", dur: 0.35 },
    t: { viseme: "DD", dur: 0.4 },
    d: { viseme: "DD", dur: 0.4 },
    n: { viseme: "nn", dur: 0.45 },
    "ŋ": { viseme: "kk", dur: 0.45 },
    k: { viseme: "kk", dur: 0.45 },
    g: { viseme: "kk", dur: 0.45 },
    s: { viseme: "SS", dur: 0.45 },
    z: { viseme: "SS", dur: 0.45 },
    h: { viseme: "sil", dur: 0.2 },
    l: { viseme: "RR", dur: 0.4 },
    r: { viseme: "RR", dur: 0.4 },
    y: { viseme: "I", dur: 0.35 },
  };

  const TWI_DIGRAPHS = ["dz", "ts", "ky", "gy", "ny", "tw", "dw", "kw", "gw", "hw", "nw"];
  const WORD_GAP_REL = 0.28;

  function stripCombiningMarks(word) {
    // Nasalization tildes etc. don't change mouth shape for our purposes.
    return word.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  }

  // Equivalent to a TalkingHead language module's wordsToVisemes(): turns
  // raw text into { visemes, times, durations } in relative units.
  function twiTextToVisemes(text) {
    const words = String(text || "")
      .trim()
      .split(/\\s+/)
      .filter(Boolean);

    const visemes = [];
    const times = [];
    const durations = [];
    let t = 0;

    words.forEach((rawWord, wordIndex) => {
      const word = stripCombiningMarks(rawWord.toLowerCase()).replace(/[^a-zɛɔŋ]/g, "");
      let i = 0;
      while (i < word.length) {
        const digraph = TWI_DIGRAPHS.find((d) => word.startsWith(d, i));
        const grapheme = digraph || word[i];
        const entry = TWI_VISEME_TABLE[grapheme];
        if (entry) {
          visemes.push(entry.viseme);
          times.push(t);
          durations.push(entry.dur);
          t += entry.dur;
        }
        i += grapheme.length;
      }

      if (wordIndex < words.length - 1) {
        visemes.push("sil");
        times.push(t);
        durations.push(WORD_GAP_REL);
        t += WORD_GAP_REL;
      }
    });

    return { visemes, times, durations, totalRelative: t || 1 };
  }

  // Scale the relative-unit timeline onto the real decoded audio duration,
  // so mouth movement actually matches how long GhanaNLP's TTS took to say
  // the sentence instead of a generic guess.
  function scaleToAudioDuration(lipsync, audioDurationMs) {
    const scale = lipsync.totalRelative > 0 ? audioDurationMs / lipsync.totalRelative : 1;
    return {
      visemes: lipsync.visemes,
      vtimes: lipsync.times.map((t) => t * scale),
      vdurations: lipsync.durations.map((d) => Math.max(20, d * scale)),
    };
  }

  let head;
  let avatarLoaded = false;

  async function init() {
    try {
      head = new TalkingHead(document.getElementById("avatar"), {
        ttsEndpoint: null,
        cameraView: "upper",
        cameraRotateEnable: false,
        cameraPanEnable: false,
        cameraZoomEnable: false,
      });

      await head.showAvatar(
        {
          url: ${JSON.stringify(avatarUrl)},
          body: "F",
          avatarMood: "neutral",
        },
        (progress) => setStatus("Loading avatar… " + Math.round((progress?.loaded / (progress?.total || 1)) * 100) + "%"),
      );

      avatarLoaded = true;
      setStatus("");
      post({ type: "ready" });
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      setStatus("Avatar failed to load: " + message);
      post({ type: "error", message: "Failed to load avatar from " + ${JSON.stringify(avatarUrl)} + " — " + message });
    }
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  async function speak(payload) {
    if (!head || !avatarLoaded) {
      post({ type: "error", message: "Avatar isn't loaded yet, can't speak." });
      return;
    }
    try {
      const arrayBuffer = base64ToArrayBuffer(payload.audioBase64);
      const audioBuffer = await head.audioCtx.decodeAudioData(arrayBuffer);

      post({ type: "speaking-start" });

      const text = payload.text || (payload.words || []).join(" ");
      const rawLipsync = twiTextToVisemes(text);
      const { visemes, vtimes, vdurations } = scaleToAudioDuration(
        rawLipsync,
        audioBuffer.duration * 1000,
      );

      head.speakAudio(
        {
          audio: audioBuffer,
          words: payload.words || [],
          wtimes: payload.wtimes || [],
          wdurations: payload.wdurations || [],
          visemes,
          vtimes,
          vdurations,
        },
        {},
        () => {},
      );

      const durationMs = Math.max(500, audioBuffer.duration * 1000);
      setTimeout(() => post({ type: "speaking-end" }), durationMs);
    } catch (error) {
      post({ type: "error", message: String(error && error.message ? error.message : error) });
    }
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "speak") speak(data);
    if (data.type === "idle" && head) head.stopSpeaking?.();
  });

  // Native WebView delivers messages via document, not window, on some platforms.
  document.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "speak") speak(data);
      if (data.type === "idle" && head) head.stopSpeaking?.();
    } catch {
      // ignore non-JSON native events
    }
  });

  init();
</script>
</body>
</html>`;
}

export { DEFAULT_AVATAR_URL };
