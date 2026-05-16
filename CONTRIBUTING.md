# Contributing

## Codebase Structure

```
src/
├── components/
│   ├── canvas/       # Three.js/R3F scene components
│   └── ui/           # HTML overlay UI (Tailwind)
├── hooks/            # Custom React hooks
├── utils/            # Pure functions (parsing, transforms)
├── stores/           # Zustand state stores
└── constants/        # Enums, palettes, config
```

## How to Add a New View Mode

1. Create a new camera controller component in `src/components/canvas/` (e.g., `IsometricCamera.jsx`)
2. Add the enum value to `src/constants/viewModes.js`
3. Add a selector option in `src/components/ui/ViewModeSelector.jsx`
4. Wire the Zustand store's `viewMode` state to conditionally render your camera controller in the scene

## GPX Data Flow

```
File dropped
  → src/utils/gpxParser.js (parse XML, extract points)
  → Normalised track array (lat, lon, ele, time, speed per point)
  → Zustand store (useJourneyStore.addTrack)
  → RouteTrail component reads tracks from store, renders geometry
  → AnimatedDot component reads playback progress, interpolates position
```

## How to Add a New Colour Mode

1. Add the colour mode enum to `src/constants/`
2. Define the colour ramp/palette in the same file
3. Update the `RouteTrail` component's shader or material logic to map the new data dimension to vertex colours
4. Add a toggle in the UI to switch between colour modes

## AI Context File

`CLAUDE.md` is the AI context file for Claude Code. Update it whenever:

- A significant architectural decision is made
- A new utility or component is added
- The build process or folder structure changes
