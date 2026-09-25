import * as THREE from 'three/webgpu'

import {
  SpriteNodeMaterial,
} from 'three/webgpu'

import {
  getEntityVisualState,
} from '../state/entityStore'

import {
  Fn,
  deltaTime,
  float,
  hash,
  instanceIndex,
  instancedArray,
  smoothstep,
  step,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl'

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

const PARTICLE_COUNT = 16000

/* =========================================================
   GPU PARTICLE FIELD
   ========================================================= */

export default function TSLParticleField() {

  const { gl } =
    useThree()

  const renderer =
    gl as unknown as THREE.WebGPURenderer

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
      () => uniform(0.72),
      [],
    )

  const visualMotion =
    useMemo(
      () => uniform(0.25),
      [],
    )

  /* =======================================================
     GPU STORAGE
     =======================================================

     Every particle owns:

       position = vec3
       velocity = vec3

     ======================================================= */

  const positions =
    useMemo(
      () =>
        instancedArray(
          PARTICLE_COUNT,
          'vec3',
        ),
      [],
    )

  const velocities =
    useMemo(
      () =>
        instancedArray(
          PARTICLE_COUNT,
          'vec3',
        ),
      [],
    )

  /* =======================================================
     INITIAL GPU STATE
     ======================================================= */

  const initializeParticles =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          /*
           * Deterministic random spherical
           * distribution.
           */
          const randomA =
            hash(id)

          const randomB =
            hash(
              id.add(17),
            )

          const randomC =
            hash(
              id.add(43),
            )

          const theta =
            randomA.mul(
              Math.PI * 2,
            )

          const phi =
            randomB.mul(
              Math.PI,
            )

          const radius =
            float(0.75)
              .add(
                randomC.mul(0.95),
              )

          const sinPhi =
            phi.sin()

          const position =
            vec3(
              sinPhi
                .mul(theta.cos())
                .mul(radius),

              phi.cos()
                .mul(radius),

              sinPhi
                .mul(theta.sin())
                .mul(radius),
            )

          /*
           * Tangential starting velocity.
           */
          const tangent =
            vec3(
              position.z.negate(),
              float(0),
              position.x,
            )
              .normalize()

          const velocity =
            tangent.mul(
              float(0.25)
                .add(
                  randomC.mul(
                    0.35,
                  ),
                ),
            )

          positions
            .element(id)
            .assign(
              position,
            )

          velocities
            .element(id)
            .assign(
              velocity,
            )

        })().compute(
          PARTICLE_COUNT,
        ),
      [
        positions,
        velocities,
      ],
    )

  /* =======================================================
     GPU SIMULATION
     ======================================================= */

  const updateParticles =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const position =
            positions.element(id)

          const velocity =
            velocities.element(id)

          const radius =
            position.length()

          const radial =
            position.normalize()

          /*
           * Primary vortex.
           */
          const vortex =
            vec3(
              position.z.negate(),
              float(0),
              position.x,
            )
              .normalize()

          /*
           * Secondary 3D vortex.
           */
          const secondaryVortex =
            vec3(
              position.y.negate(),
              position.z,
              position.x.negate(),
            )
              .normalize()

          /*
           * Procedural turbulence.
           */
          const turbulence =
            vec3(

              position.y
                .mul(3.7)
                .add(
                  time.mul(0.55),
                )
                .sin(),

              position.z
                .mul(4.1)
                .sub(
                  time.mul(0.43),
                )
                .cos(),

              position.x
                .mul(4.8)
                .add(
                  time.mul(0.31),
                )
                .sin(),

            ).normalize()

          /*
           * Push particles away from
           * the singularity.
           */
          const coreRepulsion =
            float(1)
              .sub(
                smoothstep(
                  0.32,
                  0.78,
                  radius,
                ),
              )

          /*
           * Pull particles back from
           * the outer boundary.
           */
          const outerConfinement =
            smoothstep(
              1.55,
              2.10,
              radius,
            )

          /*
           * Slowly breathing shell.
           */
          const breathingShell =
            time
              .mul(0.55)
              .add(
                position.y.mul(2.5),
              )
              .sin()

          /*
           * ------------------------------------------------
           * ULTRON STATE-DRIVEN MOTION
           * ------------------------------------------------
           *
           * Idle:
           *   calm particle motion
           *
           * Listening:
           *   particles become more responsive
           *
           * Thinking:
           *   stronger motion
           *
           * Executing:
           *   aggressive motion
           */
          const motionBoost =
            float(0.72)
              .add(
                visualMotion.mul(
                  0.55,
                ),
              )

          /*
           * Combined vector field.
           */
          const force =
            vortex
              .mul(
                motionBoost,
              )

              .add(
                secondaryVortex.mul(
                  float(0.20)
                    .add(
                      visualMotion.mul(
                        0.18,
                      ),
                    ),
                ),
              )

              .add(
                turbulence.mul(
                  float(0.24)
                    .add(
                      visualMotion.mul(
                        0.22,
                      ),
                    ),
                ),
              )

              .add(
                radial.mul(
                  coreRepulsion
                    .mul(
                      0.72,
                    ),
                ),
              )

              .sub(
                radial.mul(
                  outerConfinement
                    .mul(
                      float(1.55)
                        .add(
                          visualMotion.mul(
                            0.30,
                          ),
                        ),
                    ),
                ),
              )

              .add(
                radial.mul(
                  breathingShell
                    .mul(
                      0.055,
                    ),
                ),
              )

          /*
           * Integrate velocity.
           */
          const newVelocity =
            velocity
              .add(
                force.mul(
                  deltaTime,
                ),
              )
              .mul(
                0.992,
              )

          /*
           * Integrate position.
           */
          const newPosition =
            position.add(
              newVelocity.mul(
                deltaTime,
              ),
            )

          velocities
            .element(id)
            .assign(
              newVelocity,
            )

          positions
            .element(id)
            .assign(
              newPosition,
            )

        })().compute(
          PARTICLE_COUNT,
        ),
      [
        positions,
        velocities,

        /*
         * ULTRON visual state.
         */
        visualMotion,
      ],
    )

  /* =======================================================
     PARTICLE MATERIAL
     ======================================================= */

  const material =
    useMemo(
      () => {

        const particleMaterial =
          new SpriteNodeMaterial()

        particleMaterial.transparent =
          true

        particleMaterial.depthWrite =
          false

        particleMaterial.blending =
          THREE.AdditiveBlending

        particleMaterial.toneMapped =
          false

        /*
         * GPU-computed position.
         */
        particleMaterial.positionNode =
          positions.toAttribute()

        /*
         * -------------------------------------------------
         * PARTICLE SIZE
         * -------------------------------------------------
         */

        const baseSize =
          float(0.018)
            .add(
              hash(
                instanceIndex,
              ).mul(0.030),
            )

        const sizeBoost =
          float(0.72)
            .add(
              visualIntensity.mul(
                0.45,
              ),
            )

        const particleSize =
          baseSize.mul(
            sizeBoost,
          )

        particleMaterial.scaleNode =
          vec2(
            particleSize,
          )

        /*
         * -------------------------------------------------
         * VELOCITY BRIGHTNESS
         * -------------------------------------------------
         */

        const speed =
          velocities
            .toAttribute()
            .length()

        /*
         * -------------------------------------------------
         * ULTRON COLORS
         * -------------------------------------------------
         *
         * These are now SEMANTIC.
         *
         * redWeight:
         *   ULTRON / computation
         *
         * blueWeight:
         *   listening / information
         *
         * goldWeight:
         *   execution / high-value activity
         * -------------------------------------------------
         */

        const red =
          vec3(
            1.0,
            0.004,
            0.012,
          )

        const blue =
          vec3(
            0.005,
            0.08,
            0.85,
          )

        const gold =
          vec3(
            1.0,
            0.32,
            0.008,
          )

        /*
         * Global semantic color field.
         *
         * Unlike the old system, particles are no longer
         * permanently assigned random red/blue/gold colors.
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
         * Preserve a little natural particle variation
         * without allowing randomness to override the
         * current ULTRON state.
         */
        const colorSeed =
          hash(
            instanceIndex.add(71),
          )

        const identityVariation =
          float(0.78)
            .add(
              colorSeed.mul(
                0.22,
              ),
            )

        const color =
          stateColor.mul(
            identityVariation,
          )

        /*
         * -------------------------------------------------
         * ENERGY
         * -------------------------------------------------
         */

        const velocityEnergy =
          smoothstep(
            0.20,
            1.05,
            speed,
          )

        const energy =
          float(0.30)
            .add(
              velocityEnergy.mul(
                0.95,
              ),
            )
            .mul(
              float(0.55)
                .add(
                  visualIntensity.mul(
                    0.70,
                  ),
                ),
            )

        particleMaterial.colorNode =
          color.mul(
            energy,
          )

        /*
         * -------------------------------------------------
         * SOFT PARTICLE
         * -------------------------------------------------
         */

        const circle =
          step(
            uv()
              .sub(0.5)
              .length(),
            0.5,
          )

        particleMaterial.opacityNode =
          circle.mul(
            float(0.25)
              .add(
                energy.mul(
                  0.46,
                ),
              ),
          )

        return particleMaterial

      },
      [
        positions,
        velocities,

        redWeight,
        blueWeight,
        goldWeight,

        visualIntensity,
      ],
    )

  /* =======================================================
     MESH
     ======================================================= */

  const particleMesh =
    useMemo(
      () => {

        /*
         * A tiny plane is rendered as a
         * GPU-driven sprite.
         */
        const geometry =
          new THREE.PlaneGeometry(
            0.06,
            0.06,
          )

        const mesh =
          new THREE.InstancedMesh(
            geometry,
            material,
            PARTICLE_COUNT,
          )

        mesh.frustumCulled =
          false

        return mesh

      },
      [
        material,
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

    renderer.compute(
      initializeParticles,
    )

  }, [
    renderer,
    initializeParticles,
  ])

  /* =======================================================
     COMPUTE EACH FRAME
     ======================================================= */

  useFrame(() => {

    /*
     * Read the live semantic ULTRON state.
     */
    const visualState =
      getEntityVisualState()

    /*
     * Update color composition.
     */
    redWeight.value =
      visualState.redWeight

    blueWeight.value =
      visualState.blueWeight

    goldWeight.value =
      visualState.goldWeight

    /*
     * Update global visual intensity.
     */
    visualIntensity.value =
      visualState.intensity

    /*
     * Update particle motion.
     */
    visualMotion.value =
      visualState.motion

    /*
     * Continue GPU simulation.
     */
    renderer.compute(
      updateParticles,
    )

  })

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {

    return () => {

      particleMesh.geometry.dispose()

      material.dispose()

    }

  }, [
    particleMesh,
    material,
  ])

  /* =======================================================
     OUTPUT
     ======================================================= */

  return (
    <primitive
      object={particleMesh}
    />
  )
}