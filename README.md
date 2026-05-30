# Journey Visualiser

A cinematic 3D GPX route visualiser. Drop in one or more GPX files and watch an animated dot travel your route in a dark, polished 3D scene.

Designed for repeat use across any future trip — not hardcoded to any specific journey.

## View Modes

- **Free-rotate** — draggable, zoomable 3D view with OrbitControls
- **Isometric** — fixed diagonal camera, elevation visible as vertical displacement
- **First-person fly-through** — camera follows the animated dot from behind/above
- **Top-down** — orthographic overhead view with speed/elevation heatmap colouring

## Running Locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (default: http://localhost:5173).

## Production Build

```bash
npm run build
```

Output goes to `dist/`. Preview locally with `npm run preview`.

## Loading GPX Files

### Manifest (recommended for multi-leg trips)

1. Place `.gpx` files in `public/gpx/`
2. Run `node scripts/build-index.js` to scaffold a manifest
3. Edit `public/gpx/index.json` to group files into legs:
   ```json
   [
     { "leg": "Leg 1", "colour": null, "files": ["day1a.gpx", "day1b.gpx"] },
     { "leg": "Leg 2", "colour": null, "files": ["day2.gpx"] }
   ]
   ```
4. Start the dev server — legs load automatically and stitch geographically

**Naming:** The `leg` field is what appears in the UI legend and playback bar — name legs descriptively (e.g. `"Bengaluru → Dindigul"`) not generically (`"Leg 1"`). The origin city (text before the `→`) is also used as the billboard label on the 3D map.

**Important:** If OsmAnd split a single leg into multiple GPX files (e.g. when recording was paused/resumed), all split files must be listed under the **same leg entry**. If they end up as separate legs, the animated dot will jump through empty space between file endpoints:

```json
[
  {
    "leg": "Bengaluru to Dindigul",
    "colour": null,
    "files": ["2026-01-15_part1.gpx", "2026-01-15_part2.gpx", "2026-01-15_part3.gpx"]
  }
]
```

## View Modes

Four view modes selectable from the pill at top-centre: **Free · Iso · FPV · Top**

- **Free-rotate** — draggable, zoomable 3D view (default)
- **Isometric** — fixed diagonal camera, pan only
- **FPV** — first-person fly-through behind the animated dot
- **Top-down** — orthographic overhead view

## Controls

- **Orbit** — click and drag to rotate, scroll to zoom (Free-rotate mode)
- **Elevation slider** — exaggerate terrain height (1x–10x)
- **Reset view** — snap back to the active mode's default camera angle
- **Playback** — play/pause, scrub through the timeline, speed selector (1x–3600x)
- **3600x speed** — plays a full 24-hour journey in 24 seconds for social media clips
- **Cinema mode** (`C`) — hides all UI for clean screen recordings
- **Vertical preview** (phone icon) — shows a 9:16 framing overlay for recording vertical clips
- **Auto-play** (`R`) — resets, enables cinema mode, and auto-plays in one keystroke

See `docs/RECORDING_GUIDE.md` for the full recording workflow for Instagram Reels.

## Claude Code CLI

This project was built with [Claude Code](https://claude.ai/code). For uninterrupted builds on trusted local projects, you can use:

```bash
claude --dangerously-skip-permissions
```

This skips tool approval prompts so Claude can edit files, run builds, and execute commands without pausing for confirmation. Only use this on local projects where you review changes via `git diff` before committing.

## Hosting

Self-hosted on a Raspberry Pi behind a Cloudflare tunnel, served via Nginx from the `dist/` folder. Deploy by building locally and copying `dist/` to the Pi.
