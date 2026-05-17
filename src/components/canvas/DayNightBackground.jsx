import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'

const NIGHT = new THREE.Color('#0a0a0f')
const DAY = new THREE.Color('#0c1225')
const _color = new THREE.Color()

export default function DayNightBackground() {
  const { scene } = useThree()

  useFrame(() => {
    const { dayNightBg } = useJourneyStore.getState().settings
    if (!dayNightBg) {
      scene.background = NIGHT
      return
    }

    const dotData = useJourneyStore.getState().dotData
    if (!dotData?.time) {
      scene.background = NIGHT
      return
    }

    const hour = dotData.time.getHours() + dotData.time.getMinutes() / 60
    let t = 0
    if (hour >= 7 && hour <= 19) {
      t = 1
    } else if (hour > 6 && hour < 7) {
      t = hour - 6
    } else if (hour > 19 && hour < 20) {
      t = 20 - hour
    }

    t = t * t * (3 - 2 * t)
    _color.copy(NIGHT).lerp(DAY, t)
    scene.background = _color
  })

  return null
}
