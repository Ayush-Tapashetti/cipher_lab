# `cipher-lab` ≡ Classical Cryptanalysis & Modular Arithmetic Workbench

> `STATUS: ONLINE` · `ENGINE: Z26 PURE ARITHMETIC` · `SELF-CHECK: 375/375 PASSED` · `NETWORK: ISOLATED (connect-src 'none')`

```text
   ______  ____  ____   __  __  ______  ____           __     ___     ____
  / ____/ /  _/ / __ \ / / / / / ____/ / __ \         / /    /   |   / __ )
 / /      / /  / /_/ // /_/ / / __/   / /_/ /______  / /    / /| |  / __  |
/ /___  _/ /  / ____// __  / / /___  / _, _//_____/ / /___ / ___ | / /_/ /
\____/ /___/ /_/    /_/ /_/ /_____/ /_/ |_|        /_____//_/  |_|/_____/
```

**`cipher-lab`** is an interactive discrete mathematics and classical cryptanalysis workbench built in strict TypeScript. Every cryptographic transformation, algebraic exploration, known-plaintext attack, and statistical breaking routine operates over explicit modular arithmetic on $\mathbb{Z}_{26}$ and is surfaced step-by-step in a keyboard-driven terminal interface.

*Disclaimer: Classical ciphers are breakable by design. Never protect real secrets with them. All computation runs 100% locally in your browser with network isolation (`connect-src 'none'`) and strict privacy/CSP verification.*

---

## 01 ≡ Core Capabilities, Panes & Feature Modules

The interface organizes multi-pane workspaces, dedicated routes, and feature manifests (`FEAT-001`–`FEAT-005` and `DIFF-001`–`DIFF-006`) navigable via top-level routes, layout toggles, or the `Ctrl+K` Command Palette:

### `[01] Workspace` (Interactive Cryptographic Workbench)
- **Pane 1 — `Input / Output` (`IoPane`)**: Real-time encryption and decryption for **Caesar**, **Affine**, and **Simple Substitution** ciphers, with sample presets (`samples.ts`) and character/case/punctuation preservation across $\mathbb{Z}_{26}$ residues.
- **Pane 2 — `Cipher Wheel` (`FEAT-001` — `WheelPane`, `CipherWheel`, `wheelGeometry`)**: Interactive dual-ring SVG cipher wheel. Drag the outer ring or use `←` / `→` (`Shift` for $\pm 5$) to inspect congruence shifts $E(x) = (x + k) \bmod 26$.
- **Substitution Board (`SubstitutionBoard`) & Key Controls (`KeyControls`)**: Interactive key configuration and direct mapping inspection for shift, affine $(a, b)$, and substitution keys.
- **Pane 3 — `Frequency` (`FEAT-003` — `FrequencyPane`, `FrequencyChart`, `AnalysisInput`)**: Live letter-frequency histogram comparing ciphertext distributions against standard English probabilities ($p_i$) alongside the **Index of Coincidence** ($IC$).
- **Pane 4 — `Trace` (`TracePane`)**: Step-by-step arithmetic breakdown exposing the exact modular congruence steps behind each transformation.
- **Pane 5 — `Break` (`FEAT-004` — `BreakPane`, `CandidateTable`)**: Automated cryptanalysis engine ranking candidate keys by **Chi-Squared ($\chi^2$)** distance against English, with statistical confidence indicators (`HIGH` / `MEDIUM` / `LOW`).

### `[02] Math Lab` (Algebraic & Number-Theoretic Explorer)
- **Units & Modular Inverses (`UnitsTable`)**: Inspect the $\varphi(26) = 12$ units of $\mathbb{Z}_{26}$ alongside **Extended Euclidean Algorithm** traces solving Bézout's identity ($as + 26t = 1$).
- **Group Explorer (`GroupExplorer`)**: Interactive Cayley tables, element orders, cyclic subgroups, and generator identification ($\{7, 11, 15, 19\}$) for $(\mathbb{Z}_{26}, +)$ and $(\mathbb{Z}_{26}^*, \times)$.
- **Key Space & Proofs (`KeySpace`, `Proofs`)**: Combinatorial comparisons ($26$ vs. $312$ vs. $26! \approx 4.03 \times 10^{26}$) and constructive proofs of bijection and invertibility requirements.

### `[03] Verify` (In-Browser Mathematical Verification)
- **Exhaustive Self-Checks (`ExhaustiveChecks` — `375 / 375`)**: Executes deterministic checks in the browser—verifying round-trip correctness $D(E(m)) = m$ across Caesar and Affine key spaces, modular inverse identities, and rejection of invalid/non-coprime multipliers ($\gcd(a, 26) > 1$).
- **Known-Plaintext Solver (`KnownPlaintext`)**: Recovers Affine keys $(a, b)$ from known plaintext–ciphertext pairs by solving linear congruences modulo $26$.
- **Unicity & Break Success Curve (`UnicityCurve`)**: Seeded Monte Carlo simulation measuring key recovery accuracy across ciphertext lengths against Shannon's theoretical unicity distance ($U = \log_2 |K| / D$).

---

## 02 ≡ Mathematical Foundations

| Cipher | Encryption $E(x)$ | Decryption $D(y)$ | Legal Key Space $\|K\|$ | Number-Theoretic Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Caesar** | $(x + k) \bmod 26$ | $(y - k) \bmod 26$ | $26$ ($\approx 4.7\text{ bits}$) | $k \in \mathbb{Z}_{26}$ |
| **Affine** | $(ax + b) \bmod 26$ | $a^{-1}(y - b) \bmod 26$ | $312$ ($\approx 8.3\text{ bits}$) | $\gcd(a, 26) = 1,\; b \in \mathbb{Z}_{26}$ |
| **Substitution** | $\pi(x)$ | $\pi^{-1}(y)$ | $26!$ ($\approx 88.4\text{ bits}$) | $\pi \in S_{26}$ (bijection on $\mathbb{Z}_{26}$) |

---

## 03 ≡ Repository Architecture

```text
cipher-lab/
├── packages/
│   └── engine/                 # Pure TypeScript discrete math & cryptanalysis core
│       ├── src/
│       │   ├── modular.ts      # mod, gcd, extendedGcd, modInverse, totient
│       │   ├── ciphers.ts      # Key validation, E(x)/D(y), step-by-step trace
│       │   ├── frequency.ts    # Letter counts, relative frequencies, IC
│       │   ├── breaker.ts      # Chi-squared ranking, confidence heuristics
│       │   ├── algebra.ts      # Units, cyclic orbits, orders, Cayley tables
│       │   ├── attack.ts       # Linear congruence known-plaintext solver
│       │   ├── stats.ts        # Key-space metrics, unicity distance, 375-check suite
│       │   ├── english.ts      # English frequency model & scoring helpers
│       │   ├── samples.ts      # Preset cipher/plaintexts
│       │   ├── types.ts        # Shared engine types
│       │   └── errors.ts       # Structured engine error types
│       ├── __tests__/          # Vitest unit & property test suites
│       └── evals/              # Seeded cryptanalysis accuracy benchmarks (break.eval.ts)
├── frontend/                   # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── routes/             # Workspace, MathLab, Verify, RouteError, NotFound
│   │   ├── features/           # workspace, break, mathlab, verify, frequency, trace + manifests
│   │   ├── components/         # ui, adapters (CommandPalette, ResizablePanes, AppToaster), vendor
│   │   ├── layouts/            # RootLayout, Header, Rail, StatusBar, useShortcuts
│   │   ├── state/              # store.ts, cipherStore.ts (+ unit specs)
│   │   ├── hooks/              # useCipherResult.ts
│   │   ├── lib/                # text.ts, cx.ts (+ unit specs)
│   │   ├── motion/             # motion.ts
│   │   └── styles/             # tokens.css, index.css
│   ├── scripts/                # audit-vendor.mjs, size.mjs
│   ├── Dockerfile              # Multi-stage build -> nginx-unprivileged
│   └── nginx.conf              # Static SPA & security headers config
├── scripts/                    # gate-01..08.mjs, run-verification.mjs, e2e.mjs, verify-*.mjs, check-csp.mjs
├── docs/pipeline/              # Architecture specs, schemas, feature/experience/guardrail manifests, 08-docker.md
├── reports/                    # Verification JSON reports & UI capture PNGs
├── docker-compose.yml          # Production unprivileged nginx container setup
└── docker-compose.dev.yml      # Local development compose config
```

---

## 04 ≡ Quickstart & Commands

### Local Development
```bash
# Install dependencies from lockfile
npm ci

# Start the frontend development server
npm --workspace=frontend run dev
```

### Testing, Evals & Verification Gates
```bash
# Run unit tests across the workspace
npx vitest run

# Run engine evaluation benchmarks (if defined in packages/engine/package.json)
npm --workspace=packages/engine run eval

# Run repository verification suite & checks
node scripts/run-verification.mjs
bash scripts/check_purity.sh
node scripts/verify-privacy.mjs
node scripts/check-csp.mjs
```

### Containerized Deployment (`nginx` + Strict CSP)
```bash
# Build and start containers
docker compose up --build -d

# Check running containers and mapped ports
docker compose ps

# Run Docker verification script
bash scripts/verify-docker.sh

# Stop and remove containers
docker compose down
```

---

## 05 ≡ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `1` – `5` | Switch active workspace pane (`I/O`, `Wheel`, `Frequency`, `Trace`, `Break`) |
| `T` | Toggle between Tile and Focus layout modes |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |
| `←` / `→` | Rotate Cipher Wheel by $\pm 1$ (`Shift` for $\pm 5$) |

---

## 06 ≡ Roadmap & Future Extensions

- **Polyalphabetic Ciphers**: Vigenère encryption with Kasiski examination and Friedman IC key-length estimation.
- **Matrix Cryptography**: Hill cipher over $GL_n(\mathbb{Z}_{26})$ requiring $\gcd(\det(K), 26) = 1$.
- **Heuristic Substitution Solver**: Quadgram-scored simulated annealing / hill-climbing over $S_{26}$.
- **Public-Key Primitives**: Modular exponentiation, Euler's theorem, and textbook RSA inside `packages/engine`.
