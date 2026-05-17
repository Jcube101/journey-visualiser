import { useMemo } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'

const SPEED_OPTIONS = [1, 2, 5, 10, 50, 100, 3600]

export default function PlaybackControls() {
  const tracks = useJourneyStore((s) => s.tracks)
  const isPlaying = useJourneyStore((s) => s.isPlaying)
  const playbackSpeed = useJourneyStore((s) => s.playbackSpeed)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)
  const play = useJourneyStore((s) => s.play)
  const pause = useJourneyStore((s) => s.pause)
  const setPlaybackSpeed = useJourneyStore((s) => s.setPlaybackSpeed)
  const setCurrentPointIndex = useJourneyStore((s) => s.setCurrentPointIndex)

  const allPoints = useMemo(() => {
    if (tracks.length === 0) return []
    const combined = tracks
      .filter((t) => t.visible)
      .flatMap((t) => t.scenePoints.map((p) => ({ ...p, trackId: t.id, colour: t.colour, label: t.label })))
    combined.sort((a, b) => {
      if (!a.time || !b.time) return 0
      return a.time.getTime() - b.time.getTime()
    })
    return combined
  }, [tracks])

  if (allPoints.length === 0) return null

  const current = allPoints[currentPointIndex] || allPoints[0]
  const progress = allPoints.length > 1 ? currentPointIndex / (allPoints.length - 1) : 0

  const timestamp = current?.time
    ? formatTimestamp(current.time, allPoints[0]?.time)
    : '—'

  const legLabel = current?.label || '—'

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
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
        <span>{timestamp}</span>
      </div>
    </div>
  )
}

function formatTimestamp(time, startTime) {
  if (!time) return '—'
  const dayNum = startTime
    ? Math.floor((time.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1
  const hours = time.getHours()
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `Day ${dayNum} — ${h12}:${minutes} ${ampm}`
}
