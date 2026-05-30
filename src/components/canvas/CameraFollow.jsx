import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { VIEW_MODES } from '../../constants/viewModes'

const _target = new THREE.Vector3()
const _lerped = new THREE.Vector3()

export default function CameraFollow() {
  const { controls } = useThree()

  useFrame(() => {
    if (!controls) return
    const store = useJourneyStore.getState()
    const { cameraFollow } = store.settings
    if (!cameraFollow) return
    if (store.viewMode !== VIEW_MODES.FREE_ROTATE) return

    const dotPos = useJourneyStore.getState().dotPosition
    if (!dotPos) return

    _target.set(dotPos.x, dotPos.y, dotPos.z)
    _lerped.copy(controls.target).lerp(_target, 0.03)
    const dx = _lerped.x - controls.target.x
    const dy = _lerped.y - controls.target.y
    const dz = _lerped.z - controls.target.z
    controls.target.copy(_lerped)

    const cam = controls.object
    cam.position.x += dx
    cam.position.y += dy
    cam.position.z += dz
    controls.update()
  })

  return null
}
