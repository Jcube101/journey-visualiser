import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function App() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <OrbitControls />
        <gridHelper args={[20, 20, '#1e293b', '#1e293b']} />
      </Canvas>

      <div className="absolute top-4 left-4 text-white/80 text-sm font-medium">
        Journey Visualiser
      </div>
    </div>
  )
}
