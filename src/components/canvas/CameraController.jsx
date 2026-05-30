import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { VIEW_MODES } from '../../constants/viewModes'
import { getDefaultCameraPosition } from '../../utils/cameraDefaults'

const _camPos = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _dir = new THREE.Vector3()

function getIsometricCamera(sceneBounds) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = sceneBounds
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const diagonal = Math.sqrt(
    (maxX - minX) ** 2 + (maxY - minY) ** 2 + (maxZ - minZ) ** 2
  )
  const distance = diagonal * 1.2
  const azimuth = (45 * Math.PI) / 180
  const polar = (45 * Math.PI) / 180
  const horizontal = distance * Math.cos(polar)

  return {
    position: [
      cx + horizontal * Math.sin(azimuth),
      cy + distance * Math.sin(polar),
      cz + horizontal * Math.cos(azimuth),
    ],
    target: [cx, cy, cz],
  }
}

function getTopDownCamera(sceneBounds) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = sceneBounds
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const extent = Math.max(maxX - minX, maxZ - minZ) * 0.7

  return {
    position: [cx, cy + 200, cz],
    target: [cx, cy, cz],
    orthoExtent: extent,
  }
}

export default function CameraController({ sceneMetadata }) {
  const { camera, controls, gl } = useThree()
  const viewMode = useJourneyStore((s) => s.viewMode)
  const cameraResetKey = useJourneyStore((s) => s.cameraResetKey)
  const fpvLookTarget = useRef(new THREE.Vector3())
  const fpvInitialized = useRef(false)
  const savedPerspective = useRef(null)

  useEffect(() => {
    if (!sceneMetadata) return
    const sb = sceneMetadata.sceneBounds

    // Restore perspective camera if leaving top-down
    if (savedPerspective.current && viewMode !== VIEW_MODES.TOP_DOWN) {
      const { fov } = savedPerspective.current
      camera.fov = fov
      camera.near = 0.1
      camera.far = 2000
      camera.aspect = gl.domElement.clientWidth / gl.domElement.clientHeight

      if (camera.isOrthographicCamera) {
        delete camera.isOrthographicCamera
      }
      camera.updateProjectionMatrix()
      savedPerspective.current = null
    }

    if (viewMode === VIEW_MODES.TOP_DOWN) {
      if (!savedPerspective.current) {
        savedPerspective.current = { fov: camera.fov || 50 }
      }

      const { position, target, orthoExtent } = getTopDownCamera(sb)
      const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight

      camera.left = -orthoExtent * aspect
      camera.right = orthoExtent * aspect
      camera.top = orthoExtent
      camera.bottom = -orthoExtent
      camera.near = 0.1
      camera.far = 1000

      Object.defineProperty(camera, 'isOrthographicCamera', {
        value: true, writable: true, configurable: true,
      })
      camera.projectionMatrix.makeOrthographic(
        camera.left, camera.right, camera.top, camera.bottom, camera.near, camera.far
      )

      camera.position.set(...position)
      camera.lookAt(...target)
      camera.updateProjectionMatrix()

      if (controls) {
        controls.target.set(...target)
        controls.enableRotate = false
        controls.enableZoom = false
        controls.enablePan = true
        controls.update()
      }
    } else if (viewMode === VIEW_MODES.ISOMETRIC) {
      const { position, target } = getIsometricCamera(sb)
      camera.position.set(...position)
      camera.lookAt(...target)
      camera.updateProjectionMatrix()
      if (controls) {
        controls.target.set(...target)
        controls.enableRotate = false
        controls.enableZoom = false
        controls.enablePan = true
        controls.update()
      }
    } else if (viewMode === VIEW_MODES.FIRST_PERSON) {
      fpvInitialized.current = false
      if (controls) {
        controls.enableRotate = false
        controls.enableZoom = false
        controls.enablePan = false
        controls.update()
      }
    } else {
      // FREE_ROTATE
      const { position, target } = getDefaultCameraPosition(sb)
      camera.position.set(...position)
      camera.lookAt(...target)
      camera.updateProjectionMatrix()
      if (controls) {
        controls.target.set(...target)
        controls.enableRotate = true
        controls.enableZoom = true
        controls.enablePan = true
        controls.update()
      }
    }
  }, [viewMode, cameraResetKey, sceneMetadata, camera, controls, gl])

  // FPV per-frame update
  useFrame(() => {
    if (viewMode !== VIEW_MODES.FIRST_PERSON) return

    const dotPos = useJourneyStore.getState().dotPosition
    if (!dotPos) return

    const points = getFPVPoints()
    if (!points || points.length < 2) return

    const idx = useJourneyStore.getState().currentPointIndex
    const lookAhead = Math.min(idx + 5, points.length - 1)
    const nextPt = points[lookAhead]

    _dir.set(nextPt.x - dotPos.x, nextPt.y - dotPos.y, nextPt.z - dotPos.z)
    if (_dir.lengthSq() < 0.0001 && idx > 0) {
      const prevPt = points[idx - 1]
      _dir.set(dotPos.x - prevPt.x, dotPos.y - prevPt.y, dotPos.z - prevPt.z)
    }
    _dir.normalize()

    _camPos.set(
      dotPos.x - _dir.x * 12,
      dotPos.y + 5,
      dotPos.z - _dir.z * 12
    )

    _lookTarget.set(
      dotPos.x + _dir.x * 8,
      dotPos.y + _dir.y * 0.5,
      dotPos.z + _dir.z * 8
    )

    if (!fpvInitialized.current) {
      camera.position.copy(_camPos)
      fpvLookTarget.current.copy(_lookTarget)
      fpvInitialized.current = true
    } else {
      camera.position.lerp(_camPos, 0.05)
      fpvLookTarget.current.lerp(_lookTarget, 0.05)
    }

    camera.lookAt(fpvLookTarget.current)

    if (controls) {
      controls.target.copy(fpvLookTarget.current)
    }
  })

  return null
}

function getFPVPoints() {
  const tracks = useJourneyStore.getState().tracks
  if (tracks.length === 0) return null
  const combined = tracks
    .filter((t) => t.visible)
    .flatMap((t) => t.scenePoints)
  combined.sort((a, b) => {
    if (!a.time || !b.time) return 0
    return a.time.getTime() - b.time.getTime()
  })
  return combined
}
