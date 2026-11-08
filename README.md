# Crack Time Simulator

Two pages about what actually determines how long a password survives an attack — and what quantum computing does and does not change about that.

**▶ [Try the simulator](https://marco-pianese.github.io/crack-time-simulator/)** · **[Read the explainer](https://marco-pianese.github.io/crack-time-simulator/explainer.html)**

No build step, no backend, no dependencies. Open `index.html` and it works.

---

## What this is, and what it isn't

**A learning project.** I built it to teach myself how password cracking actually works, and what quantum computing genuinely threatens, as the practical exercise for a course on working with AI. I started as a complete beginner on the subject. The test I set for success was whether the finished pages would have explained the topic to the person I was when I began.

**Not a security product.** This is not an audit, it cracks nothing, and no figure here should be used to decide that a particular password is safe. It performs arithmetic on entropy and published benchmark rates — there is no attack code anywhere in it, and nothing you type in it ever leaves your browser.

**Honest about its own limits.** Every number carries a marker showing whether it was measured directly, calculated from a measurement, or merely reported by someone else. Both pages list what they get wrong, and the one claim that is my own reasoning rather than a citation is labelled as such. That seemed more useful than a page that sounds certain about everything.

---

## The two pages

**`index.html` — the simulator.** An instrument, not an essay. Type a password (or build a random one), choose who is attacking it, and see how long it survives against each of the ten ways a website might have stored it. Definitions are tucked into a collapsible glossary so they don't get in the way.

**`explainer.html` — the reading.** How hashing, salting and work factors actually work; the crack-time arithmetic worked through step by step on one password; whether you can discover how a given website stores yours; a real breach where both a good and a bad algorithm appear in the same stolen file; and what quantum computing changes.

## What the simulator shows

Two strength figures side by side:

- **Textbook entropy** — the classic `L × log₂(C)` calculation, which assumes the attacker works through every combination in order.
- **Pattern-aware estimate** — what an attacker actually needs, from [zxcvbn](https://github.com/dropbox/zxcvbn), which matches against dictionaries, breach lists, keyboard walks and the substitutions people really make.

The gap between them is the point. For `Summer2024!` the first figure says 72 bits; the second says far less, because that password is assembled entirely from things that sit in every wordlist.

Then the same password against ten storage algorithms at once, for one of four attackers — a laptop, one graphics card, an eight-card rig, or a thousand-card operation. The spread across that table is roughly eight orders of magnitude, and which end you land on was decided by whichever website you handed the password to.

## Design constraints

**No password is ever stored, logged or transmitted.** Everything is client-side. No analytics, no backend, no request carrying anything you type. The page cannot crack anything — it only counts.

**Every number is sourced and dated.** Figures carry a reliability marker:

| Tag | Meaning |
|---|---|
| `P` | Primary — read directly from raw benchmark output or the text of a standard |
| `D` | Derived — calculated from a `P` figure, with the calculation written down |
| `S` | Secondary — reported by a credible third party, original not yet consulted |

**No invented precision.** The quantum section is an explainer, not a simulator. It generates no quantum crack-time figures, because producing them would mean inventing hardware parameters for machines that do not exist. It reports published resource estimates with their caveats attached, and lists five claims it refuses to make.

**Written for someone starting from nothing.** Every technical term — hash, salt, entropy, H/s, work factor, qubit — is defined with a worked example using real computed values at the point it first appears.

## How the numbers work

Entropy of a randomly generated password:

```
E = L × log₂(C)        keyspace = C^L = 2^E
```

Average time for an exhaustive search at `R` guesses per second:

```
t = 2^E / (2 × R)
```

The division by two is because the password is found halfway through the space on average. The pattern-aware column skips that division — zxcvbn already reports an expected number of guesses rather than a space size. Halving twice is a factor-of-two error and a common one in tools like this.

All arithmetic runs on base-10 exponents rather than the numbers themselves, so a long password does not overflow to `Infinity`.

The explainer recomputes three reference cases on every load, and they are checked against figures worked out by hand during the research. If they ever stop matching, something in the code has broken — a regression test in public view.

## Updating the data

Benchmark figures go stale. **`crack.js` is the only place to change a number.** The `BENCH` object at the top holds every algorithm rate and attacker multiplier, each with its reliability tag and the hardware it was measured on, plus the reference source and date. Both pages read from it.

Current reference: hashcat v6.2.6-851 on an NVIDIA RTX 5090, 10 February 2025. Re-checked 25 October 2026 — still the most recent primary benchmark published. The pages display that date, so the project declares its own age instead of pretending to be current.

## Known limitations

Deliberately not papered over, and repeated in the explainer's footer:

1. **The laptop scenario is an approximation.** It derives from a Ryzen 7 7700X measured on MD5 only. Processors do relatively better against memory-hard functions like Argon2id, so one ratio across all ten rows understates CPU performance at the slow end.
2. **Two rates are unverified.** PBKDF2 and Argon2id are tagged `S` — third-party reports, not yet read from raw benchmark output.
3. **The Grover-versus-passwords argument is the author's reasoning**, not a cited finding. Flagged as such in the explainer. It needs a citation or expert review.
4. **Benchmarks use optimised kernels against a single hash.** Real attacks run against millions of salted hashes at once and behave differently.
5. **The Ashley Madison comparison** comes from contemporary reporting, not a controlled experiment. Treat the ratio as an order of magnitude.
6. **zxcvbn loads from a CDN.** Nothing is sent to it — it is a static script download — but the pattern-aware figure is unavailable offline, and the page says so rather than substituting a guess.

## Repository contents

```
index.html       the simulator
explainer.html   the companion reading
crack.js         benchmark data, arithmetic, formatting — shared by both pages
styles.css       shared visual system, dark with a light switch
```

Four files, no dependencies to install. Everything either page needs is in one of them.

## Running it locally

Clone the repository and open `index.html` in a browser. No server, no install, no build.

## How it was built

The research came first and the code came last. Before any of this existed there were two research notes, where every figure was tracked down to a primary source and tagged by how reliable it was. Only once the numbers were settled did the pages get written, which is why the content drives the design here rather than the reverse.

It was built in collaboration with Claude, which is the point: the project was the practical exercise for a course on describing work to an AI and judging what comes back. The commit history records that collaboration rather than hiding it. Several things in the final version exist because a draft was wrong and got sent back — the quantum section was rebuilt from scratch after a first version turned out to be unreadable for a newcomer, and the original single page was split in two after it became clear the interactive part had disappeared under the explanation.

## Sources

- [hashcat RTX 5090 benchmark](https://gist.github.com/Chick3nman/09bac0775e6393468c2925c1e1363d5c), February 2025
- [hashcat Ryzen 7 7700X benchmark](https://gist.github.com/cococig/2b592488fcbdb8a0301b8c38acaee466), September 2023
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html), Digital Identity Guidelines
- Gidney, [*How to factor 2048 bit RSA integers with less than a million noisy qubits*](https://arxiv.org/abs/2505.15917v1), 2025
- Gidney and Ekerå, [*How to factor 2048-bit RSA integers in 8 hours using 20 million noisy qubits*](https://arxiv.org/abs/1905.09749), 2019
- UK NCSC, [*On the practical cost of Grover for AES key recovery*](https://csrc.nist.gov/csrc/media/Events/2024/fifth-pqc-standardization-conference/documents/papers/on-practical-cost-of-grover.pdf), NIST PQC Conference 2024
- [NIST Post-Quantum Cryptography project](https://csrc.nist.gov/Projects/post-quantum-cryptography/news)
- [WordPress 6.8 password hashing change](https://make.wordpress.org/core/2025/02/17/wordpress-6-8-will-use-bcrypt-for-password-hashing/)
- [Sophos on the Ashley Madison cracking](https://news.sophos.com/en-us/2015/09/10/11-million-ashley-madison-passwords-cracked-in-10-days/)
- [Dropbox on how they store passwords](https://dropbox.tech/security/how-dropbox-securely-stores-your-passwords)
- [Troy Hunt on mandatory disclosure of password storage](https://www.troyhunt.com/should-websites-be-required-to-publicly/)

## Licence

MIT for the code. zxcvbn is MIT-licensed and loaded from a CDN, not bundled here. The sources cited above keep their own terms.
