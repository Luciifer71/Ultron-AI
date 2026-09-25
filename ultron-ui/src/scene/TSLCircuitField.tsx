import * as THREE from 'three/webgpu'

import {
  SpriteNodeMaterial,
} from 'three/webgpu'

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
   ========================================================= */

const FRAGMENT_COUNT = 4200
const NODE_COUNT = 700

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
     GLOBAL VISUAL STATE
     ======================================================= */

  /*
   * These are the new semantic visual controls.
   *
   * RED  = ULTRON / computation
   * BLUE = listening / information
   * GOLD = execution / high-value activity
   */

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

  const visualTurbulence =
    useMemo(
      () => uniform(0.18),
      [],
    )

  const informationDensity =
    useMemo(
      () => uniform(0.08),
      [],
    )

  const informationSpeed =
    useMemo(
      () => uniform(0.12),
      [],
    )

  /* =======================================================
     FRAGMENT INITIALIZATION
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
              randomC.mul(1.15),
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
              randomD.mul(0.82),
            )

          const length =
            float(0.025).add(
              randomC.mul(0.15),
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
     FRAGMENT SIMULATION
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

          /* -------------------------------------------------
             PRIMARY COMPUTATIONAL VORTEX
             ------------------------------------------------- */

          const vortex =
            vec3(
              position.z.negate(),
              float(0),
              position.x,
            ).normalize()

          /* -------------------------------------------------
             SECONDARY 3D FLOW
             ------------------------------------------------- */

          const vortex2 =
            vec3(
              position.y.negate(),
              position.z,
              position.x.negate(),
            ).normalize()

          /* -------------------------------------------------
             PROCEDURAL TURBULENCE
             ------------------------------------------------- */

          const fieldTime =
            time.mul(
              float(0.24).add(
                visualMotion.mul(
                  0.38,
                ),
              ),
            )

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

          /* -------------------------------------------------
             MOVING COMPUTATIONAL WAVE
             ------------------------------------------------- */

          const wave =
            time
              .mul(
                float(0.75).add(
                  informationSpeed.mul(
                    1.5,
                  ),
                ),
              )
              .add(phase)
              .add(
                radius.mul(4.2),
              )
              .sin()

          /* -------------------------------------------------
             CORE REPULSION
             ------------------------------------------------- */

          const coreRepulsion =
            float(1).sub(
              smoothstep(
                0.38,
                0.78,
                radius,
              ),
            )

          /* -------------------------------------------------
             OUTER CONFINEMENT
             ------------------------------------------------- */

          const outerConfinement =
            smoothstep(
              1.70,
              2.20,
              radius,
            )

          /* -------------------------------------------------
             BREATHING SHELL
             ------------------------------------------------- */

          const breathing =
            time
              .mul(
                float(0.40).add(
                  visualMotion.mul(
                    0.35,
                  ),
                ),
              )
              .add(phase)
              .sin()
              .mul(
                float(0.05).add(
                  visualTurbulence.mul(
                    0.08,
                  ),
                ),
              )

          const targetRadius =
            float(1.35).add(
              breathing,
            )

          const radialCorrection =
            targetRadius
              .sub(radius)
              .mul(0.72)

          /* -------------------------------------------------
             VISUAL-STATE DRIVEN MOTION
             ------------------------------------------------- */

          const motionDrive =
            float(0.62)
              .add(
                visualMotion.mul(
                  0.85,
                ),
              )
              .add(
                entityActivity.mul(
                  0.25,
                ),
              )

          const turbulenceDrive =
            float(0.24)
              .add(
                visualTurbulence.mul(
                  0.58,
                ),
              )
              .add(
                entityProcessing.mul(
                  0.18,
                ),
              )

          const networkDrive =
            float(0.85)
              .add(
                informationSpeed.mul(
                  1.15,
                ),
              )
              .add(
                entityNetworkActivity.mul(
                  0.30,
                ),
              )

          /* -------------------------------------------------
             VECTOR FIELD
             ------------------------------------------------- */

          const force =
            vortex
              .mul(
                motionDrive
                  .add(
                    speed.mul(
                      0.24,
                    ),
                  ),
              )

              .add(
                vortex2.mul(
                  float(0.14).add(
                    visualMotion.mul(
                      0.20,
                    ),
                  ),
                ),
              )

              .add(
                turbulence.mul(
                  turbulenceDrive,
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
                    float(1.45).add(
                      visualMotion.mul(
                        0.45,
                      ),
                    ),
                  ),
                ),
              )

              .add(
                radial.mul(
                  wave.mul(
                    float(0.035).add(
                      informationDensity.mul(
                        0.05,
                      ),
                    ),
                  ),
                ),
              )

          /* -------------------------------------------------
             VELOCITY INTEGRATION
             ------------------------------------------------- */

          const newVelocity =
            velocity
              .add(
                force
                  .mul(
                    deltaTime,
                  )
                  .mul(
                    networkDrive,
                  ),
              )
              .mul(
                float(0.990).sub(
                  visualMotion.mul(
                    0.008,
                  ),
                ),
              )

          /* -------------------------------------------------
             POSITION INTEGRATION
             ------------------------------------------------- */

          const newPosition =
            position.add(
              newVelocity.mul(
                deltaTime,
              ),
            )

          /* -------------------------------------------------
             CORE PROTECTION
             ------------------------------------------------- */

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

          /* -------------------------------------------------
             BOUNDARY CONFINEMENT
             ------------------------------------------------- */

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

          /* -------------------------------------------------
             EVOLVING CIRCUIT PHASE
             ------------------------------------------------- */

          phases
            .element(id)
            .assign(
              phase.add(
                deltaTime.mul(
                  speed.mul(
                    networkDrive,
                  ),
                ),
              ),
            )

          /* -------------------------------------------------
             DYNAMIC FRAGMENT LENGTH
             ------------------------------------------------- */

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

        entityActivity,
        entityProcessing,
        entityNetworkActivity,

        visualMotion,
        visualTurbulence,
        informationDensity,
        informationSpeed,
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

        material.positionNode =
          positions.toAttribute()

        const length =
          lengths.element(
            instanceIndex,
          )

        const width =
          float(0.0035).add(
            hash(
              instanceIndex.add(71),
            ).mul(0.0055),
          )

        /* -------------------------------------------------
           SEMANTIC COLORS
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
            0.08,
            0.95,
          )

        const gold =
          vec3(
            1.0,
            0.40,
            0.008,
          )

        /*
         * The global visual state is now the primary
         * source of the circuit color.
         */
        const baseColor =
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

        /* -------------------------------------------------
           INFORMATION FLOW
           ------------------------------------------------- */

        const fragmentPosition =
          positions.element(
            instanceIndex,
          )

        const informationDrive =
          entityNetworkActivity
            .mul(0.50)
            .add(
              entityAttention.mul(
                0.20,
              ),
            )
            .add(
              informationDensity.mul(
                0.20,
              ),
            )
            .add(
              entityEnergy.mul(
                0.10,
              ),
            )

        const flowCoordinate =
          fragmentPosition.x
            .mul(1.7)
            .add(
              fragmentPosition.y.mul(
                2.1,
              ),
            )
            .add(
              fragmentPosition.z.mul(
                1.3,
              ),
            )

        const packetSpeed =
          float(0.45).add(
            informationSpeed.mul(
              2.40,
            ),
          )

        const packetPhase =
          time
            .mul(packetSpeed)
            .add(
              flowCoordinate.mul(
                2.2,
              ),
            )
            .add(
              phases
                .element(
                  instanceIndex,
                )
                .mul(0.35),
            )

        const packetWave =
          packetPhase
            .sin()
            .mul(0.5)
            .add(0.5)

        const packetTrail =
          smoothstep(
            0.38,
            0.82,
            packetWave,
          )

        const packetHead =
          smoothstep(
            0.80,
            0.995,
            packetWave,
          )

        /*
         * Blue information activity is now controlled
         * by the listening/thinking visual state.
         */
        const informationPulse =
          blueWeight
            .mul(
              informationDensity,
            )
            .mul(
              informationDrive,
            )
            .mul(
              float(0.08)
                .add(
                  packetTrail.mul(
                    0.20,
                  ),
                )
                .add(
                  packetHead.mul(
                    1.10,
                  ),
                ),
            )

        /*
         * Gold activity becomes visible during execution.
         */
        const executionPulse =
          goldWeight
            .mul(
              smoothstep(
                0.72,
                0.98,
                informationDensity,
              ),
            )
            .mul(
              packetHead.mul(
                0.55,
              ),
            )

        let color =
          mix(
            baseColor,
            blue,
            informationPulse.mul(
              0.45,
            ),
          )

        color =
          mix(
            color,
            gold,
            executionPulse.mul(
              0.55,
            ),
          )

        /* -------------------------------------------------
           DYNAMIC PACKET LENGTH
           ------------------------------------------------- */

        const animatedLength =
          length.mul(
            float(1.0).add(
              packetHead.mul(
                0.45,
              ),
            ),
          )

        material.scaleNode =
          vec2(
            animatedLength,
            width,
          )

        /* -------------------------------------------------
           ROTATION
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

        /* -------------------------------------------------
           VELOCITY ENERGY
           ------------------------------------------------- */

        const velocity =
          velocities.element(
            instanceIndex,
          )

        const speed =
          velocity.length()

        const energy =
          float(0.16)
            .add(
              smoothstep(
                0.18,
                0.95,
                speed,
              ).mul(
                0.95,
              ),
            )
            .add(
              informationPulse.mul(
                0.65,
              ),
            )
            .add(
              visualIntensity.mul(
                0.45,
              ),
            )

        material.colorNode =
          color.mul(
            energy,
          )

        /* -------------------------------------------------
           SOFT RECTANGULAR FRAGMENT
           ------------------------------------------------- */

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
              float(0.14)
                .add(
                  energy.mul(
                    0.24,
                  ),
                )
                .add(
                  packetHead.mul(
                    0.35,
                  ),
                ),
            )
            .mul(
              visualIntensity,
            )

        return material

      },
      [
        positions,
        velocities,
        phases,
        speeds,
        lengths,

        entityAttention,
        entityEnergy,
        entityNetworkActivity,

        redWeight,
        blueWeight,
        goldWeight,

        visualIntensity,

        informationDensity,
        informationSpeed,
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

  /* =======================================================
     NODE SIMULATION
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

          const velocity =
            nodeVelocities.element(
              id,
            )

          const radial =
            position.normalize()

          const nodeTime =
            time.mul(
              float(0.16).add(
                visualMotion.mul(
                  0.28,
                ),
              ),
            )

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

          const nodeMotion =
            float(0.30).add(
              visualMotion.mul(
                0.65,
              ),
            )

          const force =
            turbulence
              .mul(
                float(0.10).add(
                  visualTurbulence.mul(
                    0.40,
                  ),
                ),
              )

              .add(
                vortex.mul(
                  float(0.30).add(
                    nodeMotion,
                  ),
                ),
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
              .mul(
                float(0.980).sub(
                  visualMotion.mul(
                    0.006,
                  ),
                ),
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

        visualMotion,
        visualTurbulence,
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

        const nodePosition =
          nodePositions.element(
            instanceIndex,
          )

        /* -------------------------------------------------
           NODE INFORMATION FLOW
           ------------------------------------------------- */

        const nodeFlow =
          nodePosition.x
            .mul(1.4)
            .add(
              nodePosition.y.mul(
                1.8,
              ),
            )
            .add(
              nodePosition.z.mul(
                1.2,
              ),
            )

        const nodePulsePhase =
          time
            .mul(
              float(0.40).add(
                informationSpeed.mul(
                  1.80,
                ),
              ),
            )
            .add(
              nodeFlow.mul(2.0),
            )

        const nodeWave =
          nodePulsePhase
            .sin()
            .mul(0.5)
            .add(0.5)

        const nodePulse =
          smoothstep(
            0.78,
            0.995,
            nodeWave,
          )

        /* -------------------------------------------------
           NODE SIZE
           ------------------------------------------------- */

        const size =
          float(0.008)
            .add(
              hash(
                instanceIndex.add(900),
              ).mul(0.020),
            )
            .add(
              nodePulse.mul(
                informationDensity.mul(
                  0.020,
                ),
              ),
            )

        material.scaleNode =
          vec2(
            size,
            size,
          )

        /* -------------------------------------------------
           SEMANTIC NODE COLORS
           ------------------------------------------------- */

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
            0.98,
          )

        const gold =
          vec3(
            1.0,
            0.42,
            0.01,
          )

        const baseColor =
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

        /* -------------------------------------------------
           INFORMATION / EXECUTION BURSTS
           ------------------------------------------------- */

        const informationBurst =
          blueWeight
            .mul(
              informationDensity,
            )
            .mul(
              nodePulse,
            )
            .mul(1.35)

        const executionBurst =
          goldWeight
            .mul(
              nodePulse,
            )
            .mul(0.75)

        let color =
          mix(
            baseColor,
            blue,
            informationBurst.mul(
              0.45,
            ),
          )

        color =
          mix(
            color,
            gold,
            executionBurst.mul(
              0.55,
            ),
          )

        /* -------------------------------------------------
           NODE OUTPUT
           ------------------------------------------------- */

        material.colorNode =
          color.mul(
            float(0.75)
              .add(
                visualIntensity.mul(
                  0.65,
                ),
              )
              .add(
                nodePulse.mul(
                  visualIntensity.mul(
                    0.90,
                  ),
                ),
              ),
          )

        material.opacityNode =
          float(0.20)
            .add(
              visualIntensity.mul(
                0.36,
              ),
            )
            .add(
              nodePulse.mul(
                informationDensity.mul(
                  0.45,
                ),
              ),
            )

        return material

      },
      [
        nodePositions,

        redWeight,
        blueWeight,
        goldWeight,

        visualIntensity,

        informationDensity,
        informationSpeed,
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

    const visualState =
      getEntityVisualState()

    /* ---------------------------------------------------
       EXISTING ENTITY STATE
       --------------------------------------------------- */

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

    /* ---------------------------------------------------
       GLOBAL VISUAL STATE
       --------------------------------------------------- */

    redWeight.value =
      visualState.redWeight

    blueWeight.value =
      visualState.blueWeight

    goldWeight.value =
      visualState.goldWeight

    visualIntensity.value =
      visualState.intensity

    visualMotion.value =
      visualState.motion

    visualTurbulence.value =
      visualState.turbulence

    informationDensity.value =
      visualState.informationDensity

    informationSpeed.value =
      visualState.informationSpeed

    /* ---------------------------------------------------
       GPU UPDATE
       --------------------------------------------------- */

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
     OUTPUT
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