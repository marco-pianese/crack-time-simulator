/* ──────────────────────────────────────────────────────────────
   crack.js — the single source of truth for every figure used by
   either page, plus the arithmetic and the formatting.

   Benchmark data goes stale. When it needs refreshing, this file
   is the only place to change a number. Each entry carries its
   reliability tag and the hardware it was measured on:

     P  measured directly from raw benchmark output or a standard
     D  derived by calculation from a P figure
     S  reported by a credible third party, not verified at source

   All time arithmetic happens on base-10 exponents rather than on
   the numbers themselves, so a long password does not overflow to
   Infinity.
   ────────────────────────────────────────────────────────────── */

(function (root) {
  "use strict";

  var LOG10_2 = Math.log10(2);
  var SECONDS_PER_YEAR = 31557600;
  var LOG10_YEAR = Math.log10(SECONDS_PER_YEAR);

  /* ── reference data ─────────────────────────────────────── */

  var BENCH = {
    reference: "NVIDIA GeForce RTX 5090, single card",
    source: "hashcat v6.2.6-851 benchmark, 10 February 2025",
    sourceUrl: "https://gist.github.com/Chick3nman/09bac0775e6393468c2925c1e1363d5c",
    rechecked: "2026-10-25",

    algorithms: [
      { id: "ntlm", name: "NTLM", rate: 3.401e11, tag: "P", group: "fast",
        params: "How Windows stores login passwords. Fast, no salt." },
      { id: "md5", name: "MD5", rate: 2.206e11, tag: "P", group: "fast",
        params: "A 1990s fingerprint function. Fast, no salt, still found in old databases." },
      { id: "sha1", name: "SHA-1", rate: 7.02e10, tag: "P", group: "fast",
        params: "MD5's successor. Also built for speed, also wrong for passwords." },
      { id: "sha256", name: "SHA-256", rate: 2.84e10, tag: "P", group: "fast",
        params: "Modern and sound as a fingerprint — but speed is the problem here." },
      { id: "sha512", name: "SHA-512", rate: 1.00e10, tag: "P", group: "fast",
        params: "Longer output, same mistake if used for passwords." },
      { id: "sha512crypt", name: "sha512crypt", rate: 1.4798e6, tag: "P", group: "slow",
        params: "Repeats SHA-512 five thousand times. Common on Linux systems." },
      { id: "pbkdf2", name: "PBKDF2-SHA256", rate: 3.6e4, tag: "S", group: "slow",
        params: "Repeats the work 310,000 times. The default in many web frameworks." },
      { id: "bcrypt", name: "bcrypt", rate: 9.5e3, tag: "D", group: "slow",
        params: "Deliberately slow and awkward for graphics cards. OWASP's legacy minimum, cost 10." },
      { id: "scrypt", name: "scrypt", rate: 7.76e3, tag: "P", group: "slow",
        params: "Slow and memory-hungry, which graphics cards hate." },
      { id: "argon2id", name: "Argon2id", rate: 2.2e3, tag: "S", group: "slow",
        params: "Won the 2015 password hashing competition. Today's first choice." }
    ],

    attackers: [
      { id: "laptop", name: "An ordinary laptop", factor: 0.0147, tag: "D",
        plain: "Someone with no special equipment, using the computer they already own.",
        note: "Scaled from a Ryzen 7 7700X measured at 3,257.7 MH/s on MD5 — about 68× slower than the reference card. Measured on MD5 only, so it understates what a processor manages against the memory-hungry algorithms lower down the table." },
      { id: "gpu1", name: "One high-end graphics card", factor: 1, tag: "P",
        plain: "A hobbyist or a lone attacker. An RTX 5090 costs roughly €2,000 and sits in a normal desktop.",
        note: "This is the reference benchmark, measured directly on the hardware." },
      { id: "rig8", name: "An eight-card rig", factor: 8, tag: "D",
        plain: "A dedicated setup, the sort a security firm or an organised group builds. Around €20,000.",
        note: "Fast hash types scale close to linearly across cards, so eight cards is treated as eight times one." },
      { id: "farm", name: "A thousand-card operation", factor: 1000, tag: "D",
        plain: "A criminal enterprise or a rented cloud fleet. Expensive, but nothing exotic — this can be rented by the hour.",
        note: "Illustrative scale rather than a measured deployment, included to show that firepower is something an attacker simply buys." }
    ]
  };

  function algo(id) {
    for (var i = 0; i < BENCH.algorithms.length; i++) if (BENCH.algorithms[i].id === id) return BENCH.algorithms[i];
    return null;
  }
  function attacker(id) {
    for (var i = 0; i < BENCH.attackers.length; i++) if (BENCH.attackers[i].id === id) return BENCH.attackers[i];
    return null;
  }

  /* ── number formatting ──────────────────────────────────── */

  function fmtNum(v) {
    if (v >= 100) return Math.round(v).toLocaleString("en-US");
    if (v >= 10) return v.toFixed(0);
    return v.toFixed(1).replace(/\.0$/, "");
  }

  function fmtCount(n) {
    if (n >= 1e12) return fmtNum(n / 1e12) + " trillion";
    if (n >= 1e9) return fmtNum(n / 1e9) + " billion";
    if (n >= 1e6) return fmtNum(n / 1e6) + " million";
    if (n >= 1e3) return fmtNum(n / 1e3) + " thousand";
    return fmtNum(n);
  }

  function fmtRate(r) {
    if (r >= 1e12) return fmtNum(r / 1e12) + " TH/s";
    if (r >= 1e9) return fmtNum(r / 1e9) + " GH/s";
    if (r >= 1e6) return fmtNum(r / 1e6) + " MH/s";
    if (r >= 1e3) return fmtNum(r / 1e3) + " kH/s";
    return fmtNum(r) + " H/s";
  }

  /* Takes log10 of a duration in seconds. */
  function fmtTime(L10) {
    if (!isFinite(L10)) return "—";
    if (L10 < -0.3) return "instantly";
    if (L10 < 1.78) return fmtNum(Math.pow(10, L10)) + " seconds";
    if (L10 < 3.56) return fmtNum(Math.pow(10, L10 - 1.7782)) + " minutes";
    if (L10 < 4.94) return fmtNum(Math.pow(10, L10 - 3.5563)) + " hours";
    if (L10 < 6.41) return fmtNum(Math.pow(10, L10 - 4.9365)) + " days";
    if (L10 < LOG10_YEAR) return fmtNum(Math.pow(10, L10 - 6.4133)) + " months";
    var y = L10 - LOG10_YEAR;
    if (y < 3) return fmtNum(Math.pow(10, y)) + " years";
    if (y < 6) return fmtNum(Math.pow(10, y - 3)) + " thousand years";
    if (y < 9) return fmtNum(Math.pow(10, y - 6)) + " million years";
    if (y < 12) return fmtNum(Math.pow(10, y - 9)) + " billion years";
    if (y < 15) return fmtNum(Math.pow(10, y - 12)) + " trillion years";
    return "10^" + Math.round(y) + " years";
  }

  var ANCHORS = [
    { t: 0.1, label: "a blink" },
    { t: 25, label: "pulling an espresso" },
    { t: 180, label: "boiling a kettle" },
    { t: 7200, label: "a feature film" },
    { t: 28800, label: "a night's sleep" },
    { t: 1209600, label: "a fortnight" },
    { t: 3.156e7, label: "a year" },
    { t: 2.52e9, label: "a human lifetime" },
    { t: 1.45e11, label: "the time since the Great Pyramid was built" },
    { t: 9.47e12, label: "the time since our species first appeared" },
    { t: 2.08e15, label: "the time since the last dinosaurs died" },
    { t: 4.35e17, label: "the age of the universe" }
  ];

  function comparison(L10) {
    if (!isFinite(L10)) return "";
    if (L10 < Math.log10(ANCHORS[0].t)) return "Faster than a blink.";
    var pick = ANCHORS[0];
    for (var i = 0; i < ANCHORS.length; i++) if (Math.log10(ANCHORS[i].t) <= L10) pick = ANCHORS[i];
    var rl = L10 - Math.log10(pick.t);
    if (rl < 0.3) return "About as long as " + pick.label + ".";
    var r = Math.pow(10, rl);
    return "Roughly " + (r >= 1e6 ? "10^" + Math.round(rl) : fmtNum(r)) + " times longer than " + pick.label + ".";
  }

  /* 1 = falls at once … 5 = holds */
  function severity(L10) {
    if (!isFinite(L10)) return 3;
    if (L10 < 3.56) return 1;      // under an hour
    if (L10 < 6.41) return 2;      // under a month
    if (L10 < 9.5) return 3;       // under a century
    if (L10 < 13.5) return 4;      // under a million years
    return 5;
  }

  /* ── entropy and crack time ─────────────────────────────── */

  function charsetOf(pw) {
    var size = 0, parts = [];
    if (/[a-z]/.test(pw)) { size += 26; parts.push("lowercase"); }
    if (/[A-Z]/.test(pw)) { size += 26; parts.push("uppercase"); }
    if (/[0-9]/.test(pw)) { size += 10; parts.push("digits"); }
    if (/[ -\/:-@\[-`{-~]/.test(pw)) { size += 33; parts.push("symbols"); }
    if (/[^\x20-\x7E]/.test(pw)) { size += 100; parts.push("non-ASCII, approximated"); }
    return { size: size, parts: parts };
  }

  function theoryBits(pw) {
    var cs = charsetOf(pw);
    return (pw.length && cs.size) ? pw.length * Math.log2(cs.size) : 0;
  }

  /* log10 of the guesses an exhaustive search expects: half the keyspace */
  function guessesLog10FromBits(bits) {
    return bits * LOG10_2 - LOG10_2;
  }

  /* log10 of seconds to crack */
  function crackLog10(guessesLog10, rate, factor) {
    return guessesLog10 - Math.log10(rate * (factor === undefined ? 1 : factor));
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── theme switch, shared by both pages ─────────────────── */

  function initTheme(buttonId) {
    var btn = document.getElementById(buttonId);
    function apply(t) {
      if (t === "light") document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
      if (btn) btn.textContent = t === "light" ? "Dark mode" : "Light mode";
    }
    var saved = null;
    try { saved = localStorage.getItem("pqe-theme"); } catch (e) {}
    apply(saved === "light" ? "light" : "dark");
    if (btn) btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      apply(next);
      try { localStorage.setItem("pqe-theme", next); } catch (e) {}
    });
  }

  /* The three reference cases from the research notes. If these ever stop
     matching the notes, the arithmetic above has broken. */
  var REFERENCE_CASES = [
    { label: "8 characters, every symbol on the keyboard", length: 8, charset: 94 },
    { label: "12 characters, lowercase and digits", length: 12, charset: 36 },
    { label: "16 characters, lowercase only", length: 16, charset: 26 }
  ];

  root.CRACK = {
    BENCH: BENCH,
    REFERENCE_CASES: REFERENCE_CASES,
    LOG10_2: LOG10_2,
    SECONDS_PER_YEAR: SECONDS_PER_YEAR,
    algo: algo,
    attacker: attacker,
    fmtNum: fmtNum,
    fmtCount: fmtCount,
    fmtRate: fmtRate,
    fmtTime: fmtTime,
    comparison: comparison,
    severity: severity,
    charsetOf: charsetOf,
    theoryBits: theoryBits,
    guessesLog10FromBits: guessesLog10FromBits,
    crackLog10: crackLog10,
    esc: esc,
    initTheme: initTheme
  };
})(window);
