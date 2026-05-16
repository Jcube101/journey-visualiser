import { readdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const gpxDir = join(import.meta.dirname, '..', 'public', 'gpx')
const indexPath = join(gpxDir, 'index.json')

if (existsSync(indexPath)) {
  console.warn('⚠  public/gpx/index.json already exists — not overwriting.')
  console.warn('   Delete it manually if you want to regenerate from scratch.')
  process.exit(0)
}

const files = readdirSync(gpxDir)
  .filter((f) => f.toLowerCase().endsWith('.gpx'))
  .sort()

if (files.length === 0) {
  console.log('No .gpx files found in public/gpx/ — nothing to scaffold.')
  process.exit(0)
}

const index = files.map((file, i) => ({
  leg: `Leg ${i + 1}`,
  colour: null,
  files: [file],
}))

writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n')
console.log(`✓ Created public/gpx/index.json with ${files.length} leg(s):`)
files.forEach((f, i) => console.log(`  Leg ${i + 1}: ${f}`))
