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
  step,
  time,
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

  /*
   * GPU storage buffers.
   *
   * Every particle owns:
   * position = vec3
   * velocity = vec3
   */
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
            randomA
              .mul(
                Math.PI * 2,
              )

          const phi =
            randomB
              .mul(Math.PI)

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
            .assign(position)

          velocities
            .element(id)
            .assign(velocity)

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
            position
              .normalize()

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
           *
           * This is deliberately inexpensive
           * for our first compute layer.
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
           * Combined vector field.
           */
          const force =
            vortex.mul(0.72)
              .add(
                secondaryVortex.mul(
                  0.20,
                ),
              )
              .add(
                turbulence.mul(
                  0.24,
                ),
              )
              .add(
                radial.mul(
                  coreRepulsion
                    .mul(0.72),
                ),
              )
              .sub(
                radial.mul(
                  outerConfinement
                    .mul(1.55),
                ),
              )
              .add(
                radial.mul(
                  breathingShell
                    .mul(0.055),
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
              .mul(0.992)

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
      ],
    )

  /* =======================================================
     PARTICLE MATERIAL
     ======================================================= */

  const material =
    useMemo(() => {

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
       * Individual particle size.
       */
      const particleSize =
        float(0.018).add(
          hash(
            instanceIndex,
          ).mul(0.030),
        )

      particleMaterial.scaleNode =
        vec2(
          particleSize,
        )

      /*
       * Velocity-dependent brightness.
       */
      const speed =
        velocities
          .toAttribute()
          .length()

      /*
       * RED = primary
       * BLUE = secondary
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

      const colorSeed =
        hash(
          instanceIndex.add(71),
        )

      const blueAmount =
        smoothstep(
          0.62,
          0.92,
          colorSeed,
        )

      const goldAmount =
        smoothstep(
          0.985,
          1.0,
          colorSeed,
        )

      let color =
        mix(
          red,
          blue,
          blueAmount.mul(0.72),
        )

      color =
        mix(
          color,
          gold,
          goldAmount,
        )

      /*
       * Bright particles respond to
       * velocity.
       */
      const energy =
        float(0.35).add(
          smoothstep(
            0.20,
            1.05,
            speed,
          ).mul(0.95),
        )

      particleMaterial.colorNode =
        color.mul(
          energy,
        )

      /*
       * Circular soft particle.
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
          float(0.32).add(
            energy.mul(0.42),
          ),
        )

      return particleMaterial

    }, [
      positions,
      velocities,
    ])

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

  return (
    <primitive
      object={particleMesh}
    />
  )
}