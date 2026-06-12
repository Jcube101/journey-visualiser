import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'
import { sceneDistanceKm } from '../../utils/geoTransform'

export default function LiveStatsBar() {
  const liveStats = useJourneyStore((s) => s.settings.liveStats)
  const dotData = useJourneyStore((s) => s.dotData)
  const dotPosition = useJourneyStore((s) => s.dotPosition)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)
  const scale = useJourneyStore((s) => s.globalSceneMetadata?.scale)

  const allPoints = usePlaybackPoints()

  if (!liveStats || !dotData || !dotPosition) return null

  const elevation = dotData.ele != null ? dotData.ele.toFixed(0) : '—'
  const speed = dotData.speed != null ? (dotData.speed * 3.6).toFixed(1) : '—'

  let distanceKm = 0
  for (let i = 1; i <= currentPointIndex && i < allPoints.length; i++) {
    const prev = allPoints[i - 1]
    const cur = allPoints[i]
    distanceKm += sceneDistanceKm(prev.x, prev.z, cur.x, cur.z, scale)
  }

  const drivingMs = dotData.drivingTimeMs || 0
  const h = Math.floor(drivingMs / 3600000)
  const m = Math.floor((drivingMs % 3600000) / 60000)
  const elapsed = `${h}h ${m}m`

  return (
    <div className="absolute top-14 right-4 z-10 bg-black/60 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm text-[10px] text-white/60 space-y-1 min-w-[140px]">
      <Row label="Elevation" value={`${elevation} m`} />
      <Row label="Speed" value={`${speed} km/h`} />
      <Row label="Distance" value={`${distanceKm.toFixed(1)} km`} />
      <Row label="Elapsed" value={elapsed} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 tabular-nums">{value}</span>
    </div>
  )
}
