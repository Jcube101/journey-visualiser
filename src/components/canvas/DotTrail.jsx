import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourneyStore } from '../../stores/useJourneyStore'

const MAX_TRAIL = 50

export default function DotTrail() {
  const lineRef = useRef()
  const positionsRef = useRef([])
  const colorsRef = useRef([])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const posArr = new Float32Array(MAX_TRAIL * 3)
    const colArr = new Float32Array(MAX_TRAIL * 4)
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 4))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useFrame(() => {
    const { dotTrail, dotTrailWidth } = useJourneyStore.getState().settings
    if (!dotTrail) {
      geometry.setDrawRange(0, 0)
      return
    }

    const dotPos = useJourneyStore.getState().dotPosition
    const dotData = useJourneyStore.getState().dotData
    if (!dotPos) {
      geometry.setDrawRange(0, 0)
      return
    }

    positionsRef.current.push([dotPos.x, dotPos.y, dotPos.z])
    colorsRef.current.push(dotData?.colour || '#ffffff')
    if (positionsRef.current.length > MAX_TRAIL) {
      positionsRef.current.shift()
      colorsRef.current.shift()
    }

    const pts = positionsRef.current
    const cols = colorsRef.current
    const posAttr = geometry.attributes.position
    const colAttr = geometry.attributes.color
    const tmpColor = new THREE.Color()

    for (let i = 0; i < pts.length; i++) {
      posAttr.setXYZ(i, pts[i][0], pts[i][1], pts[i][2])
      const opacity = 0.8 * (i / (pts.length - 1))
      tmpColor.set(cols[i])
      colAttr.setXYZW(i, tmpColor.r, tmpColor.g, tmpColor.b, opacity)
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, pts.length)

    if (lineRef.current) {
      lineRef.current.material.linewidth = dotTrailWidth
    }
  })

  return <line ref={lineRef} geometry={geometry} material={material} />
}
