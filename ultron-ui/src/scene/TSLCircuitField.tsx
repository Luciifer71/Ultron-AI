import * as THREE from 'three/webgpu'


import {
  Fn,
  deltaTime,
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
  getEntityVisualState,
} from '../state/entityStore'

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

const FRAGMENT_COUNT = 5000
const NODE_COUNT = 900

/* =========================================================
   TSL CURL-NOISE APPROXIMATION
   ========================================================= */

/*
 * TSL in the installed Three.js version does not expose
 * curlNoise() through the TypeScript API we are using.
 *
 * We therefore construct a rotational vector field from
 * finite differences of simplex noise.
 *
 * Conceptually:
 *
 *       scalar noise field
 *              ↓
 *        spatial gradient
 *              ↓
 *      rotational vector field
 *
 * This gives us fluid-like motion without hard-coded curves.
 */

/* =========================================================
   GPU CIRCUIT FIELD
   ========================================================= */

export default function TSLCircuitField() {

  const { gl } =
    useThree()

  const renderer =
    gl as unknown as THREE.WebGPURenderer

  /* =======================================================
     GPU STORAGE
     ======================================================= */

  const positions =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'vec3',
        ),
      [],
    )

  const velocities =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'vec3',
        ),
      [],
    )

  const phases =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'float',
        ),
      [],
    )

  const speeds =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'float',
        ),
      [],
    )

  const lengths =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'float',
        ),
      [],
    )
/* =======================================================
   ULTRON ENTITY STATE
   ======================================================= */

const entityActivity =
  useMemo(
    () => uniform(0.20),
    [],
  )

const entityAttention =
  useMemo(
    () => uniform(0.35),
    [],
  )

const entityProcessing =
  useMemo(
    () => uniform(0.10),
    [],
  )

const entityEnergy =
  useMemo(
    () => uniform(0.55),
    [],
  )

const entityNetworkActivity =
  useMemo(
    () => uniform(0.05),
    [],
  )
  /* =======================================================
     GPU INITIALIZATION
     ======================================================= */

  const initializeFragments =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const randomA =
            hash(id)

          const randomB =
            hash(
              id.add(17),
            )

          const randomC =
            hash(
              id.add(47),
            )

          const randomD =
            hash(
              id.add(91),
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
            float(0.72).add(
              randomC.mul(
                1.15,
              ),
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

          const radial =
            position.normalize()

          const tangent =
            vec3(
              radial.z.negate(),
              float(0),
              radial.x,
            ).normalize()

          const speed =
            float(0.18).add(
              randomD.mul(
                0.82,
              ),
            )

          const length =
            float(0.025).add(
              randomC.mul(
                0.15,
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
              tangent.mul(
                speed,
              ),
            )

          phases
            .element(id)
            .assign(
              randomA.mul(
                Math.PI * 2,
              ),
            )

          speeds
            .element(id)
            .assign(
              speed,
            )

          lengths
            .element(id)
            .assign(
              length,
            )

        })().compute(
          FRAGMENT_COUNT,
        ),
      [
        positions,
        velocities,
        phases,
        speeds,
        lengths,
      ],
    )
/* =======================================================
   GPU DYNAMIC SIMULATION
   ======================================================= */

const updateFragments =
  useMemo(
    () =>
      Fn(() => {

        const id =
          instanceIndex

        const position =
          positions.element(id)

        const velocity =
          velocities.element(id)

        const phase =
          phases.element(id)

        const speed =
          speeds.element(id)

        const radius =
          position.length()

        const radial =
          position.normalize()

        /*
         * Main vortex.
         *
         * ULTRON activity increases the rotational
         * intensity of the computational field.
         */
        const vortex =
          vec3(
            position.z.negate(),
            float(0),
            position.x,
          ).normalize()

        /*
         * Secondary 3D flow.
         */
        const vortex2 =
          vec3(
            position.y.negate(),
            position.z,
            position.x.negate(),
          ).normalize()

        /*
         * Procedural rotational turbulence.
         */
        const fieldTime =
          time.mul(0.35)

        const turbulence =
          vec3(
            position.y
              .mul(3.7)
              .add(fieldTime)
              .sin()
              .add(
                position.z
                  .mul(2.1)
                  .sub(
                    fieldTime.mul(0.7),
                  )
                  .cos()
                  .mul(0.5),
              ),

            position.z
              .mul(4.1)
              .sub(
                fieldTime.mul(0.8),
              )
              .sin()
              .add(
                position.x
                  .mul(2.7)
                  .add(fieldTime)
                  .cos()
                  .mul(0.5),
              ),

            position.x
              .mul(4.8)
              .add(
                fieldTime.mul(0.6),
              )
              .sin()
              .add(
                position.y
                  .mul(3.2)
                  .sub(fieldTime)
                  .cos()
                  .mul(0.5),
              ),
          ).normalize()

        /*
         * Moving energy wave.
         */
        const wave =
          time
            .mul(1.25)
            .add(phase)
            .add(
              radius.mul(4.2),
            )
            .sin()

        /*
         * Central repulsion.
         */
        const coreRepulsion =
          float(1).sub(
            smoothstep(
              0.38,
              0.78,
              radius,
            ),
          )

        /*
         * Outer confinement.
         */
        const outerConfinement =
          smoothstep(
            1.70,
            2.20,
            radius,
          )

        /*
         * Breathing shell.
         */
        const breathing =
          time
            .mul(0.55)
            .add(phase)
            .sin()
            .mul(0.10)

        const targetRadius =
          float(1.35).add(
            breathing,
          )

        const radialCorrection =
          targetRadius
            .sub(radius)
            .mul(0.72)

        /*
         * ===================================================
         * COMBINED ULTRON VECTOR FIELD
         * ===================================================
         *
         * activity
         *     -> increases global motion
         *
         * processing
         *     -> increases turbulence
         *
         * networkActivity
         *     -> increases information-flow velocity
         */
        const force =
          vortex
            .mul(
              float(0.85)
                .add(
                  speed.mul(0.32),
                )
                .add(
                  entityActivity.mul(
                    0.45,
                  ),
                ),
            )

            .add(
              vortex2.mul(0.24),
            )

            .add(
              turbulence.mul(
                float(0.42).add(
                  entityProcessing.mul(
                    0.35,
                  ),
                ),
              ),
            )

            .add(
              radial.mul(
                radialCorrection,
              ),
            )

            .add(
              radial.mul(
                coreRepulsion.mul(
                  1.2,
                ),
              ),
            )

            .sub(
              radial.mul(
                outerConfinement.mul(
                  1.8,
                ),
              ),
            )

            .add(
              radial.mul(
                wave.mul(0.06),
              ),
            )

        /*
         * ===================================================
         * VELOCITY INTEGRATION
         * ===================================================
         *
         * Network activity accelerates the computational
         * information field.
         */
        const newVelocity =
          velocity
            .add(
              force
                .mul(
                  deltaTime,
                )
                .mul(
                  float(1.0).add(
                    entityNetworkActivity.mul(
                      0.75,
                    ),
                  ),
                ),
            )
            .mul(0.986)

        /*
         * Integrate position.
         */
        const newPosition =
          position.add(
            newVelocity.mul(
              deltaTime,
            ),
          )

        /*
         * Prevent collapse into core.
         */
        const safePosition =
          mix(
            newPosition,

            newPosition
              .normalize()
              .mul(0.62),

            smoothstep(
              0.20,
              0.62,
              float(0.62)
                .sub(
                  newPosition.length(),
                ),
            ),
          )

        /*
         * Boundary confinement.
         */
        const boundedPosition =
          mix(
            safePosition,

            safePosition
              .normalize()
              .mul(1.82),

            smoothstep(
              1.72,
              2.18,
              safePosition.length(),
            ),
          )

        /*
         * Store GPU position.
         */
        positions
          .element(id)
          .assign(
            boundedPosition,
          )

        /*
         * Store GPU velocity.
         */
        velocities
          .element(id)
          .assign(
            newVelocity,
          )

        /*
         * ===================================================
         * EVOLVING FRAGMENT IDENTITY
         * ===================================================
         *
         * Network activity changes the rate at which
         * fragments evolve through their phase space.
         */
        phases
          .element(id)
          .assign(
            phase.add(
              deltaTime.mul(
                speed.mul(
                  float(1.0).add(
                    entityNetworkActivity.mul(
                      0.85,
                    ),
                  ),
                ),
              ),
            ),
          )

        /*
         * Dynamic fragment length.
         */
        const newLength =
          lengths
            .element(id)
            .mul(0.992)
            .add(
              float(0.025).mul(
                smoothstep(
                  0.35,
                  1.15,
                  speed,
                ),
              ),
            )

        lengths
          .element(id)
          .assign(
            newLength.clamp(
              0.018,
              0.18,
            ),
          )

      })().compute(
        FRAGMENT_COUNT,
      ),
    [
      positions,
      velocities,
      phases,
      speeds,
      lengths,

      /*
       * ULTRON semantic state.
       */
      entityActivity,
      entityProcessing,
      entityNetworkActivity,
    ],
  )

/* =======================================================
   GPU FRAGMENT MATERIAL
   ======================================================= */

const fragmentMaterial =
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

      /*
       * GPU-computed position.
       */
      material.positionNode =
        positions.toAttribute()

      /*
       * Dynamic length / width.
       */
      const length =
        lengths.element(
          instanceIndex,
        )

      const width =
        float(0.004).add(
          hash(
            instanceIndex.add(71),
          ).mul(0.007),
        )

      material.scaleNode =
        vec2(
          length,
          width,
        )

      /*
       * Dynamic rotation.
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

      /*
       * -----------------------------------------------
       * COLORS
       * -----------------------------------------------
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
          0.07,
          0.85,
        )

      const gold =
        vec3(
          1.0,
          0.30,
          0.006,
        )

      const identity =
        hash(
          instanceIndex.add(113),
        )

      const blueMask =
        smoothstep(
          0.70,
          0.93,
          identity,
        )

      const goldMask =
        smoothstep(
          0.982,
          0.999,
          identity,
        )

      let color =
        mix(
          red,
          blue,
          blueMask.mul(0.72),
        )

      color =
        mix(
          color,
          gold,
          goldMask,
        )

      /*
       * Velocity-driven brightness.
       */
      const velocity =
        velocities.element(
          instanceIndex,
        )

      const speed =
        velocity.length()

      const energy =
        float(0.20).add(
          smoothstep(
            0.18,
            0.95,
            speed,
          ).mul(1.10),
        )

      material.colorNode =
        color.mul(
          energy,
        )

      /*
       * Soft rectangular fragment.
       */
      const fragmentUv =
        uv()
          .sub(0.5)
          .abs()

      const horizontalFade =
        smoothstep(
          0.5,
          0.05,
          fragmentUv.x,
        )

      const verticalFade =
        smoothstep(
          0.5,
          0.05,
          fragmentUv.y,
        )

      material.opacityNode =
        horizontalFade
          .mul(
            verticalFade,
          )
          .mul(
            float(0.35).add(
              energy.mul(0.45),
            ),
          )

      return material

    },
    [
      positions,
      velocities,
      phases,
      speeds,
      lengths,
    ],
  )

/* =======================================================
   NODE FIELD
   ======================================================= */

const nodePositions =
  useMemo(
    () =>
      instancedArray(
        NODE_COUNT,
        'vec3',
      ),
    [],
  )

const nodeVelocities =
  useMemo(
    () =>
      instancedArray(
        NODE_COUNT,
        'vec3',
      ),
    [],
  )

const initializeNodes =
  useMemo(
    () =>
      Fn(() => {

        const id =
          instanceIndex

        const a =
          hash(
            id.add(200),
          )

        const b =
          hash(
            id.add(400),
          )

        const c =
          hash(
            id.add(600),
          )

        const theta =
          a.mul(
            Math.PI * 2,
          )

        const phi =
          b.mul(
            Math.PI,
          )

        const radius =
          float(0.72).add(
            c.mul(1.0),
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

        nodePositions
          .element(id)
          .assign(
            position,
          )

        nodeVelocities
          .element(id)
          .assign(
            vec3(
              0,
              0,
              0,
            ),
          )

      })().compute(
        NODE_COUNT,
      ),
    [
      nodePositions,
      nodeVelocities,
    ],
  )

const updateNodes =
  useMemo(
    () =>
      Fn(() => {

        const id =
          instanceIndex

        const position =
          nodePositions.element(
            id,
          )

        const velocity =
          nodeVelocities.element(
            id,
          )

        const radial =
          position.normalize()

        const nodeTime =
          time.mul(0.22)

        const turbulence =
          vec3(
            position.y
              .mul(2.8)
              .add(nodeTime)
              .sin(),

            position.z
              .mul(3.4)
              .sub(
                nodeTime.mul(0.8),
              )
              .cos(),

            position.x
              .mul(3.1)
              .add(
                nodeTime.mul(0.6),
              )
              .sin(),
          ).normalize()

        const vortex =
          vec3(
            position.z.negate(),
            position.y.mul(0.20),
            position.x,
          ).normalize()

        const force =
          turbulence
            .mul(0.18)

            .add(
              vortex.mul(0.48),
            )

            .add(
              radial.mul(
                float(1.20)
                  .sub(
                    position.length(),
                  )
                  .mul(0.44),
              ),
            )

        const newVelocity =
          velocity
            .add(
              force.mul(
                deltaTime,
              ),
            )
            .mul(0.975)

        const newPosition =
          position.add(
            newVelocity.mul(
              deltaTime,
            ),
          )

        nodePositions
          .element(id)
          .assign(
            mix(
              newPosition,

              newPosition
                .normalize()
                .mul(1.85),

              smoothstep(
                1.70,
                2.15,
                newPosition.length(),
              ),
            ),
          )

        nodeVelocities
          .element(id)
          .assign(
            newVelocity,
          )

      })().compute(
        NODE_COUNT,
      ),
    [
      nodePositions,
      nodeVelocities,
    ],
  )

/* =======================================================
   NODE MATERIAL
   ======================================================= */

const nodeMaterial =
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
        nodePositions.toAttribute()

      const size =
        float(0.010).add(
          hash(
            instanceIndex.add(900),
          ).mul(0.026),
        )

      material.scaleNode =
        vec2(
          size,
          size,
        )

      const red =
        vec3(
          1.0,
          0.006,
          0.015,
        )

      const blue =
        vec3(
          0.01,
          0.10,
          0.95,
        )

      const gold =
        vec3(
          1.0,
          0.32,
          0.01,
        )

      const selector =
        hash(
          instanceIndex.add(1000),
        )

      let color =
        mix(
          red,
          blue,
          smoothstep(
            0.68,
            0.96,
            selector,
          ),
        )

      color =
        mix(
          color,
          gold,
          smoothstep(
            0.989,
            1.0,
            selector,
          ),
        )

      material.colorNode =
        color.mul(1.35)

      material.opacityNode =
        float(0.60)

      return material

    },
    [
      nodePositions,
    ],
  )

/* =======================================================
   RENDER OBJECTS
   ======================================================= */

const fragmentMesh =
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
          fragmentMaterial,
          FRAGMENT_COUNT,
        )

      mesh.frustumCulled =
        false

      return mesh

    },
    [
      fragmentMaterial,
    ],
  )

const nodeMesh =
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
          nodeMaterial,
          NODE_COUNT,
        )

      mesh.frustumCulled =
        false

      return mesh

    },
    [
      nodeMaterial,
    ],
  )

/* =======================================================
   GPU INITIALIZATION
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
    initializeFragments,
  )

  void renderer.computeAsync(
    initializeNodes,
  )

}, [
  renderer,
  initializeFragments,
  initializeNodes,
])

/* =======================================================
   GPU UPDATE LOOP
   ======================================================= */

useFrame(() => {

  /*
   * Read the current semantic state of ULTRON.
   *
   * These values are produced by entitySimulation.ts
   * and are now fed into the GPU simulation.
   */
  const visualState =
    getEntityVisualState()

  entityActivity.value =
    visualState.activity

  entityAttention.value =
    visualState.attention

  entityProcessing.value =
    visualState.processing

  entityEnergy.value =
    visualState.energy

  entityNetworkActivity.value =
    visualState.networkActivity

  /*
   * Run both GPU simulations.
   */
  void renderer.compute(
    [
      updateFragments,
      updateNodes,
    ],
  )

})

/* =======================================================
   CLEANUP
   ======================================================= */

useEffect(() => {

  return () => {

    fragmentMesh.geometry.dispose()

    nodeMesh.geometry.dispose()

    fragmentMaterial.dispose()

    nodeMaterial.dispose()

  }

}, [
  fragmentMesh,
  nodeMesh,
  fragmentMaterial,
  nodeMaterial,
])

return (
  <group>

    <primitive
      object={fragmentMesh}
    />

    <primitive
      object={nodeMesh}
    />

  </group>
)}