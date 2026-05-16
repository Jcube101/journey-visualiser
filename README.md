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

### Drag-and-drop

Drag `.gpx` files onto the viewport at any time. Each file is added as a standalone leg with an auto-assigned colour.

## Controls

- **Orbit** — click and drag to rotate, scroll to zoom
- **Elevation slider** — exaggerate terrain height (1x–10x)
- **Reset view** — snap back to the default cinematic camera angle

## Hosting

Self-hosted on a Raspberry Pi behind a Cloudflare tunnel, served via Nginx from the `dist/` folder. Deploy by building locally and copying `dist/` to the Pi.
