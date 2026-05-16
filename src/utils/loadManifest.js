import { parseGpx } from './gpxParser'
import { transformToScene, computeGlobalBounds } from './geoTransform'

/**
 * Load the GPX manifest and return fully parsed + transformed legs.
 * All legs share the same coordinate system (global bounds).
 *
 * @returns {Promise<Array<{ legName, points, metadata, scenePoints, sceneMetadata, colour }>>}
 *          Returns empty array if no manifest or no legs.
 */
export async function loadManifest() {
  let manifest
  try {
    const res = await fetch('/gpx/index.json')
    if (!res.ok) return []
    manifest = await res.json()
  } catch {
    return []
  }

  if (!Array.isArray(manifest) || manifest.length === 0) return []

  // Phase 1: fetch and parse all files, merge per-leg
  const legs = []

  for (const entry of manifest) {
    const legPoints = []

    for (const filename of entry.files) {
      const res = await fetch(`/gpx/${filename}`)
      if (!res.ok) {
        console.warn(`Failed to fetch /gpx/${filename}`)
        continue
      }
      const gpxText = await res.text()
      const { points } = parseGpx(gpxText)
      legPoints.push(...points)
    }

    if (legPoints.length === 0) continue

    // Sort merged points by timestamp
    legPoints.sort((a, b) => {
      if (!a.time || !b.time) return 0
      return a.time.getTime() - b.time.getTime()
    })

    // Compute per-leg metadata from merged points
    const metadata = computeMetadata(entry.leg, legPoints)

    legs.push({
      legName: entry.leg,
      colour: entry.colour,
      points: legPoints,
      metadata,
    })
  }

  if (legs.length === 0) return []

  // Phase 2: compute global bounds across all legs
  const globalBounds = computeGlobalBounds(legs.map((l) => l.metadata))

  // Phase 3: transform all legs using shared bounds
  const result = legs.map((leg) => {
    const { points: scenePoints, sceneMetadata } = transformToScene(
      leg.points,
      leg.metadata,
      { overrideBounds: globalBounds }
    )
    return {
      legName: leg.legName,
      colour: leg.colour,
      points: leg.points,
      metadata: leg.metadata,
      scenePoints,
      sceneMetadata,
    }
  })

  return result
}

function computeMetadata(name, points) {
  const bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
    minEle: Infinity,
    maxEle: -Infinity,
  }

  const segmentIndices = new Set()

  for (const pt of points) {
    if (pt.lat < bounds.minLat) bounds.minLat = pt.lat
    if (pt.lat > bounds.maxLat) bounds.maxLat = pt.lat
    if (pt.lon < bounds.minLon) bounds.minLon = pt.lon
    if (pt.lon > bounds.maxLon) bounds.maxLon = pt.lon
    if (pt.ele < bounds.minEle) bounds.minEle = pt.ele
    if (pt.ele > bounds.maxEle) bounds.maxEle = pt.ele
    segmentIndices.add(pt.segmentIndex)
  }

  const startTime = points[0]?.time || null
  const endTime = points[points.length - 1]?.time || null
  const durationMs = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0

  return {
    name,
    totalPoints: points.length,
    segments: segmentIndices.size,
    startTime,
    endTime,
    durationMs,
    bounds,
  }
}
