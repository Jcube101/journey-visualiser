import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { COLOUR_MODES } from '../../constants/colourModes'
import { speedToColor, elevationToColor } from '../../utils/colourMap'

const BASE_OPACITY = 0.15

export default function RouteGlow() {
  const groupRef = useRef()
  const tracks = useJourneyStore((s) => s.tracks)
  const routeGlow = useJourneyStore((s) => s.settings.routeGlow)
  const colourMode = useJourneyStore((s) => s.colourMode)

  useFrame(() => {
    if (!groupRef.current) return
    const { introProgress, introDone } = useJourneyStore.getState()
    const opacity = introDone ? BASE_OPACITY : BASE_OPACITY * introProgress
    groupRef.current.traverse((child) => {
      if (child.material) {
        child.material.opacity = opacity
      }
    })
  })

  const { maxSpeed, minEle, maxEle } = useMemo(() => {
    let maxS = 0, minE = Infinity, maxE = -Infinity
    for (const t of tracks) {
      if (!t.visible) continue
      for (const p of t.scenePoints) {
        if (p.speed != null && p.speed > maxS) maxS = p.speed
        if (p.ele != null) {
          if (p.ele < minE) minE = p.ele
          if (p.ele > maxE) maxE = p.ele
        }
      }
    }
    return { maxSpeed: maxS, minEle: minE === Infinity ? 0 : minE, maxEle: maxE === -Infinity ? 0 : maxE }
  }, [tracks])

  if (!routeGlow) return null

  return (
    <group ref={groupRef}>
      {tracks
        .filter((t) => t.visible)
        .map((track) => (
          <GlowSegments
            key={`${track.id}-glow-${colourMode}`}
            track={track}
            colourMode={colourMode}
            maxSpeed={maxSpeed}
            minEle={minEle}
            maxEle={maxEle}
          />
        ))}
    </group>
  )
}

function GlowSegments({ track, colourMode, maxSpeed, minEle, maxEle }) {
  const segments = useMemo(() => splitBySegment(track.scenePoints), [track.scenePoints])

  return (
    <>
      {segments.map((segPoints, i) => {
        if (segPoints.length < 2) return null
        const positions = segPoints.map((p) => [p.x, p.y, p.z])

        if (colourMode === COLOUR_MODES.LEG) {
          return (
            <Line
              key={`${track.id}-glow-${i}`}
              points={positions}
              color={track.colour}
              lineWidth={5}
              transparent
              opacity={BASE_OPACITY}
            />
          )
        }

        const vertexColors = segPoints.map((p) => {
          if (colourMode === COLOUR_MODES.SPEED) {
            return speedToColor(p.speed || 0, maxSpeed)
          }
          return elevationToColor(p.ele || 0, minEle, maxEle)
        })

        return (
          <Line
            key={`${track.id}-glow-${i}`}
            points={positions}
            vertexColors={vertexColors}
            lineWidth={glowWidth}
            transparent
            opacity={BASE_OPACITY}
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
