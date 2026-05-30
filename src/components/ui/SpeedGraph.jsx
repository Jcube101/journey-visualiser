import { useRef, useMemo, useEffect, useCallback, useState } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

const CHART_HEIGHT = 60
const PADDING_TOP = 12
const PADDING_BOTTOM = 12
const DRAW_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM

const SPEED_STOPS = [
  { t: 0, r: 26, g: 102, b: 255 },
  { t: 0.2, r: 0, g: 212, b: 255 },
  { t: 0.4, r: 0, g: 255, b: 136 },
  { t: 0.7, r: 255, g: 238, b: 0 },
  { t: 1.0, r: 255, g: 51, b: 0 },
]

function speedColor(t) {
  const c = Math.max(0, Math.min(1, t))
  for (let i = 0; i < SPEED_STOPS.length - 1; i++) {
    if (c >= SPEED_STOPS[i].t && c <= SPEED_STOPS[i + 1].t) {
      const local = (c - SPEED_STOPS[i].t) / (SPEED_STOPS[i + 1].t - SPEED_STOPS[i].t)
      const a = SPEED_STOPS[i], b = SPEED_STOPS[i + 1]
      return `rgb(${Math.round(a.r + (b.r - a.r) * local)},${Math.round(a.g + (b.g - a.g) * local)},${Math.round(a.b + (b.b - a.b) * local)})`
    }
  }
  const last = SPEED_STOPS[SPEED_STOPS.length - 1]
  return `rgb(${last.r},${last.g},${last.b})`
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function SpeedGraph() {
  const tracks = useJourneyStore((s) => s.tracks)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)
  const setCurrentPointIndex = useJourneyStore((s) => s.setCurrentPointIndex)
  const showElevProfile = useJourneyStore((s) => s.settings.elevationProfile)

  const allPoints = usePlaybackPoints()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [width, setWidth] = useState(0)

  const profile = useMemo(() => {
    if (allPoints.length === 0) return null

    const distances = [0]
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1]
      const cur = allPoints[i]
      const d =
        prev.lat != null && cur.lat != null
          ? haversine(prev.lat, prev.lon, cur.lat, cur.lon)
          : 0
      distances.push(distances[i - 1] + d)
    }

    const totalDist = distances[distances.length - 1]
    let maxSpeed = 0
    for (const p of allPoints) {
      if (p.speed != null) {
        const kmh = p.speed * 3.6
        if (kmh > maxSpeed) maxSpeed = kmh
      }
    }

    return { distances, totalDist, maxSpeed }
  }, [allPoints])

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !profile || width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = CHART_HEIGHT * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, CHART_HEIGHT)

    const { distances, totalDist, maxSpeed } = profile
    if (totalDist === 0 || maxSpeed === 0) return

    function xFor(dist) {
      return (dist / totalDist) * width
    }
    function yFor(kmh) {
      return PADDING_TOP + DRAW_HEIGHT - (kmh / maxSpeed) * DRAW_HEIGHT
    }

    // Draw filled segments coloured by speed
    for (let i = 0; i < allPoints.length - 1; i++) {
      const kmh = allPoints[i].speed != null ? allPoints[i].speed * 3.6 : 0
      const kmhNext = allPoints[i + 1].speed != null ? allPoints[i + 1].speed * 3.6 : 0
      const x1 = xFor(distances[i])
      const x2 = xFor(distances[i + 1])
      if (x2 - x1 < 0.3) continue

      const col = speedColor(kmh / maxSpeed)
      ctx.beginPath()
      ctx.moveTo(x1, yFor(kmh))
      ctx.lineTo(x2, yFor(kmhNext))
      ctx.lineTo(x2, PADDING_TOP + DRAW_HEIGHT)
      ctx.lineTo(x1, PADDING_TOP + DRAW_HEIGHT)
      ctx.closePath()
      ctx.fillStyle = col
      ctx.globalAlpha = 0.5
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Speed line on top
    ctx.beginPath()
    const firstKmh = allPoints[0].speed != null ? allPoints[0].speed * 3.6 : 0
    ctx.moveTo(xFor(distances[0]), yFor(firstKmh))
    for (let i = 1; i < allPoints.length; i++) {
      const kmh = allPoints[i].speed != null ? allPoints[i].speed * 3.6 : 0
      ctx.lineTo(xFor(distances[i]), yFor(kmh))
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 0.8
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('0 km/h', 2, PADDING_TOP + DRAW_HEIGHT + 10)
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(maxSpeed)} km/h`, width - 2, PADDING_TOP - 1)

    // Current position indicator
    if (currentPointIndex >= 0 && currentPointIndex < allPoints.length) {
      const cx = xFor(distances[currentPointIndex])
      const kmh = allPoints[currentPointIndex].speed != null ? allPoints[currentPointIndex].speed * 3.6 : 0
      const cy = yFor(kmh)

      ctx.beginPath()
      ctx.moveTo(cx, PADDING_TOP)
      ctx.lineTo(cx, PADDING_TOP + DRAW_HEIGHT)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    }

    // Hover indicator
    if (hover != null && hover.index >= 0 && hover.index < allPoints.length) {
      const hx = xFor(distances[hover.index])
      const kmh = allPoints[hover.index].speed != null ? allPoints[hover.index].speed * 3.6 : 0
      const hy = yFor(kmh)

      ctx.beginPath()
      ctx.moveTo(hx, PADDING_TOP)
      ctx.lineTo(hx, PADDING_TOP + DRAW_HEIGHT)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fill()
    }
  }, [allPoints, profile, width, currentPointIndex, hover])

  useEffect(() => {
    draw()
  }, [draw])

  const indexFromX = useCallback(
    (clientX) => {
      if (!containerRef.current || !profile || profile.totalDist === 0) return -1
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const frac = Math.max(0, Math.min(1, x / rect.width))
      const targetDist = frac * profile.totalDist
      let lo = 0
      let hi = profile.distances.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (profile.distances[mid] < targetDist) lo = mid + 1
        else hi = mid
      }
      return lo
    },
    [profile]
  )

  const handleClick = useCallback(
    (e) => {
      const idx = indexFromX(e.clientX)
      if (idx >= 0) setCurrentPointIndex(idx)
    },
    [indexFromX, setCurrentPointIndex]
  )

  const handleMouseMove = useCallback(
    (e) => {
      const idx = indexFromX(e.clientX)
      if (idx >= 0 && idx < allPoints.length) {
        const p = allPoints[idx]
        setHover({
          index: idx,
          speed: p.speed != null ? (p.speed * 3.6).toFixed(1) : null,
          dist: profile ? profile.distances[idx].toFixed(1) : null,
          x: e.clientX,
          y: e.clientY,
        })
      }
    },
    [indexFromX, allPoints, profile]
  )

  const handleMouseLeave = useCallback(() => setHover(null), [])

  if (allPoints.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 z-10"
      style={{ height: CHART_HEIGHT, bottom: showElevProfile ? 80 : 0 }}
    >
      <div className="w-full h-full bg-black/50 backdrop-blur-sm border-t border-white/10 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: CHART_HEIGHT }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      {hover && (
        <div
          className="fixed z-30 bg-black/80 border border-white/15 rounded px-2 py-1 text-[10px] text-white/80 pointer-events-none whitespace-nowrap"
          style={{ left: hover.x + 12, top: hover.y - 40 }}
        >
          {hover.speed != null && <div>{hover.speed} km/h</div>}
          {hover.dist != null && <div>{hover.dist} km from start</div>}
        </div>
      )}
    </div>
  )
}
