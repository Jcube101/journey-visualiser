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
