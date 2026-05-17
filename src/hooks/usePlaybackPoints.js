import { useMemo, useRef } from 'react'
import { useJourneyStore } from '../stores/useJourneyStore'

const REST_THRESHOLD_MS = 5 * 60 * 1000

export function usePlaybackPoints() {
  const tracks = useJourneyStore((s) => s.tracks)
  const loggedRef = useRef(false)

  return useMemo(() => {
    if (tracks.length === 0) return []

    const combined = tracks
      .filter((t) => t.visible)
      .flatMap((t) =>
        t.scenePoints.map((p) => ({ ...p, trackId: t.id, colour: t.colour, label: t.label }))
      )

    combined.sort((a, b) => {
      if (!a.time || !b.time) return 0
      return a.time.getTime() - b.time.getTime()
    })

    let cumulativeMs = 0
    combined[0].drivingTimeMs = 0

    for (let i = 1; i < combined.length; i++) {
      const prev = combined[i - 1]
      const cur = combined[i]
      const wallGap =
        prev.time && cur.time ? cur.time.getTime() - prev.time.getTime() : 100

      if (wallGap > REST_THRESHOLD_MS) {
        cumulativeMs += 0
      } else {
        cumulativeMs += Math.max(wallGap, 1)
      }

      cur.drivingTimeMs = cumulativeMs
    }

    const totalMs = combined[combined.length - 1].drivingTimeMs
    if (!loggedRef.current && combined.length > 1) {
      const h = Math.floor(totalMs / 3600000)
      const m = Math.floor((totalMs % 3600000) / 60000)
      const s = Math.floor((totalMs % 60000) / 1000)
      console.log(
        `[Playback] Total cumulative driving time: ${totalMs}ms (${h}h ${m}m ${s}s). ` +
        `For 24s full playback, use speed multiplier: ${Math.round(totalMs / 24000)}x`
      )
      loggedRef.current = true
    }

    return combined
  }, [tracks])
}
