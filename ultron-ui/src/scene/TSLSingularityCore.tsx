import * as THREE from 'three/webgpu'
import {
  MeshBasicNodeMaterial,
} from 'three/webgpu'

import {
  float,
  mix,
  smoothstep,
  time,
  triNoise3D,
  vec3,
  positionLocal,
  normalLocal,
} from 'three/tsl'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function TSLSingularityCore() {
  const meshRef =
    useRef<THREE.Mesh>(null)

  const material =
    useMemo(() => {
      const material =
        new MeshBasicNodeMaterial({
          transparent: true,
          depthWrite: false,
          blending:
            THREE.AdditiveBlending,
          toneMapped: false,
        })

      /*
       * -----------------------------------------------------
       * PROCEDURAL POSITION
       * -----------------------------------------------------
       */

      const localDirection =
        positionLocal.normalize()

      const largeField =
        triNoise3D(
          localDirection.mul(3.2),
          0.16,
          time,
        )

      const fineField =
        triNoise3D(
          localDirection.mul(9.0),
          0.28,
          time.mul(0.75),
        )

      const plasma =
        largeField
          .mul(0.78)
          .add(
            fineField.mul(0.22),
          )

      /*
       * Keep deformation controlled.
       * We want an unstable surface,
       * not a melted sphere.
       */
      const displacement =
        plasma
          .sub(0.5)
          .mul(0.11)

      material.positionNode =
        positionLocal.add(
          normalLocal.mul(
            displacement,
          ),
        )

      /*
       * -----------------------------------------------------
       * COLORS
       * -----------------------------------------------------
       */

      const darkRed =
        vec3(
          0.10,
          0.001,
          0.003,
        )

      const evilRed =
        vec3(
          1.0,
          0.006,
          0.018,
        )

      const deepBlue =
        vec3(
          0.002,
          0.035,
          0.42,
        )

      const electricBlue =
        vec3(
          0.008,
          0.18,
          1.0,
        )

      const gold =
        vec3(
          1.0,
          0.30,
          0.006,
        )

      /*
       * Red is the body identity.
       */
      const redMask =
        smoothstep(
          0.20,
          0.72,
          plasma,
        )

      let color =
        mix(
          darkRed,
          evilRed,
          redMask,
        )

      /*
       * Blue appears as structured
       * computational interference.
       */
      const bluePattern =
        smoothstep(
          0.68,
          0.93,
          triNoise3D(
            localDirection.mul(6.5),
            0.20,
            time.mul(0.55),
          ),
        )

      color =
        mix(
          color,
          electricBlue,
          bluePattern.mul(0.38),
        )

      /*
       * Very small amount of deep blue
       * in quieter regions.
       */
      color =
        mix(
          color,
          deepBlue,
          float(0.12),
        )

      /*
       * Gold is intentionally rare.
       */
      const goldPattern =
        smoothstep(
          0.90,
          0.98,
          fineField,
        )

      color =
        mix(
          color,
          gold,
          goldPattern.mul(0.32),
        )

      /*
       * -----------------------------------------------------
       * BREATHING / ENERGY
       * -----------------------------------------------------
       */

      const breathing =
        float(1.0)
          .add(
            time
              .mul(1.35)
              .sin()
              .mul(0.08),
          )

      const energy =
        float(0.65)
          .add(
            plasma.mul(1.55),
          )
          .mul(breathing)

      /*
       * HDR-style output.
       */
      material.colorNode =
        color.mul(
          energy,
        )

      return material
    }, [])

  useFrame(
    ({
      clock,
    }) => {

      if (!meshRef.current)
        return

      /*
       * Very slow entity-level rotation.
       * The shader handles the internal activity.
       */
      meshRef.current.rotation.y =
        clock.elapsedTime *
        0.075

      meshRef.current.rotation.x =
        Math.sin(
          clock.elapsedTime *
          0.16,
        ) *
        0.06
    },
  )

  return (
    <mesh
      ref={meshRef}
      scale={0.82}
    >
      <icosahedronGeometry
        args={[
          0.82,
          96,
        ]}
      />

      <primitive
        object={material}
        attach="material"
      />
    </mesh>
  )
}