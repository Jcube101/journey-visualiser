# Learnings

Running log of architectural decisions, discoveries, and lessons learned.

---

## 2026-05-16 — Initial architecture decisions

### R3F over raw Three.js

React Three Fiber gives cleaner React integration — components are declarative, lifecycle is managed by React, and Drei provides pre-built helpers (OrbitControls, camera rigs, shaders) that eliminate significant boilerplate. Trade-off: slightly more abstraction, but the ecosystem maturity makes it worthwhile for a React app.

### Zustand over Context/Redux

Lightweight and works naturally across the R3F canvas boundary. React context can be awkward with R3F because the canvas runs in a separate reconciler — Zustand sidesteps this entirely with module-level stores. No providers needed.

### Raspberry Pi + Nginx over Vercel

Static build served via Nginx behind a Cloudflare tunnel already in place. Keeps everything self-hosted. Manual deploy-on-update is acceptable for a personal tool — no CI/CD overhead needed. The Pi is always on and the tunnel is stable.

### OsmAnd as the GPX source

OsmAnd produces multi-segment files with the `osmand:speed` extension (instantaneous speed in m/s). Elevation is present on all points. Timestamps are reliable. This means we can derive speed colouring directly from the data rather than computing it from position deltas.

## 2026-05-16 — First real data

Source file: Bengaluru → Dindigul leg.

- 4,358 trackpoints
- ~400 km distance
- 8 hours 36 minutes duration
- Elevation range: 28m – 846m
- 3 track segments within a single GPX file

## 2026-05-17 — Dynamic camera positioning

### Why spherical angles, not hardcoded coordinates

Hardcoded camera positions are trip-specific — a good angle for a west-east route looks wrong for a north-south one. Spherical coordinates relative to the scene centre (azimuth + polar angle + distance from bounding box diagonal) produce a consistently good cinematic angle regardless of route direction or scale.

Final formula: azimuth 45° (diagonal view), polar 30° above horizontal, distance = bbox diagonal × 1.2.

### Debug overlay pattern

When tuning visual parameters like camera angle, temporarily expose the live values in the UI (position + target updating in real time as you orbit) so you can find a good angle empirically. Then translate the discovery into a generic formula and remove the overlay. This is faster than guessing multipliers in code and rebuilding.

## 2026-05-17 — Playback and visual polish

### Cumulative driving time replaces wall clock time

Real GPX timestamps include overnight stops, city rest periods, and any pause longer than a few minutes. Playing back wall clock time means the dot sits motionless for hours at every stop — unusable for a cinematic visualisation. The fix: when building the combined point array, calculate the time gap between consecutive points. If the gap exceeds 5 minutes (REST_THRESHOLD_MS), treat it as a rest stop and skip it — jump directly to the next point with 0ms added. Replace the raw timestamp gaps with a cumulative driving-time offset (`drivingTimeMs`) on each point. All playback advancement and interpolation uses this driving timeline.

### 3600x speed calculation

Total driving time for the Bengaluru trip is roughly 21 hours. At 3600x speed, 21 hours of driving time plays back in ~21 seconds — close enough to the 24-second social clip target. The hook logs the exact total and the ideal multiplier for a 24s playback on first computation.

### Split file floating dot bug

When a leg's GPX files aren't all listed in `index.json`, the dot jumps through empty space between file endpoints because there's no position data connecting them. The fix is always to group all split files for the same leg under the same leg entry in the manifest. This isn't a code fix — it's a data problem.

### CLI auto mode and --dangerously-skip-permissions

`--dangerously-skip-permissions` was used for this session. Claude Code's auto mode (skipping tool approval prompts) requires a Pro Max subscription or above; using the flag bypasses this for trusted local projects where every change is reviewed via git diff before committing.

## 2026-05-18 — Leg naming and city labels

### Leg names must come from index.json, never hardcoded

The tool is designed for any future trip, not just this one. Hardcoding city names anywhere in the code would make it trip-specific. All display names (legend, playback bar, labels) flow from the `leg` field in index.json — rename the leg there and the entire UI updates.

### Deduplication by proximity, not just by name

City labels on the 3D map are deduplicated by matching name AND proximity (within 2 scene units). This is better than name-only deduplication because future trips may have repeated city names at genuinely different locations (e.g. visiting the same city on different days via different routes that don't overlap geographically).

### Colour is sufficient to distinguish legs on the map

Verbose labels like "Bengaluru → Dindigul" on the 3D map add clutter without adding clarity — the leg colours already distinguish segments, and the legend shows full names. Billboard labels should be minimal: just the city name at that point.

## 2026-05-18 — Colour modes and intro animation

### Per-point vertex colouring in R3F

Drei's `<Line>` component accepts a `vertexColors` prop — an array of `[r, g, b]` tuples, one per point. This is fundamentally different from setting a single `color` on the material. The Line component internally sets the material colour to white and enables `vertexColors: true` on the geometry when this prop is present. The colour values must be linear (0–1 floats), not sRGB hex strings.

### Global normalisation is essential for colour consistency

Speed and elevation gradients must normalise against global min/max across all legs, not per-leg. Per-leg normalisation would make every leg's gradient span the full colour range regardless of actual values — a slow city leg and a fast highway leg would look identical. Global normalisation ensures that 40 km/h looks the same shade of green whether it's on leg 1 or leg 4.

### Intro animation timing: after tracks load, not on mount

The intro animation must only trigger after tracks are loaded and scene metadata is ready, not on component mount. Using a Zustand flag (`introDone`) to track whether the intro has played ensures it fires exactly once and doesn't conflict with CameraFit's initial positioning. CameraFit checks the flag and skips its first run when an intro is pending.

### Imperative opacity animation avoids re-render storms

Animating route opacity during the intro by subscribing to `introProgress` in RouteTrail would cause 180 React re-renders (60fps × 3s), each reconstructing all Line components. Instead, use `useFrame` to imperatively traverse the group's children and set `material.opacity` directly — zero re-renders, smooth animation.

## 2026-05-18 — Bottom layout and toggle behaviour

### Conditional rendering over CSS hide for toggled panels

Using `{flag && <Component />}` to unmount a toggled panel is better than hiding it with CSS (`display: none` or `opacity: 0`). CSS hide leaves the container in the DOM, which breaks layout calculations for sibling elements that position themselves relative to the hidden panel. When ElevationProfile was CSS-hidden but still mounted, PlaybackControls stayed at `bottom-[92px]` because it couldn't know the chart was visually gone. Conditional rendering removes the element entirely, and siblings can respond to its absence via a shared setting flag.

### Shared offset constant for bottom panel stacking

All bottom-positioned elements (PlaybackControls, ControlsPanel) need to agree on the chart height so they can offset above it. Rather than magic numbers scattered across files, both components read `settings.elevationProfile` and apply the same conditional: `bottom-[92px]` when chart is present (80px chart + 12px gap), default bottom offset when absent. A CSS variable or shared constant would be even cleaner for future additions to the bottom stack.

## 2026-05-30 — Vertical recording workflow and social media

### CSS overlay beats canvas resizing for framing guides

For screen recording framing (9:16 vertical), use a CSS overlay (dark mask + white border + safe zone guides) rather than resizing the canvas or constraining the WebGL viewport. The scene renders at full resolution; the overlay only shows where to position the recording region. The screen recorder (OBS/OpenScreen) handles the actual crop. This keeps the 3D rendering unchanged and avoids aspect ratio bugs in Three.js.

### OBS with ffmpeg -c copy for trim/strip pipeline

OBS at high bitrate is the correct tool for quality screen recording. Trimming with `ffmpeg -c copy` (no re-encoding) gives zero quality loss. Clipchamp and Windows Snipping Tool both compress aggressively and introduce artifacts. The pipeline: OBS record → ffmpeg trim → upload.

### ElevenLabs and Indian place names

ElevenLabs text-to-speech struggles with Indian place names (Bengaluru, Kodaikanal, Dindigul). Two workarounds: phonetic spelling in the script, or rewriting to avoid specific names entirely. Avoiding names produces cleaner audio with fewer retakes.

### Instagram caption should complement voiceover, not repeat it

When the Reel has a voiceover telling the story, keep the caption short — it should add context (dates, distance, gear) rather than repeat what the audio already says. Long captions compete with the audio for attention.

### Best posting time for Indian travel content on Instagram

Saturday 8 PM IST. First Reel posted successfully — Bengaluru → Kodaikanal → Bengaluru, May 2026.

## 2026-05-30 — View modes and camera systems

### FPV needs independent lerp on position AND lookAt

The first-person camera must lerp both `camera.position` and the `lookAt` target independently. Lerping only position causes the camera to snap its gaze direction each frame while gliding smoothly — visually jarring, especially through hairpin turns. Lerping only lookAt makes the camera feel disconnected from the dot. Both must use the same lerp factor (0.05) for a cohesive cinematic feel. The look-ahead distance (8 units ahead of the dot) matters more than the follow distance for smoothness.

### Orthographic camera fitting differs from perspective

Top-down view requires an orthographic frustum sized from scene bounds (`Math.max(sizeX, sizeZ) * 0.7`), not a FOV-based distance calculation. The perspective camera's `fov` + `distance` approach doesn't translate — you set `left/right/top/bottom` on the camera directly and call `makeOrthographic()`. Switching between perspective and orthographic on the same camera object requires saving/restoring the original fov and cleaning up the `isOrthographicCamera` property.

### Speed graph and elevation profile share patterns

Both charts use identical click-to-scrub, hover tooltip, resize observer, and playback indicator logic. Currently duplicated. If they diverge further or a third chart is added, extract the shared Canvas 2D chart scaffolding (resize, draw loop, indexFromX, hover state) into a shared hook.
