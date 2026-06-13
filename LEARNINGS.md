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

## 2026-05-30 — FPV smoothness, chart toggles, and dot colour

### FPV smoothness is highly subjective and road-dependent

A configurable lerp slider is far better than a hardcoded value. 0.0004 is the sweet spot for winding mountain roads like the Kodaikanal ghats — the camera glides through hairpins with a cinematic float. Tighter values (0.02–0.05) work better on straight highways where you want the camera to respond more immediately. The range 0.0002–0.05 covers everything from extremely floaty to near-instant tracking.

### Bottom offset stacking needs a single computed value

Bottom offset stacking for multiple optional charts needs a single computed value derived from which combination of charts is active — not per-chart assumptions about what else is visible. The original speed graph toggle only worked when elevation profile was also on because the render condition and bottom position both assumed the elevation chart was present. The fix: each chart mounts/unmounts independently, and the bottom offset is computed from the full 4-state matrix (none/elev/speed/both = 0/80/60/152px).

### Dot colour in Route mode requires cached global ranges

When the dot colour matches the speed or elevation gradient in real time, it needs global min/max values to normalise against. Computing these by iterating all raw points every frame is wasteful — the values don't change during playback. Cache them with `useMemo` keyed on the tracks array. The per-frame work reduces to a single `speedToColor` or `elevationToColor` call.

## 2026-06-12 — Pi static frontend deployment

### Nginx can't traverse a 700 home directory, even when dist/ is correct

The single biggest gotcha deploying this to the Pi: Nginx's `www-data` worker cannot traverse a `700` home directory to reach `dist/`, even though `dist/` and all its contents had correct permissions. Every request returned HTTP 500 with `stat() ".../dist/index.html" failed (13: Permission denied)` in the Nginx error log. The fix is `sudo chmod o+x /home/jcube` — this adds traverse (execute) only, no read bit, so others still can't list the home directory's contents. Easily reversible with `chmod o-x`.

This is **different from the pi-service-migration skill's documented 403 fix** (`chmod -R 755 dist`), which only applies when `dist/` *itself* has wrong permissions. A 403 means the block is on `dist/`; a 500 with "Permission denied" means the block is higher up the path (the home directory or `projects/`). Diagnose with `namei -l /home/<user>/projects/<repo>/dist/index.html` — it shows the permission bits at every level of the path.

### Node v22 works fine on Pi aarch64 for React/Vite builds

The skill recommends Node 18+; the Pi is running v22 and the Vite build completed cleanly on aarch64 despite v22 being newer than recommended. No native-dependency issues for a standard React/Vite stack.

### Static frontends need no systemd service

Unlike the backend migration pattern (venv + uvicorn + systemd), a static frontend deploy is just **Nginx + cloudflared**. There is no service process to supervise — Nginx serves the files. The update workflow is correspondingly simpler than a backend: `git pull → npm install → npm run build → sudo systemctl reload nginx`. No service restart is needed; the Nginx reload picks up the freshly built `dist/` immediately.

## 2026-06-12 — Moving GPX private: frontend repoint to /api/legs

The GPX is now served privately by a FastAPI backend (`journey-visualiser-api`, systemd `journey-api`, 127.0.0.1:8009) that parses/merges/trims/transforms server-side and returns scene coordinates. The frontend `loadManifest.js` was repointed from `fetch('/gpx/index.json')` + client-side GPX parse/geoTransform to a single `fetch('/api/legs')`. Several non-obvious consequences fell out of the API deliberately **never** returning raw lat/lon/ele:

### Elevation colour mode needs an `ele` proxy — alias it to scene Y

The default ELEVATION colour mode reads `point.ele` in RouteTrail/RouteGlow/AnimatedDot to normalise colours. The API strips real elevation, but scene `y` is an affine function of true elevation (`y = (ele − centreEle) · eleScale · exaggeration`), so normalising over `y` gives an **identical** 0→1 colour ramp. Aliasing `ele = y` in `loadManifest` kept all three components working untouched — no need to send the real metres.

### Elevation slider: rescale Y by the exaggeration ratio, don't re-project

`setElevationExaggeration` used to re-run `transformToScene(rawPoints, …)` on raw coords. With no raw coords client-side that would produce `NaN` and blank the scene. But scene Y is **strictly proportional** to the exaggeration factor, so `y_new = y_old · (newExag / oldExag)` is mathematically identical to re-projecting — a pure rescale of Y (and the Y scene-bounds) with no lat/lon needed. Cheap and exact.

### Distance readouts: a shared `sceneDistanceKm()` helper from scene deltas

LiveStatsBar/SpeedGraph/ElevationProfile/TitleCard all computed distance via haversine on lat/lon. Without those, distance is reconstructed from scene space: dividing a scene delta by the shared projection `scale` recovers degrees (the X axis already carries the `cos(lat)` correction), and `1° ≈ 111.32 km`. Factored into `sceneDistanceKm(ax, az, bx, bz, scale)` in `geoTransform.js` so the magic constant lives in one place.

### JSON loses the Date type — re-parse `time` from the ISO string

The client parser produced `Date` objects; JSON serialisation flattens these to ISO strings. Many consumers call `.getTime()`/`.getHours()` (playback timeline, day/night background, camera ordering), which silently break on a string. `loadManifest` must re-wrap each point's `time` as `new Date(p.time)` after the fetch.

### Don't `git pull` a Pi working tree that has uncommitted edits

The documented deploy recipe starts with `git pull`, which assumes changes arrive from the remote. When editing **directly in the Pi clone**, the working tree already holds the changes — pulling first risks merge conflicts against the uncommitted edits (and is a no-op at best). The clean order is: edit in the working tree → build/deploy → `git commit` → `git push`. Future pulls are then conflict-free because local and remote are back in sync.

## 2026-06-12 — Stripping raw coordinates from an API requires a full consumer audit

The headline lesson from moving GPX behind the API: **when you remove a field from a data contract, you must audit every downstream consumer — the dependencies are often silent.** Removing raw lat/lon/ele from the `/api/legs` response broke four features that read those fields indirectly, none of which threw an obvious error:

- **Elevation colour mode** read `point.ele` to normalise the colour ramp.
- **Distance readouts** (LiveStatsBar, SpeedGraph, ElevationProfile, TitleCard) computed haversine over lat/lon.
- **Elevation slider** re-ran `transformToScene` on raw coords.
- **Day/night background** read `point.time` as a `Date`.

Most failed *silently* — `prev.lat != null` guards just made distances quietly read 0, and `NaN` coordinates blanked the scene rather than erroring. A grep for `.lat`/`.lon`/`.ele`/`.time`/`.getTime` across `src/` was the only reliable way to find them all.

### Aliasing `ele → y` works because the projection is affine

Scene `y = (ele − centreEle) · eleScale · exaggeration` is an **affine function of elevation** (positive slope). Normalising over `y` between `[minY, maxY]` yields the exact same 0→1 parameter as normalising elevation over `[minEle, maxEle]`, so elevation colours are pixel-identical without ever shipping real metres. The same affine property is why the elevation slider can just **rescale `y` by the exaggeration ratio** instead of re-projecting.

### `sceneDistanceKm()` — reconstructing geographic distance from scene coords

Dividing a scene-space delta by the shared projection `scale` recovers degrees (the X axis already bakes in the `cos(lat)` correction), and `1° ≈ 111.32 km`: `km = hypot(Δx/scale, Δz/scale) · 111.32`. This is the correct general pattern for getting real distances back out of a normalised scene when the source coordinates are gone.

### JSON has no Date type — always re-parse ISO strings on the client

`JSON.stringify(new Date())` emits an ISO string and `JSON.parse` gives it straight back as a string, never a `Date`. Any consumer calling `.getTime()`/`.getHours()` breaks silently. Re-wrap with `new Date(str)` at the fetch boundary.

### Edit the Pi working tree *before* pulling, not after

(Reiterating the prior entry from real recurrence.) Pulling into a dirty working tree risks conflicts — edit, build, commit, push, and only then are future pulls clean.

### SCP from Git Bash fails with a cloudflared ProxyCommand

Copying files to the Pi via `scp` from **Git Bash** fails when `~/.ssh/config` uses a cloudflared `ProxyCommand` with a Windows-style path — Git Bash can't execute it. Use **PowerShell** `scp` (with `C:\Users\...` paths) instead, or rewrite the `ProxyCommand` path to `/c/Users/...` for Git Bash compatibility.

## 2026-06-13 — In-memory startup caching for the /api/legs backend

`/api/legs` re-parsed and re-projected every GPX file on every request. The processed result is immutable between GPX uploads, so the fix is **build once at startup, serve from memory** — the correct pattern for expensive one-time computation behind a read-mostly endpoint.

### FastAPI `lifespan` handler is the right place to build the cache

A `lifespan` async context manager runs the build **before the service accepts requests**, so there's no lazy first-hit penalty — the very first request is already warm. (Cleaner than the deprecated `@app.on_event("startup")`.) The cache lives in module-level variables; a `POST /api/cache/reload` endpoint rebuilds them after new files are added, and `/health` exposes a `cache_built_at` timestamp so you can see when it last built.

### Cache the *pre-serialised bytes*, not just the Python object

Caching the Python object still made FastAPI re-serialise ~1.5 MB of JSON on every request (~0.2s). Serialising **once** at build time into `json.dumps(...).encode()` and returning a raw `Response(content=bytes, media_type="application/json")` drops the hot path to a memory read. Result: **0.49s → 0.010s (≈50×)**, constant regardless of dataset size.

### Custom query params must bypass the cache

The cache is keyed to the default parameters. A request with `?exaggeration=` needs a different projection, so it **correctly skips the cache and computes fresh** — only the default (the sole hot path, since the frontend's elevation slider rescales client-side) is served from bytes. Caching only the common case keeps the fast path trivial without breaking the flexible one.

### Distinguish endpoint compute from network latency

Through the Cloudflare Tunnel `/api/legs` takes ~1.37s, but the endpoint itself answers in 0.010s locally — the difference is **network overhead (Cloudflare edge ↔ Pi), not compute**, so there's nothing to optimise server-side there. The originally-reported ~30s could not be reproduced (steady-state was 0.49s before caching); it was most likely a **Pi cold start or load spike**, not normal operation. Lesson: measure the local endpoint and the tunnel separately before assuming the code is the bottleneck.
