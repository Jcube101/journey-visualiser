import { useMemo } from 'react'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function SeaPlane() {
  const globalSceneMetadata = useJourneyStore((s) => s.globalSceneMetadata)

  const planeProps = useMemo(() => {
    if (!globalSceneMetadata) return null

    const { minX, maxX, minY, minZ, maxZ } = globalSceneMetadata.sceneBounds
    const padding = 15
    const width = (maxX - minX) + padding * 2
    const depth = (maxZ - minZ) + padding * 2
    const centreX = (minX + maxX) / 2
    const centreZ = (minZ + maxZ) / 2

    return { width, depth, centreX, centreZ, y: minY }
  }, [globalSceneMetadata])

  if (!planeProps) return null

  return (
    <group position={[planeProps.centreX, planeProps.y, planeProps.centreZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeProps.width, planeProps.depth]} />
        <meshBasicMaterial color="#0f2d52" transparent opacity={0.35} />
      </mesh>
      <gridHelper
        args={[
          Math.max(planeProps.width, planeProps.depth),
          Math.round(Math.max(planeProps.width, planeProps.depth) / 5),
          new THREE.Color('#1a4a7a'),
          new THREE.Color('#1a4a7a'),
        ]}
        position={[0, 0.01, 0]}
        material-transparent={true}
        material-opacity={0.2}
      />
    </group>
  )
}
