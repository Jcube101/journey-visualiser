import { useMemo } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { COLOUR_MODES } from '../../constants/colourModes'
import { SPEED_CSS_GRADIENT, ELEVATION_CSS_GRADIENT } from '../../utils/colourMap'

export default function GradientLegend() {
  const tracks = useJourneyStore((s) => s.tracks)
  const colourMode = useJourneyStore((s) => s.colourMode)

  const { maxSpeedKmh, minEle, maxEle } = useMemo(() => {
    let maxS = 0, minE = Infinity, maxE = -Infinity
    for (const t of tracks) {
      if (!t.visible) continue
      for (const p of t.scenePoints) {
        if (p.speed != null && p.speed > maxS) maxS = p.speed
        if (p.ele != null) {
          if (p.ele < minE) minE = p.ele
          if (p.ele > maxE) maxE = p.ele
        }
      }
    }
    return {
      maxSpeedKmh: Math.round(maxS * 3.6),
      minEle: minE === Infinity ? 0 : Math.round(minE),
      maxEle: maxE === -Infinity ? 0 : Math.round(maxE),
    }
  }, [tracks])

  if (colourMode === COLOUR_MODES.LEG) return null

  const isSpeed = colourMode === COLOUR_MODES.SPEED
  const gradient = isSpeed ? SPEED_CSS_GRADIENT : ELEVATION_CSS_GRADIENT
  const minLabel = isSpeed ? '0 km/h' : `${minEle} m`
  const maxLabel = isSpeed ? `${maxSpeedKmh} km/h` : `${maxEle} m`
  const title = isSpeed ? 'Speed' : 'Elevation'

  return (
    <div className="absolute top-4 left-4 z-10 bg-black/60 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm text-[10px] text-white/60 w-44">
      <div className="text-white/80 text-xs mb-1.5">{title}</div>
      <div
        className="h-2.5 rounded-sm mb-1"
        style={{ background: gradient }}
      />
      <div className="flex justify-between">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}
