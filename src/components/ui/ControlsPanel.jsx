import { useJourneyStore } from '../../stores/useJourneyStore'

export default function ControlsPanel() {
  const elevationExaggeration = useJourneyStore((s) => s.elevationExaggeration)
  const setElevationExaggeration = useJourneyStore((s) => s.setElevationExaggeration)
  const resetCamera = useJourneyStore((s) => s.resetCamera)
  const showElevProfile = useJourneyStore((s) => s.settings.elevationProfile)

  return (
    <div className={`absolute left-4 z-10 bg-black/60 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm flex items-center gap-4 ${showElevProfile ? 'bottom-[92px]' : 'bottom-4'}`}>
      <label className="flex items-center gap-3 text-white/60 text-xs">
        <span className="w-20">Elevation {elevationExaggeration.toFixed(1)}x</span>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={elevationExaggeration}
          onChange={(e) => setElevationExaggeration(parseFloat(e.target.value))}
          className="w-28 accent-white/60"
        />
      </label>
      <button
        onClick={resetCamera}
        className="text-white/50 hover:text-white/90 text-xs border border-white/15 hover:border-white/30 rounded px-2 py-1 transition-colors"
      >
        Reset view
      </button>
    </div>
  )
}
