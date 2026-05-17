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
