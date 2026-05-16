/**
 * Compute combined bounds from multiple metadata objects.
 * Use this to get a shared coordinate frame before transforming individual legs.
 *
 * @param {Array<Object>} metadataArray - array of metadata objects from parseGpx
 * @returns {Object} combined bounds object: { minLat, maxLat, minLon, maxLon, minEle, maxEle }
 */
export function computeGlobalBounds(metadataArray) {
  const global = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
    minEle: Infinity,
    maxEle: -Infinity,
  }

  for (const meta of metadataArray) {
    const b = meta.bounds
    if (b.minLat < global.minLat) global.minLat = b.minLat
    if (b.maxLat > global.maxLat) global.maxLat = b.maxLat
    if (b.minLon < global.minLon) global.minLon = b.minLon
    if (b.maxLon > global.maxLon) global.maxLon = b.maxLon
    if (b.minEle < global.minEle) global.minEle = b.minEle
    if (b.maxEle > global.maxEle) global.maxEle = b.maxEle
  }

  return global
}

/**
 * Transform parsed GPX points from GPS coordinates to Three.js scene space.
 *
 * @param {Array} points - parsed point array from parseGpx
 * @param {Object} metadata - metadata object from parseGpx (needs bounds)
 * @param {Object} [options]
 * @param {number} [options.sceneSize=100] - longest axis fits within this many units
 * @param {number} [options.elevationExaggeration=3.0] - Y axis multiplier
 * @param {Object} [options.overrideBounds] - use these bounds instead of metadata.bounds
 *        (for shared coordinate space across multiple legs)
 * @returns {{ points: Array, sceneMetadata: Object }}
 */
export function transformToScene(points, metadata, options = {}) {
  const { sceneSize = 100, elevationExaggeration = 3.0, overrideBounds } = options
  const bounds = overrideBounds || metadata.bounds

  const centreLat = (bounds.minLat + bounds.maxLat) / 2
  const centreLon = (bounds.minLon + bounds.maxLon) / 2
  const centreEle = (bounds.minEle + bounds.maxEle) / 2

  const cosLat = Math.cos((centreLat * Math.PI) / 180)

  const latRange = bounds.maxLat - bounds.minLat
  const lonRange = (bounds.maxLon - bounds.minLon) * cosLat
  const maxRange = Math.max(latRange, lonRange)

  const scale = maxRange > 0 ? sceneSize / maxRange : 1

  const eleRange = bounds.maxEle - bounds.minEle
  const eleScale = eleRange > 0 ? (sceneSize * 0.15) / eleRange : 0
  const eleMultiplier = eleScale * elevationExaggeration

  const transformedPoints = points.map((pt) => ({
    ...pt,
    x: (pt.lon - centreLon) * cosLat * scale,
    y: (pt.ele - centreEle) * eleMultiplier,
    z: -(pt.lat - centreLat) * scale,
  }))

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity

  for (const pt of transformedPoints) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
    if (pt.y < minY) minY = pt.y
    if (pt.y > maxY) maxY = pt.y
    if (pt.z < minZ) minZ = pt.z
    if (pt.z > maxZ) maxZ = pt.z
  }

  const sceneMetadata = {
    scale,
    elevationExaggeration,
    centre: { lat: centreLat, lon: centreLon, ele: centreEle },
    sceneBounds: { minX, maxX, minY, maxY, minZ, maxZ },
  }

  return { points: transformedPoints, sceneMetadata }
}
