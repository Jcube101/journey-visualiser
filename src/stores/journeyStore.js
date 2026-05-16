import { create } from 'zustand'
import { VIEW_MODES } from '../constants/viewModes'

export const useJourneyStore = create((set) => ({
  tracks: [],
  viewMode: VIEW_MODES.FREE_ROTATE,
  isPlaying: false,
  playbackProgress: 0,

  addTrack: (track) => set((s) => ({ tracks: [...s.tracks, track] })),
  removeTrack: (id) => set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),
  clearTracks: () => set({ tracks: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
}))
