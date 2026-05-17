# Roadmap

## Phase 1 — Core single-leg visualiser ✅

- [x] GPX drag-and-drop file loading
- [x] Coordinate transform (GPS → 3D scene space)
- [x] Free-rotate 3D view with OrbitControls
- [x] Multi-leg manifest loading with shared global bounds
- [x] Elevation exaggeration slider (1x–10x)
- [x] Sea level reference plane with grid
- [x] Dynamic camera default (azimuth 45°, polar 30°, auto-fitted distance)
- [x] Reset view button

## Phase 2 — Animated playback and visual polish ✅

- [x] Animated dot travelling the route (glowing sphere with halo + point light)
- [x] Playback controls (play/pause, scrub, speed: 1x–3600x, driving time elapsed, leg indicator)
- [x] Cumulative driving-time playback (gaps > 5 min skipped as rest stops)
- [x] Dot trail — fading 50-point comet tail with additive blending
- [x] Auto-orbit — slow camera rotation during playback, pauses on mouse grab, resumes after 2s inactivity
- [x] Camera follow — smooth pan keeping dot centred
- [x] Leg labels — billboard text at each leg's start point
- [x] Ambient particles — 200 faint drifting particles for scene depth
- [x] Route glow — thicker low-opacity duplicate lines behind each route
- [x] Day/night background — shifts by GPX timestamp (black at night, dark navy by day)
- [x] Live stats bar — elevation, speed, distance, driving time
- [x] Settings panel — gear icon with toggles/sliders for all visual features

## Phase 3 — Colour modes and stats (next)

- [ ] Speed colour mode — route trail coloured by speed gradient replacing leg colours
- [ ] Elevation colour mode — route trail coloured by elevation gradient
- [ ] Stats overlay panel with elevation profile chart
- [ ] Speed graph alongside 3D view

## Phase 4 — View modes

- [ ] Isometric — fixed diagonal camera, no user rotation
- [ ] First-person fly-through — camera behind/above dot looking forward
- [ ] Top-down — orthographic overhead with heatmap colouring

## Phase 5 — Dashcam integration

- [ ] Sync dashcam video timestamps with GPX timestamps
- [ ] Display footage alongside the route at the corresponding point

## Phase 6 — Polish and portfolio integration

- [ ] Embed on job-joseph.com
- [ ] Shareable URL state (which GPX, playback position, view mode)
- [ ] Mobile responsiveness
