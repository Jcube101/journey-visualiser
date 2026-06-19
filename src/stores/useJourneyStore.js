import { create } from 'zustand'
import { VIEW_MODES } from '../constants/viewModes'
import { COLOUR_MODES } from '../constants/colourModes'
import { TRACK_PALETTE } from '../constants/palette'
import { loadTripLegs } from '../utils/loadManifest'

let nextId = 1

export const useJourneyStore = create((set, get) => ({
  // --- Trip library ---
  trips: [],
  activeTripId: null,
  tripLoading: false,

  setTrips: (trips) => set({ trips: Array.isArray(trips) ? trips : [] }),

  // Fetch a trip's legs, swap out the current tracks for the new ones, and
  // re-arm the intro animation + playback so the scene presents from the start.
  loadTrip: async (tripId) => {
    set({ tripLoading: true })
    const legs = await loadTripLegs(tripId)
    if (legs.length === 0) {
      // Trip has no playable legs yet (e.g. its GPX files aren't on the Pi).
      // Leave the current scene untouched rather than blanking it out.
      set({ tripLoading: false })
      return false
    }
    get().loadLegs(legs) // replaces tracks + globalSceneMetadata atomically
    set({
      activeTripId: tripId,
      tripLoading: false,
      // reset playback to the start of the new trip
      isPlaying: false,
      currentPointIndex: 0,
      activeLeg: null,
      // re-arm the intro so it replays for the new trip (when enabled)
      introDone: false,
      introPlaying: false,
      introProgress: 0,
    })
    return true
  },

  // --- Tracks ---
  tracks: [],
  globalSceneMetadata: null,

  addTrack: (label, rawPoints, metadata, scenePoints, sceneMetadata, colour) =>
    set((s) => {
      const assignedColour = colour || TRACK_PALETTE[s.tracks.length % TRACK_PALETTE.length]
      const track = {
        id: nextId++,
        label,
        rawPoints,
        scenePoints,
        metadata,
        sceneMetadata,
        colour: assignedColour,
        visible: true,
      }
      return { tracks: [...s.tracks, track] }
    }),

  loadLegs: (legs) =>
    set(() => {
      const tracks = legs.map((leg, i) => ({
        id: nextId++,
        label: leg.legName,
        rawPoints: leg.points,
        scenePoints: leg.scenePoints,
        metadata: leg.metadata,
        sceneMetadata: leg.sceneMetadata,
        colour: leg.colour || TRACK_PALETTE[i % TRACK_PALETTE.length],
        visible: true,
      }))

      // Compute combined scene bounds across all legs
      const allBounds = tracks.map((t) => t.sceneMetadata.sceneBounds)
      const globalSceneMetadata = {
        ...tracks[0].sceneMetadata,
        sceneBounds: {
          minX: Math.min(...allBounds.map((b) => b.minX)),
          maxX: Math.max(...allBounds.map((b) => b.maxX)),
          minY: Math.min(...allBounds.map((b) => b.minY)),
          maxY: Math.max(...allBounds.map((b) => b.maxY)),
          minZ: Math.min(...allBounds.map((b) => b.minZ)),
          maxZ: Math.max(...allBounds.map((b) => b.maxZ)),
        },
      }

      return { tracks, globalSceneMetadata }
    }),

  removeTrack: (id) =>
    set((s) => {
      const tracks = s.tracks.filter((t) => t.id !== id)
      const updates = {}
      if (s.activeLeg === id) {
        updates.activeLeg = null
        updates.isPlaying = false
        updates.currentPointIndex = 0
      }
      return { tracks, ...updates }
    }),

  toggleTrackVisibility: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, visible: !t.visible } : t
      ),
    })),

  clearAllTracks: () =>
    set({
      tracks: [],
      globalSceneMetadata: null,
      isPlaying: false,
      currentPointIndex: 0,
      activeLeg: null,
    }),

  // --- Playback ---
  isPlaying: false,
  playbackSpeed: 3600,
  currentPointIndex: 0,
  activeLeg: null,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setPlaybackSpeed: (multiplier) => set({ playbackSpeed: multiplier }),
  setCurrentPointIndex: (index) => set({ currentPointIndex: index }),
  setActiveLeg: (id) => set({ activeLeg: id, currentPointIndex: 0 }),

  // --- View ---
  viewMode: VIEW_MODES.FREE_ROTATE,
  colourMode: COLOUR_MODES.ELEVATION,
  elevationExaggeration: 6.0,
  cameraResetKey: 0,

  setViewMode: (mode) => set({ viewMode: mode }),
  setColourMode: (mode) => set((s) => ({
    colourMode: mode,
    settings: {
      ...s.settings,
      dotColourMode: mode === COLOUR_MODES.LEG ? 'leg' : 'route',
    },
  })),
  resetCamera: () => set((s) => ({ cameraResetKey: s.cameraResetKey + 1 })),

  // --- Settings ---
  settings: {
    autoOrbit: true,
    autoOrbitSpeed: 0.07,
    dotTrail: true,
    dotTrailWidth: 3,
    cameraFollow: true,
    legLabels: true,
    ambientParticles: true,
    routeGlow: false,
    liveStats: true,
    dayNightBg: false,
    elevationProfile: false,
    introAnimation: false,
    speedGraph: false,
    fpvSmoothness: 0.0004,
    isoAzimuth: 45,
    isoPolar: 45,
    dotColourMode: 'route',
    cinemaMode: false,
    verticalPreview: false,
    cinemaTitle: false,
    titleCard: false,
  },

  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),

  toggleCinemaMode: () =>
    set((s) => ({
      settings: {
        ...s.settings,
        cinemaMode: !s.settings.cinemaMode,
        verticalPreview: !s.settings.cinemaMode ? false : s.settings.verticalPreview,
      },
    })),

  // --- Intro animation ---
  introPlaying: false,
  introProgress: 0,
  introDone: false,
  startIntro: () => set({ introPlaying: true, introProgress: 0, introDone: false }),
  finishIntro: () => set({ introPlaying: false, introProgress: 1, introDone: true }),
  setIntroProgress: (p) => set({ introProgress: p }),

  // --- Dot position (updated by AnimatedDot for other components to read) ---
  dotPosition: null,
  dotData: null,
  setDotState: (position, data) => set({ dotPosition: position, dotData: data }),

  setElevationExaggeration: (value) => {
    const s = get()
    if (s.tracks.length === 0 || value === s.elevationExaggeration) {
      set({ elevationExaggeration: value })
      return
    }

    // The backend pre-projects scene coords at a fixed exaggeration, and the
    // client no longer holds raw lat/lon/ele to re-project from. But scene Y is
    // strictly proportional to the exaggeration factor, so a pure Y rescale by
    // the ratio is mathematically identical to re-running the projection.
    const ratio = value / s.elevationExaggeration

    const tracks = s.tracks.map((t) => {
      const scenePoints = t.scenePoints.map((p) => ({
        ...p,
        y: p.y * ratio,
        ele: p.ele != null ? p.ele * ratio : p.ele,
      }))
      const sb = t.sceneMetadata.sceneBounds
      const sceneMetadata = {
        ...t.sceneMetadata,
        elevationExaggeration: value,
        sceneBounds: { ...sb, minY: sb.minY * ratio, maxY: sb.maxY * ratio },
      }
      return { ...t, scenePoints, sceneMetadata }
    })

    const allBounds = tracks.map((t) => t.sceneMetadata.sceneBounds)
    const globalSceneMetadata = {
      ...tracks[0].sceneMetadata,
      sceneBounds: {
        minX: Math.min(...allBounds.map((b) => b.minX)),
        maxX: Math.max(...allBounds.map((b) => b.maxX)),
        minY: Math.min(...allBounds.map((b) => b.minY)),
        maxY: Math.max(...allBounds.map((b) => b.maxY)),
        minZ: Math.min(...allBounds.map((b) => b.minZ)),
        maxZ: Math.max(...allBounds.map((b) => b.maxZ)),
      },
    }

    set({ elevationExaggeration: value, tracks, globalSceneMetadata })
  },
}))
