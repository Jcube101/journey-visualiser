import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'

const COUNT = 200

export default function AmbientParticles() {
  const meshRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 200
      arr[i * 3 + 1] = Math.random() * 80
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return arr
  }, [])

  const velocities = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.02
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return arr
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const { ambientParticles } = useJourneyStore.getState().settings
    meshRef.current.visible = ambientParticles
    if (!ambientParticles) return

    const posAttr = meshRef.current.geometry.attributes.position
    for (let i = 0; i < COUNT; i++) {
      posAttr.array[i * 3] += velocities[i * 3]
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1]
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2]
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.15} transparent opacity={0.12} sizeAttenuation depthWrite={false} />
    </points>
  )
}
