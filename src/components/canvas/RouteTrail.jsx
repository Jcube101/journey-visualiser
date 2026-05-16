import { Line } from '@react-three/drei'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function RouteTrail() {
  const tracks = useJourneyStore((s) => s.tracks)

  return (
    <>
      {tracks
        .filter((t) => t.visible)
        .map((track) => (
          <TrackSegments key={track.id} track={track} />
        ))}
    </>
  )
}

function TrackSegments({ track }) {
  const segments = splitBySegment(track.scenePoints)

  return (
    <>
      {segments.map((segPoints, i) => {
        if (segPoints.length < 2) return null
        const positions = segPoints.map((p) => [p.x, p.y, p.z])
        return (
          <Line
            key={`${track.id}-seg-${i}`}
            points={positions}
            color={track.colour}
            lineWidth={2}
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
