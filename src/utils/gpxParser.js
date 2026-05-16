/**
 * Parse a GPX file (as text) into a normalised point array and metadata.
 * Handles OsmAnd-generated files with multiple <trkseg>, elevation,
 * timestamps, and optional osmand:speed extensions.
 *
 * @param {string} gpxText - raw GPX XML string
 * @returns {{ points: Array, metadata: Object }}
 */
export function parseGpx(gpxText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(gpxText, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`Invalid GPX XML: ${parseError.textContent}`)
  }

  const trk = doc.querySelector('trk')
  const name = trk?.querySelector('name')?.textContent || 'Unnamed Track'

  const segments = doc.querySelectorAll('trkseg')
  const points = []

  const bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
    minEle: Infinity,
    maxEle: -Infinity,
  }

  segments.forEach((seg, segmentIndex) => {
    const trkpts = seg.querySelectorAll('trkpt')

    trkpts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat'))
      const lon = parseFloat(pt.getAttribute('lon'))

      const eleEl = pt.querySelector('ele')
      const ele = eleEl ? parseFloat(eleEl.textContent) : 0

      const timeEl = pt.querySelector('time')
      const time = timeEl ? new Date(timeEl.textContent) : null

      const speedEl =
        pt.getElementsByTagNameNS('https://osmand.net', 'speed')[0] ||
        pt.querySelector('speed')
      const speed = speedEl ? parseFloat(speedEl.textContent) : null

      if (lat < bounds.minLat) bounds.minLat = lat
      if (lat > bounds.maxLat) bounds.maxLat = lat
      if (lon < bounds.minLon) bounds.minLon = lon
      if (lon > bounds.maxLon) bounds.maxLon = lon
      if (ele < bounds.minEle) bounds.minEle = ele
      if (ele > bounds.maxEle) bounds.maxEle = ele

      points.push({ lat, lon, ele, time, speed, segmentIndex })
    })
  })

  const startTime = points.length > 0 ? points[0].time : null
  const endTime = points.length > 0 ? points[points.length - 1].time : null
  const durationMs =
    startTime && endTime ? endTime.getTime() - startTime.getTime() : 0

  const metadata = {
    name,
    totalPoints: points.length,
    segments: segments.length,
    startTime,
    endTime,
    durationMs,
    bounds,
  }

  return { points, metadata }
}

/**
 * Read a File object and parse its GPX content.
 * @param {File} file - a .gpx File from drag-and-drop or file input
 * @returns {Promise<{ points: Array, metadata: Object }>}
 */
export function parseGpxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(parseGpx(e.target.result))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
