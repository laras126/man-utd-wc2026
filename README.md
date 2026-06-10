# Man Utd at the 2026 World Cup

A small React app that lists every 2026 FIFA World Cup group-stage match featuring a
current Manchester United player, with player profiles and a downloadable **`.ics`
calendar** you can import into Apple Calendar, Google Calendar, or Outlook.

- Left panel: scrollable, date-sorted list of matches (filter by nation).
- Right panel: player profile, venue, kick-off time (UTC), and a per-match `.ics`.
- Top right: **Download .ics** for the full schedule.
- Player headshots load live from the Wikipedia REST API, with an initials fallback.

All fixture data is hardcoded (no runtime API needed except the Wikipedia avatars).

---

## Run it locally

You need [Node.js](https://nodejs.org) (version 18 or newer).

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

To make a production build:

```bash
npm run build      # outputs to ./dist
npm run preview    # serve the built version locally to check it
```

---

## Deploy and share a link

The project is configured with a **relative base path** (`base: "./"` in
`vite.config.js`), so the same `dist` build works on any host without changes.
Pick whichever is easiest:

### Option A — GitHub Pages (free, auto-deploys on push)

1. Create a new repo on GitHub and push this project to the `main` branch.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and
   choose **GitHub Actions**.
3. That's it. The included workflow (`.github/workflows/deploy.yml`) builds and
   publishes on every push to `main`. Your link appears under
   **Settings → Pages** (e.g. `https://YOUR-USERNAME.github.io/man-utd-wc2026/`).

### Option B — Netlify (drag-and-drop, no Git needed)

1. Run `npm run build`.
2. Go to https://app.netlify.com/drop and drag the **`dist`** folder onto the page.
3. Netlify gives you a shareable link instantly.

### Option C — Vercel (connect the repo)

1. Push to GitHub.
2. Import the repo at https://vercel.com/new — it auto-detects Vite.
3. Deploy. Vercel gives you a link and redeploys on every push.

---

## Editing

The whole app lives in `src/App.jsx`:

- `FIXTURES` — each nation's three group-stage matches (UTC kick-off times).
- `PLAYERS` — the United players, their nation, position, role, and bio bullets.

Add a knockout fixture or fix a detail by editing those two arrays, then commit and
push (GitHub Pages/Vercel) or re-run `npm run build` and re-drop on Netlify.

## Notes

- Kick-off times are stored and displayed in **UTC**.
- Only **group-stage** matches are included — knockout opponents depend on results.
- A few players (e.g. backup goalkeepers) are plausible but not guaranteed national-team picks.
