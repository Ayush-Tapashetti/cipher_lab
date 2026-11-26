# 02 Scope

## P0 (max 5 product features)
| ID | Feature | Persona | Acceptance check | Interactivity |
|---|---|---|---|---|
| FEAT-001 | Caesar and affine cipher with live cipher wheel | p1 | E(x)=(x+3) mod 26 turns HELLO into KHOOR and back; affine a=5,b=8 turns AFFINE CIPHER into IHHWVC SWFRCP; gcd(a,26)!=1 rejected; D(E(m))=m for all 26 shifts and 312 affine keys | high |
| FEAT-002 | Simple substitution cipher with permutation key editor | p1 | Key with repeated or missing letter rejected and named; round trip holds for a random permutation; case and non-letters preserved | high |
| FEAT-003 | Letter-frequency analysis | p1 | AAB gives A=2, B=1; frequencies sum to 1; non-letters ignored; empty input handled without NaN | high |
| FEAT-004 | Automated break by frequency analysis | p2 | Bundled Caesar sample: top-ranked candidate is the true key and plaintext matches; sorted by ascending chi-squared; under 20 letters gives low-confidence warning | experimental |
| FEAT-005 | Math Lab: step-by-step modular arithmetic trace | p2 | Trace reproduces cipher output for every letter; 12 units mod 26 with inverses; key-space counts 26, 312, 26! shown | high |

## P1 (deferred)
- Assisted substitution break (frequency-rank mapping plus manual swaps with live preview)
- Brute-force table of all 26 Caesar decryptions
- Export frequency charts and Math Lab traces as PNG/CSV (for report screenshots)
- Shareable permalink encoding cipher, key and text
- Bigram frequency view

## Infrastructure (conditional)
- FEAT-AUTH: cut because no identity is needed (single-user, no private data).
- FEAT-SEO: cut because the project is not meant to be found through search; everything stays noindex.

## Indexable pages (only when FEAT-SEO)
Not applicable.

## Differentiators
| ID | Name | Why it matters here | How it is demonstrated |
|---|---|---|---|
| DIFF-001 | Every output is a visible proof step | The report is graded on the math, so the app shows Z26 arithmetic, inverses via gcd and group structure | Math Lab panel plus a test that trace rows equal cipher output |
| DIFF-002 | Exhaustive self-verification panel | Correctness is a hard limit; proves D(E(m))=m for every key and that substitution keys are bijections | Run-all-checks button and a property test printing 26/26 and 312/312 |
| DIFF-003 | Explainable break with chi-squared table | Shows why one key wins instead of only the answer | Ranked candidate table with chi-squared values and animated histogram alignment |
| DIFF-004 | Group explorer for Z26 | Shows (Z26,+) is cyclic, every unit generates it, and units mod 26 form a group under multiplication, which is why only 12 values of a work | Orbit diagram and Cayley table with element orders; test asserts 12 units |
| DIFF-005 | Algebraic key recovery from known plaintext | A second attack using linear congruences: a(x1-x2) = y1-y2 (mod 26) solved with the modular inverse; flags multiple solutions when gcd(x1-x2,26)>1 | Known-plaintext panel recovering (a,b); test with the AFFINE CIPHER example |
| DIFF-006 | Unicity distance and break-success curve | Links key-space counting to how much ciphertext is needed before the key is unique | Chart of break success vs ciphertext length (seeded, reproducible) plus unicity distance per cipher |

## Cut list
- FEAT-AUTH: no identity needed (single-user / public / demo)
- FEAT-SEO: not meant to be found through search
- LLM-based cracking: defeats the point; the report must show the mathematical method
- Vigenere, Hill, RSA and other ciphers: scope creep beyond the brief
- Saved history and accounts: no persistence or identity needed; user text must not be stored
- Non-English frequency tables: English-only is a soft limit

## Traceability
| Feature | Entities | Routes |
|---|---|---|
| FEAT-001 | CipherKey, Message | POST /cipher/encrypt, POST /cipher/decrypt |
| FEAT-002 | CipherKey, Message | POST /cipher/encrypt, POST /cipher/decrypt, POST /keys/validate |
| FEAT-003 | FrequencyProfile, Message | POST /analysis/frequency |
| FEAT-004 | BreakCandidate, FrequencyProfile, CipherKey | POST /analysis/break |
| FEAT-005 | Trace, CipherKey | POST /cipher/trace |

Note: routes are the logical contract. Step 4 decides whether they run in a thin backend or as client-side calls to the same pure functions.

## Discrete-math mapping (for the report, Section 5 and 9)
| Concept | Where it shows up |
|---|---|
| Modular arithmetic, congruence classes | Z26 shift and affine maps (FEAT-001, FEAT-005) |
| Functions: injective, surjective, bijective, inverse | Encryption as a bijection on Z26; decryption as its inverse (FEAT-001, FEAT-002) |
| Relations | Congruence mod 26 as an equivalence relation (FEAT-005) |
| Number theory / gcd | gcd(a,26)=1 condition and modular inverse (FEAT-001, FEAT-005) |
| Algebraic structures | (Z26, +) as a cyclic group; units of Z26 as a group under multiplication (FEAT-005) |
| Combinatorics | Key spaces 26, 312, 26! and why brute force fails on substitution (FEAT-002, FEAT-005) |
| Sets and counting | Letter multisets and frequency distributions (FEAT-003) |
| Logic / proof | Round-trip correctness D(E(m))=m checked exhaustively (DIFF-002) |
| Groups, cyclic groups, generators, orders | Z26 under addition, units under multiplication (DIFF-004) |
| Linear congruences, gcd, Euclid | Solving a(x1-x2) = y1-y2 mod 26 (DIFF-005) |
| Counting and probability | Unicity distance and success rate versus text length (DIFF-006) |
