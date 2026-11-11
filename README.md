# Daily Hour

A guided one-hour daily session for a PhD in computational multiphase flow:

| Block | Time | What |
|---|---|---|
| Research radar | 25 min | New papers ranked for VOF/PLIC, contact lines, FSI / immersed boundaries, pressure Poisson & quantum solvers, ML for interfaces — each with a problem / method / result summary and "why it matters for you" |
| Classic paper | 15 min | 28 foundational papers in turbulence and multiphase numerics (Reynolds → Kolmogorov → Germano; VOF, CSF, PLIC, Chorin, Peskin, Cox–Voinov, HHL), with the key equation and a recall question |
| Śloka | 10 min | Bhagavad Gītā, Upaniṣads and Nyāya Sūtra in daily rotation: Devanāgarī, IAST, word meanings, translation, reflection |
| Speaking | 10 min | Recite the śloka, then one prompt rotating through faculty-interview, defense and fluency practice, with timer, transcript and self-check |
| Close | 2 min | One thing learned, one PhD action for tomorrow; streak and journal |

## Files

- `index.html`, `styles.css`, `app.js` — the site (GitHub Pages ready, no build step)
- `content/classics.js`, `content/philosophy.js`, `content/speaking.js` — the 28-day curriculum
- `data/latest.json` — today's paper radar with summaries, refreshed each morning by a scheduled Claude task
- `build_artifact.py` → `daily-hour.html` — the same page for the Claude-hosted copy (synced progress, "Ask Claude", speaking feedback)

## Turning on GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / root. The site then lives at
`https://mohitrsharma.github.io/paper-tracker/`.

Progress on the GitHub site is stored in your browser. The Claude-hosted copy syncs across devices.
