import { useRef, useMemo, useEffect, useCallback, useState } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

const CHART_HEIGHT = 80
const PADDING_TOP = 16
const PADDING_BOTTOM = 14
const DRAW_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM

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

export default function ElevationProfile() {
  const show = useJourneyStore((s) => s.settings.elevationProfile)
  const tracks = useJourneyStore((s) => s.tracks)
  const currentPointIndex = useJourneyStore((s) => s.currentPointIndex)
  const setCurrentPointIndex = useJourneyStore((s) => s.setCurrentPointIndex)

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
    let minEle = Infinity
    let maxEle = -Infinity
    for (const p of allPoints) {
      if (p.ele != null) {
        if (p.ele < minEle) minEle = p.ele
        if (p.ele > maxEle) maxEle = p.ele
      }
    }
    if (minEle === Infinity) minEle = 0
    if (maxEle === -Infinity) maxEle = 0

    const legBoundaries = []
    let prevTrackId = allPoints[0]?.trackId
    for (let i = 1; i < allPoints.length; i++) {
      if (allPoints[i].trackId !== prevTrackId) {
        legBoundaries.push({
          index: i,
          dist: distances[i],
          label: allPoints[i].label,
        })
        prevTrackId = allPoints[i].trackId
      }
    }

    return { distances, totalDist, minEle, maxEle, legBoundaries }
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

    const { distances, totalDist, minEle, maxEle, legBoundaries } = profile
    if (totalDist === 0) return

    const eleRange = maxEle - minEle || 1

    function xFor(dist) {
      return (dist / totalDist) * width
    }
    function yFor(ele) {
      return PADDING_TOP + DRAW_HEIGHT - ((ele - minEle) / eleRange) * DRAW_HEIGHT
    }

    // Elevation gradient fill
    const gradient = ctx.createLinearGradient(0, PADDING_TOP + DRAW_HEIGHT, 0, PADDING_TOP)
    gradient.addColorStop(0, 'rgba(26,58,107,0.6)')
    gradient.addColorStop(0.25, 'rgba(45,138,78,0.5)')
    gradient.addColorStop(0.5, 'rgba(141,184,52,0.4)')
    gradient.addColorStop(0.75, 'rgba(196,163,90,0.35)')
    gradient.addColorStop(1, 'rgba(240,238,234,0.3)')

    ctx.beginPath()
    ctx.moveTo(xFor(distances[0]), yFor(allPoints[0].ele || minEle))
    for (let i = 1; i < allPoints.length; i++) {
      ctx.lineTo(xFor(distances[i]), yFor(allPoints[i].ele || minEle))
    }
    ctx.lineTo(xFor(distances[allPoints.length - 1]), PADDING_TOP + DRAW_HEIGHT)
    ctx.lineTo(xFor(distances[0]), PADDING_TOP + DRAW_HEIGHT)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Elevation line
    const lineGrad = ctx.createLinearGradient(0, PADDING_TOP + DRAW_HEIGHT, 0, PADDING_TOP)
    lineGrad.addColorStop(0, '#1a3a6b')
    lineGrad.addColorStop(0.25, '#2d8a4e')
    lineGrad.addColorStop(0.5, '#8db834')
    lineGrad.addColorStop(0.75, '#c4a35a')
    lineGrad.addColorStop(1, '#f0eeea')

    ctx.beginPath()
    ctx.moveTo(xFor(distances[0]), yFor(allPoints[0].ele || minEle))
    for (let i = 1; i < allPoints.length; i++) {
      ctx.lineTo(xFor(distances[i]), yFor(allPoints[i].ele || minEle))
    }
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Leg boundaries
    for (const b of legBoundaries) {
      const bx = xFor(b.dist)
      ctx.beginPath()
      ctx.moveTo(bx, PADDING_TOP)
      ctx.lineTo(bx, PADDING_TOP + DRAW_HEIGHT)
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '9px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(b.label, bx + 3, PADDING_TOP + 10)
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(minEle)} m`, 2, PADDING_TOP + DRAW_HEIGHT + 11)
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(maxEle)} m`, width - 2, PADDING_TOP - 3)
    ctx.fillText(`${totalDist.toFixed(0)} km`, width - 2, PADDING_TOP + DRAW_HEIGHT + 11)

    // Current position indicator
    if (currentPointIndex >= 0 && currentPointIndex < allPoints.length) {
      const cx = xFor(distances[currentPointIndex])
      const cy = yFor(allPoints[currentPointIndex].ele || minEle)

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
      const hy = yFor(allPoints[hover.index].ele || minEle)

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
          ele: p.ele != null ? Math.round(p.ele) : null,
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
      className="absolute bottom-0 left-0 right-0 z-10"
      style={{ height: CHART_HEIGHT }}
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
          style={{ left: hover.x + 12, top: hover.y - 50 }}
        >
          {hover.ele != null && <div>{hover.ele} m elevation</div>}
          {hover.dist != null && <div>{hover.dist} km from start</div>}
          {hover.speed != null && <div>{hover.speed} km/h</div>}
        </div>
      )}
    </div>
  )
}
