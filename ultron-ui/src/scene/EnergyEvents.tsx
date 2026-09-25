import * as THREE from 'three/webgpu'

import {
  Fn,
  float,
  hash,
  instanceIndex,
  instancedArray,
  mix,
  smoothstep,
  time,
  uv,
  vec2,
  vec3,
} from 'three/tsl'

import {
  SpriteNodeMaterial,
} from 'three/webgpu'

import {
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  useFrame,
  useThree,
} from '@react-three/fiber'

/* =========================================================
   CONFIG
   ========================================================= */

const EVENT_COUNT = 1200

/* =========================================================
   GPU ENERGY EVENT SYSTEM
   ========================================================= */

export default function TSLEnergyEvents() {

  const { gl } = useThree()

  const renderer =
    gl as unknown as THREE.WebGPURenderer

  /* =======================================================
     GPU EVENT STATE
     ======================================================= */

  const positions =
    useMemo(
      () =>
        instancedArray(
          EVENT_COUNT,
          'vec3',
        ),
      [],
    )

  const directions =
    useMemo(
      () =>
        instancedArray(
          EVENT_COUNT,
          'vec3',
        ),
      [],
    )

  const phases =
    useMemo(
      () =>
        instancedArray(
          EVENT_COUNT,
          'float',
        ),
      [],
    )

  const speeds =
    useMemo(
      () =>
        instancedArray(
          EVENT_COUNT,
          'float',
        ),
      [],
    )

  const energies =
    useMemo(
      () =>
        instancedArray(
          EVENT_COUNT,
          'float',
        ),
      [],
    )

  /* =======================================================
     INITIALIZE EVENTS
     ======================================================= */

  const initializeEvents =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const r0 =
            hash(id.add(1000))

          const r1 =
            hash(id.add(1200))

          const r2 =
            hash(id.add(1400))

          const theta =
            r0.mul(
              Math.PI * 2,
            )

          const phi =
            r1.mul(
              Math.PI,
            )

          const direction =
            vec3(
              phi.sin()
                .mul(theta.cos()),

              phi.cos(),

              phi.sin()
                .mul(theta.sin()),
            ).normalize()

          /*
           * Events begin throughout
           * the computational shell.
           */
          const startingRadius =
            float(0.42)
              .add(
                r2.mul(
                  1.10,
                ),
              )

          const position =
            direction.mul(
              startingRadius,
            )

          positions
            .element(id)
            .assign(
              position,
            )

          directions
            .element(id)
            .assign(
              direction,
            )

          phases
            .element(id)
            .assign(
              r0.mul(
                Math.PI * 2,
              ),
            )

          speeds
            .element(id)
            .assign(
              float(0.35)
                .add(
                  r1.mul(
                    1.15,
                  ),
                ),
            )

          energies
            .element(id)
            .assign(
              float(0.20)
                .add(
                  r2.mul(
                    0.80,
                  ),
                ),
            )

        })().compute(
          EVENT_COUNT,
        ),
      [
        positions,
        directions,
        phases,
        speeds,
        energies,
      ],
    )

  /* =======================================================
     UPDATE EVENTS
     ======================================================= */

  const updateEvents =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const direction =
            directions.element(id)

          const phase =
            phases.element(id)

          const speed =
            speeds.element(id)

          /*
           * Radial shell coordinate.
           */

          /*
           * Event travels outward,
           * then cycles back inward.
           */
          const travel =
            time
              .mul(speed)
              .add(phase)
              .sin()
              .mul(0.5)
              .add(0.5)

          const targetRadius =
            float(0.48)
              .add(
                travel.mul(
                  1.42,
                ),
              )

          /*
           * Small orbital deflection.
           */
          const orbitAngle =
            time
              .mul(
                0.65,
              )
              .add(
                phase,
              )

          const orbital =
            vec3(

              direction.z
                .negate()
                .mul(
                  orbitAngle.sin(),
                ),

              orbitAngle.cos()
                .mul(0.15),

              direction.x
                .mul(
                  orbitAngle.cos(),
                ),

            )

          const eventPosition =
            direction
              .mul(
                targetRadius,
              )
              .add(
                orbital.mul(
                  0.10,
                ),
              )

          positions
            .element(id)
            .assign(
              eventPosition,
            )

          /*
           * Energy is strongest around
           * the middle of the event path.
           */
          const envelope =
            smoothstep(
              0.02,
              0.18,
              travel,
            )
              .mul(
                smoothstep(
                  1.0,
                  0.72,
                  travel,
                ),
              )

          /*
           * Fast secondary modulation.
           */
          const flicker =
            float(0.72)
              .add(
                phase
                  .add(
                    time.mul(8.0),
                  )
                  .sin()
                  .mul(0.28),
              )

          energies
            .element(id)
            .assign(
              envelope.mul(
                flicker,
              ),
            )

          /*
           * Direction changes subtly as
           * the energy packet progresses.
           */
          directions
            .element(id)
            .assign(
              mix(
                direction,
                eventPosition.normalize(),
                0.08,
              ),
            )

        })().compute(
          EVENT_COUNT,
        ),
      [
        positions,
        directions,
        phases,
        speeds,
        energies,
      ],
    )

  /* =======================================================
     EVENT MATERIAL
     ======================================================= */

  const eventMaterial =
    useMemo(
      () => {

        const material =
          new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending:
              THREE.AdditiveBlending,
            toneMapped: false,
          })

        material.positionNode =
          positions.toAttribute()

        /*
         * Energy event becomes a bright
         * elongated computational spark.
         */
        const energy =
          energies.element(
            instanceIndex,
          )

        const length =
          float(0.035)
            .add(
              energy.mul(
                0.14,
              ),
            )

        const width =
          float(0.004)
            .add(
              energy.mul(
                0.012,
              ),
            )

        material.scaleNode =
          vec2(
            length,
            width,
          )

        /*
         * Each event continuously rotates.
         */
        material.rotationNode =
          phases
            .element(
              instanceIndex,
            )
            .add(
              time.mul(
                speeds.element(
                  instanceIndex,
                ),
              ),
            )

        /* -------------------------------------------------
           COLOR
           ------------------------------------------------- */

        const red =
          vec3(
            1.0,
            0.004,
            0.012,
          )

        const blue =
          vec3(
            0.005,
            0.10,
            0.92,
          )

        const gold =
          vec3(
            1.0,
            0.32,
            0.006,
          )

        const identity =
          hash(
            instanceIndex.add(
              1700,
            ),
          )

        /*
         * Most events are red.
         */
        const blueMask =
          smoothstep(
            0.76,
            0.94,
            identity,
          )

        /*
         * Only a very small percentage
         * become gold.
         */
        const goldMask =
          smoothstep(
            0.988,
            0.998,
            identity,
          )

        let color =
          mix(
            red,
            blue,
            blueMask,
          )

        color =
          mix(
            color,
            gold,
            goldMask,
          )

        /*
         * HDR-like event intensity.
         */
        material.colorNode =
          color.mul(
            float(0.25)
              .add(
                energy.mul(
                  3.2,
                ),
              ),
          )

        /*
         * Soft spark body.
         */
        const local =
          uv()
            .sub(0.5)
            .abs()

        const horizontal =
          smoothstep(
            0.50,
            0.03,
            local.x,
          )

        const vertical =
          smoothstep(
            0.50,
            0.04,
            local.y,
          )

        material.opacityNode =
          horizontal
            .mul(
              vertical,
            )
            .mul(
              energy,
            )

        return material

      },
      [
        positions,
        phases,
        speeds,
        energies,
      ],
    )

  /* =======================================================
     GPU EVENT MESH
     ======================================================= */

  const eventMesh =
    useMemo(
      () => {

        const geometry =
          new THREE.PlaneGeometry(
            1,
            1,
          )

        const mesh =
          new THREE.InstancedMesh(
            geometry,
            eventMaterial,
            EVENT_COUNT,
          )

        mesh.frustumCulled =
          false

        return mesh

      },
      [
        eventMaterial,
      ],
    )

  /* =======================================================
     INITIALIZE
     ======================================================= */

  const initialized =
    useRef(false)

  useEffect(() => {

    if (
      initialized.current
    ) {
      return
    }

    initialized.current =
      true

    void renderer.computeAsync(
      initializeEvents,
    )

  }, [
    renderer,
    initializeEvents,
  ])

  /* =======================================================
     GPU UPDATE
     ======================================================= */

  useFrame(() => {

    void renderer.compute(
      updateEvents,
    )

  })

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {

    return () => {

      eventMesh.geometry.dispose()

      eventMaterial.dispose()

    }

  }, [
    eventMesh,
    eventMaterial,
  ])

  return (
    <primitive
      object={eventMesh}
    />
  )
}   