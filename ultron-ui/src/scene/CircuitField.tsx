import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* =========================================================
   DYNAMIC ENERGY FIELD SHADERS
   ========================================================= */

const flowTubeVertexShader = `
uniform float uTime;

attribute float aPhase;
attribute float aSpeed;
attribute float aWarp;

varying float vProgress;
varying float vPhase;
varying float vSpeed;

void main() {

  vec3 p = position;

  float t = uv.x;

  /*
   * Each filament has its own independent
   * temporal identity.
   */
  float phase =
    aPhase +
    uTime * aSpeed;

  /*
   * Large-scale breathing movement.
   */
  float waveA =
    sin(
      t * 9.0 +
      phase
    );

  float waveB =
    sin(
      t * 19.0 -
      phase * 1.37
    );

  float waveC =
    sin(
      t * 31.0 +
      phase * 0.71
    );

  /*
   * Multi-frequency deformation.
   */
  float deformation =
    waveA * 0.040 +
    waveB * 0.018 +
    waveC * 0.009;

  /*
   * Make the displacement strongest
   * away from the center of the strand.
   */
  float envelope =
    sin(t * 3.14159265);

  deformation *=
    0.45 +
    envelope * 0.85;

  /*
   * Warp the actual tube surface.
   */
  p +=
    normal *
    deformation *
    (0.7 + aWarp);

  /*
   * Slow 3D twist.
   */
  float angle =
    phase *
    0.12;

  float s = sin(angle);
  float c = cos(angle);

  p.xz =
    mat2(
      c, -s,
      s,  c
    ) *
    p.xz;

  /*
   * Asymmetric vertical breathing.
   */
  p.y +=
    sin(
      t * 6.0 +
      phase * 0.43
    ) *
    0.035 *
    envelope;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(
      p,
      1.0
    );

  gl_Position =
    projectionMatrix *
    mvPosition;

  vProgress =
    t;

  vPhase =
    aPhase;

  vSpeed =
    aSpeed;
}
`

const flowTubeFragmentShader = `
uniform float uTime;

varying float vProgress;
varying float vPhase;
varying float vSpeed;

void main() {

  /*
   * Moving energy packet.
   */
  float head =
    fract(
      uTime *
      (
        0.055 +
        vSpeed * 0.018
      ) +
      vPhase * 0.031
    );

  float distanceToHead =
    abs(
      vProgress -
      head
    );

  distanceToHead =
    min(
      distanceToHead,
      1.0 -
      distanceToHead
    );

  float pulse =
    smoothstep(
      0.125,
      0.0,
      distanceToHead
    );

  /*
   * Secondary pulse.
   */
  float head2 =
    fract(
      head +
      0.47 +
      sin(vPhase) * 0.08
    );

  float distanceToHead2 =
    abs(
      vProgress -
      head2
    );

  distanceToHead2 =
    min(
      distanceToHead2,
      1.0 -
      distanceToHead2
    );

  float pulse2 =
    smoothstep(
      0.075,
      0.0,
      distanceToHead2
    );

  /*
   * ULTRON palette.
   */
  vec3 red =
  vec3(
    1.0,
    0.003,
    0.008
  );

vec3 deepRed =
  vec3(
    0.16,
    0.001,
    0.004
  );

vec3 blue =
  vec3(
    0.005,
    0.055,
    0.65
  );

vec3 gold =
  vec3(
    1.0,
    0.28,
    0.005
  );

  /*
   * Stable base color.
   */
  float channel =
    0.5 +
    0.5 *
    sin(
      vPhase * 1.73
    );

  color =
  mix(
    deepRed,
    blue,
    smoothstep(
      0.52,
      0.82,
      channel
    ) * 0.28
  );

color =
  mix(
    color,
    red,
    0.72
  );

  /*
   * Red dominates energetic regions.
   */
  color =
  mix(
    color,
    red,
    pulse * 0.95
  );

  /*
   * Gold is reserved for rare
   * high-energy events.
   */
  float goldMask =
    smoothstep(
      0.72,
      1.0,
      sin(
        vPhase * 2.91
      ) * 0.5 + 0.5
    );

  color =
    mix(
      color,
      gold,
      goldMask *
      (
        pulse * 0.72 +
        pulse2 * 0.28
      )
    );

  /*
   * Fine internal energy variation.
   */
  float structuralEnergy =
    0.08 +
    0.055 *
    sin(
      vProgress * 28.0 +
      vPhase * 1.7
    );

float intensity =
  structuralEnergy +
  pulse * 1.45 +
  pulse2 * 0.45;

float alpha =
  0.10 +
  pulse * 0.40 +
  pulse2 * 0.16;

  /*
   * Keep highlights bright without
   * turning the whole field white.
   */
  intensity =
    min(
      intensity,
      2.15
    );

  gl_FragColor =
    vec4(
      color * intensity,
      alpha
    );
}
`

/* =========================================================
   DYNAMIC CIRCUIT FIELD
   ========================================================= */

function NeuralFilaments() {

  const material =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uTime: {
              value: 0,
            },
          },

          vertexShader:
            flowTubeVertexShader,

          fragmentShader:
            flowTubeFragmentShader,

          transparent: true,

          depthWrite: false,

          blending:
            THREE.AdditiveBlending,

          toneMapped: false,
        }),
      [],
    )

  const materialRef =
    useRef<THREE.ShaderMaterial>(
      material,
    )

  const tubes =
    useMemo(() => {

      const streamCount = 30
      const samples = 78

      const random = (
        seed: number,
      ) => {

        const x =
          Math.sin(
            seed *
            12.9898,
          ) *
          43758.5453

        return (
          x -
          Math.floor(x)
        )
      }

      return Array.from(
        {
          length:
            streamCount,
        },
        (_, stream) => {

          const phase =
            stream *
            2.399963 +
            random(stream + 101) *
            2.0

          const points:
            THREE.Vector3[] =
            []

          const startAngle =
            random(
              stream + 4,
            ) *
            Math.PI *
            2

          /*
           * Less symmetric than the old
           * stacked-orbit structure.
           */
          const tilt =
            0.45 +
            random(
              stream + 9,
            ) *
            1.15

          const twist =
            0.75 +
            random(
              stream + 17,
            ) *
            2.15

          const baseRadius =
            0.90 +
            random(
              stream + 25,
            ) *
            0.58

          const radialBias =
            random(
              stream + 41,
            ) -
            0.5

          for (
            let i = 0;
            i < samples;
            i++
          ) {

            const t =
              i /
              (samples - 1)

            /*
             * Non-uniform angular progression.
             */
            const theta =
              startAngle +
              t *
              Math.PI *
              2 *
              twist +
              Math.sin(
                t * 4.0 +
                phase
              ) *
              0.24

            /*
             * Non-planar latitude.
             */
            const latitude =
              Math.sin(
                t *
                Math.PI *
                (
                  1.45 +
                  random(
                    stream + 53
                  ) *
                  1.4
                ) +
                phase
              ) *
              tilt *
              0.62

            /*
             * Multi-scale radius deformation.
             */
            const largeWave =
              Math.sin(
                t * 4.0 +
                phase
              ) *
              0.13

            const mediumWave =
              Math.sin(
                t * 11.0 -
                phase * 0.8
              ) *
              0.065

            const smallWave =
              Math.sin(
                t * 23.0 +
                phase * 1.7
              ) *
              0.028

            const radius =
              baseRadius +
              largeWave +
              mediumWave +
              smallWave +
              radialBias *
              Math.sin(
                t * Math.PI
              )

            const cosLat =
              Math.cos(
                latitude,
              )

            /*
             * Independent X/Y/Z distortion.
             */
            const x =
              Math.cos(theta) *
              cosLat *
              radius

            const y =
              Math.sin(latitude) *
              radius *
              (
                0.82 +
                random(
                  stream + 67
                ) *
                0.36
              )

            const z =
              Math.sin(theta) *
              cosLat *
              radius

            points.push(
              new THREE.Vector3(
                x,
                y,
                z,
              ),
            )
          }

          const curve =
            new THREE.CatmullRomCurve3(
              points,
              false,
              'centripetal',
              0.55,
            )

          const geometry =
            new THREE.TubeGeometry(
              curve,
              samples,
              0.008 +
                random(
                  stream + 33,
                ) *
                0.010,
              7,
              false,
            )

          /*
           * Give every vertex its own
           * stream parameters.
           */
          const vertexCount =
            geometry.attributes
              .position.count

          const phases =
            new Float32Array(
              vertexCount,
            )

          const speeds =
            new Float32Array(
              vertexCount,
            )

          const warps =
            new Float32Array(
              vertexCount,
            )

          const speed =
            0.58 +
            random(
              stream + 79,
            ) *
            0.85

          const warp =
            0.55 +
            random(
              stream + 91,
            ) *
            0.85

          for (
            let vertex = 0;
            vertex < vertexCount;
            vertex++
          ) {

            phases[vertex] =
              phase

            speeds[vertex] =
              speed

            warps[vertex] =
              warp
          }

          geometry.setAttribute(
            'aPhase',
            new THREE.BufferAttribute(
              phases,
              1,
            ),
          )

          geometry.setAttribute(
            'aSpeed',
            new THREE.BufferAttribute(
              speeds,
              1,
            ),
          )

          geometry.setAttribute(
            'aWarp',
            new THREE.BufferAttribute(
              warps,
              1,
            ),
          )

          return geometry
        },
      )
    }, [])

  useFrame(
    ({
      clock,
    }) => {

      materialRef.current
        .uniforms
        .uTime
        .value =
        clock.elapsedTime
    },
  )

  return (
    <group>

      {tubes.map(
        (
          geometry,
          index,
        ) => (

          <mesh
            key={index}
            geometry={geometry}
            rotation={[
              index * 0.013,
              index * 0.021,
              index * 0.009,
            ]}
          >

            <primitive
              object={material}
              attach="material"
            />

          </mesh>
        ),
      )}

    </group>
  )
}

export default NeuralFilaments