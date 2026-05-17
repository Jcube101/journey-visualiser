import { useEffect, useState } from 'react'
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
import { useJourneyStore } from './stores/useJourneyStore'
import { COLOUR_MODES } from './constants/colourModes'
import { loadManifest } from './utils/loadManifest'

export default function App() {
  const tracks = useJourneyStore((s) => s.tracks)
  const globalSceneMetadata = useJourneyStore((s) => s.globalSceneMetadata)
  const colourMode = useJourneyStore((s) => s.colourMode)
  const loadLegs = useJourneyStore((s) => s.loadLegs)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadManifest().then((legs) => {
      if (legs.length > 0) loadLegs(legs)
      setLoading(false)
    })
  }, [loadLegs])

  const cameraTarget = globalSceneMetadata || tracks[0]?.sceneMetadata

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
        {tracks.length === 0 && !loading && (
          <gridHelper args={[20, 20, '#1e293b', '#1e293b']} />
        )}
      </Canvas>

      {tracks.length > 0 && <ControlsPanel />}
      {tracks.length > 0 && <ElevationProfile />}
      {tracks.length > 0 && <PlaybackControls />}
      {tracks.length > 0 && <SettingsPanel />}
      {tracks.length > 0 && <LiveStatsBar />}

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading journey...</div>
        </div>
      )}

      {tracks.length > 0 && colourMode === COLOUR_MODES.LEG && (
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
      {tracks.length > 0 && <GradientLegend />}
    </div>
  )
}
