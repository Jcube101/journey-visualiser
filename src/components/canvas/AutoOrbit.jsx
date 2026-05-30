import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { VIEW_MODES } from '../../constants/viewModes'

export default function AutoOrbit() {
  const { controls } = useThree()
  const lastInteraction = useRef(0)
  const wasInteracting = useRef(false)

  useFrame((state, delta) => {
    if (!controls) return
    const store = useJourneyStore.getState()
    const { autoOrbit, autoOrbitSpeed } = store.settings
    const isPlaying = store.isPlaying
    const viewMode = store.viewMode
    if (!autoOrbit || !isPlaying) return
    if (viewMode !== VIEW_MODES.FREE_ROTATE) return

    const now = state.clock.getElapsedTime()

    if (controls._isDragging || controls._isRotating) {
      wasInteracting.current = true
      lastInteraction.current = now
      return
    }

    if (wasInteracting.current) {
      wasInteracting.current = false
      lastInteraction.current = now
    }

    if (now - lastInteraction.current < 2) return

    controls.azimuthAngle != null
      ? (controls.azimuthAngle += autoOrbitSpeed * delta)
      : (controls.autoRotate = false)

    const azimuth = Math.atan2(
      state.camera.position.x - controls.target.x,
      state.camera.position.z - controls.target.z
    )
    const radius = Math.sqrt(
      Math.pow(state.camera.position.x - controls.target.x, 2) +
      Math.pow(state.camera.position.z - controls.target.z, 2)
    )

    const newAzimuth = azimuth + autoOrbitSpeed * delta
    state.camera.position.x = controls.target.x + radius * Math.sin(newAzimuth)
    state.camera.position.z = controls.target.z + radius * Math.cos(newAzimuth)
    state.camera.lookAt(controls.target)
    controls.update()
  })

  return null
}
