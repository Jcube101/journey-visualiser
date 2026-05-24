import { useState, useEffect, useRef } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { usePlaybackPoints } from '../../hooks/usePlaybackPoints'

const DURATION = 2500
const FADE_IN = 500
const FADE_OUT = 500

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function TitleCard() {
  const titleCard = useJourneyStore((s) => s.settings.titleCard)
  const cinemaMode = useJourneyStore((s) => s.settings.cinemaMode)
  const isPlaying = useJourneyStore((s) => s.isPlaying)
  const tracks = useJourneyStore((s) => s.tracks)
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

  const firstLabel = tracks[0].label
  const lastLabel = tracks[tracks.length - 1].label
  const firstCity = firstLabel.split(/[→—]/)[0].trim()
  const lastParts = lastLabel.split(/[→—]/)
  const lastCity = lastParts[lastParts.length - 1].trim()
  const title = firstCity === lastCity ? firstCity : `${firstCity} → ${lastCity}`

  let totalKm = 0
  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1]
    const cur = allPoints[i]
    if (prev.lat != null && cur.lat != null) {
      totalKm += haversine(prev.lat, prev.lon, cur.lat, cur.lon)
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
