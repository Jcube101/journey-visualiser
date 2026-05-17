import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { getDefaultCameraPosition } from '../../utils/cameraDefaults'
import { useJourneyStore } from '../../stores/useJourneyStore'

const DURATION = 3

function easeInOut(t) {
  return t * t * (3 - 2 * t)
}

export default function IntroAnimation({ sceneMetadata }) {
  const { camera, controls } = useThree()
  const elapsedRef = useRef(0)
  const startPosRef = useRef(null)
  const endRef = useRef(null)
  const activeRef = useRef(false)

  useEffect(() => {
    if (!sceneMetadata) return
    const store = useJourneyStore.getState()
    if (store.introDone) return
    if (!store.settings.introAnimation) {
      store.finishIntro()
      return
    }

    const { position: endPos, target } = getDefaultCameraPosition(sceneMetadata.sceneBounds)
    const { minX, maxX, minY, maxY, minZ, maxZ } = sceneMetadata.sceneBounds
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cz = (minZ + maxZ) / 2
    const sizeX = maxX - minX
    const sizeY = maxY - minY
    const sizeZ = maxZ - minZ
    const diagonal = Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ)
    const farDist = diagonal * 2.5

    const startPos = [cx, cy + farDist, cz + 0.01]

    startPosRef.current = startPos
    endRef.current = { position: endPos, target }
    elapsedRef.current = 0
    activeRef.current = true

    camera.position.set(...startPos)
    camera.lookAt(cx, cy, cz)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(cx, cy, cz)
      controls.enabled = false
      controls.update()
    }

    useJourneyStore.getState().startIntro()
  }, [sceneMetadata, camera, controls])

  useFrame((_, delta) => {
    if (!activeRef.current || !endRef.current) return

    elapsedRef.current += delta
    const raw = Math.min(elapsedRef.current / DURATION, 1)
    const t = easeInOut(raw)

    useJourneyStore.setState({ introProgress: t })

    const start = startPosRef.current
    const end = endRef.current

    camera.position.set(
      start[0] + (end.position[0] - start[0]) * t,
      start[1] + (end.position[1] - start[1]) * t,
      start[2] + (end.position[2] - start[2]) * t,
    )
    camera.lookAt(...end.target)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(...end.target)
      controls.update()
    }

    if (raw >= 1) {
      activeRef.current = false
      if (controls) controls.enabled = true
      useJourneyStore.getState().finishIntro()
    }
  })

  return null
}
