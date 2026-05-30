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
- [x] 3600x playback speed for ~21 second social clip
- [x] Dot trail — fading 50-point comet tail with additive blending
- [x] Auto-orbit — slow camera rotation during playback, pauses on mouse grab, resumes after 2s inactivity
- [x] Camera follow — smooth pan keeping dot centred
- [x] City name billboard labels on 3D map (deduplicated by location proximity)
- [x] Leg names driven by index.json `leg` field (no hardcoding)
- [x] Split-file leg grouping support in index.json (multiple GPX files per leg)
- [x] Ambient particles — 200 faint drifting particles for scene depth
- [x] Route glow — thicker low-opacity duplicate lines behind each route
- [x] Day/night background — shifts by GPX timestamp (black at night, dark navy by day)
- [x] Live stats bar — elevation, speed, distance, driving time
- [x] Settings panel — gear icon with toggles/sliders for all visual features

## Phase 3 — Colour modes, charts, cinema, and recording ✅

- [x] Speed colour mode — single gradient ribbon (blue→cyan→green→yellow→red) with gradient legend
- [x] Elevation colour mode — mountain gradient (deep blue→green→yellow-green→tan→white) with gradient legend
- [x] Colour mode toggle in settings panel (Leg / Speed / Elev)
- [x] Drag-and-drop removed — manifest-only loading (cleaner UI for screen recordings)
- [x] Intro camera animation — cinematic fly-in from top-down with route fade-in over 3s
- [x] Elevation profile chart — full-width bottom panel (80px), gradient fill, leg boundary markers, click-to-scrub, hover tooltip, synced playback indicator
- [x] Layout rework — screen edge → elevation chart → controls → 3D scene stacking; all bottom elements reposition correctly when elevation profile toggled off
- [x] Cinema mode (`C` key) — hides all UI overlays, leaving only the route + animated dot visible
- [x] Vertical 9:16 preview overlay — framing guide with safe zone indicators (caption zone, buttons zone), disappears in cinema mode
- [x] Auto-play record sequence (`R` key) — resets playback → 1s pause → enables cinema mode → auto-plays
- [x] Title card — correct round-trip format (Origin → Peak → Origin), fades in/out at playback start in cinema mode
- [x] City billboard labels always visible during playback (no cinema mode hiding)
- [x] Legend repositions into 9:16 frame during vertical/cinema mode
- [x] Recording guide (`docs/RECORDING_GUIDE.md`) — full OpenScreen workflow for Instagram Reels
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
- [ ] Use OpenScreen (free, open-source Screen Studio alternative) for final social media clip recording — supports variable speed per segment, zoom, motion blur, no watermark. Download from github.com/siddharthvaddem/openscreen/releases
