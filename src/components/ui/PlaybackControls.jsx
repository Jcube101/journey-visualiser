import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

const SPEED_OPTIONS = [1, 2, 5, 10, 50, 100, 3600]

export default function PlaybackControls() {
  const isPlaying = useJourneyStore((s) => s.isPlaying)
  const playbackSpeed = useJourneyStore((s) => s.playbackSpeed)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)
  const play = useJourneyStore((s) => s.play)
  const pause = useJourneyStore((s) => s.pause)
  const setPlaybackSpeed = useJourneyStore((s) => s.setPlaybackSpeed)
  const setCurrentPointIndex = useJourneyStore((s) => s.setCurrentPointIndex)

  const showElevProfile = useJourneyStore((s) => s.settings.elevationProfile)
  const showSpeedGraph = useJourneyStore((s) => s.settings.speedGraph)

  const allPoints = usePlaybackPoints()

  if (allPoints.length === 0) return null

  const current = allPoints[currentPointIndex] || allPoints[0]
  const drivingMs = current?.drivingTimeMs || 0
  const totalMs = allPoints[allPoints.length - 1]?.drivingTimeMs || 0

  const legLabel = current?.label || '—'

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2`} style={{ bottom: (showElevProfile && showSpeedGraph ? 152 : showElevProfile ? 92 : showSpeedGraph ? 72 : 24) }}>
      <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 flex items-center gap-4 min-w-[420px]">
        <button
          onClick={() => isPlaying ? pause() : play()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={allPoints.length - 1}
          value={currentPointIndex}
          onChange={(e) => setCurrentPointIndex(Number(e.target.value))}
          className="flex-1 h-1 accent-white/60 cursor-pointer"
        />

        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                playbackSpeed === s
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: current?.colour || '#fff' }}
          />
          {legLabel}
        </span>
        <span>{formatDrivingTime(drivingMs)} / {formatDrivingTime(totalMs)} driven</span>
      </div>
    </div>
  )
}

function formatDrivingTime(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
