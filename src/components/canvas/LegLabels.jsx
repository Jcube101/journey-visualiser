import { Billboard, Text } from '@react-three/drei'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function LegLabels() {
  const tracks = useJourneyStore((s) => s.tracks)
  const legLabels = useJourneyStore((s) => s.settings.legLabels)

  if (!legLabels) return null

  return (
    <>
      {tracks
        .filter((t) => t.visible && t.scenePoints.length > 0)
        .map((track) => {
          const start = track.scenePoints[0]
          return (
            <Billboard key={track.id} position={[start.x, start.y + 1.5, start.z]} follow lockX={false} lockY={false} lockZ={false}>
              <Text
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="bottom"
                fillOpacity={0.6}
                outlineWidth={0.02}
                outlineColor="black"
              >
                {track.label}
              </Text>
            </Billboard>
          )
        })}
    </>
  )
}
