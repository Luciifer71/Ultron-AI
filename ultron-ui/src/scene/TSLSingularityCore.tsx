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
  uniform,
  vec3,
  positionLocal,
  normalLocal,
} from 'three/tsl'

import {
  useMemo,
  useRef,
} from 'react'

import {
  useFrame,
} from '@react-three/fiber'

import {
  getEntityVisualState,
} from '../state/entityStore'

export default function TSLSingularityCore() {

  const meshRef =
    useRef<THREE.Mesh>(null)

  /* =====================================================
     ULTRON VISUAL STATE
     =====================================================

     These uniforms are controlled by the central
     ULTRON visual-state system.

     RED  = ULTRON / computation
     BLUE = listening / information
     GOLD = execution / high-value activity

     ===================================================== */

  const redWeight =
    useMemo(
      () => uniform(0.94),
      [],
    )

  const blueWeight =
    useMemo(
      () => uniform(0.05),
      [],
    )

  const goldWeight =
    useMemo(
      () => uniform(0.01),
      [],
    )

  const visualIntensity =
    useMemo(
      () => uniform(0.72),
      [],
    )

  const coreGlow =
    useMemo(
      () => uniform(0.82),
      [],
    )

  /* =====================================================
     MATERIAL
     ===================================================== */

  const material =
    useMemo(
      () => {

        const material =
          new MeshBasicNodeMaterial({
            transparent: true,

            depthWrite:
              false,

            blending:
              THREE.AdditiveBlending,

            toneMapped:
              false,
          })

        /* -------------------------------------------------
           PROCEDURAL POSITION
           ------------------------------------------------- */

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
         * Controlled deformation.
         *
         * We want a living unstable surface,
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

        /* -------------------------------------------------
           ULTRON COLOR SYSTEM
           ------------------------------------------------- */

        const darkRed =
          vec3(
            0.025,
            0.0005,
            0.0015,
          )

        const red =
          vec3(
            1.0,
            0.006,
            0.018,
          )

        const blue =
          vec3(
            0.008,
            0.18,
            1.0,
          )

        const gold =
          vec3(
            1.0,
            0.42,
            0.008,
          )

        /*
         * Procedural red body structure.
         */
        const redMask =
          smoothstep(
            0.20,
            0.72,
            plasma,
          )

        const redField =
          mix(
            darkRed,
            red,
            redMask,
          )

        /*
         * Global semantic color state.
         *
         * The entire core now responds to the current
         * ULTRON mode instead of using random color
         * assignments as its primary identity.
         */
        const stateColor =
          redField
            .mul(
              redWeight,
            )
            .add(
              blue.mul(
                blueWeight,
              ),
            )
            .add(
              gold.mul(
                goldWeight,
              ),
            )

        /* -------------------------------------------------
           INTERNAL COMPUTATIONAL STRUCTURE
           ------------------------------------------------- */

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

        const goldPattern =
          smoothstep(
            0.90,
            0.98,
            fineField,
          )

        /*
         * During listening/thinking, blue can appear
         * as structured internal information activity.
         */
        let color =
          mix(
            stateColor,
            blue,
            bluePattern
              .mul(
                blueWeight.mul(
                  0.35,
                ),
              ),
          )

        /*
         * During execution, gold can propagate
         * through the plasma structure.
         */
        color =
          mix(
            color,
            gold,
            goldPattern
              .mul(
                goldWeight.mul(
                  0.65,
                ),
              ),
          )

        /* -------------------------------------------------
           BREATHING / ENERGY
           ------------------------------------------------- */

        const breathing =
          float(1.0)
            .add(
              time
                .mul(1.35)
                .sin()
                .mul(0.08),
            )

        /*
         * Base plasma energy.
         *
         * Visual intensity and core glow now come from
         * the central ULTRON visual-state controller.
         */
        const energy =
          float(0.55)
            .add(
              plasma.mul(1.55),
            )
            .mul(
              breathing,
            )
            .mul(
              visualIntensity,
            )
            .mul(
              coreGlow,
            )

        /* -------------------------------------------------
           HDR-STYLE OUTPUT
           ------------------------------------------------- */

        material.colorNode =
          color.mul(
            energy,
          )

        return material

      },
      [
        redWeight,
        blueWeight,
        goldWeight,
        visualIntensity,
        coreGlow,
      ],
    )

  /* =====================================================
     ENTITY MOTION
     ===================================================== */

  useFrame(
    ({
      clock,
    }) => {

      const visualState =
        getEntityVisualState()

      /*
       * Live semantic color state.
       */
      redWeight.value =
        visualState.redWeight

      blueWeight.value =
        visualState.blueWeight

      goldWeight.value =
        visualState.goldWeight

      /*
       * Live global visual intensity.
       */
      visualIntensity.value =
        visualState.intensity

      coreGlow.value =
        visualState.coreGlow

      if (
        !meshRef.current
      ) {
        return
      }

      /*
       * Entity-level rotation remains subtle.
       *
       * The shader itself performs the actual
       * computational activity.
       */
      meshRef.current.rotation.y =
        clock.elapsedTime *
        (
          0.045 +
          visualState.motion *
          0.035
        )

      meshRef.current.rotation.x =
        Math.sin(
          clock.elapsedTime *
          (
            0.12 +
            visualState.turbulence *
            0.08
          ),
        ) *
        0.06
    },
  )

  /* =====================================================
     OUTPUT
     ===================================================== */

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