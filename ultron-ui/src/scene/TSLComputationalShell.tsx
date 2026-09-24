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
  step,
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

const FRAGMENT_COUNT = 6000
const NODE_COUNT = 700

/* =========================================================
   GPU COMPUTATIONAL SHELL
   ========================================================= */

export default function TSLComputationalShell() {

  const { gl } =
    useThree()

  const renderer =
    gl as unknown as THREE.WebGPURenderer

  /* =======================================================
     FRAGMENT STORAGE
     ======================================================= */

  /*
   * Current position.
   */
  const positions =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'vec3',
        ),
      [],
    )

  /*
   * Stable computational anchor.
   *
   * The fragment moves around this
   * instead of flying randomly away.
   */
  const anchors =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'vec3',
        ),
      [],
    )

  /*
   * Velocity of every fragment.
   */
  const velocities =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'vec3',
        ),
      [],
    )

  /*
   * Independent phase.
   */
  const phases =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'float',
        ),
      [],
    )

  /*
   * Independent speed.
   */
  const speeds =
    useMemo(
      () =>
        instancedArray(
          FRAGMENT_COUNT,
          'float',
        ),
      [],
    )

  /*
   * Fragment length.
   */
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
     NODE STORAGE
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

  const nodeAnchors =
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

  /* =======================================================
     INITIALIZE CIRCUIT FRAGMENTS
     ======================================================= */

  const initializeFragments =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          /*
           * Independent random values.
           */
          const r0 =
            hash(id)

          const r1 =
            hash(
              id.add(11),
            )

          const r2 =
            hash(
              id.add(37),
            )

          const r3 =
            hash(
              id.add(71),
            )

          const r4 =
            hash(
              id.add(109),
            )

          /*
           * -------------------------------------------------
           * TWO STRUCTURAL MODES
           *
           * 0 = broken orbital/circuit fragment
           * 1 = radial/spoke fragment
           * -------------------------------------------------
           */

          const spokeMask =
            smoothstep(
              0.70,
              0.82,
              r0,
            )

          /*
           * -------------------------------------------------
           * BROKEN CIRCUIT RINGS
           * -------------------------------------------------
           */

          /*
           * Four broad computational latitude bands.
           */
          const bandA =
            step(
              0.25,
              r1,
            )

          const bandB =
            step(
              0.50,
              r1,
            )

          const bandC =
            step(
              0.75,
              r1,
            )

          const band =
            bandA
              .add(bandB)
              .add(bandC)

          const latitude =
            band
              .sub(1.5)
              .mul(0.34)
              .add(
                r2
                  .sub(0.5)
                  .mul(0.22),
              )

          const ringTheta =
            r3.mul(
              Math.PI * 2,
            )

          const ringRadius =
            float(1.02)
              .add(
                r4.mul(0.58),
              )

          const ringCos =
            latitude.cos()

          const ringPosition =
            vec3(

              ringCos
                .mul(ringTheta.cos())
                .mul(ringRadius),

              latitude
                .sin()
                .mul(ringRadius),

              ringCos
                .mul(ringTheta.sin())
                .mul(ringRadius),

            )

          /*
           * -------------------------------------------------
           * RADIAL STRUCTURES
           * -------------------------------------------------
           */

          const radialTheta =
            r1.mul(
              Math.PI * 2,
            )

          const radialPhi =
            r2.mul(
              Math.PI,
            )

          const radialDirection =
            vec3(

              radialPhi
                .sin()
                .mul(
                  radialTheta.cos(),
                ),

              radialPhi.cos(),

              radialPhi
                .sin()
                .mul(
                  radialTheta.sin(),
                ),

            ).normalize()

          const radialRadius =
            float(0.35)
              .add(
                r3.mul(1.42),
              )

          const radialPosition =
            radialDirection.mul(
              radialRadius,
            )

          /*
           * Combine the two structures.
           */
          const anchor =
            mix(
              ringPosition,
              radialPosition,
              spokeMask,
            )

          /*
           * Start slightly offset from anchor.
           */
          const position =
            anchor.add(
              radialDirection.mul(
                r4
                  .sub(0.5)
                  .mul(0.06),
              ),
            )

          /*
           * Main orbital velocity.
           */
          const radial =
            anchor.normalize()

          const tangent =
            vec3(
              radial.z.negate(),
              float(0),
              radial.x,
            ).normalize()

          const speed =
            float(0.20)
              .add(
                r2.mul(0.92),
              )

          const velocity =
            tangent.mul(
              speed,
            )

          const length =
            float(0.025)
              .add(
                r4.mul(0.14),
              )

          anchors
            .element(id)
            .assign(
              anchor,
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
        anchors,
        velocities,
        phases,
        speeds,
        lengths,
      ],
    )

  /* =======================================================
     UPDATE CIRCUIT FRAGMENTS
     ======================================================= */

  const updateFragments =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const position =
            positions.element(
              id,
            )

          const anchor =
            anchors.element(
              id,
            )

          const velocity =
            velocities.element(
              id,
            )

          const phase =
            phases.element(
              id,
            )

          const speed =
            speeds.element(
              id,
            )

          /*
           * Current radial information.
           */
          const radial =
            position.normalize()

          const radius =
            position.length()

          /*
           * -------------------------------------------------
           * ORBITAL FIELD
           * -------------------------------------------------
           */

          const vortex =
            vec3(
              position.z.negate(),
              position.y.mul(0.18),
              position.x,
            ).normalize()

          /*
           * Secondary vortex gives the
           * field a more 3D character.
           */
          const vortex2 =
            vec3(
              position.y.negate(),
              position.z,
              position.x.negate(),
            ).normalize()

          /*
           * -------------------------------------------------
           * ANALYTIC TURBULENCE
           *
           * No unstable noise API required.
           * This is cheap and deterministic.
           * -------------------------------------------------
           */

          const fieldTime =
            time.mul(0.32)

          const turbulence =
            vec3(

              position.y
                .mul(3.2)
                .add(fieldTime)
                .sin()
                .add(
                  position.z
                    .mul(2.4)
                    .sub(
                      fieldTime.mul(0.7),
                    )
                    .cos()
                    .mul(0.45),
                ),

              position.z
                .mul(4.3)
                .sub(
                  fieldTime.mul(0.8),
                )
                .sin()
                .add(
                  position.x
                    .mul(2.6)
                    .add(fieldTime)
                    .cos()
                    .mul(0.45),
                ),

              position.x
                .mul(4.7)
                .add(
                  fieldTime.mul(0.6),
                )
                .sin()
                .add(
                  position.y
                    .mul(3.4)
                    .sub(fieldTime)
                    .cos()
                    .mul(0.45),
                ),

            ).normalize()

          /*
           * -------------------------------------------------
           * ANCHOR FORCE
           *
           * Keeps fragments computationally
           * structured while still moving.
           * -------------------------------------------------
           */

          const anchorOffset =
            anchor.sub(
              position,
            )

          const anchorForce =
            anchorOffset.mul(
              0.95,
            )

          /*
           * -------------------------------------------------
           * BREATHING SHELL
           * -------------------------------------------------
           */

          const breathing =
            time
              .mul(0.60)
              .add(phase)
              .sin()

          const desiredRadius =
            float(1.22)
              .add(
                breathing.mul(
                  0.12,
                ),
              )

          const radialCorrection =
            desiredRadius
              .sub(radius)
              .mul(0.32)

          /*
           * -------------------------------------------------
           * CENTRAL / OUTER CONSTRAINT
           * -------------------------------------------------
           */

          const coreRepulsion =
            float(1).sub(
              smoothstep(
                0.42,
                0.78,
                radius,
              ),
            )

          const outerConfinement =
            smoothstep(
              1.75,
              2.18,
              radius,
            )

          /*
           * -------------------------------------------------
           * FINAL FORCE FIELD
           * -------------------------------------------------
           */

          const force =
            vortex.mul(
              float(0.40)
                .add(
                  speed.mul(0.20),
                ),
            )

              .add(
                vortex2.mul(
                  0.16,
                ),
              )

              .add(
                turbulence.mul(
                  0.16,
                ),
              )

              .add(
                anchorForce,
              )

              .add(
                radial.mul(
                  radialCorrection,
                ),
              )

              .add(
                radial.mul(
                  coreRepulsion.mul(
                    0.45,
                  ),
                ),
              )

              .sub(
                radial.mul(
                  outerConfinement.mul(
                    1.15,
                  ),
                ),
              )

          /*
           * Integrate.
           */
          const newVelocity =
            velocity
              .add(
                force.mul(
                  deltaTime,
                ),
              )
              .mul(
                0.978,
              )

          const newPosition =
            position.add(
              newVelocity.mul(
                deltaTime,
              ),
            )

          /*
           * Soft shell boundary.
           */
          const boundedPosition =
            mix(
              newPosition,
              newPosition
                .normalize()
                .mul(1.98),

              smoothstep(
                1.82,
                2.18,
                newPosition.length(),
              ),
            )

          positions
            .element(id)
            .assign(
              boundedPosition,
            )

          velocities
            .element(id)
            .assign(
              newVelocity,
            )

          phases
            .element(id)
            .assign(
              phase.add(
                deltaTime.mul(
                  speed,
                ),
              ),
            )

        })().compute(
          FRAGMENT_COUNT,
        ),
      [
        positions,
        anchors,
        velocities,
        phases,
        speeds,
      ],
    )

  /* =======================================================
     FRAGMENT MATERIAL
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
         * Fragment dimensions.
         */
        const baseLength =
          lengths.element(
            instanceIndex,
          )

        const pulse =
          float(0.68)
            .add(
              phases
                .element(
                  instanceIndex,
                )
                .sin()
                .mul(0.36),
            )

        const fragmentLength =
          baseLength.mul(
            pulse,
          )

        const width =
          float(0.006)
            .add(
              hash(
                instanceIndex.add(
                  71,
                ),
              ).mul(
                0.008,
              ),
            )

        material.scaleNode =
          vec2(
            fragmentLength.mul(
              2.4,
            ),
            width,
          )

        /*
         * Independent 2D computational
         * orientation.
         */
        material.rotationNode =
          phases
            .element(
              instanceIndex,
            )
            .add(
              hash(
                instanceIndex.add(
                  131,
                ),
              ).mul(
                Math.PI * 2,
              ),
            )

        /*
         * -----------------------------------------------
         * COLOR IDENTITY
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
            0.075,
            0.88,
          )

        const gold =
          vec3(
            1.0,
            0.30,
            0.006,
          )

        const identity =
          hash(
            instanceIndex.add(
              193,
            ),
          )

        const blueMask =
          smoothstep(
            0.58,
            0.78,
            identity,
          )

        const goldMask =
          smoothstep(
            0.965,
            0.995,
            identity,
          )

        let color =
          mix(
            red,
            blue,
            blueMask.mul(
              0.72,
            ),
          )

        color =
          mix(
            color,
            gold,
            goldMask,
          )

        /*
         * Energy activation.
         */
        const energyWave =
          phases
            .element(
              instanceIndex,
            )
            .sin()

        const energy =
          float(0.22)
            .add(
              smoothstep(
                0.30,
                0.92,
                energyWave,
              ).mul(
                1.05,
              ),
            )

        material.colorNode =
          color.mul(
            energy,
          )

        /*
         * Fragment fades at its edges.
         */
        const localUv =
          uv()
            .sub(0.5)
            .abs()

        const horizontalFade =
          smoothstep(
            0.50,
            0.08,
            localUv.x,
          )

        const verticalFade =
          smoothstep(
            0.50,
            0.12,
            localUv.y,
          )

        material.opacityNode =
          horizontalFade
            .mul(
              verticalFade,
            )
            .mul(
              float(0.26)
                .add(
                  energy.mul(
                    0.42,
                  ),
                ),
            )

        return material

      },
      [
        positions,
        lengths,
        phases,
      ],
    )

  /* =======================================================
     INITIALIZE NODES
     ======================================================= */

  const initializeNodes =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const r0 =
            hash(
              id.add(400),
            )

          const r1 =
            hash(
              id.add(500),
            )

          const r2 =
            hash(
              id.add(600),
            )

          const theta =
            r0.mul(
              Math.PI * 2,
            )

          const phi =
            r1.mul(
              Math.PI,
            )

          /*
           * Nodes live slightly closer to
           * the computational shell.
           */
          const radius =
            float(0.82)
              .add(
                r2.mul(
                  0.80,
                ),
              )

          const sinPhi =
            phi.sin()

          const anchor =
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

          nodeAnchors
            .element(id)
            .assign(
              anchor,
            )

          nodePositions
            .element(id)
            .assign(
              anchor,
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
        nodeAnchors,
        nodeVelocities,
      ],
    )

  /* =======================================================
     UPDATE NODES
     ======================================================= */

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

          const anchor =
            nodeAnchors.element(
              id,
            )

          const velocity =
            nodeVelocities.element(
              id,
            )

          const radial =
            position.normalize()

          const vortex =
            vec3(
              position.z.negate(),
              position.y.mul(0.22),
              position.x,
            ).normalize()

          const fieldTime =
            time.mul(0.25)

          const flow =
            vec3(

              position.y
                .mul(3.4)
                .add(fieldTime)
                .sin(),

              position.z
                .mul(4.2)
                .sub(fieldTime)
                .cos(),

              position.x
                .mul(2.8)
                .add(
                  fieldTime.mul(
                    0.7,
                  ),
                )
                .sin(),

            ).normalize()

          const anchorForce =
            anchor
              .sub(position)
              .mul(
                0.85,
              )

          const radialForce =
            float(1.30)
              .sub(
                position.length(),
              )
              .mul(
                0.38,
              )

          const force =
            vortex.mul(
              0.36,
            )
              .add(
                flow.mul(
                  0.12,
                ),
              )
              .add(
                anchorForce,
              )
              .add(
                radial.mul(
                  radialForce,
                ),
              )

          const newVelocity =
            velocity
              .add(
                force.mul(
                  deltaTime,
                ),
              )
              .mul(
                0.972,
              )

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
                  .mul(
                    1.96,
                  ),
                smoothstep(
                  1.82,
                  2.18,
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
        nodeAnchors,
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
          float(0.012)
            .add(
              hash(
                instanceIndex.add(
                  801,
                ),
              ).mul(
                0.030,
              ),
            )

        const pulse =
          float(0.75)
            .add(
              time
                .mul(1.6)
                .add(
                  hash(
                    instanceIndex.add(
                      803,
                    ),
                  ),
                )
                .sin()
                .mul(0.30),
            )

        material.scaleNode =
          vec2(
            size.mul(pulse),
          )

        const red =
          vec3(
            1.0,
            0.006,
            0.015,
          )

        const blue =
          vec3(
            0.005,
            0.11,
            0.96,
          )

        const gold =
          vec3(
            1.0,
            0.32,
            0.008,
          )

        const identity =
          hash(
            instanceIndex.add(
              901,
            ),
          )

        let color =
          mix(
            red,
            blue,
            smoothstep(
              0.63,
              0.88,
              identity,
            ),
          )

        color =
          mix(
            color,
            gold,
            smoothstep(
              0.982,
              0.998,
              identity,
            ),
          )

        material.colorNode =
          color.mul(
            float(0.55)
              .add(
                pulse.mul(
                  0.75,
                ),
              ),
          )

        material.opacityNode =
          float(0.55)
            .add(
              pulse.mul(
                0.30,
              ),
            )

        return material

      },
      [
        nodePositions,
      ],
    )

  /* =======================================================
     GPU INSTANCED OBJECTS
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
     INITIAL GPU STATE
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
     GPU UPDATE
     ======================================================= */

  useFrame(() => {

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

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <group>

      <primitive
        object={fragmentMesh}
      />

      <primitive
        object={nodeMesh}
      />

    </group>
  )
}