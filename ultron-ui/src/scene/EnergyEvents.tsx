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
  uniform,
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

import {
  getEntityVisualState,
} from '../state/entityStore'

/* =========================================================
   CONFIG
   =========================================================

   Energy events are intentionally sparse.

   They are transient computational incidents, not another
   permanent particle field.

   ========================================================= */

const EVENT_COUNT = 700

/* =========================================================
   GPU ENERGY EVENT SYSTEM
   ========================================================= */

export default function TSLEnergyEvents() {

  const { gl } =
    useThree()

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
     ULTRON VISUAL STATE
     ======================================================= */

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
      () => uniform(0.58),
      [],
    )

  const eventDensity =
    useMemo(
      () => uniform(0.035),
      [],
    )

  const eventIntensity =
    useMemo(
      () => uniform(0.06),
      [],
    )

  const informationSpeed =
    useMemo(
      () => uniform(0.12),
      [],
    )

  const visualMotion =
    useMemo(
      () => uniform(0.25),
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
            hash(
              id.add(1000),
            )

          const r1 =
            hash(
              id.add(1200),
            )

          const r2 =
            hash(
              id.add(1400),
            )

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
                .mul(
                  theta.cos(),
                ),

              phi.cos(),

              phi.sin()
                .mul(
                  theta.sin(),
                ),

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

          /* -------------------------------------------------
             EVENT TRAVEL
             ------------------------------------------------- */

          const travel =
            time
              .mul(
                speed.mul(
                  float(0.82).add(
                    informationSpeed.mul(
                      0.75,
                    ),
                  ),
                ),
              )
              .add(
                phase,
              )
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

          /* -------------------------------------------------
             ORGANIC ORBITAL DEFLECTION
             ------------------------------------------------- */

          const orbitAngle =
            time
              .mul(
                float(0.55).add(
                  visualMotion.mul(
                    0.30,
                  ),
                ),
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
                .mul(
                  float(0.10).add(
                    visualMotion.mul(
                      0.05,
                    ),
                  ),
                ),

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

          /* -------------------------------------------------
             EVENT ENERGY ENVELOPE
             ------------------------------------------------- */

          const envelope =
            smoothstep(
              0.04,
              0.20,
              travel,
            )
              .mul(
                smoothstep(
                  1.0,
                  0.72,
                  travel,
                ),
              )

          /* -------------------------------------------------
             SMALL FLICKER
             ------------------------------------------------- */

          const flicker =
            float(0.78)
              .add(
                phase
                  .add(
                    time.mul(
                      6.0,
                    ),
                  )
                  .sin()
                  .mul(
                    0.22,
                  ),
              )

          const stateEnergy =
            float(0.30).add(
              eventIntensity.mul(
                0.70,
              ),
            )

          energies
            .element(id)
            .assign(
              envelope
                .mul(
                  flicker,
                )
                .mul(
                  stateEnergy,
                ),
            )

          /* -------------------------------------------------
             DIRECTION EVOLUTION
             ------------------------------------------------- */

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

        informationSpeed,
        visualMotion,
        eventIntensity,
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

            toneMapped:
              false,
          })

        material.positionNode =
          positions.toAttribute()

        const energy =
          energies.element(
            instanceIndex,
          )

        /* -------------------------------------------------
           EVENT IDENTITY
           ------------------------------------------------- */

        const identity =
          hash(
            instanceIndex.add(
              1700,
            ),
          )

        /*
         * Only a fraction of the event population is
         * visible depending on the current semantic state.
         *
         * Idle:
         *   almost invisible
         *
         * Executing:
         *   many more events visible
         *
         * Alert:
         *   very high event density
         */
        const activationThreshold =
          float(1.0)
            .sub(
              eventDensity,
            )

        const activeMask =
          smoothstep(
            activationThreshold
              .sub(0.025),

            activationThreshold
              .add(0.01),

            identity,
          )

        /* -------------------------------------------------
           EVENT SIZE
           ------------------------------------------------- */

        const length =
          float(0.025)
            .add(
              energy.mul(
                0.10,
              ),
            )
            .add(
              eventIntensity.mul(
                0.025,
              ),
            )

        const width =
          float(0.0025)
            .add(
              energy.mul(
                0.006,
              ),
            )

        material.scaleNode =
          vec2(
            length,
            width,
          )

        /* -------------------------------------------------
           EVENT ROTATION
           ------------------------------------------------- */

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

        /* =================================================
           SEMANTIC COLORS
           ================================================= */

        const red =
          vec3(
            0.95,
            0.003,
            0.010,
          )

        const blue =
          vec3(
            0.005,
            0.12,
            0.96,
          )

        const gold =
          vec3(
            1.00,
            0.36,
            0.008,
          )

        /*
         * Global ULTRON color state.
         */
        const stateColor =
          red
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

        /*
         * Information-heavy states get subtle blue
         * emphasis at event peaks.
         */
        const informationAccent =
          blueWeight
            .mul(
              eventIntensity,
            )
            .mul(
              smoothstep(
                0.68,
                0.95,
                energy,
              ),
            )

        /*
         * Execution gets a stronger gold accent at
         * event peaks.
         */
        const executionAccent =
          goldWeight
            .mul(
              eventIntensity,
            )
            .mul(
              smoothstep(
                0.58,
                0.92,
                energy,
              ),
            )

        let color =
          mix(
            stateColor,
            blue,
            informationAccent.mul(
              0.25,
            ),
          )

        color =
          mix(
            color,
            gold,
            executionAccent.mul(
              0.28,
            ),
          )

        /* -------------------------------------------------
           EVENT ENERGY
           ------------------------------------------------- */

        const brightness =
          float(0.18)
            .add(
              energy.mul(
                1.70,
              ),
            )
            .mul(
              float(0.48).add(
                visualIntensity.mul(
                  0.52,
                ),
              ),
            )

        material.colorNode =
          color.mul(
            brightness,
          )

        /* -------------------------------------------------
           SOFT SPARK BODY
           ------------------------------------------------- */

        const local =
          uv()
            .sub(0.5)
            .abs()

        const horizontal =
          smoothstep(
            0.50,
            0.04,
            local.x,
          )

        const vertical =
          smoothstep(
            0.50,
            0.05,
            local.y,
          )

        /*
         * Local event opacity.
         *
         * activeMask is the major clutter-control
         * mechanism.
         */
        material.opacityNode =
          horizontal
            .mul(
              vertical,
            )
            .mul(
              energy.mul(
                0.70,
              ),
            )
            .mul(
              activeMask,
            )
            .mul(
              float(0.25).add(
                visualIntensity.mul(
                  0.50,
                ),
              ),
            )

        return material

      },
      [
        positions,
        phases,
        speeds,
        energies,

        redWeight,
        blueWeight,
        goldWeight,

        visualIntensity,

        eventDensity,
        eventIntensity,
      ],
    )

  /* =======================================================
     EVENT MESH
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
     INITIALIZE GPU STATE
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

    const visualState =
      getEntityVisualState()

    /* ---------------------------------------------------
       COLOR STATE
       --------------------------------------------------- */

    redWeight.value =
      visualState.redWeight

    blueWeight.value =
      visualState.blueWeight

    goldWeight.value =
      visualState.goldWeight

    /* ---------------------------------------------------
       GLOBAL INTENSITY
       --------------------------------------------------- */

    visualIntensity.value =
      visualState.intensity

    /* ---------------------------------------------------
       EVENT BEHAVIOR
       --------------------------------------------------- */

    eventDensity.value =
      visualState.eventDensity

    eventIntensity.value =
      visualState.eventIntensity

    informationSpeed.value =
      visualState.informationSpeed

    visualMotion.value =
      visualState.motion

    /* ---------------------------------------------------
       GPU UPDATE
       --------------------------------------------------- */

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

  /* =======================================================
     OUTPUT
     ======================================================= */

  return (
    <primitive
      object={eventMesh}
    />
  )
}