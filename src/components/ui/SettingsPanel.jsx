import { useState, useEffect, useRef } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef()
  const buttonRef = useRef()
  const settings = useJourneyStore((s) => s.settings)
  const setSetting = useJourneyStore((s) => s.setSetting)

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

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white/90 transition-colors backdrop-blur-sm text-sm"
        title="Settings"
      >
        &#9881;
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute top-14 right-4 z-20 w-72 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md p-4 space-y-3 text-xs text-white/70"
        >
          <div className="text-white/90 text-sm font-medium mb-2">Settings</div>

          <Toggle label="Auto-orbit" value={settings.autoOrbit} onChange={(v) => setSetting('autoOrbit', v)} />
          {settings.autoOrbit && (
            <Slider label="Orbit speed" value={settings.autoOrbitSpeed} min={0.01} max={0.2} step={0.01}
              display={(v) => `${v.toFixed(2)} rad/s`}
              onChange={(v) => setSetting('autoOrbitSpeed', v)} />
          )}

          <Toggle label="Dot trail" value={settings.dotTrail} onChange={(v) => setSetting('dotTrail', v)} />
          {settings.dotTrail && (
            <Slider label="Trail width" value={settings.dotTrailWidth} min={1} max={8} step={0.5}
              display={(v) => v <= 2 ? 'Thin' : v <= 5 ? 'Medium' : 'Thick'}
              onChange={(v) => setSetting('dotTrailWidth', v)} />
          )}

          <Toggle label="Camera follow" value={settings.cameraFollow} onChange={(v) => setSetting('cameraFollow', v)} />
          <Toggle label="Leg labels" value={settings.legLabels} onChange={(v) => setSetting('legLabels', v)} />
          <Toggle label="Ambient particles" value={settings.ambientParticles} onChange={(v) => setSetting('ambientParticles', v)} />
          <Toggle label="Route glow" value={settings.routeGlow} onChange={(v) => setSetting('routeGlow', v)} />
          <Toggle label="Live stats" value={settings.liveStats} onChange={(v) => setSetting('liveStats', v)} />
          <Toggle label="Day/night background" value={settings.dayNightBg} onChange={(v) => setSetting('dayNightBg', v)} />
        </div>
      )}
    </>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span>{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-blue-500/70' : 'bg-white/15'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </label>
  )
}

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <div className="flex items-center gap-2 pl-4">
      <span className="text-white/40 w-16 text-[10px]">{display(value)}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-blue-400/60"
      />
    </div>
  )
}
