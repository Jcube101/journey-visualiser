# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GPX Journey Visualiser — a React + Vite + Three.js web app that renders GPX routes in 3D with animated playback. Dark, cinematic UI. Supports multi-leg trips (multiple GPX files as separate coloured segments) and 4 view modes: Free-rotate, Isometric, First-person fly-through, Top-down with speed/elevation colouring.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build locally

## Architecture

```
src/
├── components/
│   ├── canvas/       # Three.js scene components (R3F)
│   │   ├── Scene.jsx
│   │   ├── RouteTrail.jsx
│   │   ├── AnimatedDot.jsx
│   │   └── CameraController.jsx
│   └── ui/           # HTML overlay UI (Tailwind)
│       ├── DropZone.jsx
│       ├── ViewModeSelector.jsx
│       └── PlaybackControls.jsx
├── hooks/            # Custom React hooks
├── utils/            # Pure functions (GPX parsing, coordinate transforms)
├── stores/           # App state (loaded tracks, playback, view mode)
└── constants/        # Enums and config (view modes, colours)
```

## Key Libraries

- **@react-three/fiber** + **@react-three/drei** — React renderer for Three.js
- **three** — 3D engine
- **gpxparser** — GPX file parsing
- **tailwindcss v4** — styling (via `@tailwindcss/vite` plugin)

## Conventions

- Canvas (3D) components live in `components/canvas/`, HTML UI in `components/ui/`
- Coordinate conversion from GPS → scene space is isolated in `utils/coordinates.js`
- State management goes in `stores/` (no library chosen yet — zustand recommended)
- View mode constants defined in `constants/viewModes.js`
