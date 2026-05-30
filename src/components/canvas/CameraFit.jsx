import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { getDefaultCameraPosition } from '../../utils/cameraDefaults'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { VIEW_MODES } from '../../constants/viewModes'

export default function CameraFit({ sceneMetadata }) {
  const { camera, controls } = useThree()
  const cameraResetKey = useJourneyStore((s) => s.cameraResetKey)
  const viewMode = useJourneyStore((s) => s.viewMode)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (!sceneMetadata) return
    if (viewMode !== VIEW_MODES.FREE_ROTATE) return

    const store = useJourneyStore.getState()
    if (!hasRunRef.current) {
      hasRunRef.current = true
      if (store.settings.introAnimation && !store.introDone) return
    }

    const { position, target } = getDefaultCameraPosition(sceneMetadata.sceneBounds)

    camera.position.set(...position)
    camera.lookAt(...target)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(...target)
      controls.update()
    }
  }, [sceneMetadata, camera, controls, cameraResetKey, viewMode])

  return null
}
