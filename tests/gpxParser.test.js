import { JSDOM } from 'jsdom'
import { readFileSync } from 'fs'
import { parseGpx } from '../src/utils/gpxParser.js'
import { transformToScene, computeGlobalBounds } from '../src/utils/geoTransform.js'

// Provide DOMParser globally (not available in Node by default)
const dom = new JSDOM('')
globalThis.DOMParser = dom.window.DOMParser

// --- Test with synthetic GPX ---

const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:osmand="https://osmand.net">
  <trk>
    <name>Test Route</name>
    <trkseg>
      <trkpt lat="12.9716" lon="77.5946">
        <ele>920</ele>
        <time>2024-12-01T06:00:00Z</time>
        <extensions>
          <osmand:speed>12.5</osmand:speed>
        </extensions>
      </trkpt>
      <trkpt lat="12.9700" lon="77.5900">
        <ele>915</ele>
        <time>2024-12-01T06:01:00Z</time>
        <extensions>
          <osmand:speed>14.2</osmand:speed>
        </extensions>
      </trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="12.9650" lon="77.5850">
        <ele>900</ele>
        <time>2024-12-01T06:05:00Z</time>
      </trkpt>
      <trkpt lat="12.9600" lon="77.5800">
        <ele>880</ele>
        <time>2024-12-01T06:10:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`)
}

function approx(a, b, tolerance = 0.001) {
  return Math.abs(a - b) < tolerance
}

// --- Parser tests ---

function runParserTest() {
  const { points, metadata } = parseGpx(SAMPLE_GPX)

  assert(points.length === 4, `expected 4 points, got ${points.length}`)

  assert(metadata.name === 'Test Route', `name: ${metadata.name}`)
  assert(metadata.totalPoints === 4, `totalPoints: ${metadata.totalPoints}`)
  assert(metadata.segments === 2, `segments: ${metadata.segments}`)
  assert(metadata.durationMs === 600000, `durationMs: ${metadata.durationMs}`)

  assert(metadata.bounds.minLat === 12.96, `minLat: ${metadata.bounds.minLat}`)
  assert(metadata.bounds.maxLat === 12.9716, `maxLat: ${metadata.bounds.maxLat}`)
  assert(metadata.bounds.minEle === 880, `minEle: ${metadata.bounds.minEle}`)
  assert(metadata.bounds.maxEle === 920, `maxEle: ${metadata.bounds.maxEle}`)

  const p0 = points[0]
  assert(p0.lat === 12.9716, `p0.lat: ${p0.lat}`)
  assert(p0.lon === 77.5946, `p0.lon: ${p0.lon}`)
  assert(p0.ele === 920, `p0.ele: ${p0.ele}`)
  assert(p0.time instanceof Date, 'p0.time should be a Date')
  assert(p0.speed === 12.5, `p0.speed: ${p0.speed}`)
  assert(p0.segmentIndex === 0, `p0.segmentIndex: ${p0.segmentIndex}`)

  const p2 = points[2]
  assert(p2.segmentIndex === 1, `p2.segmentIndex: ${p2.segmentIndex}`)
  assert(p2.speed === null, `p2.speed should be null, got ${p2.speed}`)

  console.log('✓ Parser: synthetic GPX test passed')
}

// --- Transform tests ---

function runTransformTest() {
  const { points, metadata } = parseGpx(SAMPLE_GPX)
  const { points: scenePoints, sceneMetadata } = transformToScene(points, metadata)

  // All points should have x, y, z as finite numbers
  for (let i = 0; i < scenePoints.length; i++) {
    const p = scenePoints[i]
    assert(Number.isFinite(p.x), `point ${i} x is not finite: ${p.x}`)
    assert(Number.isFinite(p.y), `point ${i} y is not finite: ${p.y}`)
    assert(Number.isFinite(p.z), `point ${i} z is not finite: ${p.z}`)
  }

  // Original fields preserved
  assert(scenePoints[0].lat === 12.9716, 'original lat preserved')
  assert(scenePoints[0].speed === 12.5, 'original speed preserved')
  assert(scenePoints[2].segmentIndex === 1, 'segmentIndex preserved')

  // Centred near origin: mean x and z should be near 0
  const meanX = scenePoints.reduce((s, p) => s + p.x, 0) / scenePoints.length
  const meanZ = scenePoints.reduce((s, p) => s + p.z, 0) / scenePoints.length
  assert(Math.abs(meanX) < 20, `mean x not near 0: ${meanX}`)
  assert(Math.abs(meanZ) < 20, `mean z not near 0: ${meanZ}`)

  // Y range reflects elevation exaggeration (not flat)
  const ys = scenePoints.map((p) => p.y)
  const yRange = Math.max(...ys) - Math.min(...ys)
  assert(yRange > 0, `y range should be > 0, got ${yRange}`)

  // Scene metadata structure
  assert(sceneMetadata.scale > 0, `scale: ${sceneMetadata.scale}`)
  assert(sceneMetadata.elevationExaggeration === 3.0, `exaggeration: ${sceneMetadata.elevationExaggeration}`)
  assert(sceneMetadata.centre.lat > 0, `centre.lat: ${sceneMetadata.centre.lat}`)
  assert(sceneMetadata.sceneBounds.minX <= sceneMetadata.sceneBounds.maxX, 'sceneBounds x order')
  assert(sceneMetadata.sceneBounds.minY <= sceneMetadata.sceneBounds.maxY, 'sceneBounds y order')
  assert(sceneMetadata.sceneBounds.minZ <= sceneMetadata.sceneBounds.maxZ, 'sceneBounds z order')

  // Custom exaggeration
  const { points: pts2 } = transformToScene(points, metadata, { elevationExaggeration: 1.0 })
  const yRange2 = Math.max(...pts2.map((p) => p.y)) - Math.min(...pts2.map((p) => p.y))
  assert(yRange > yRange2, `higher exaggeration should give larger y range: ${yRange} vs ${yRange2}`)

  console.log('✓ Transform: synthetic test passed')
}

// --- Global bounds + overrideBounds test ---

function runGlobalBoundsTest() {
  const { points: pts1, metadata: meta1 } = parseGpx(SAMPLE_GPX)

  // Simulate a second leg far to the east (lon + 1 degree)
  const GPX2 = SAMPLE_GPX
    .replace(/77\.5946/g, '78.5946')
    .replace(/77\.5900/g, '78.5900')
    .replace(/77\.5850/g, '78.5850')
    .replace(/77\.5800/g, '78.5800')
    .replace(/Test Route/g, 'Leg 2')
  const { points: pts2, metadata: meta2 } = parseGpx(GPX2)

  const globalBounds = computeGlobalBounds([meta1, meta2])

  // Global bounds should span both legs
  assert(globalBounds.minLon < 77.6, `global minLon: ${globalBounds.minLon}`)
  assert(globalBounds.maxLon > 78.5, `global maxLon: ${globalBounds.maxLon}`)

  // Transform both with shared bounds
  const { points: scene1 } = transformToScene(pts1, meta1, { overrideBounds: globalBounds })
  const { points: scene2 } = transformToScene(pts2, meta2, { overrideBounds: globalBounds })

  // Leg 1 (lower lon) should have lower x than leg 2 (higher lon)
  const leg1MeanX = scene1.reduce((s, p) => s + p.x, 0) / scene1.length
  const leg2MeanX = scene2.reduce((s, p) => s + p.x, 0) / scene2.length
  assert(leg1MeanX < leg2MeanX, `leg1 mean x should be < leg2: ${leg1MeanX} vs ${leg2MeanX}`)

  // Both should be finite
  for (const p of [...scene1, ...scene2]) {
    assert(Number.isFinite(p.x + p.y + p.z), 'all coords finite with overrideBounds')
  }

  console.log('✓ Global bounds: shared coordinate space test passed')
}

// --- Real file test (parser + transform pipeline) ---

function runFileTest() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.log('  (skipping file test — pass a .gpx path as argument to test with real data)')
    return
  }

  const gpxText = readFileSync(filePath, 'utf-8')
  const { points, metadata } = parseGpx(gpxText)
  const { points: scenePoints, sceneMetadata } = transformToScene(points, metadata)

  console.log('\n--- Real GPX: parser ---')
  console.log(`Name:        ${metadata.name}`)
  console.log(`Points:      ${metadata.totalPoints}`)
  console.log(`Segments:    ${metadata.segments}`)
  console.log(`Start:       ${metadata.startTime?.toISOString()}`)
  console.log(`End:         ${metadata.endTime?.toISOString()}`)
  console.log(`Duration:    ${(metadata.durationMs / 3600000).toFixed(2)} hours`)
  console.log(`Lat range:   ${metadata.bounds.minLat.toFixed(4)} – ${metadata.bounds.maxLat.toFixed(4)}`)
  console.log(`Lon range:   ${metadata.bounds.minLon.toFixed(4)} – ${metadata.bounds.maxLon.toFixed(4)}`)
  console.log(`Ele range:   ${metadata.bounds.minEle.toFixed(1)}m – ${metadata.bounds.maxEle.toFixed(1)}m`)
  const withSpeed = points.filter((p) => p.speed !== null).length
  console.log(`With speed:  ${withSpeed}/${metadata.totalPoints} points`)

  console.log('\n--- Real GPX: transform ---')
  console.log(`Scale:       ${sceneMetadata.scale.toFixed(4)}`)
  console.log(`Exaggeration: ${sceneMetadata.elevationExaggeration}x`)
  console.log(`Centre:      lat=${sceneMetadata.centre.lat.toFixed(4)}, lon=${sceneMetadata.centre.lon.toFixed(4)}, ele=${sceneMetadata.centre.ele.toFixed(1)}m`)
  console.log(`Scene X:     ${sceneMetadata.sceneBounds.minX.toFixed(2)} – ${sceneMetadata.sceneBounds.maxX.toFixed(2)}`)
  console.log(`Scene Y:     ${sceneMetadata.sceneBounds.minY.toFixed(2)} – ${sceneMetadata.sceneBounds.maxY.toFixed(2)}`)
  console.log(`Scene Z:     ${sceneMetadata.sceneBounds.minZ.toFixed(2)} – ${sceneMetadata.sceneBounds.maxZ.toFixed(2)}`)

  // Sanity checks on real data
  const nanCount = scenePoints.filter((p) => !Number.isFinite(p.x + p.y + p.z)).length
  assert(nanCount === 0, `${nanCount} points have NaN/Infinity coordinates`)

  const xs = scenePoints.map((p) => p.x)
  const zs = scenePoints.map((p) => p.z)
  const xSpan = Math.max(...xs) - Math.min(...xs)
  const zSpan = Math.max(...zs) - Math.min(...zs)
  console.log(`X span:      ${xSpan.toFixed(2)} units`)
  console.log(`Z span:      ${zSpan.toFixed(2)} units`)
  assert(Math.max(xSpan, zSpan) <= 101, `longest axis exceeds scene size: ${Math.max(xSpan, zSpan)}`)

  console.log('\n✓ Real file: parser + transform pipeline passed')
}

runParserTest()
runTransformTest()
runGlobalBoundsTest()
runFileTest()
