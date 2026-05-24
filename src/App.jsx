import { useEffect, useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import RouteTrail from './components/canvas/RouteTrail'
import SeaPlane from './components/canvas/SeaPlane'
import CameraFit from './components/canvas/CameraFit'
import AnimatedDot from './components/canvas/AnimatedDot'
import AutoOrbit from './components/canvas/AutoOrbit'
import DotTrail from './components/canvas/DotTrail'
import CameraFollow from './components/canvas/CameraFollow'
import LegLabels from './components/canvas/LegLabels'
import AmbientParticles from './components/canvas/AmbientParticles'
import RouteGlow from './components/canvas/RouteGlow'
import DayNightBackground from './components/canvas/DayNightBackground'
import IntroAnimation from './components/canvas/IntroAnimation'
import ControlsPanel from './components/ui/ControlsPanel'
import PlaybackControls from './components/ui/PlaybackControls'
import SettingsPanel from './components/ui/SettingsPanel'
import LiveStatsBar from './components/ui/LiveStatsBar'
import GradientLegend from './components/ui/GradientLegend'
import ElevationProfile from './components/ui/ElevationProfile'
import TitleCard from './components/ui/TitleCard'
import { useJourneyStore } from './stores/useJourneyStore'
import { COLOUR_MODES } from './constants/colourModes'
import { loadManifest } from './utils/loadManifest'

export default function App() {
  const tracks = useJourneyStore((s) => s.tracks)
  const globalSceneMetadata = useJourneyStore((s) => s.globalSceneMetadata)
  const colourMode = useJourneyStore((s) => s.colourMode)
  const settings = useJourneyStore((s) => s.settings)
  const loadLegs = useJourneyStore((s) => s.loadLegs)
  const [loading, setLoading] = useState(true)
  const recordTimerRef = useRef(null)

  useEffect(() => {
    loadManifest().then((legs) => {
      if (legs.length > 0) loadLegs(legs)
      setLoading(false)
    })
  }, [loadLegs])

  const handleAutoPlay = useCallback(() => {
    const store = useJourneyStore.getState()
    if (store.tracks.length === 0) return
    store.pause()
    useJourneyStore.setState({ currentPointIndex: 0 })
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current)
    recordTimerRef.current = setTimeout(() => {
      const s = useJourneyStore.getState()
      if (!s.settings.cinemaMode) s.toggleCinemaMode()
      s.play()
    }, 1000)
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        useJourneyStore.getState().toggleCinemaMode()
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleAutoPlay()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      if (recordTimerRef.current) clearTimeout(recordTimerRef.current)
    }
  }, [handleAutoPlay])

  const cameraTarget = globalSceneMetadata || tracks[0]?.sceneMetadata
  const cinema = settings.cinemaMode
  const vertical = settings.verticalPreview
  const hasTracks = tracks.length > 0

  return (
    <div className="w-full h-full relative bg-[#0a0a0f]">
      <Canvas camera={{ position: [0, 50, 80], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[50, 100, 50]} intensity={0.6} />
        <RouteTrail />
        <RouteGlow />
        <AnimatedDot />
        <DotTrail />
        <SeaPlane />
        <LegLabels />
        <AmbientParticles />
        <AutoOrbit />
        <CameraFollow />
        <DayNightBackground />
        {cameraTarget && <IntroAnimation sceneMetadata={cameraTarget} />}
        {cameraTarget && <CameraFit sceneMetadata={cameraTarget} />}
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
        {!hasTracks && !loading && (
          <gridHelper args={[20, 20, '#1e293b', '#1e293b']} />
        )}
      </Canvas>

      {!cinema && hasTracks && <ControlsPanel />}
      {!cinema && hasTracks && settings.elevationProfile && <ElevationProfile />}
      {!cinema && hasTracks && <PlaybackControls />}
      {hasTracks && <SettingsPanel />}
      {!cinema && hasTracks && <LiveStatsBar />}

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading journey...</div>
        </div>
      )}

      {!cinema && hasTracks && colourMode === COLOUR_MODES.LEG && (
        <div className="absolute top-4 left-4 text-white/60 text-xs space-y-1">
          {tracks.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: t.colour }}
              />
              <span>{t.label}</span>
              <span className="text-white/30">
                {t.metadata.totalPoints} pts / {t.metadata.segments} seg
              </span>
            </div>
          ))}
        </div>
      )}
      {!cinema && hasTracks && <GradientLegend />}

      {cinema && settings.cinemaTitle && hasTracks && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="text-white/40 text-sm font-light tracking-widest uppercase">
            {tracks[0].label.split(/[→—]/)[0].trim()} → {(() => {
              const last = tracks[tracks.length - 1].label.split(/[→—]/)
              return last[last.length - 1].trim()
            })()}
          </div>
        </div>
      )}

      {hasTracks && <TitleCard />}

      {!cinema && hasTracks && (
        <div className="absolute top-4 right-14 z-20 flex gap-1.5">
          <button
            onClick={() => useJourneyStore.getState().toggleCinemaMode()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white/90 transition-colors backdrop-blur-sm text-[10px] font-mono"
            title="Cinema mode (C)"
          >
            C
          </button>
          <button
            onClick={() => useJourneyStore.getState().setSetting('verticalPreview', !settings.verticalPreview)}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors backdrop-blur-sm text-[10px] ${
              vertical
                ? 'bg-blue-500/30 border-blue-400/40 text-blue-300'
                : 'bg-black/60 border-white/10 hover:border-white/30 text-white/60 hover:text-white/90'
            }`}
            title="Use this to frame your OpenScreen recording region, then turn off before recording."
          >
            <svg viewBox="0 0 12 18" className="w-3 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="10" height="16" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={handleAutoPlay}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white/90 transition-colors backdrop-blur-sm text-[10px] font-mono"
            title="Record-ready auto-play (R)"
          >
            R
          </button>
        </div>
      )}

      {vertical && <VerticalOverlay />}
    </div>
  )
}

function VerticalOverlay() {
  // 9:16 rectangle centred in the viewport, with darkened surround
  // rectWidth = viewportHeight * 9/16, centred horizontally
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Dark mask — four rectangles around the 9:16 cutout */}
      {/* Using CSS to compute: rect is h-full, width = h * 9/16, centred */}
      {/* Left bar */}
      <div
        className="absolute top-0 bottom-0 left-0 bg-black/60"
        style={{ width: 'calc((100% - 100vh * 9 / 16) / 2)' }}
      />
      {/* Right bar */}
      <div
        className="absolute top-0 bottom-0 right-0 bg-black/60"
        style={{ width: 'calc((100% - 100vh * 9 / 16) / 2)' }}
      />
      {/* White border around the 9:16 rectangle */}
      <div
        className="absolute top-0 bottom-0 border border-white/20"
        style={{
          left: 'calc((100% - 100vh * 9 / 16) / 2)',
          width: 'calc(100vh * 9 / 16)',
        }}
      >
        {/* Caption zone — bottom 15% */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-red-500/25" style={{ height: '15%' }}>
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-red-400/40 text-[9px] uppercase tracking-widest">
            caption zone
          </div>
        </div>
        {/* Buttons zone — right 10% */}
        <div className="absolute top-0 right-0 bottom-0 border-l border-red-500/25" style={{ width: '10%' }}>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-400/40 text-[9px] uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl' }}
          >
            buttons zone
          </div>
        </div>
      </div>
    </div>
  )
}
