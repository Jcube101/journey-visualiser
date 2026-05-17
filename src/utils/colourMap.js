import * as THREE from 'three'

const SPEED_STOPS = [
  { t: 0, color: new THREE.Color('#1a66ff') },
  { t: 0.2, color: new THREE.Color('#00d4ff') },
  { t: 0.4, color: new THREE.Color('#00ff88') },
  { t: 0.7, color: new THREE.Color('#ffee00') },
  { t: 1.0, color: new THREE.Color('#ff3300') },
]

const ELEVATION_STOPS = [
  { t: 0, color: new THREE.Color('#1a3a6b') },
  { t: 0.25, color: new THREE.Color('#2d8a4e') },
  { t: 0.5, color: new THREE.Color('#8db834') },
  { t: 0.75, color: new THREE.Color('#c4a35a') },
  { t: 1.0, color: new THREE.Color('#f0eeea') },
]

const _tmp = new THREE.Color()

function sampleGradient(stops, t) {
  const clamped = Math.max(0, Math.min(1, t))
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].t && clamped <= stops[i + 1].t) {
      const local = (clamped - stops[i].t) / (stops[i + 1].t - stops[i].t)
      _tmp.copy(stops[i].color).lerp(stops[i + 1].color, local)
      return [_tmp.r, _tmp.g, _tmp.b]
    }
  }
  const last = stops[stops.length - 1].color
  return [last.r, last.g, last.b]
}

export function speedToColor(speedMs, maxSpeedMs) {
  if (maxSpeedMs <= 0) return [0.1, 0.4, 1]
  const kmh = speedMs * 3.6
  const maxKmh = maxSpeedMs * 3.6
  const t = Math.min(kmh / Math.max(maxKmh, 1), 1)
  return sampleGradient(SPEED_STOPS, t)
}

export function elevationToColor(ele, minEle, maxEle) {
  const range = maxEle - minEle
  if (range <= 0) return [0.18, 0.54, 0.18]
  const t = (ele - minEle) / range
  return sampleGradient(ELEVATION_STOPS, t)
}

export const SPEED_CSS_GRADIENT = 'linear-gradient(to right, #1a66ff, #00d4ff, #00ff88, #ffee00, #ff3300)'
export const ELEVATION_CSS_GRADIENT = 'linear-gradient(to right, #1a3a6b, #2d8a4e, #8db834, #c4a35a, #f0eeea)'
