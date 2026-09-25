import * as THREE from 'three/webgpu'
import TSLParticleField from './scene/TSLParticleField'
import TSLCircuitField
  from './scene/TSLCircuitField'
import TSLComputationalShell
  from './scene/TSLComputationalShell'
import TSLEnergyEvents
  from './scene/EnergyEvents'
  import SimulationRuntime
  from './simulation/SimulationRuntime'

import {
  Canvas,
} from '@react-three/fiber'

import TSLSingularityCore
  from './scene/TSLSingularityCore'

export default function WebGPUTest() {

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000003',
      }}
    >

      <Canvas
        camera={{
          position: [
            0,
            0,
            4.8,
          ],

          fov: 50,
        }}

        gl={async (props) => {

          const renderer =
            new THREE.WebGPURenderer({
              ...(props as THREE.WebGPURendererParameters),

              antialias: true,

              powerPreference:
                'high-performance',

              outputBufferType:
                THREE.HalfFloatType,
            })

          renderer.setPixelRatio(
            Math.min(
              window.devicePixelRatio,
              2,
            ),
          )

          await renderer.init()

          return renderer
        }}
      >

        <TSLSingularityCore />

<TSLParticleField />

<TSLCircuitField />

<TSLComputationalShell />

<TSLEnergyEvents />
<SimulationRuntime />
      </Canvas>

    </div>
  )
}