# Roadmap

## Phase 1 — Core single-leg visualiser

- [x] GPX drag-and-drop file loading
- [x] Coordinate transform (GPS → 3D scene space)
- [x] Free-rotate 3D view with OrbitControls
- [x] Multi-leg manifest loading with shared global bounds
- [x] Elevation exaggeration slider (1x–10x)
- [x] Sea level reference plane with grid
- [x] Dynamic camera default (azimuth 45°, polar 30°, auto-fitted distance)
- [x] Reset view button
- [x] Animated dot travelling the route (glowing sphere with halo + point light)
- [x] Playback controls (play/pause, scrub, speed: 1x–3600x, timestamp, leg indicator)

## Phase 2 — View modes and colour

- All 4 view modes (Free-rotate, Isometric, First-person, Top-down)
- Speed/elevation colour toggle on the route trail

## Phase 3 — Multi-leg support

- Load multiple GPX files
- Stitch or overlay segments in the same scene
- Per-leg colour coding with distinct palette

## Phase 4 — Stats overlay

- Elevation profile chart alongside the 3D view
- Speed graph
- Summary panel: total distance, duration, max speed

## Phase 5 — Dashcam integration

- Sync dashcam video timestamps with GPX timestamps
- Display footage alongside the route at the corresponding point

## Phase 6 — Polish and portfolio integration

- Embed on job-joseph.com
- Shareable URL state (which GPX, playback position, view mode)
- Mobile responsiveness
