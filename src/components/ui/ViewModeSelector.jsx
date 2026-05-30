import { useJourneyStore } from '../../stores/useJourneyStore'
import { VIEW_MODES } from '../../constants/viewModes'

const MODES = [
  { key: VIEW_MODES.FREE_ROTATE, label: 'Free' },
  { key: VIEW_MODES.ISOMETRIC, label: 'Iso' },
  { key: VIEW_MODES.FIRST_PERSON, label: 'FPV' },
  { key: VIEW_MODES.TOP_DOWN, label: 'Top' },
]

export default function ViewModeSelector() {
  const viewMode = useJourneyStore((s) => s.viewMode)
  const setViewMode = useJourneyStore((s) => s.setViewMode)
  const resetCamera = useJourneyStore((s) => s.resetCamera)

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex bg-black/60 border border-white/10 rounded-full backdrop-blur-sm overflow-hidden">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setViewMode(m.key); resetCamera() }}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              viewMode === m.key
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
