import { useState, useEffect, useRef } from 'react'
import { Layers, Check } from 'lucide-react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { TRACK_PALETTE } from '../../constants/palette'

// How many palette swatches to preview per trip card. The legs default to the
// shared TRACK_PALETTE (index.json colours are null), so this previews the
// palette the trip's legs will be drawn with.
const PREVIEW_SWATCHES = 5

export default function TripLibrary() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef()
  const buttonRef = useRef()

  const trips = useJourneyStore((s) => s.trips)
  const activeTripId = useJourneyStore((s) => s.activeTripId)
  const tripLoading = useJourneyStore((s) => s.tripLoading)
  const loadTrip = useJourneyStore((s) => s.loadTrip)
  const cinemaMode = useJourneyStore((s) => s.settings.cinemaMode)

  // Close on outside click (anywhere that isn't the drawer or its button).
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  if (cinemaMode || trips.length === 0) return null

  const handleLoad = (tripId) => {
    setOpen(false)
    // loadTrip swaps the tracks, resets playback, and re-arms the intro; the
    // dark loading overlay (driven by tripLoading) covers the fetch.
    loadTrip(tripId)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="absolute top-4 right-[172px] z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white/90 transition-colors backdrop-blur-sm"
        title="Trip library"
      >
        <Layers className="w-4 h-4" />
      </button>

      <div
        ref={panelRef}
        className={`absolute top-0 left-0 h-full w-[280px] z-30 bg-black/80 border-r border-white/10 backdrop-blur-md transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="text-white/90 text-sm font-medium mb-3">Trip library</div>

          <div className="space-y-2">
            {trips.map((trip) => {
              const active = trip.id === activeTripId
              return (
                <div
                  key={trip.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    active
                      ? 'bg-blue-500/10 border-blue-400/40'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-white text-base font-medium leading-tight">
                      {trip.name}
                    </div>
                    {active && (
                      <Check className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {(trip.date || trip.description) && (
                    <div className="mt-1 text-[11px] text-white/40 leading-snug">
                      {trip.date && <span>{trip.date}</span>}
                      {trip.date && trip.description && <span> · </span>}
                      {trip.description && <span>{trip.description}</span>}
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center gap-1">
                    {TRACK_PALETTE.slice(0, PREVIEW_SWATCHES).map((c, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {!active && (
                    <button
                      onClick={() => handleLoad(trip.id)}
                      disabled={tripLoading}
                      className="mt-3 w-full py-1.5 rounded text-xs font-medium bg-blue-500/70 text-white hover:bg-blue-500/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {tripLoading ? 'Loading…' : 'Load'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
