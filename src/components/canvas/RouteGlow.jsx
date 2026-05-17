import { Line } from '@react-three/drei'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function RouteGlow() {
  const tracks = useJourneyStore((s) => s.tracks)
  const routeGlow = useJourneyStore((s) => s.settings.routeGlow)

  if (!routeGlow) return null

  return (
    <>
      {tracks
        .filter((t) => t.visible)
        .map((track) => (
          <GlowSegments key={track.id} track={track} />
        ))}
    </>
  )
}

function GlowSegments({ track }) {
  const segments = splitBySegment(track.scenePoints)

  return (
    <>
      {segments.map((segPoints, i) => {
        if (segPoints.length < 2) return null
        const positions = segPoints.map((p) => [p.x, p.y, p.z])
        return (
          <Line
            key={`${track.id}-glow-${i}`}
            points={positions}
            color={track.colour}
            lineWidth={5}
            transparent
            opacity={0.15}
          />
        )
      })}
    </>
  )
}

function splitBySegment(points) {
  const segments = []
  let current = []
  let currentIdx = points[0]?.segmentIndex

  for (const pt of points) {
    if (pt.segmentIndex !== currentIdx) {
      segments.push(current)
      current = []
      currentIdx = pt.segmentIndex
    }
    current.push(pt)
  }

  if (current.length > 0) segments.push(current)
  return segments
}
