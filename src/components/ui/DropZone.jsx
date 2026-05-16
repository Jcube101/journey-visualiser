import { useState, useCallback } from 'react'
import { useJourneyStore } from '../../stores/useJourneyStore'
import { parseGpxFile } from '../../utils/gpxParser'
import { transformToScene } from '../../utils/geoTransform'

export default function DropZone() {
  const tracks = useJourneyStore((s) => s.tracks)
  const addTrack = useJourneyStore((s) => s.addTrack)

  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasTracks = tracks.length > 0

  const handleFiles = useCallback(
    async (files) => {
      setError(null)
      setIsLoading(true)

      try {
        for (const file of files) {
          if (!file.name.toLowerCase().endsWith('.gpx')) {
            setError(`"${file.name}" is not a .gpx file`)
            continue
          }

          const { points, metadata } = await parseGpxFile(file)

          if (points.length === 0) {
            setError(`"${file.name}" contains no trackpoints`)
            continue
          }

          const { points: scenePoints, sceneMetadata } = transformToScene(
            points,
            metadata
          )

          addTrack(file.name, points, metadata, scenePoints, sceneMetadata)
        }
      } catch (err) {
        setError(err.message || 'Failed to parse GPX file')
      } finally {
        setIsLoading(false)
      }
    },
    [addTrack]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleFiles(files)
    },
    [handleFiles]
  )

  if (!hasTracks) {
    return (
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-colors duration-200 ${
          isDragging
            ? 'bg-white/5 border-2 border-dashed border-white/40'
            : 'bg-transparent'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="text-center pointer-events-none">
          <div className="text-white/60 text-lg mb-2">
            {isLoading ? 'Parsing...' : 'Drop a GPX file here'}
          </div>
          <div className="text-white/30 text-sm">
            Supports OsmAnd exports with multiple segments
          </div>
          {error && (
            <div className="mt-4 text-red-400 text-sm max-w-md">{error}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`absolute bottom-4 right-4 z-10 w-48 h-24 flex items-center justify-center rounded-lg border transition-colors duration-200 ${
        isDragging
          ? 'border-white/40 bg-white/10'
          : 'border-white/10 bg-black/40'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="text-center pointer-events-none">
        <div className="text-white/50 text-xs">
          {isLoading ? 'Parsing...' : 'Drop more GPX files'}
        </div>
        {error && (
          <div className="mt-1 text-red-400 text-xs truncate px-2">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
