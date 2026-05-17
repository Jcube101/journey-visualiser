import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

export default function LiveStatsBar() {
  const liveStats = useJourneyStore((s) => s.settings.liveStats)
  const dotData = useJourneyStore((s) => s.dotData)
  const dotPosition = useJourneyStore((s) => s.dotPosition)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)

  const allPoints = usePlaybackPoints()

  if (!liveStats || !dotData || !dotPosition) return null

  const elevation = dotData.ele != null ? dotData.ele.toFixed(0) : '—'
  const speed = dotData.speed != null ? (dotData.speed * 3.6).toFixed(1) : '—'

  let distanceKm = 0
  for (let i = 1; i <= currentPointIndex && i < allPoints.length; i++) {
    const prev = allPoints[i - 1]
    const cur = allPoints[i]
    if (prev.lat != null && cur.lat != null) {
      distanceKm += haversine(prev.lat, prev.lon, cur.lat, cur.lon)
    }
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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
