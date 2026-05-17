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
- Elevation mapped to the Y axis with configurable exaggeration (default 3x, range 1x–10x)
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
- Travels all legs continuously in timestamp order — seamless leg transitions
- Position interpolated smoothly between adjacent points using accumulator pattern
- Colour matches the active leg's palette colour, updates dynamically at transitions
- Animation driven by `useFrame` — advances based on real GPX time gaps × playback speed

## Playback Controls

- Play / Pause toggle
- Scrubber bar (full journey progress across all legs combined)
- Speed selector: 1x, 2x, 5x, 10x, 50x, 100x, 3600x
- 3600x plays a 24-hour journey in 24 seconds (for screen recording / social clips)
- Current timestamp display: "Day N — H:MM AM/PM" format
- Leg indicator with colour dot and label
- Positioned as bottom-centre dark bar with backdrop blur

## State (Zustand)

- `tracks` — array of loaded/parsed track data
- `globalSceneMetadata` — combined scene bounds across all legs
- `viewMode` — active view mode enum
- `colourMode` — speed vs elevation colouring
- `elevationExaggeration` — Y axis multiplier (1–10)
- `isPlaying` — playback state
- `playbackSpeed` — multiplier
- `currentPointIndex` — scrub position
- `activeLeg` — which track is being animated
- `cameraResetKey` — incremented to trigger camera reset
