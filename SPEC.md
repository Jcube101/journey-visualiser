# Technical Specification

## Stack

- **React 19** — UI framework
- **Vite 8** — build tool and dev server
- **React Three Fiber (R3F)** — React renderer for Three.js
- **Drei** — R3F helper components (OrbitControls, camera rigs, etc.)
- **Zustand** — state management
- **Tailwind CSS v4** — styling (via `@tailwindcss/vite` plugin)

## GPX Input

Source: OsmAnd-generated GPX files.

- May contain multiple track segments (`<trkseg>`) per file
- Each trackpoint includes: `lat`, `lon`, `ele` (elevation), `time` (timestamp)
- Optional extension: `osmand:speed` (instantaneous speed in m/s)

### Manifest Format

`public/gpx/index.json` — grouped legs with optional colour override:

```json
[
  { "leg": "Leg 1", "colour": null, "files": ["file1a.gpx", "file1b.gpx"] },
  { "leg": "Leg 2", "colour": null, "files": ["file2.gpx"] }
]
```

A leg with multiple files has its points merged and sorted by timestamp before being treated as a single track.

## Coordinate Transform

GPS coordinates (lat/lon/elevation) are converted to a normalised 3D scene space:

- Lat/lon mapped to X/Z plane using equirectangular projection (lon scaled by cos(centreLat))
- Elevation mapped to the Y axis with configurable exaggeration (default 6x, range 1x–10x)
- All values normalised so the longest axis fits within 100 scene units
- Multi-leg trips use shared global bounds (`overrideBounds`) so legs stitch geographically

## Camera

### Default View

Computed dynamically from the scene bounding box — never hardcoded:

- **Azimuth:** 45° (diagonal view)
- **Polar angle:** 30° above horizontal (shows both map shape and elevation)
- **Distance:** bounding box diagonal × 1.2 (fits full route in frame)

The same position is used on initial load and when "Reset view" is clicked.

## Sea Level Reference Plane

- Flat plane at global `minY` (base of elevation range)
- Colour: `#0f2d52` (navy) at 35% opacity
- Grid lines every 5 scene units at 20% opacity (`#1a4a7a`)
- Extends 15 units beyond route XZ bounds on each side
- Responds to elevation exaggeration slider (stays at base)

## Multi-Leg Support

- Multiple GPX files can be loaded simultaneously
- Each leg is rendered as a distinct coloured segment (auto-assigned from palette)
- All legs share a global coordinate system so they stitch geographically
- Manifest supports grouped files per leg (merged by timestamp)

## Colour Modes

Three modes, toggled via settings panel (Leg / Speed / Elev):

### LEG

Each leg rendered with its assigned palette colour. Legend shows colour dots with leg names.

### SPEED

Per-point vertex colouring based on instantaneous speed, normalised against global max speed across all legs.

| Speed range | Colour | Hex |
|-------------|--------|-----|
| 0–20 km/h (city/stops) | Blue | `#1a66ff` |
| 20–40 km/h | Cyan | `#00d4ff` |
| 40–70 km/h | Green | `#00ff88` |
| 70–100 km/h | Yellow | `#ffee00` |
| 100+ km/h | Red | `#ff3300` |

Gradient stops at t=0, 0.2, 0.4, 0.7, 1.0. Legend shows gradient bar with "0 km/h → {maxSpeed} km/h".

### ELEVATION (default)

Per-point vertex colouring based on elevation, normalised against global min/max elevation across all legs.

| Elevation range | Colour | Hex |
|-----------------|--------|-----|
| Lowest (sea level) | Deep blue | `#1a3a6b` |
| Low-mid (plains) | Green | `#2d8a4e` |
| Mid | Yellow-green | `#8db834` |
| High (plateau) | Tan | `#c4a35a` |
| Peak (mountain) | White | `#f0eeea` |

Gradient stops at t=0, 0.25, 0.5, 0.75, 1.0. Legend shows gradient bar with "{minEle} m → {maxEle} m".

### Implementation

- RouteTrail passes `vertexColors` array (per-point `[r, g, b]` tuples) to Drei `<Line>` when in SPEED or ELEVATION mode
- RouteGlow uses the same vertex colours at `lineWidth: 5` / `opacity: 0.15`
- Global stats (maxSpeed, minEle, maxEle) computed once via `useMemo` across all visible tracks
- GradientLegend component renders CSS gradient bar with data-driven min/max labels; hidden in LEG mode

## Intro Animation

One-time cinematic camera fly-in on page load:

- **Start:** Camera at 2.5× fitted distance, directly above scene centre, looking straight down
- **End:** Default camera position (azimuth 45°, polar 30°, 1.2× bbox diagonal distance)
- **Duration:** 3 seconds
- **Easing:** Hermite ease-in-out (`t² × (3 - 2t)`)
- **Route fade:** Route lines (RouteTrail + RouteGlow) fade from opacity 0 → 1 simultaneously via imperative `material.opacity` updates in `useFrame` (no React re-renders)
- **Visible throughout:** Sea plane, ambient particles, grid — only routes fade in
- **Controls:** OrbitControls disabled during intro, re-enabled after completion
- **One-shot:** Tracked by `introDone` Zustand flag; Reset View does not replay the intro
- **Toggleable:** `introAnimation` setting (default on) — when off, intro is skipped entirely

## View Modes

### 1. Free-rotate

Full OrbitControls — draggable, zoomable, rotatable. Path rendered as a 3D ribbon coloured by speed or elevation.

### 2. Isometric

Fixed diagonal camera angle (45° azimuth, ~35° elevation). No user rotation. Elevation visible as vertical displacement in the scene.

### 3. First-person fly-through

Camera positioned behind and slightly above the animated dot, looking forward along the path. Route visible ahead of the current position.

### 4. Top-down

Orthographic camera looking straight down. Path coloured by speed or elevation as a heatmap. No perspective distortion.

## Animated Dot

- Glowing sphere (emissive material + transparent outer halo + point light)
- Travels all legs continuously in driving-time order — seamless leg transitions
- Position interpolated smoothly between adjacent points using accumulator pattern
- Colour matches the active leg's palette colour, updates dynamically at transitions
- Animation driven by `useFrame` — advances based on cumulative driving-time gaps × playback speed
- Publishes `dotPosition` ({x, y, z}) and `dotData` (full point data) to Zustand store each frame

### Dot Trail

- Fading comet tail rendered as a `<line>` with per-vertex RGBA colours
- Last 50 positions stored in a ring buffer, updated each frame from `dotPosition`
- Opacity fades from 80% at the dot to 0% at the tail end
- Additive blending (`THREE.AdditiveBlending`) with `depthWrite: false` for glow effect
- Trail width configurable via settings slider (1–8, default 3)

## Playback System

### Driving-Time Timeline

- Playback uses cumulative driving time, **not** wall clock time
- Gap threshold: **5 minutes** (`REST_THRESHOLD_MS = 5 * 60 * 1000`) — configurable constant in `usePlaybackPoints.js`
- Gaps exceeding the threshold are treated as rest stops: 0ms added to cumulative time, dot jumps instantly to next point
- Each point in the combined array carries a `drivingTimeMs` field (milliseconds of cumulative driving time from journey start)
- The `usePlaybackPoints` hook (shared by AnimatedDot, PlaybackControls, LiveStatsBar) builds this array and logs the total driving time on first computation

### Playback Controls

- Play / Pause toggle
- Scrubber bar (full journey progress across all legs combined)
- Speed selector: 1x, 2x, 5x, 10x, 50x, 100x, 3600x
- 3600x plays ~21 hours of driving time in ~21 seconds (close to 24-second social clip target)
- Driving time display: "4h 23m / 12h 05m driven" format (current / total)
- Leg indicator with colour dot and label
- Positioned as bottom-centre dark bar with backdrop blur

## Settings Panel

Gear icon button (top-right corner), opens a compact dark panel with toggles and sliders. All settings persisted in Zustand store under `settings` slice. Panel closes on gear click or click-outside.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Auto-orbit | toggle | on | Slow camera rotation during playback. Pauses when user grabs mouse, resumes after 2s inactivity |
| Orbit speed | slider | 0.07 rad/s | Range 0.01–0.2 rad/s (visible when auto-orbit is on) |
| Dot trail | toggle | on | Fading comet tail behind animated dot |
| Trail width | slider | 3 | Range 1–8 (visible when dot trail is on) |
| Camera follow | toggle | on | Camera slowly pans to keep dot centred |
| Leg labels | toggle | on | Billboard text at each leg's start point |
| Ambient particles | toggle | on | ~200 faint drifting particles in scene volume |
| Route glow | toggle | off | Thicker low-opacity duplicate line behind each route |
| Elevation profile | toggle | on | 2D elevation chart above playback controls, click-to-scrub |
| Live stats | toggle | on | Top-right panel showing elevation, speed, distance, driving time |
| Day/night background | toggle | on | Background shifts by GPX timestamp: black (8pm–6am), dark navy (6am–8pm) |
| Intro animation | toggle | off | Cinematic camera fly-in on page load (3s, plays once) |
| Route colour | 3-way | Elevation | LEG (palette), SPEED (gradient), ELEVATION (gradient) |
| Cinema mode | toggle | off | Hides all UI overlays except legend and city labels (`C` key) |
| Vertical preview | toggle | off | 9:16 framing overlay for screen recording |
| Cinema title | toggle | off | Subtle journey title visible in cinema mode |
| Title card | toggle | off | Fade-in/out journey title + distance at playback start |

## Visual Features

### Route Glow

Subtle emissive glow on route lines: a second `<Line>` per segment rendered at `lineWidth: 5` with `opacity: 0.15`, drawn behind the primary `lineWidth: 2` route line.

### Leg Labels

Billboard `<Text>` showing the **origin city name only** (text before the `→` separator in the leg name), not the full leg name. Deduplicated by location proximity — if two legs share a start point within `DEDUP_RADIUS` (2 scene units) and have the same city name, only one label is rendered. Always faces camera. Small white text at 60% opacity with thin black outline. Positioned 1.5 units above the start point.

Leg names in all UI elements (legend, playback bar, live stats) read directly from the `leg` field in index.json — no hardcoding.

### Ambient Particles

200 `<points>` scattered across a 200×80×200 volume. Size 0.15, white at 12% opacity, slowly drifting with random velocities. Depth write disabled.

### Day/Night Background

Scene background colour transitions based on the current dot's GPX timestamp:
- Night (8pm–6am): `#0a0a0f` (deep black)
- Day (7am–7pm): `#0c1225` (very dark navy)
- Smooth hermite transition during 6–7am and 7–8pm

### Elevation Profile Chart

Full-width 2D area chart (80px tall) pinned flush to the viewport bottom edge:

- X axis: cumulative distance (km) computed via haversine between consecutive points
- Y axis: elevation (m) with global min/max across all legs
- Filled area under the elevation curve with vertical gradient matching elevation colour stops (blue at bottom → white at peaks)
- Elevation line on top using same gradient
- Faint vertical lines at each leg boundary with labels inside the chart area
- White vertical indicator line + dot synced to `currentPointIndex`
- Click anywhere to scrub playback to that distance
- Hover shows tooltip: elevation (m), distance from start (km), speed (km/h)
- Rendered via HTML Canvas 2D (no charting library) for performance — redraws on currentPointIndex change
- Dark semi-transparent background (`bg-black/50 backdrop-blur-sm`) with top border only
- Axis labels: min/max elevation, total distance
- Conditionally rendered (`settings.elevationProfile && <ElevationProfile />`) — fully unmounted when toggled off

## Bottom Layout Stacking Order

From viewport bottom edge upward:

1. **Screen edge** (bottom: 0)
2. **Elevation profile chart** — 80px tall, full width, flush to bottom
3. **Controls row** (bottom: 92px = 80px chart + 12px gap):
   - Left: ControlsPanel (elevation slider + reset view)
   - Centre: PlaybackControls pill + driving time/leg indicator
4. **3D scene** — full viewport height, chart overlays the bottom portion

When elevation profile is toggled off:
- ControlsPanel drops to `bottom-4`
- PlaybackControls drops to `bottom-6`
- No gap or ghost container remains

### Live Stats Bar

Small panel (top-right, below settings gear) showing live values updated as dot moves:
- Current elevation (m) — from `dotData.ele`
- Current speed (km/h) — from `dotData.speed` × 3.6
- Distance covered (km) — haversine sum up to `currentPointIndex`
- Driving time elapsed — from `dotData.drivingTimeMs`

## State (Zustand)

- `tracks` — array of loaded/parsed track data
- `globalSceneMetadata` — combined scene bounds across all legs
- `viewMode` — active view mode enum
- `colourMode` — LEG, SPEED, or ELEVATION
- `elevationExaggeration` — Y axis multiplier (1–10)
- `isPlaying` — playback state
- `playbackSpeed` — multiplier (default 3600)
- `currentPointIndex` — scrub position
- `activeLeg` — which track is being animated
- `cameraResetKey` — incremented to trigger camera reset
- `settings` — all visual feature toggles and slider values (see Settings Panel table)
- `dotPosition` — {x, y, z} of animated dot's current interpolated position (updated each frame)
- `dotData` — full point data at current index (ele, speed, time, drivingTimeMs, colour, etc.)
- `introPlaying` — whether the intro animation is currently active
- `introProgress` — 0→1 progress of the intro animation (read imperatively via getState, not subscribed)
- `introDone` — whether the intro has completed (prevents replay on Reset View)

## Cinema Mode

Triggered by `C` key or settings toggle. Hides all UI overlays (controls panel, playback controls, live stats bar, settings panel, elevation profile) leaving only:
- The 3D route and animated dot
- City billboard labels (always visible when `legLabels` is on)
- Colour legend (gradient bar or leg dots) — repositioned into the 9:16 frame
- Cinema title (optional, via `cinemaTitle` setting)
- Title card (optional, via `titleCard` setting)

Entering cinema mode forces `verticalPreview` to `false` in the store so the framing overlay doesn't appear in recordings.

## Vertical Preview Overlay

CSS-only overlay — no canvas resizing or DOM restructuring. Draws a centred 9:16 rectangle calculated as `width = viewportHeight × 9/16`, centred horizontally. Components:
- Dark mask (60% black) on left and right sides
- White border around the 9:16 cutout
- Caption safe zone: bottom 15%, faint red border + label
- Buttons safe zone: right 10%, faint red border + label

Only renders when `verticalPreview === true && cinemaMode === false`.

## Auto-Play Record Sequence

Triggered by `R` key. Sequence:
1. Pause playback and reset `currentPointIndex` to 0
2. Wait 1 second
3. Enable cinema mode (if not already on)
4. Start playback

## Title Card

Renders in `TitleCard.jsx`. Shows journey title + total distance (km) as a centred overlay that fades in and out over 2.5 seconds at playback start. Only active when both `cinemaMode` and `titleCard` settings are on.

Title logic (generic for any round trip):
1. Extract first city from leg 1's label (text before `→`)
2. Find the furthest destination by haversine distance from start point across all legs
3. Extract last city from the final leg's label (text after last `→`)
4. Format: `Origin → Furthest → Destination` (or `Origin → Destination` for one-way, or just `Origin` if start equals end with no intermediate peak)

## Legend Positioning

In normal mode: `top: 16px, left: 16px` (standard top-left corner).

In vertical preview or cinema mode: legend shifts to sit inside the 9:16 recording frame:
- `left = (viewportWidth - frameWidth) / 2 + 16px` where `frameWidth = viewportHeight × 9/16`
- `top = 56px` (below the title card area: 40px title + 16px gap)
- Responsive to window resizes via `useEffect` + resize listener
