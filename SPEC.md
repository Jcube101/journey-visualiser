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

## Coordinate Transform

GPS coordinates (lat/lon/elevation) are converted to a normalised 3D scene space:

- Lat/lon mapped to X/Z plane, centred on the track's bounding box midpoint
- Elevation mapped to the Y axis with configurable exaggeration factor to make terrain drama visible
- All values normalised so the scene fits within a consistent viewport regardless of absolute GPS coordinates

## Multi-Leg Support

- Multiple GPX files can be loaded simultaneously
- Each file is rendered as a distinct coloured segment
- Segments can be overlaid in the same scene or stitched end-to-end

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

- Travels the route based on recorded timestamps
- Configurable playback speed multiplier
- Smooth interpolation between trackpoints

## Playback Controls

- Play / Pause
- Scrub (seek to any point on the timeline)
- Speed multiplier (1x, 2x, 5x, 10x, etc.)

## State (Zustand)

- `tracks` — array of loaded/parsed track data
- `viewMode` — active view mode enum
- `isPlaying` — playback state
- `playbackProgress` — current position (0–1)
- `colourMode` — speed vs elevation colouring
