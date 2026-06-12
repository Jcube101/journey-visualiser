/**
 * Load fully parsed + transformed legs from the backend API.
 *
 * The server (journey-visualiser-api) reads the private GPX, merges/trims/
 * transforms every leg against shared global bounds and returns scene
 * coordinates directly — so this function no longer parses GPX or runs
 * geoTransform on the client. It just fetches `/api/legs` and normalises the
 * response into the shape the Zustand store's loadLegs() expects.
 *
 * The relative `/api/legs` path works unchanged on localhost dev (Vite proxy /
 * nginx) and on visualiser.job-joseph.com (nginx → 127.0.0.1:8009).
 *
 * gpxParser.js + geoTransform.js are intentionally left untouched — they still
 * back the ad-hoc drag-and-drop flow.
 *
 * @returns {Promise<Array<{ legName, points, metadata, scenePoints, sceneMetadata, colour }>>}
 *          Returns empty array if the API is unreachable or has no legs.
 */
export async function loadManifest() {
  let apiLegs
  try {
    const res = await fetch('/api/legs')
    if (!res.ok) return []
    apiLegs = await res.json()
  } catch {
    return []
  }

  if (!Array.isArray(apiLegs) || apiLegs.length === 0) return []

  return apiLegs.map((leg) => {
    // API points are already projected scene coords {x,y,z,speed,time,segmentIndex}.
    // Enrich them for downstream consumers:
    //  - `time` → Date (playback, day/night, camera ordering call .getTime()/.getHours())
    //  - `ele`  → scene y, used purely as an elevation proxy for colouring. Scene y is
    //    an affine function of true elevation, so normalised (min→max) colours are
    //    identical. Raw lat/lon/ele never reach the client anymore.
    const points = leg.points.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      ele: p.y,
      speed: p.speed,
      segmentIndex: p.segmentIndex,
      time: p.time ? new Date(p.time) : null,
    }))

    const startTime = points[0]?.time || null
    const endTime = points[points.length - 1]?.time || null

    const metadata = {
      name: leg.leg,
      totalPoints: leg.totalPoints ?? points.length,
      segments: leg.segments ?? 1,
      startTime,
      endTime,
      durationMs: leg.durationMs ?? 0,
      // No raw GPS bounds — the server owns the projection. Kept null so any
      // accidental consumer fails loudly rather than reading stale numbers.
      bounds: null,
    }

    return {
      legName: leg.leg,
      colour: leg.colour, // may be null → loadLegs() assigns from TRACK_PALETTE
      // rawPoints and scenePoints are separate arrays so the elevation slider
      // can rescale scenePoints without mutating the canonical set.
      points: points.map((p) => ({ ...p })),
      scenePoints: points,
      metadata,
      sceneMetadata: leg.sceneMetadata,
    }
  })
}
