# 07 Verification

Client-only build, so the API, database and model checks of the standard Step 7 are replaced as follows.

| Standard sub-gate | What it means here |
|---|---|
| 07a types | `tsc --noEmit` for the engine and the frontend (strict) |
| 07b lint | ESLint with `jsx-a11y`, and Prettier check |
| 07c tests | Vitest for the engine (91 tests) and the frontend (19 tests), with `fetch` stubbed to throw |
| 07d schema | Not applicable: no database |
| 07e contract | `scripts/verify-contract.mjs`: every function in `domain.json` is exported by the engine, error codes exist, the frontend imports only the engine's package root, the engine has no runtime dependencies |
| 07f build | Production build, 300 KB gzip budget, vendor audit, and the browser walkthrough with axe |
| 07g evals and leaks | Seeded break eval, plus `scripts/verify-privacy.mjs` (no network or storage APIs, engine purity, no external hosts) |
| 07h SEO | `stack.seo.mode` is `none`, so the audit checks the default: noindex, robots disallow, no sitemap |

Run everything with `PLAYWRIGHT_MODULE=<path to playwright index.mjs> node scripts/run-verification.mjs && node scripts/gate-07.mjs` (the variable is needed only if Playwright is not importable as `playwright`).

## P0 acceptance matrix

| Check (from `features.json`) | Unit or property test | Browser check (`scripts/e2e.mjs`) | Status |
|---|---|---|---|
| FEAT-001 shift 3 turns HELLO into KHOOR and back | `ciphers.spec` "E(x) = (x + 3) mod 26 turns HELLO into KHOOR and back" | "HELLO with shift 3 gives KHOOR", "decrypting KHOOR…gives HELLO" | pass |
| FEAT-001 affine 5,8 turns AFFINE CIPHER into IHHWVC SWFRCP | `ciphers.spec` "a=5, b=8 turns AFFINE CIPHER into IHHWVC SWFRCP" | "affine 5,8 gives IHHWVC SWFRCP" | pass |
| FEAT-001 gcd(a,26)≠1 rejected with a reason | `ciphers.spec` "rejects every multiplier with gcd(a, 26) != 1 and names the gcd" | "a=2 is rejected with a gcd reason" | pass |
| FEAT-001 D(E(m)) = m for all 26 shifts and 312 affine keys | `ciphers.spec` "every one of the 26 Caesar keys and 312 affine keys round-trips arbitrary text"; `attack-stats.spec` exhaustive check 26/26, 312/312 | "exhaustive checks 375/375" | pass |
| FEAT-002 repeated or missing letter rejected, duplicate named | `ciphers.spec` "rejects a key with a repeated or missing letter and names them" | "repeated and missing letters are named" | pass |
| FEAT-002 decrypt(encrypt(m)) = m for random permutations | `ciphers.spec` property: inverse of the inverse, decrypt(encrypt(m)) = m | n/a | pass |
| FEAT-002 case and non-letters preserved | `ciphers.spec` "encrypt keeps length, case and every non-letter in place" | "case, spaces, digits and punctuation preserved" | pass |
| FEAT-003 AAB gives A=2, B=1 | `frequency.spec` "AAB gives A=2, B=1 and zeros elsewhere" | "AAB gives A 66.67% and B 33.33%" | pass |
| FEAT-003 frequencies sum to 1 within 1e-9; non-letters ignored | `frequency.spec` "sums to 1 within 1e-9", "is case-insensitive and ignores non-letters" | n/a | pass |
| FEAT-003 empty input is a clear empty state, not NaN | `frequency.spec` "returns zeros, never NaN, for empty input" | "empty input shows an empty state, not NaN" | pass |
| FEAT-004 sample: top candidate is the true key, plaintext equals original | `breaker.spec` "ranks the true Caesar key first and recovers the plaintext"; `cipherStore.spec` "break on the sample ranks the true Caesar key first" | "sample break: top-ranked key is k = 11", "recovered plaintext starts with the original" | pass |
| FEAT-004 candidates sorted by ascending chi-squared | `breaker.spec` "is sorted by ascending chi-squared with ranks 1..26" | n/a | pass |
| FEAT-004 under 20 letters gives a low-confidence warning | `breaker.spec` "is low under 20 letters whatever the scores"; eval: all 20 wrong short-text answers flagged low | "short ciphertext shows low confidence" | pass |
| FEAT-005 trace rows reproduce the cipher output | `ciphers.spec` property: the trace reproduces the cipher output for every key type and direction | "trace outputs equal the cipher output" (the pane also checks this live) | pass |
| FEAT-005 inverse table lists 12 units with a·a⁻¹ = 1 | `algebra.spec` "are the 12 numbers coprime to 26", "…every unit has an inverse"; `modular.spec` "5 · 21 ≡ 1 (mod 26)" | "inverse table lists 12 units" | pass |
| FEAT-005 key-space counts 26, 312, 26! | `algebra.spec` "is 26, 312 and exactly 26!" | "key space shows 26, 312 and 26!" | pass |

## Differentiators

| ID | Proof | Status |
|---|---|---|
| DIFF-001 proof steps | `ciphers.spec` trace tests; Trace pane with live consistency check; browser check above | pass |
| DIFF-002 self-verification | `attack-stats.spec` "reports the headline counts 26/26, 312/312, 12/12 and 14/14" and "would notice a broken cipher"; browser "exhaustive checks 375/375"; mutation test run in Step 5B (6 tests failed on a sign flip, as they should) | pass |
| DIFF-003 explainable break | `breaker.spec`; eval v1 (40/40); browser: ranked table, selection, recovered text | pass |
| DIFF-004 group explorer | `algebra.spec` "multiplicative orders divide 12 (Lagrange) and the group is cyclic with 4 generators"; browser "generators 7, 11, 15, 19" | pass |
| DIFF-005 known-plaintext attack | `attack-stats.spec` "recovers a=5, b=8 from A→I and F→H", "returns several solutions when gcd(x1 - x2, 26) > 1"; browser "known-plaintext panel recovers a key" | pass |
| DIFF-006 unicity and success curve | `attack-stats.spec` "is reproducible for the same seed", "rises with ciphertext length"; browser "success curve renders with a text table" | pass |

## Other checks

| Area | Evidence |
|---|---|
| Wheel geometry and drag | `wheelGeometry.spec` (6 tests); keyboard check in the browser run; screenshot `reports/ui-wheel.png` |
| Store and candidate state machine | `cipherStore.spec` (9 tests), `breaker.spec` transition tests |
| Accessibility | axe-core on 8 views (5 workspace panes, Math Lab, Verify, 404): 0 violations, `reports/axe-report.json` |
| Console errors | None across the whole walkthrough. This check found the bar-height overshoot bug (fixed) |
| Privacy | No `fetch`, XHR, WebSocket, beacon or storage API in the source. Engine has no network or clock access. Built files mention only `react.dev`, `reactrouter.com`, `www.w3.org` (XML namespace) and a `localhost` base URL used by the router for parsing |
| Bundle | Initial JS 212.6 KB gzip against a 300 KB budget |
| Break eval v1 | 40 of 40 on 120-letter texts (threshold 0.95). 12-letter texts: 50% recovered, and every wrong answer is flagged low confidence. Mean break time about 1.4 ms. `reports/eval-report.json` |

## Not verified or not applicable

| Item | Why |
|---|---|
| 07d database | No database |
| Model fallback, PII masking before egress | No model and no third party: nothing leaves the tab (checked by `verify-privacy`) |
| Real-device and Safari/Firefox runs | Only Chromium was available. Run the same `scripts/e2e.mjs` against other browsers when needed |
| Screen-reader listening test | axe covers the rules a tool can check. The wheel's `aria-live` readout and slider semantics have not been tried with a real screen reader |
| Docker run and nginx headers | Step 8: see `08-docker.md` (stand-in check passed; real container run not verified here) |
| SEO checklist rows 19 and 20 (Search Console, backlinks) | Not applicable: the app is deliberately noindex |

## Known limits

- The Break histogram bars animate by changing height, not by the wrapped-copy slide in the original design.
- Break appears only in focus mode, not in the tile layout.
- Frontend tests run in Node, without a DOM. Component behaviour is covered by the browser walkthrough instead.
