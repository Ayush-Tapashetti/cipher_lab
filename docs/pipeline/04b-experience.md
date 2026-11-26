# 04b Experience & Interaction Design

## Assumptions
- Answers from the user (2026-11-23): first action = **type text and watch the cipher wheel turn**; feel = **hacker / terminal**; density = **spacious, minimal**; no reference sites given.
- "Hacker terminal" plus "spacious" is read as: dark, monospace, cyan and emerald accents, tiling-window-manager panes, but showing **one focused pane at a time by default**. Tiling is one keypress away for demos and report screenshots.
- No SEO (`seo.mode` none): no route is indexable, so there is no page copy or route metadata to define.

## Chosen model
**Primary: `workspace-split`.** The job is exploring one piece of text through several lenses (cipher, wheel, frequencies, trace, break), so a panes-and-inspector workspace fits better than a wizard or a form. **Supporting: `command-first`.** A command palette (Ctrl/Cmd+K) switches cipher, loads the sample, runs the break and toggles layout, which gives the tiling-WM feel without clutter.

Why not the others: a `dashboard` (second best) makes the app a thing you look at instead of a thing you do; a `wizard` or `form-centric` flow would hide the live arithmetic behind a Submit step.

## Signature interaction: the Cipher Wheel (user story)
> I open the site and the cursor is already in a large text box. I type `HELLO`. Two concentric rings of A to Z sit beside it. As each letter lands, the outer ring turns on a spring so H lines up with K, and a readout beneath the wheel shows `H = 7 → (7 + 3) mod 26 = 10 → K`. I grab the outer ring and drag it to shift 5; the ciphertext rewrites itself instantly and the readout now says `(7 + 5) mod 26 = 12 → M`. I press `A` for affine and the wheel becomes two linked controls for a and b; setting a = 13 shows `gcd(13, 26) = 13, not 1` in amber and the last valid output stays on screen.

Second moment (the break): I paste the sample ciphertext and press `B`. The English frequency histogram slides across the ciphertext histogram one shift at a time until the bars line up; a ranked table shows each shift's chi-squared score and the winner glows emerald.

## Layout
Default is **focus mode**: one large pane, a slim rail for the others.

```
┌──────────────────────────────────────────────────────────────┐
│ cipher-lab    [caesar ▾]  k = 3           ⌘K  1 2 3 4 5  T  │
├───┬──────────────────────────────────────────────────────────┤
│ 1 │                                                          │
│ I │      plaintext  ▍HELLO WORLD                             │
│ O │                                                          │
│   │              ┌──── cipher wheel ────┐                    │
│ 2 │              │   outer ring = key   │                    │
│ W │              │   inner ring = A..Z  │                    │
│   │              └──────────────────────┘                    │
│ 3 │      H = 7  →  (7 + 3) mod 26 = 10  →  K                 │
│ F │                                                          │
│   │      ciphertext  KHOOR ZRUOG                             │
│ 4 │                                                          │
│ T │                                                          │
│ 5 │                                                          │
│ B │                                                          │
└───┴──────────────────────────────────────────────────────────┘
 rail: I/O, Wheel, Frequency, Trace, Break      (T toggles tile mode)
```

Panes on `/`: **Input/Output**, **Wheel** (Caesar and affine) or **Substitution board** (26 swappable slots, always a valid permutation), **Frequency** (histogram vs English, index of coincidence), **Trace**, **Break** (ranked table and sliding histogram). Tile mode shows 2 to 4 of them side by side with draggable dividers.

## Screens and routes
| Path | Features | What it is |
|---|---|---|
| `/` | FEAT-001, FEAT-002, FEAT-003, FEAT-004 | The workspace |
| `/math-lab` | FEAT-005, DIFF-001, DIFF-004 | Units mod 26 with inverses, Cayley table, orbit diagram, key-space counts (26, 312, 26!), per-letter proofs |
| `/verify` | DIFF-002, DIFF-005, DIFF-006 | Run all round-trip checks (26/26, 312/312), known-plaintext key recovery, unicity distance and the success-versus-length curve |
| `*` | n/a | Real NotFound screen with a link back to `/` |

All routes are `noindex` (history-mode routing, no hash URLs).

## Visual direction
- Theme: dark only (a light theme is out of scope). Tokens in `styles/tokens.css`.
- Palette: ink `#0b0f14`, surface `#111820`, border `#1e2a36`, text `#d7e3ee`, muted `#8a9db0`, accent cyan `#22d3ee` (primary), emerald `#34d399` (success and the winning key), amber `#fbbf24` (warnings), red `#f87171` (errors). Contrast against the ink background is checked in Step 7 (WCAG AA).
- Type: JetBrains Mono (bundled) everywhere. Large, generous line height; plenty of empty space around the wheel and text areas.
- Colour never carries meaning alone: errors and warnings also have an icon and a text reason.

## Motion and feedback
- Wheel: spring rotation about 300 ms. Histogram alignment about 600 ms. Pane focus: short fade.
- `prefers-reduced-motion`: everything jumps instantly; the arithmetic readout carries the meaning.
- No spinners or skeletons: all compute is local and finishes within one frame for texts up to 5,000 characters.
- Invalid input never blanks the screen: the last valid output stays, with an inline reason (for example `gcd(13, 26) = 13, not 1`).
- Toasts only for copy and export.

## Accessibility (WCAG-AA)
- The wheel is also a keyboard control: arrow keys change the key by 1, Shift+arrows by 5; the readout is an `aria-live="polite"` region so a screen reader hears each step.
- All panes are reachable by Tab and by the number keys; the command palette is fully keyboard operable (cmdk).
- Histogram and tables have text equivalents (a table view of the counts).
- Visible focus ring in cyan on every interactive element; hit targets at least 40 px.

## Component sources (free, open-source, npm-installed)
| Library | License | Used for |
|---|---|---|
| react-resizable-panels | MIT | Tiling panes with draggable, keyboard-resizable dividers |
| cmdk | MIT | Command palette |
| motion | MIT | Wheel spring and histogram slide; `useReducedMotion` |
| sonner | MIT | Copy and export toasts |
| lucide-react | ISC | Icons (imported individually) |

Licenses were read from the npm registry metadata; the `LICENSE` files will be re-checked when Step 6C records the packages in `vendor.lock.json`. The wheel, histogram, substitution board, Cayley table and orbit diagram are hand-built SVG/React so no graph or chart library adds weight. Initial JS budget: **300 KB gzipped** (below the 500 KB default for experimental, because no heavy library is used). Font: JetBrains Mono, OFL-1.1, bundled via Fontsource.

## Report screenshots
A Playwright script (`frontend/scripts/screenshots.ts`) will capture the report's Section 8 screenshots in tile mode: wheel with trace, frequency histogram, break ranking before and after alignment, Math Lab, and the Verify panel.
