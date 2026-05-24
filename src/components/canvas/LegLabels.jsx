import { Billboard, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'

const DEDUP_RADIUS = 2

function extractOriginCity(label) {
  const sep = label.indexOf('→')
  if (sep !== -1) return label.slice(0, sep).trim()
  const dashSep = label.indexOf('—')
  if (dashSep !== -1) return label.slice(0, dashSep).trim()
  return label.trim()
}

export default function LegLabels() {
  const tracks = useJourneyStore((s) => s.tracks)
  const legLabels = useJourneyStore((s) => s.settings.legLabels)
  const cinemaMode = useJourneyStore((s) => s.settings.cinemaMode)

  const labels = useMemo(() => {
    const visible = tracks.filter((t) => t.visible && t.scenePoints.length > 0)
    const candidates = visible.map((track) => {
      const start = track.scenePoints[0]
      return {
        id: track.id,
        text: extractOriginCity(track.label),
        x: start.x,
        y: start.y,
        z: start.z,
      }
    })

    const deduped = []
    for (const c of candidates) {
      const duplicate = deduped.some(
        (d) =>
          d.text === c.text &&
          Math.hypot(d.x - c.x, d.z - c.z) < DEDUP_RADIUS
      )
      if (!duplicate) deduped.push(c)
    }
    return deduped
  }, [tracks])

  if (!legLabels || cinemaMode) return null

  return (
    <>
      {labels.map((l) => (
        <Billboard key={l.id} position={[l.x, l.y + 1.5, l.z]} follow lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="bottom"
            fillOpacity={0.6}
            outlineWidth={0.02}
            outlineColor="black"
          >
            {l.text}
          </Text>
        </Billboard>
      ))}
    </>
  )
}
