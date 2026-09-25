import { useFrame } from '@react-three/fiber'
import { updateEntitySimulation } from './entitySimulation'

/* =========================================================
   ULTRON SIMULATION RUNTIME

   Runs the central entity simulation every rendered frame.

   This component intentionally renders nothing.
   It exists only to drive ULTRON's semantic simulation clock.
   ========================================================= */

export default function SimulationRuntime() {

  useFrame((_, delta) => {

    /*
     * Prevent a huge simulation jump after tab switching
     * or temporary frame stalls.
     */
    const dt =
      Math.min(delta, 0.05)

    updateEntitySimulation(dt)
  })

  return null
}