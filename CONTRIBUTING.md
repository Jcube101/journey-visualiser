# Contributing

## Codebase Structure

```
src/
├── components/
│   ├── canvas/       # Three.js/R3F scene components
│   └── ui/           # HTML overlay UI (Tailwind)
├── hooks/            # Custom React hooks
├── utils/            # Pure functions (parsing, transforms, camera math)
├── stores/           # Zustand state stores
└── constants/        # Enums, palettes, config
```

## GPX Data Flow

There are two loading paths — manifest (primary) and drag-and-drop (ad hoc):

### Manifest loading (on startup)

```
App mounts
  → src/utils/loadManifest.js fetches /gpx/index.json
  → For each leg: fetch all .gpx files, parse with gpxParser.js, merge by timestamp
  → computeGlobalBounds() across all legs
  → transformToScene() for each leg with overrideBounds (shared coordinate space)
  → useJourneyStore.loadLegs() — all legs added at once with palette colours
  → RouteTrail renders all visible tracks
  → CameraFit positions camera from scene bounds
```

### Drag-and-drop (runtime)

```
File dropped onto DropZone
  → src/utils/gpxParser.js (parse XML, extract points)
  → src/utils/geoTransform.js transformToScene() (independent bounds)
  → useJourneyStore.addTrack()
  → RouteTrail re-renders with new track
```

## How to Add a New View Mode

1. Create a new camera controller component in `src/components/canvas/` (e.g., `IsometricCamera.jsx`)
2. Add the enum value to `src/constants/viewModes.js`
3. Add a selector option in `src/components/ui/ViewModeSelector.jsx`
4. Wire the Zustand store's `viewMode` state to conditionally render your camera controller in the scene

## How to Add a New Colour Mode

1. Add the colour mode enum to `src/constants/colourModes.js`
2. Define the colour ramp/palette in `src/constants/`
3. Update the `RouteTrail` component's shader or material logic to map the new data dimension to vertex colours
4. Add a toggle in the UI to switch between colour modes

## Playback Architecture

The animated dot and playback controls work together across the R3F/HTML boundary:

```
PlaybackControls (HTML overlay)
  → play/pause/scrub/speed → Zustand store actions
  → store.currentPointIndex updates

AnimatedDot (inside Canvas)
  → useFrame reads store.isPlaying, playbackSpeed, currentPointIndex
  → Accumulator pattern: elapsed real ms × speed consumed against GPX time gaps
  → All visible tracks combined into one timestamp-sorted array
  → Dot interpolates smoothly between points, colour changes at leg boundaries
```

## How to Add a New Control

1. Add the state and action to `src/stores/useJourneyStore.js`
2. Add the UI element to `src/components/ui/ControlsPanel.jsx`
3. If it affects the 3D scene (like elevation exaggeration), re-transform tracks in the store action using `transformToScene()` with the shared global bounds

## Managing GPX Files

1. Place `.gpx` files in `public/gpx/`
2. Run `node scripts/build-index.js` to scaffold `index.json` (won't overwrite existing)
3. Edit `index.json` to group split files into legs or rename leg labels
4. GPX files are gitignored — they contain personal location data

## AI Context File

`CLAUDE.md` is the AI context file for Claude Code. Update it whenever:

- A significant architectural decision is made
- A new utility or component is added
- The build process or folder structure changes

## Deployment

The site is self-hosted on a Raspberry Pi (jobpi). It is a pure static build — no backend, no systemd service. The Vite output in `dist/` is served by **Nginx on port 3002**, and the **pi-home Cloudflare Tunnel** exposes it over HTTPS at **https://visualiser.job-joseph.com**.

The repo is cloned on the Pi. To deploy code changes, push to `main`, then on the Pi run:

```bash
git pull && npm install && npm run build && sudo systemctl reload nginx
```

No service restart is needed — Nginx serves the freshly built `dist/` immediately after reload.

**Sudo access:** the sudoers file at `/etc/sudoers.d/journey-visualiser-deploy` grants passwordless sudo for all commands required by this deploy workflow (the `systemctl reload nginx` step, and the one-time `chmod o+x /home/jcube` traversal fix), so deployment runs without interactive password prompts.
