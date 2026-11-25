# `cipher-lab` // Classical Cryptanalysis & Modular Arithmetic Workbench

> `STATUS: ONLINE` · `ENGINE: Z26 PURE ARITHMETIC` · `SELF-CHECK: 375/375 PASSED` · `NETWORK: ISOLATED (connect-src 'none')`

```text
   ______  ____  ____   __  __  ______  ____           __     ___     ____
  / ____/ /  _/ / __ \ / / / / / ____/ / __ \         / /    /   |   / __ )
 / /      / /  / /_/ // /_/ / / __/   / /_/ /______  / /    / /| |  / __  |
/ /___  _/ /  / ____// __  / / /___  / _, _//_____/ / /___ / ___ | / /_/ /
\____/ /___/ /_/    /_/ /_/ /_____/ /_/ |_|        /_____//_/  |_|/_____/
```

**`cipher-lab`** is an interactive discrete mathematics and classical cryptanalysis workbench built in strict TypeScript. Rather than treating encryption as an opaque black box, every operation—encryption, decryption, key validation, and statistical breaking—is executed via explicit modular arithmetic on $\mathbb{Z}_{26}$ and exposed step-by-step in a minimal, keyboard-driven terminal interface.

*Disclaimer: Classical ciphers are breakable by design. Never protect real secrets with them. All computation runs 100% locally in your browser; zero data leaves the tab.*

---

## 01 // Core Capabilities & Panes

The interface is organized into three primary workspaces, navigable via top-level routes or the `Ctrl+K` Command Palette:

### `[01] Workspace` (Interactive Cryptographic Workbench)
* **Pane 1 — `Input / Output`**: Real-time encryption and decryption for **Caesar**, **Affine**, and **Simple Substitution** ciphers. Preserves non-alphabetic characters, spacing, digits, and case while transforming $\mathbb{Z}_{26}$ residues.
* **Pane 2 — `Cipher Wheel` (`FEAT-001`)**: Interactive dual-ring SVG cipher wheel. Drag the outer ring or use `←` / `→` (`Shift` for $\pm 5$) to visualize congruence class shifts $E(x) = (x + k) \bmod 26$.
* **Pane 3 — `Frequency` (`FEAT-003`)**: Live letter-frequency histogram comparing ciphertext distributions against standard English probabilities ($p_i$) alongside the **Index of Coincidence** ($IC$).
* **Pane 4 — `Trace`**: Letter-by-letter arithmetic breakdown exposing the exact modular congruence steps behind every transformation.
* **Pane 5 — `Break` (`FEAT-004`)**: Automated cryptanalysis engine that ranks all $26$ Caesar shifts or $312$ valid Affine keys by **Chi-Squared ($\chi^2$)** distance against English, complete with statistical confidence reporting (`HIGH` / `MEDIUM` / `LOW`).

### `[02] Math Lab` (Algebraic & Number-Theoretic Explorer)
* **Units & Modular Inverses**: Inspect the $\varphi(26) = 12$ units of $\mathbb{Z}_{26}$ alongside step-by-step **Extended Euclidean Algorithm** traces solving Bézout's identity ($as + 26t = 1$).
* **Group Explorer**: Interactive Cayley tables, element orders, cyclic subgroups, and generator identification ($\{7, 11, 15, 19\}$) for $(\mathbb{Z}_{26}, +)$ and $(\mathbb{Z}_{26}^*, \times)$.
* **Key Space & Proofs**: Combinatorial comparisons ($26$ vs. $312$ vs. $26! \approx 4.03 \times 10^{26}$) and constructive proofs of bijection requirements.

### `[03] Verify` (In-Browser Mathematical Verification)
* **Exhaustive Self-Checks (`375 / 375`)**: Executes deterministic proofs directly in the browser—verifying round-trip correctness $D(E(m)) = m$ across all $26$ Caesar keys and $312$ Affine keys, modular inverse identities, and rejection of non-coprime multipliers ($\gcd(a, 26) > 1$).
* **Known-Plaintext Solver**: Recovers Affine keys $(a, b)$ from two known plaintext–ciphertext pairs by solving the linear congruence $a(x_1 - x_2) \equiv y_1 - y_2 \pmod{26}$.
* **Unicity & Break Success Curve**: Seeded Monte Carlo simulation measuring key recovery accuracy across ciphertext lengths ($5$ to $100$ letters) against Shannon's theoretical unicity distance ($U = \log_2 |K| / D$).

---

## 02 // Mathematical Foundations

| Cipher | Encryption $E(x)$ | Decryption $D(y)$ | Legal Key Space $\|K\|$ | Number-Theoretic Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Caesar** | $(x + k) \bmod 26$ | $(y - k) \bmod 26$ | $26$ ($\approx 4.7\text{ bits}$) | $k \in \mathbb{Z}_{26}$ |
| **Affine** | $(ax + b) \bmod 26$ | $a^{-1}(y - b) \bmod 26$ | $312$ ($\approx 8.3\text{ bits}$) | $\gcd(a, 26) = 1,\; b \in \mathbb{Z}_{26}$ |
| **Substitution** | $\pi(x)$ | $\pi^{-1}(y)$ | $26!$ ($\approx 88.4\text{ bits}$) | $\pi \in S_{26}$ (bijection on $\mathbb{Z}_{26}$) |

---

## 03 // Repository Architecture

The codebase enforces a strict separation between pure discrete mathematics and UI rendering:

```text
cipher-lab/
├── packages/
│   └── engine/                 # Pure TypeScript math core (0 external runtime deps)
│       ├── src/
│       │   ├── modular.ts      # mod, gcd, extendedGcd, modInverse, totient
│       │   ├── ciphers.ts      # Key validation, E(x)/D(y), step-by-step trace
│       │   ├── frequency.ts    # Letter counts, relative frequencies, IC
│       │   ├── breaker.ts      # Chi-squared ranking, confidence heuristics
│       │   ├── algebra.ts      # Units, cyclic orbits, orders, Cayley tables
│       │   ├── attack.ts       # Linear congruence known-plaintext solver
│       │   └── stats.ts        # Key-space metrics, unicity distance, 375-check suite
│       └── evals/              # Seeded cryptanalysis accuracy benchmarks
├── frontend/                   # React 19 + Vite + Tailwind + Zustand SPA
│   └── src/
│       ├── features/           # Workspace, Wheel, Frequency, Break, MathLab, Verify
│       ├── layouts/            # Terminal chrome, Rail, StatusBar, keyboard shortcuts
│       └── styles/             # Design tokens & monospace theme
├── scripts/                    # Verification gates, CSP audit, e2e & Docker checks
├── docker-compose.yml          # Production unprivileged nginx container
└── docker-compose.dev.yml      # Local development environment
```

---

## 04 // Quickstart & Commands

### Local Development
```bash
# Install workspace dependencies
npm install

# Run the frontend development server
npm --workspace frontend run dev
```

### Testing & Verification Gates
```bash
# Run engine unit & property-based tests (Vitest + fast-check)
npm --workspace packages/engine test

# Run cryptanalysis evaluation benchmarks
npm --workspace packages/engine run eval

# Run full verification suite (contracts, privacy, CSP, accessibility)
node scripts/run-verification.mjs
```

### Containerized Deployment (`nginx` + Strict CSP)
`cipher-lab` packages as a static single-page application served by an unprivileged `nginx` container with `connect-src 'none'` enforced via Content-Security-Policy headers:

```bash
# Build and start the container
docker compose up --build -d

# Verify container headers and CSP isolation
bash scripts/verify-docker.sh
```

---

## 05 // Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `1` – `5` | Switch active workspace pane (`I/O`, `Wheel`, `Frequency`, `Trace`, `Break`) |
| `T` | Toggle between Tile and Focus layout modes |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |
| `←` / `→` | Rotate Cipher Wheel by $\pm 1$ (`Shift` for $\pm 5$) |

---

## 06 // Roadmap & Future Extensions

* **Polyalphabetic Ciphers**: Vigenère encryption with Kasiski examination and Friedman IC key-length estimation.
* **Matrix Cryptography**: Hill cipher over $GL_n(\mathbb{Z}_{26})$ requiring $\gcd(\det(K), 26) = 1$.
* **Heuristic Substitution Solver**: Quadgram-scored simulated annealing / hill-climbing over $S_{26}$.
* **Public-Key Primitives**: Modular exponentiation, Euler's theorem, and textbook RSA inside `packages/engine`.
