import { useState, useEffect, useRef } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

const DURATION = 2500
const FADE_IN = 500
const FADE_OUT = 500

export default function TitleCard() {
  const titleCard = useJourneyStore((s) => s.settings.titleCard)
  const cinemaMode = useJourneyStore((s) => s.settings.cinemaMode)
  const isPlaying = useJourneyStore((s) => s.isPlaying)
  const tracks = useJourneyStore((s) => s.tracks)
  const trips = useJourneyStore((s) => s.trips)
  const activeTripId = useJourneyStore((s) => s.activeTripId)
  const allPoints = usePlaybackPoints()

  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const timerRef = useRef(null)
  const animRef = useRef(null)
  const prevPlayingRef = useRef(false)

  useEffect(() => {
    if (!titleCard || !cinemaMode) return
    if (isPlaying && !prevPlayingRef.current) {
      setVisible(true)
      setOpacity(0)

      const start = performance.now()
      const animate = () => {
        const elapsed = performance.now() - start
        if (elapsed < FADE_IN) {
          setOpacity(elapsed / FADE_IN)
          animRef.current = requestAnimationFrame(animate)
        } else if (elapsed < DURATION - FADE_OUT) {
          setOpacity(1)
          animRef.current = requestAnimationFrame(animate)
        } else if (elapsed < DURATION) {
          setOpacity(1 - (elapsed - (DURATION - FADE_OUT)) / FADE_OUT)
          animRef.current = requestAnimationFrame(animate)
        } else {
          setOpacity(0)
          setVisible(false)
        }
      }
      animRef.current = requestAnimationFrame(animate)
    }
    prevPlayingRef.current = isPlaying

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, titleCard, cinemaMode])

  if (!visible || tracks.length === 0) return null

  // Prefer the explicit trip name (from trips.json); the derived
  // "Origin → Peak → Origin" title below is the fallback for when it's absent.
  const tripName = trips.find((t) => t.id === activeTripId)?.name

  const firstCity = tracks[0].label.split(/[→—]/)[0].trim()
  const lastParts = tracks[tracks.length - 1].label.split(/[→—]/)
  const lastCity = lastParts[lastParts.length - 1].trim()

  let furthestCity = lastCity
  let maxDist = 0
  // Furthest leg endpoint from start, in scene space (no raw lat/lon on client).
  const startPt = tracks[0].scenePoints[0]
  if (startPt) {
    for (const track of tracks) {
      const parts = track.label.split(/[→—]/)
      const dest = parts[parts.length - 1].trim()
      const lastPt = track.scenePoints[track.scenePoints.length - 1]
      if (lastPt) {
        const d = Math.hypot(lastPt.x - startPt.x, lastPt.z - startPt.z)
        if (d > maxDist) { maxDist = d; furthestCity = dest }
      }
    }
  }

  let title
  if (tripName) {
    title = tripName
  } else if (firstCity === lastCity && furthestCity !== firstCity) {
    title = `${firstCity} → ${furthestCity} → ${lastCity}`
  } else if (firstCity === lastCity) {
    title = firstCity
  } else {
    title = `${firstCity} → ${lastCity}`
  }

  // Approximate ground distance from scene coords: dividing by the shared
  // projection scale recovers degrees (x already carries the cos(lat) factor),
  // and 1° ≈ 111.32 km. Close enough for the title's headline figure.
  const scale = tracks[0]?.sceneMetadata?.scale
  let totalKm = 0
  if (scale > 0) {
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1]
      const cur = allPoints[i]
      const dDeg = Math.hypot((cur.x - prev.x) / scale, (cur.z - prev.z) / scale)
      totalKm += dDeg * 111.32
    }
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      <div className="text-center">
        <div className="text-white text-2xl font-light tracking-wider mb-2">
          {title}
        </div>
        <div className="text-white/50 text-sm tracking-widest uppercase">
          {Math.round(totalKm)} km
        </div>
      </div>
    </div>
  )
}
