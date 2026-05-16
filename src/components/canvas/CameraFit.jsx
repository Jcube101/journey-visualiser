import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { getDefaultCameraPosition } from '../../utils/cameraDefaults'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function CameraFit({ sceneMetadata }) {
  const { camera, controls } = useThree()
  const cameraResetKey = useJourneyStore((s) => s.cameraResetKey)

  useEffect(() => {
    if (!sceneMetadata) return

    const { position, target } = getDefaultCameraPosition(sceneMetadata.sceneBounds)

    camera.position.set(...position)
    camera.lookAt(...target)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(...target)
      controls.update()
    }
  }, [sceneMetadata, camera, controls, cameraResetKey])

  return null
}
