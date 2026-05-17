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
│   │   ├── RouteTrail.jsx        — renders tracks as 3D lines, split by segment
│   │   ├── RouteGlow.jsx         — thicker low-opacity duplicate lines behind each route for emissive glow
│   │   ├── SeaPlane.jsx          — semi-transparent navy reference plane at minY with grid
│   │   ├── CameraFit.jsx         — auto-positions camera on load/reset
│   │   ├── AnimatedDot.jsx       — glowing sphere that travels all legs in driving-time order
│   │   ├── DotTrail.jsx          — fading 50-point comet tail behind dot (additive blending)
│   │   ├── AutoOrbit.jsx         — slow camera rotation during playback, pauses on mouse interaction, resumes after 2s
│   │   ├── CameraFollow.jsx      — smooth pan keeping dot centred without changing orbit angle
│   │   ├── LegLabels.jsx         — billboard text at each leg's start point (always faces camera)
│   │   ├── AmbientParticles.jsx  — 200 slowly drifting faint particles for depth
│   │   ├── DayNightBackground.jsx — background colour shifts by GPX timestamp (black at night, dark navy by day)
│   │   └── CameraController.jsx  — (placeholder) per-view-mode camera logic
│   └── ui/           # HTML overlay UI (Tailwind)
│       ├── DropZone.jsx          — full-screen or corner drag-and-drop
│       ├── ControlsPanel.jsx     — elevation slider + reset view button
│       ├── SettingsPanel.jsx     — gear icon button → toggles/sliders panel for all visual features
│       ├── LiveStatsBar.jsx      — live elevation, speed, distance, driving time as dot moves
│       ├── ViewModeSelector.jsx  — (placeholder)
│       └── PlaybackControls.jsx  — play/pause, scrub, speed selector, driving time elapsed, leg indicator
├── hooks/
│   └── usePlaybackPoints.js — shared hook: builds timestamp-sorted combined point array with cumulative driving time
├── utils/
│   ├── gpxParser.js      — parse GPX XML → normalised point array + metadata
│   ├── geoTransform.js   — GPS coords → scene space (with overrideBounds for multi-leg)
│   ├── loadManifest.js   — fetch index.json, parse all legs, shared global bounds
│   └── cameraDefaults.js — compute default camera position from scene bounds
├── stores/
│   └── useJourneyStore.js — Zustand store (tracks, playback, view, elevation, settings, dotPosition/dotData)
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
- AnimatedDot publishes `dotPosition` and `dotData` to the Zustand store each frame for cross-component communication (DotTrail, CameraFollow, LiveStatsBar, DayNightBackground all read from it)
- Playback uses cumulative driving time, not wall clock time — gaps > 5 minutes (REST_THRESHOLD_MS) are skipped as rest stops; the `usePlaybackPoints` hook stamps each point with `drivingTimeMs`
- Playback is continuous across legs — dot transitions seamlessly when one leg ends and the next begins
- Settings slice in Zustand store holds all visual feature toggles and slider values with defaults:
  - `autoOrbit` (true), `autoOrbitSpeed` (0.05 rad/s)
  - `dotTrail` (true), `dotTrailWidth` (3)
  - `cameraFollow` (false)
  - `legLabels` (true), `ambientParticles` (true), `routeGlow` (true)
  - `liveStats` (true), `dayNightBg` (true)
- City name billboard labels are deduplicated by proximity (DEDUP_RADIUS = 2 scene units) so a junction city like Dindigul only appears once despite being shared by multiple legs
- Leg names in legend (top-left) and playback bar are driven entirely by the `leg` field in index.json — no hardcoding anywhere
- Three colour modes (LEG/SPEED/ELEVATION) implemented in RouteTrail with per-point vertex colouring via Drei `<Line vertexColors>`; global normalisation across all legs for consistent colours
- RouteGlow matches the active colour mode — same vertex colour array at wider lineWidth + lower opacity
- GradientLegend component swaps between leg legend (colour dots) and gradient bar legend based on active mode
- Intro animation: IntroAnimation component starts camera at 2.5x fitted distance looking top-down, eases to default position over 3s while route opacity fades 0→1 (imperatively via useFrame, no re-renders); plays once per page load, toggleable via `introAnimation` setting
- DropZone component removed — app loads exclusively from manifest (`public/gpx/index.json`)
