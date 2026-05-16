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

## Usage

Drag and drop a `.gpx` file (or multiple files) onto the viewport. The route renders immediately and the animated dot begins travelling the path.

## Hosting

Self-hosted on a Raspberry Pi behind a Cloudflare tunnel, served via Nginx from the `dist/` folder. Deploy by building locally and copying `dist/` to the Pi.
