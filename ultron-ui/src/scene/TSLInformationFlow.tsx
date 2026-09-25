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
   ULTRON INFORMATION FLOW
   =========================================================

   RED   = ULTRON / computation
   BLUE  = information traffic / listening
   GOLD  = high-value execution traffic

   This system is intentionally sparse.

   The goal is NOT to create another particle cloud.

   The goal is to make information visibly travel
   through ULTRON as discrete computational packets.

   Every packet has:

     position
     velocity
     lifetime
     energy
     phase
     lane

   Packets travel through the computational shell,
   accelerate with information activity,
   respond to ULTRON's current visual state,
   and recycle continuously.

   ========================================================= */

const PACKET_COUNT = 180

/* =========================================================
   INFORMATION FLOW
   ========================================================= */

export default function TSLInformationFlow() {

  const { gl } =
    useThree()

  const renderer =
    gl as unknown as THREE.WebGPURenderer

  /* =======================================================
     ULTRON SEMANTIC STATE
     ======================================================= */

  const entityEnergy =
    useMemo(
      () => uniform(0.55),
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

  const entityNetworkActivity =
    useMemo(
      () => uniform(0.05),
      [],
    )

  const entityUrgency =
    useMemo(
      () => uniform(0.05),
      [],
    )

  /* =======================================================
     GLOBAL ULTRON VISUAL STATE
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
     GPU PACKET STORAGE
     ======================================================= */

  const positions =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'vec3',
        ),
      [],
    )

  const velocities =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'vec3',
        ),
      [],
    )

  const lifetimes =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'float',
        ),
      [],
    )

  const energies =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'float',
        ),
      [],
    )

  const phases =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'float',
        ),
      [],
    )

  /*
   * Each packet gets a stable lane value.
   *
   * This determines which portion of the shell
   * the packet prefers.
   */
  const lanes =
    useMemo(
      () =>
        instancedArray(
          PACKET_COUNT,
          'float',
        ),
      [],
    )

  /* =======================================================
     GPU INITIALIZATION
     ======================================================= */

  const initializePackets =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const randomA =
            hash(
              id.add(1000),
            )

          const randomB =
            hash(
              id.add(1200),
            )

          const randomC =
            hash(
              id.add(1400),
            )

          const randomD =
            hash(
              id.add(1600),
            )

          const randomLane =
            hash(
              id.add(1800),
            )

          const theta =
            randomA.mul(
              Math.PI * 2,
            )

          /*
           * Information packets live primarily
           * around the computational shell.
           */
          const radialVariation =
            randomB.mul(
              0.55,
            )

          const radius =
            float(1.02).add(
              radialVariation,
            )

          const y =
            randomC
              .mul(2.0)
              .sub(1.0)
              .mul(0.72)

          const planar =
            float(1.0)
              .sub(
                y.mul(y),
              )
              .max(0.0)
              .sqrt()

          const position =
            vec3(

              theta.cos()
                .mul(planar)
                .mul(radius),

              y.mul(radius),

              theta.sin()
                .mul(planar)
                .mul(radius),

            )

          const radial =
            position.normalize()

          /*
           * Tangential flow around the shell.
           */
          const tangent =
            vec3(
              radial.z.negate(),
              float(0.16),
              radial.x,
            ).normalize()

          const speed =
            float(0.20).add(
              randomD.mul(
                0.55,
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

          lifetimes
            .element(id)
            .assign(
              randomB,
            )

          energies
            .element(id)
            .assign(
              float(0.55).add(
                randomC.mul(
                  0.45,
                ),
              ),
            )

          phases
            .element(id)
            .assign(
              randomA.mul(
                Math.PI * 2,
              ),
            )

          lanes
            .element(id)
            .assign(
              randomLane,
            )

        })().compute(
          PACKET_COUNT,
        ),
      [
        positions,
        velocities,
        lifetimes,
        energies,
        phases,
        lanes,
      ],
    )

  /* =======================================================
     GPU PACKET SIMULATION
     ======================================================= */

  const updatePackets =
    useMemo(
      () =>
        Fn(() => {

          const id =
            instanceIndex

          const position =
            positions.element(id)

          const velocity =
            velocities.element(id)

          const lifetime =
            lifetimes.element(id)

          const energy =
            energies.element(id)

          const phase =
            phases.element(id)

          const lane =
            lanes.element(id)

          const radius =
            position.length()

          const radial =
            position.normalize()

          /* -------------------------------------------------
             LIVE ULTRON DRIVE
             ------------------------------------------------- */

          const informationDrive =
            entityNetworkActivity
              .mul(0.45)

              .add(
                entityAttention.mul(
                  0.18,
                ),
              )

              .add(
                entityProcessing.mul(
                  0.14,
                ),
              )

              .add(
                entityEnergy.mul(
                  0.08,
                ),
              )

              .add(
                informationDensity.mul(
                  0.55,
                ),
              )

              .add(
                informationSpeed.mul(
                  0.35,
                ),
              )

          /*
           * Overall state motion.
           */
          const stateMotion =
            float(0.55)
              .add(
                visualMotion.mul(
                  0.80,
                ),
              )
              .add(
                informationSpeed.mul(
                  0.55,
                ),
              )

          /* -------------------------------------------------
             PRIMARY SHELL FLOW
             ------------------------------------------------- */

          const shellFlow =
            vec3(

              position.z.negate(),

              position.y
                .mul(
                  float(0.20).add(
                    lane.mul(
                      0.25,
                    ),
                  ),
                )
                .negate(),

              position.x,

            ).normalize()

          /* -------------------------------------------------
             SECONDARY INFORMATION VECTOR
             ------------------------------------------------- */

          const secondaryFlow =
            vec3(

              position.y
                .mul(0.55)
                .add(
                  phase.sin().mul(
                    0.18,
                  ),
                ),

              position.z.negate(),

              position.x.mul(
                0.75,
              ),

            ).normalize()

          /* -------------------------------------------------
             ORGANIC TURBULENCE
             ------------------------------------------------- */

          const flowTime =
            time.mul(
              float(0.32).add(
                visualTurbulence.mul(
                  0.42,
                ),
              ),
            )

          const turbulence =
            vec3(

              position.y
                .mul(4.2)
                .add(flowTime)
                .sin(),

              position.z
                .mul(3.7)
                .sub(
                  flowTime.mul(
                    0.8,
                  ),
                )
                .cos(),

              position.x
                .mul(4.8)
                .add(
                  flowTime.mul(
                    0.55,
                  ),
                )
                .sin(),

            ).normalize()

          /* -------------------------------------------------
             SHELL TARGET
             ------------------------------------------------- */

          const laneAngle =
            time
              .mul(
                float(0.14).add(
                  informationDrive.mul(
                    0.22,
                  ),
                ),
              )
              .add(
                lane.mul(
                  Math.PI * 2,
                ),
              )

          const laneWave =
            laneAngle
              .sin()
              .mul(
                float(0.07).add(
                  visualTurbulence.mul(
                    0.05,
                  ),
                ),
              )

          const targetRadius =
            float(1.28)
              .add(
                laneWave,
              )

          const shellCorrection =
            targetRadius
              .sub(radius)
              .mul(
                float(0.55).add(
                  visualMotion.mul(
                    0.20,
                  ),
                ),
              )

          /* -------------------------------------------------
             INNER EXCLUSION
             ------------------------------------------------- */

          const innerPressure =
            smoothstep(
              0.68,
              1.02,
              radius,
            )

          const innerForce =
            float(1.0)
              .sub(
                innerPressure,
              )

          /* -------------------------------------------------
             OUTER CONTAINMENT
             ------------------------------------------------- */

          const outerPressure =
            smoothstep(
              1.62,
              1.84,
              radius,
            )

          /* -------------------------------------------------
             PACKET FORCE
             ------------------------------------------------- */

          const force =
            shellFlow
              .mul(
                float(0.26).add(
                  informationDrive.mul(
                    0.72,
                  ),
                ),
              )

              .add(
                secondaryFlow.mul(
                  float(0.08).add(
                    entityProcessing.mul(
                      0.22,
                    ),
                  ),
                ),
              )

              .add(
                turbulence.mul(
                  float(0.025).add(
                    visualTurbulence.mul(
                      0.20,
                    ),
                  ),
                ),
              )

              .add(
                radial.mul(
                  shellCorrection,
                ),
              )

              .add(
                radial.mul(
                  innerForce.mul(
                    0.18,
                  ),
                ),
              )

              .sub(
                radial.mul(
                  outerPressure.mul(
                    float(0.90).add(
                      visualMotion.mul(
                        0.25,
                      ),
                    ),
                  ),
                ),
              )

          /* -------------------------------------------------
             VELOCITY
             ------------------------------------------------- */

          const newVelocity =
            velocity
              .add(
                force
                  .mul(
                    deltaTime,
                  )
                  .mul(
                    stateMotion,
                  ),
              )
              .mul(
                float(0.992).sub(
                  visualMotion.mul(
                    0.006,
                  ),
                ),
              )

          /* -------------------------------------------------
             POSITION
             ------------------------------------------------- */

          const newPosition =
            position.add(
              newVelocity.mul(
                deltaTime,
              ),
            )

          /* -------------------------------------------------
             LIFETIME
             ------------------------------------------------- */

          const newLifetime =
            lifetime.add(
              deltaTime.mul(
                float(0.10).add(
                  informationDrive.mul(
                    0.26,
                  ),
                ),
              ),
            )

          /* -------------------------------------------------
             ENERGY
             ------------------------------------------------- */

          const targetEnergy =
            float(0.32).add(
              informationDrive.mul(
                0.58,
              ),
            )

          const newEnergy =
            energy
              .mul(
                0.985,
              )
              .add(
                targetEnergy.mul(
                  0.015,
                ),
              )

          /* -------------------------------------------------
             RECYCLE CONDITIONS
             ------------------------------------------------- */

          const escaped =
            smoothstep(
              1.72,
              1.86,
              newPosition.length(),
            )

          const expired =
            smoothstep(
              0.90,
              1.00,
              newLifetime,
            )

          const recycleMask =
            escaped
              .add(
                expired,
              )
              .clamp(
                0,
                1,
              )

          /* -------------------------------------------------
             RE-SPAWN
             ------------------------------------------------- */

          const spawnA =
            hash(
              id.add(2100),
            )

          const spawnB =
            hash(
              id.add(2300),
            )

          const spawnC =
            hash(
              id.add(2500),
            )

          const spawnTheta =
            spawnA.mul(
              Math.PI * 2,
            )

          const spawnY =
            spawnB
              .mul(2.0)
              .sub(1.0)
              .mul(0.68)

          const spawnPlanar =
            float(1.0)
              .sub(
                spawnY.mul(
                  spawnY,
                ),
              )
              .max(0.0)
              .sqrt()

          const spawnDirection =
            vec3(

              spawnTheta.cos()
                .mul(
                  spawnPlanar,
                ),

              spawnY,

              spawnTheta.sin()
                .mul(
                  spawnPlanar,
                ),

            ).normalize()

          const spawnPosition =
            spawnDirection.mul(
              float(0.92).add(
                spawnC.mul(
                  0.30,
                ),
              ),
            )

          const spawnTangent =
            vec3(

              spawnDirection.z
                .negate(),

              spawnDirection.y.mul(
                0.12,
              ),

              spawnDirection.x,

            ).normalize()

          const spawnSpeed =
            float(0.28).add(
              informationSpeed.mul(
                0.75,
              ),
            )

          const spawnVelocity =
            spawnTangent.mul(
              spawnSpeed,
            )

          /* -------------------------------------------------
             STORE FINAL STATE
             ------------------------------------------------- */

          positions
            .element(id)
            .assign(
              mix(
                newPosition,
                spawnPosition,
                recycleMask,
              ),
            )

          velocities
            .element(id)
            .assign(
              mix(
                newVelocity,
                spawnVelocity,
                recycleMask,
              ),
            )

          lifetimes
            .element(id)
            .assign(
              mix(
                newLifetime,
                float(0),
                recycleMask,
              ),
            )

          energies
            .element(id)
            .assign(
              mix(
                newEnergy,

                float(0.48).add(
                  informationDrive.mul(
                    0.42,
                  ),
                ),

                recycleMask,
              ),
            )

          phases
            .element(id)
            .assign(
              phase.add(
                deltaTime.mul(
                  float(0.75).add(
                    informationDrive.mul(
                      1.65,
                    ),
                  ),
                ),
              ),
            )

        })().compute(
          PACKET_COUNT,
        ),
      [
        positions,
        velocities,
        lifetimes,
        energies,
        phases,
        lanes,

        entityEnergy,
        entityAttention,
        entityProcessing,
        entityNetworkActivity,

        visualMotion,
        visualTurbulence,
        informationDensity,
        informationSpeed,
      ],
    )

  /* =======================================================
     PACKET MATERIAL
     ======================================================= */

  const packetMaterial =
    useMemo(
      () => {

        const material =
          new SpriteNodeMaterial({
            transparent: true,

            depthWrite:
              false,

            depthTest:
              true,

            blending:
              THREE.AdditiveBlending,

            toneMapped:
              false,
          })

        material.positionNode =
          positions.toAttribute()

        /* -------------------------------------------------
           PACKET STATE
           ------------------------------------------------- */

        const packetEnergy =
          energies.element(
            instanceIndex,
          )

        const packetVelocity =
          velocities.element(
            instanceIndex,
          )

        const packetSpeed =
          packetVelocity.length()

        /* -------------------------------------------------
           DENSITY MASK
           -------------------------------------------------

           Only part of the packet population is visually
           active at once.

           This keeps the information layer readable.
           ------------------------------------------------- */

        const packetIdentity =
          hash(
            instanceIndex.add(
              3000,
            ),
          )

        const activeThreshold =
          informationDensity

        const activeMask =
          float(1.0).sub(
            smoothstep(
              activeThreshold,
              activeThreshold.add(
                0.18,
              ),
              packetIdentity,
            ),
          )

        /* -------------------------------------------------
           PACKET LENGTH
           ------------------------------------------------- */

        const packetLength =
          float(0.065)
            .add(
              packetEnergy.mul(
                0.11,
              ),
            )
            .add(
              informationSpeed.mul(
                0.06,
              ),
            )

        const packetWidth =
          float(0.0055)
            .add(
              packetEnergy.mul(
                0.007,
              ),
            )

        material.scaleNode =
          vec2(
            packetLength,
            packetWidth,
          )

        /* -------------------------------------------------
           CONTINUOUS PACKET ROTATION
           ------------------------------------------------- */

        material.rotationNode =
          phases
            .element(
              instanceIndex,
            )
            .add(
              time.mul(
                float(0.18).add(
                  packetSpeed.mul(
                    0.08,
                  ),
                ),
              ),
            )

        /* =================================================
           ULTRON SEMANTIC COLORS
           ================================================= */

        const red =
          vec3(
            0.90,
            0.003,
            0.012,
          )

        const blue =
          vec3(
            0.005,
            0.16,
            1.00,
          )

        const gold =
          vec3(
            1.00,
            0.38,
            0.008,
          )

        /*
         * Global state-controlled base color.
         *
         * This replaces the old permanent
         * blue/cyan/gold identity.
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

        /* -------------------------------------------------
           PACKET SIGNAL
           ------------------------------------------------- */

        const packetPhase =
          time
            .mul(
              float(0.60).add(
                informationSpeed.mul(
                  2.20,
                ),
              ),
            )
            .add(
              phases.element(
                instanceIndex,
              ),
            )

        const packetWave =
          packetPhase
            .sin()
            .mul(0.5)
            .add(0.5)

        /*
         * Travelling packet head.
         */
        const packetHead =
          smoothstep(
            0.82,
            0.995,
            packetWave,
          )

        /*
         * Fading packet body.
         */
        const packetTrail =
          smoothstep(
            0.30,
            0.82,
            packetWave,
          )

        /* -------------------------------------------------
           LISTENING / INFORMATION ACCENT
           ------------------------------------------------- */

        const informationAccent =
          blueWeight
            .mul(
              informationDensity,
            )
            .mul(
              packetHead,
            )
            .mul(
              0.42,
            )

        let color =
          mix(
            stateColor,
            blue,
            informationAccent,
          )

        /* -------------------------------------------------
           EXECUTION ACCENT
           ------------------------------------------------- */

        const executionAccent =
          goldWeight
            .mul(
              packetHead,
            )
            .mul(
              informationSpeed,
            )
            .mul(
              0.30,
            )

        color =
          mix(
            color,
            gold,
            executionAccent,
          )

        /* -------------------------------------------------
           ALERT ACCENT
           ------------------------------------------------- */

        const alertAccent =
          entityUrgency
            .mul(
              packetHead,
            )
            .mul(
              0.20,
            )

        color =
          mix(
            color,
            red,
            alertAccent,
          )

        /* -------------------------------------------------
           PACKET ENERGY
           ------------------------------------------------- */

        const brightness =
          float(0.10)
            .add(
              packetTrail.mul(
                0.26,
              ),
            )
            .add(
              packetHead.mul(
                0.92,
              ),
            )
            .add(
              smoothstep(
                0.20,
                0.95,
                packetSpeed,
              ).mul(
                0.25,
              ),
            )
            .mul(
              float(0.50).add(
                visualIntensity.mul(
                  0.50,
                ),
              ),
            )

        material.colorNode =
          color.mul(
            brightness,
          )

        /* -------------------------------------------------
           PACKET SHAPE
           ------------------------------------------------- */

        const packetUv =
          uv()

        const local =
          packetUv
            .sub(0.5)
            .abs()

        const horizontal =
          smoothstep(
            0.50,
            0.015,
            local.x,
          )

        const vertical =
          smoothstep(
            0.50,
            0.05,
            local.y,
          )

        /*
         * Head of the packet.
         */
        const head =
          smoothstep(
            0.68,
            0.98,
            packetUv.x,
          )

        /*
         * Body/trail.
         */
        const body =
          smoothstep(
            0.02,
            0.72,
            packetUv.x,
          )

        /* -------------------------------------------------
           OPACITY
           ------------------------------------------------- */

        material.opacityNode =
          horizontal
            .mul(
              vertical,
            )
            .mul(
              activeMask,
            )
            .mul(
              float(0.10)
                .add(
                  body.mul(
                    0.22,
                  ),
                )
                .add(
                  head.mul(
                    0.34,
                  ),
                )
                .add(
                  packetHead.mul(
                    0.38,
                  ),
                ),
            )
            .mul(
              float(0.42).add(
                visualIntensity.mul(
                  0.46,
                ),
              ),
            )

        return material

      },
      [
        positions,
        velocities,
        energies,
        phases,

        redWeight,
        blueWeight,
        goldWeight,

        visualIntensity,

        informationDensity,
        informationSpeed,

        entityUrgency,
      ],
    )

  /* =======================================================
     PACKET MESH
     ======================================================= */

  const packetMesh =
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
            packetMaterial,
            PACKET_COUNT,
          )

        mesh.frustumCulled =
          false

        return mesh

      },
      [
        packetMaterial,
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
      initializePackets,
    )

  }, [
    renderer,
    initializePackets,
  ])

  /* =======================================================
     GPU UPDATE
     ======================================================= */

  useFrame(() => {

    const visualState =
      getEntityVisualState()

    /* ---------------------------------------------------
       EXISTING ENTITY STATE
       --------------------------------------------------- */

    entityEnergy.value =
      visualState.energy

    entityAttention.value =
      visualState.attention

    entityProcessing.value =
      visualState.processing

    entityNetworkActivity.value =
      visualState.networkActivity

    entityUrgency.value =
      visualState.urgency

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
      updatePackets,
    )

  })

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {

    return () => {

      packetMesh.geometry.dispose()

      packetMaterial.dispose()

    }

  }, [
    packetMesh,
    packetMaterial,
  ])

  /* =======================================================
     OUTPUT
     ======================================================= */

  return (
    <primitive
      object={packetMesh}
    />
  )
}