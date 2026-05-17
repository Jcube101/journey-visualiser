# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GPX Journey Visualiser — a React + Vite + Three.js web app that renders GPX routes in 3D with animated playback. Dark, cinematic UI. Supports multi-leg trips (multiple GPX files as separate coloured segments) and 4 view modes: Free-rotate, Isometric, First-person fly-through, Top-down with speed/elevation colouring.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build locally
- `node scripts/build-index.js` — scaffold public/gpx/index.json from .gpx files
- `node tests/gpxParser.test.js [file.gpx]` — run parser + transform tests

## Architecture

```
src/
├── components/
│   ├── canvas/       # Three.js scene components (R3F)
│   │   ├── RouteTrail.jsx      — renders tracks as 3D lines, split by segment
│   │   ├── SeaPlane.jsx        — semi-transparent navy reference plane at minY with grid
│   │   ├── CameraFit.jsx       — auto-positions camera on load/reset
│   │   ├── AnimatedDot.jsx     — glowing sphere that travels all legs in timestamp order
│   │   └── CameraController.jsx — (placeholder) per-view-mode camera logic
│   └── ui/           # HTML overlay UI (Tailwind)
│       ├── DropZone.jsx        — full-screen or corner drag-and-drop
│       ├── ControlsPanel.jsx   — elevation slider + reset view button
│       ├── ViewModeSelector.jsx — (placeholder)
│       └── PlaybackControls.jsx — play/pause, scrub, speed selector, timestamp, leg indicator
├── hooks/            # Custom React hooks
├── utils/
│   ├── gpxParser.js      — parse GPX XML → normalised point array + metadata
│   ├── geoTransform.js   — GPS coords → scene space (with overrideBounds for multi-leg)
│   ├── loadManifest.js   — fetch index.json, parse all legs, shared global bounds
│   └── cameraDefaults.js — compute default camera position from scene bounds
├── stores/
│   └── useJourneyStore.js — Zustand store (tracks, playback, view, elevation)
└── constants/
    ├── viewModes.js    — FREE_ROTATE, ISOMETRIC, FIRST_PERSON, TOP_DOWN
    ├── colourModes.js  — SPEED, ELEVATION
    └── palette.js      — 10 vivid track colours
```

## Key Libraries

- **@react-three/fiber** + **@react-three/drei** — React renderer for Three.js
- **three** — 3D engine
- **zustand** — state management (works across R3F canvas boundary)
- **tailwindcss v4** — styling (via `@tailwindcss/vite` plugin)

## Conventions

- Canvas (3D) components live in `components/canvas/`, HTML UI in `components/ui/`
- Coordinate conversion from GPS → scene space is in `utils/geoTransform.js`
- Multi-leg trips share global bounds via `computeGlobalBounds()` + `overrideBounds` option
- Camera default is computed dynamically from scene bounds (azimuth 45°, polar 30°, distance from bbox diagonal) — never hardcoded coordinates
- SeaPlane renders at global minY and responds to elevation exaggeration changes
- Reset view button triggers `cameraResetKey` in the store, which CameraFit listens to
- GPX files in `public/gpx/` are gitignored — manifest is `public/gpx/index.json`
- View mode and colour mode constants defined in `src/constants/`
- AnimatedDot combines all visible tracks into one timestamp-sorted array and uses an accumulator pattern in useFrame to advance based on real GPX time gaps × playback speed
- Playback is continuous across legs — dot transitions seamlessly when one leg ends and the next begins
