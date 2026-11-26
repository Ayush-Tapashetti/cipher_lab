# 01 Problem & Guardrails

## Problem
A first-year discrete-math student (and the faculty evaluating them) needs to *see* how modular arithmetic encrypts text and how letter-frequency statistics break it, because textbook cipher exercises are static and hide the math, so the app encrypts and decrypts with Caesar, affine and substitution ciphers live, shows every step as arithmetic in Z26, and cracks a sample ciphertext by frequency analysis, producing the recovered plaintext, the recovered key and the reasoning behind it.

## Core journey
1. Type or paste plaintext, pick a cipher and a key, and watch the ciphertext update live with each letter's modular arithmetic shown.
2. Paste (or load the bundled sample) ciphertext and see its letter-frequency histogram next to the English reference.
3. Run the break: get ranked key candidates, the recovered plaintext and an explanation of why that key won.

## Personas & deployment
- p1: Student presenter, first-year CS/AI, learning modular arithmetic; uses the app while building and demoing the project and to capture screenshots for the report.
- p2: Evaluator (faculty), comfortable with discrete math, short on time; uses the app during a demo to check that the math is correct and visible, not hidden behind a black box.
- Deployment: desktop-web

## Deterministic vs model
| Capability | Owner (code / model) | Fallback if model fails |
|---|---|---|
| Caesar / affine / substitution encrypt and decrypt (modular arithmetic) | code | n/a |
| Key validation (shift range, gcd(a,26)=1, substitution is a permutation) | code | n/a |
| Modular inverse of a mod 26 | code | n/a |
| Letter counts, relative frequencies, index of coincidence | code | n/a |
| Chi-squared scoring of candidate keys against English frequencies | code | n/a |
| Ranking candidates and picking the best key | code | n/a |
| Step-by-step math trace and key-space counts | code | n/a |

Nothing is model-backed. The whole product is deterministic, so a wrong answer is always a bug. `model_backed` is false.

## Hard limits
- [hard] Deliverable is a website (project requirement).
- [hard] Cipher operations are expressed as modular arithmetic on Z26 (A=0 ... Z=25); the math must be visible in the UI, since the report is graded on the discrete-math content.
- [hard] Correctness: decrypt(encrypt(m, k), k) = m for every valid key, and invalid keys are rejected with a reason, never silently accepted.
- [hard] User text is processed without leaving the browser session or being stored (no accounts, no persistence, no third-party calls).
- [hard] Non-letters (spaces, digits, punctuation) pass through unchanged and letter case is preserved.
- [soft] Interactive response under 100 ms for texts up to 5,000 characters.
- [soft] Free static or single-container hosting; no paid services.
- [soft] English-only frequency reference.
- [soft] Containers allowed (Docker) but not required.

## Signals
| Signal | Value | Why |
|---|---|---|
| heavy_interactivity | true | The product is the interaction: live cipher wheel, alphabet mapping, frequency histograms that realign as the guessed key changes |
| realtime_required | false | No multi-user or streaming; everything is local compute |
| offline_first | false | Runs fine offline in principle, but offline support is not a stated need |
| visual_polish | high | Demo and screenshots go into a graded report; distinctive look is a stated preference |
| multi_user | false | Single user per session |
| needs_identity | false | No accounts, no private data |
| seo_required | false | Course project, nobody needs to find it through search; stays noindex |
| containers_allowed | true | No restriction stated |

## Assumptions
- Scope covers Caesar, affine (as the natural modular-arithmetic generalisation) and simple monoalphabetic substitution; automated breaking targets Caesar and affine, with substitution cracking assisted by frequency ranks.
- Alphabet is the 26 English letters.
- A short sample ciphertext (English, Caesar-shifted) is bundled for the break demo.
- No backend persistence; whether a thin backend exists at all is a Step 4 decision (the pure cipher core may live fully client-side).
- Group details (names, numbers, faculty) belong in the report cover page, not in the app.
