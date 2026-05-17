import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

export default function AnimatedDot() {
  const meshRef = useRef()
  const lightRef = useRef()
  const accumulatorRef = useRef(0)

  const isPlaying = useJourneyStore((s) => s.isPlaying)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)

  const allPoints = usePlaybackPoints()

  useFrame((_, delta) => {
    if (allPoints.length < 2) return
    if (!meshRef.current) return

    const store = useJourneyStore.getState()
    let idx = store.currentPointIndex

    if (store.isPlaying) {
      const realMs = delta * 1000 * store.playbackSpeed
      accumulatorRef.current += realMs

      let advanced = false
      while (idx < allPoints.length - 1) {
        const cur = allPoints[idx]
        const nxt = allPoints[idx + 1]
        const drivingGap = nxt.drivingTimeMs - cur.drivingTimeMs
        const effectiveGap = Math.max(drivingGap, 1)

        if (accumulatorRef.current >= effectiveGap) {
          accumulatorRef.current -= effectiveGap
          idx++
          advanced = true
        } else {
          break
        }
      }

      if (idx >= allPoints.length - 1) {
        useJourneyStore.setState({ isPlaying: false, currentPointIndex: 0 })
        accumulatorRef.current = 0
        idx = 0
      } else if (advanced) {
        useJourneyStore.setState({ currentPointIndex: idx })
      }
    } else {
      accumulatorRef.current = 0
    }

    idx = useJourneyStore.getState().currentPointIndex
    const pt = allPoints[idx]
    if (!pt) return

    let x = pt.x, y = pt.y, z = pt.z

    const nxt = allPoints[idx + 1]
    if (nxt) {
      const drivingGap = nxt.drivingTimeMs - pt.drivingTimeMs
      if (drivingGap > 0) {
        const t = Math.min(accumulatorRef.current / drivingGap, 1)
        x = pt.x + (nxt.x - pt.x) * t
        y = pt.y + (nxt.y - pt.y) * t
        z = pt.z + (nxt.z - pt.z) * t
      }
    }

    meshRef.current.position.set(x, y, z)
    if (lightRef.current) lightRef.current.position.set(x, y, z)

    useJourneyStore.setState({
      dotPosition: { x, y, z },
      dotData: pt,
    })

    const colour = pt.colour || '#ffffff'
    if (meshRef.current.children[0]?.material) {
      meshRef.current.children[0].material.color.set(colour)
      meshRef.current.children[0].material.emissive.set(colour)
    }
    if (meshRef.current.children[1]?.material) {
      meshRef.current.children[1].material.color.set(colour)
    }
    if (lightRef.current) lightRef.current.color.set(colour)
  })

  if (allPoints.length === 0) return null

  const initial = allPoints[currentPointIndex] || allPoints[0]

  return (
    <group>
      <group ref={meshRef} position={[initial.x, initial.y, initial.z]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color={initial.colour || '#ffffff'}
            emissive={initial.colour || '#ffffff'}
            emissiveIntensity={2}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color={initial.colour || '#ffffff'}
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>
      <pointLight
        ref={lightRef}
        position={[initial.x, initial.y, initial.z]}
        color={initial.colour || '#ffffff'}
        intensity={3}
        distance={8}
      />
    </group>
  )
}
