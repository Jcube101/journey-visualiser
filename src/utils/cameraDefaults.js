export function getDefaultCameraPosition(sceneBounds) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = sceneBounds

  const centreX = (minX + maxX) / 2
  const centreY = (minY + maxY) / 2
  const centreZ = (minZ + maxZ) / 2

  const sizeX = maxX - minX
  const sizeY = maxY - minY
  const sizeZ = maxZ - minZ
  const diagonal = Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ)

  const distance = diagonal * 1.2

  const azimuth = (45 * Math.PI) / 180
  const polar = (30 * Math.PI) / 180

  const horizontal = distance * Math.cos(polar)

  return {
    position: [
      centreX + horizontal * Math.sin(azimuth),
      centreY + distance * Math.sin(polar),
      centreZ + horizontal * Math.cos(azimuth),
    ],
    target: [centreX, centreY, centreZ],
  }
}
