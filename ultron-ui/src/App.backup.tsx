import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* =========================================================
   SHARED NOISE
   ========================================================= */

/* =========================================================
   PLASMA CORE
   ========================================================= */




function PlasmaCore() {
  const materialRef =
    useRef<THREE.ShaderMaterial>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
        },

        vertexShader: `
          uniform float uTime;

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewPosition;

          void main() {

            vec3 p = position;

            float n =
              sin(
                position.x * 9.0 +
                position.y * 7.0 +
                uTime * 0.55
              ) *
              0.025;

            p += normalize(position) * n;

            vec4 mv =
              modelViewMatrix *
              vec4(p, 1.0);

            vNormal =
              normalize(
                normalMatrix * normal
              );

            vPosition =
              normalize(p);

            vViewPosition =
              -mv.xyz;

            gl_Position =
              projectionMatrix * mv;
          }
        `,

        fragmentShader: `
          uniform float uTime;

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewPosition;

          float hash(vec3 p) {
            p = fract(
              p * 0.3183099 +
              vec3(0.1, 0.2, 0.3)
            );

            p *= 17.0;

            return fract(
              p.x *
              p.y *
              p.z *
              (p.x + p.y + p.z)
            );
          }

          float noise(vec3 p) {

            vec3 i = floor(p);
            vec3 f = fract(p);

            f = f * f *
                (3.0 - 2.0 * f);

            return mix(
              mix(
                hash(i),
                hash(i + vec3(1,0,0)),
                f.x
              ),
              mix(
                hash(i + vec3(0,1,0)),
                hash(i + vec3(1,1,0)),
                f.x
              ),
              f.y
            );
          }

          float fbm(vec3 p) {

            float value = 0.0;
            float amp = 0.5;

            for(int i = 0; i < 5; i++) {
              value += noise(p) * amp;
              p *= 2.1;
              amp *= 0.5;
            }

            return value;
          }

          void main() {

            vec3 dir =
              normalize(vPosition);

            float t =
              uTime * 0.16;

            float field =
              fbm(
                dir * 4.5 +
                vec3(
                  t,
                  -t * 0.7,
                  t * 0.45
                )
              );

            float turbulence =
              fbm(
                dir * 11.0 -
                vec3(
                  t * 1.5,
                  0.0,
                  t
                )
              );

            float energy =
              field * 0.75 +
              turbulence * 0.25;

            vec3 red =
              vec3(
                1.0,
                0.008,
                0.025
              );

            vec3 blue =
              vec3(
                0.015,
                0.12,
                0.95
              );

            vec3 gold =
              vec3(
                1.0,
                0.38,
                0.015
              );

            /*
             * Red remains dominant.
             */
            vec3 color =
              mix(
                red * 0.35,
                red,
                smoothstep(
                  0.25,
                  0.75,
                  energy
                )
              );

            /*
             * Blue appears in disturbed regions.
             */
            float blueEnergy =
              smoothstep(
                0.62,
                0.92,
                turbulence
              );

            color =
              mix(
                color,
                blue,
                blueEnergy * 0.55
              );

            /*
             * Rare gold sparks.
             */
            float goldEnergy =
              smoothstep(
                0.90,
                0.98,
                field
              );

            color =
              mix(
                color,
                gold,
                goldEnergy * 0.45
              );

            /*
             * Strong Fresnel rim.
             */
            vec3 viewDir =
              normalize(
                vViewPosition
              );

            float fresnel =
              pow(
                1.0 -
                max(
                  dot(
                    vNormal,
                    viewDir
                  ),
                  0.0
                ),
                3.0
              );

            /*
             * Dark center / bright edge.
             */
            float coreDarkness =
              pow(
                1.0 - fresnel,
                1.8
              );

            color *=
              0.35 +
              fresnel * 2.2;

            color *=
              1.0 -
              coreDarkness * 0.62;

            gl_FragColor =
              vec4(
                color,
                0.92
              );
          }
        `,

        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (!materialRef.current) return

    materialRef.current.uniforms.uTime.value =
      clock.elapsedTime
  })

  return (
    <group>
      {/* Computational energy shell */}
      <mesh scale={0.82}>
        <sphereGeometry args={[0.72, 96, 96]} />

        <primitive
          object={material}
          ref={materialRef}
          attach="material"
        />
      </mesh>

      {/* Dark central singularity */}
      <mesh scale={0.28}>
        <sphereGeometry args={[0.72, 48, 48]} />

        <meshBasicMaterial
          color="#000004"
        />
      </mesh>
    </group>
  )
}

/* =========================================================
   PARTICLE FIELD
   ========================================================= */

const particleVertexShader = `
uniform float uTime;
uniform float uSize;

varying float vEnergy;

void main() {

  vec3 p = position;

  float phase =
    dot(
      normalize(position),
      vec3(
        4.0,
        7.0,
        5.0
      )
    );

  float flow =
    sin(
      phase * 3.0 +
      uTime * 0.75
    );

  p +=
    normalize(p) *
    (
      flow * 0.045
    );

  /* Slow orbital movement */
  float angle =
    uTime * 0.055;

  float s = sin(angle);
  float c = cos(angle);

  p.xz =
    mat2(
      c, -s,
      s, c
    ) *
    p.xz;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(
      p,
      1.0
    );

  float depthScale =
    210.0 /
    max(
      -mvPosition.z,
      0.1
    );

  gl_PointSize =
    uSize *
    depthScale;

  gl_Position =
    projectionMatrix *
    mvPosition;

  vEnergy =
    0.5 +
    0.5 *
    sin(
      phase * 4.0 -
      uTime * 0.9
    );
}
`

const particleFragmentShader = `
varying float vEnergy;

void main() {

  vec2 uv =
    gl_PointCoord -
    0.5;

  float dist =
    length(uv);

  float alpha =
    1.0 -
    smoothstep(
      0.08,
      0.5,
      dist
    );

  if (
    alpha <
    0.01
  ) discard;

  vec3 red =
    vec3(
      1.0,
      0.015,
      0.04
    );

  vec3 blue =
    vec3(
      0.02,
      0.20,
      1.0
    );

  vec3 gold =
    vec3(
      1.0,
      0.45,
      0.02
    );

  vec3 color =
    mix(
      red,
      blue,
      smoothstep(
        0.25,
        0.75,
        vEnergy
      )
    );

  color =
    mix(
      color,
      gold,
      smoothstep(
        0.91,
        1.0,
        vEnergy
      ) * 0.35
    );

  float glow =
    alpha *
    (
      0.30 +
      vEnergy * 0.45
    );

  gl_FragColor =
    vec4(
      color * glow,
      glow
    );
}
`

function ParticleHalo() {

  const materialRef =
    useRef<THREE.ShaderMaterial>(null)

  const geometry =
    useMemo(() => {

      const count =
        4200

      const positions =
        new Float32Array(
          count * 3,
        )

      const goldenAngle =
        Math.PI *
        (
          3.0 -
          Math.sqrt(5.0)
        )

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const y =
          1 -
          (
            i /
            (count - 1)
          ) * 2

        const radius =
          Math.sqrt(
            Math.max(
              0,
              1 -
              y * y,
            ),
          )

        const theta =
          goldenAngle *
          i

        const shell =
          1.50 +
          Math.sin(
            i * 5.17,
          ) * 0.18 +
          Math.sin(
            i * 1.37,
          ) * 0.05

        positions[
          i * 3
        ] =
          Math.cos(theta) *
          radius *
          shell

        positions[
          i * 3 + 1
        ] =
          y *
          shell

        positions[
          i * 3 + 2
        ] =
          Math.sin(theta) *
          radius *
          shell
      }

      const geo =
        new THREE.BufferGeometry()

      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(
          positions,
          3,
        ),
      )

      return geo

    }, [])

  const material =
    useMemo(
      () =>
        new THREE.ShaderMaterial({

          uniforms: {

            uTime: {
              value: 0,
            },

            uSize: {
              value: 0.075,
            },

          },

          vertexShader:
            particleVertexShader,

          fragmentShader:
            particleFragmentShader,

          transparent:
            true,

          depthWrite:
            false,

          blending:
            THREE.AdditiveBlending,

          toneMapped:
            false,
        }),
      [],
    )

  useFrame(({ clock }) => {

    if (!materialRef.current)
      return

    materialRef.current.uniforms.uTime.value =
      clock.elapsedTime
  })

  return (
    <points>

      <primitive
        object={geometry}
        attach="geometry"
      />

      <primitive
        object={material}
        ref={materialRef}
        attach="material"
      />

    </points>
  )
}
/* =========================================================
   CONTINUOUS 3D ENERGY TENDRILS
   ========================================================= */

const flowTubeVertexShader = `
uniform float uTime;

varying vec2 vUv;

void main() {

  vUv = uv;

  vec3 p = position;

  float wave =
    sin(
      uv.x * 18.0 +
      uTime * 0.8
    ) * 0.006;

  p += normal * wave;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(p, 1.0);

  gl_Position =
    projectionMatrix *
    mvPosition;
}
`

const flowTubeFragmentShader = `
uniform float uTime;

varying vec2 vUv;

void main() {

  float pulsePosition =
    fract(
      uTime * 0.08
    );

  float distanceToPulse =
    abs(
      vUv.x -
      pulsePosition
    );

  distanceToPulse =
    min(
      distanceToPulse,
      1.0 -
      distanceToPulse
    );

  float pulse =
    smoothstep(
      0.10,
      0.0,
      distanceToPulse
    );

  vec3 red =
    vec3(
      1.0,
      0.01,
      0.025
    );

  vec3 blue =
    vec3(
      0.01,
      0.16,
      1.0
    );

  vec3 gold =
    vec3(
      1.0,
      0.40,
      0.02
    );

  float channel =
    0.5 +
    0.5 *
    sin(
      vUv.x * 12.0
    );

  vec3 color =
    mix(
      red,
      blue,
      channel
    );

  color =
    mix(
      color,
      gold,
      pulse * 0.65
    );

float intensity =
  0.12 +
  pulse * 1.8;

  float alpha =
    0.22 +
    pulse * 0.42;

  gl_FragColor =
    vec4(
      color * intensity,
      alpha
    );
}
`

function NeuralFilaments() {

  const material = useMemo(
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
    useRef<THREE.ShaderMaterial>(material)

  const tubes = useMemo(() => {

    const streamCount = 22
    const samples = 90

    const random = (seed: number) => {
      const x =
        Math.sin(seed * 12.9898) *
        43758.5453

      return x - Math.floor(x)
    }

    return Array.from(
      {
        length: streamCount,
      },
      (_, stream) => {

        const phase =
          stream * 2.399963

        const points: THREE.Vector3[] = []

        const startAngle =
          random(stream + 4) *
          Math.PI *
          2

        const tilt =
          0.35 +
          random(stream + 9) *
          0.8

        const twist =
          1.0 +
          random(stream + 17) *
          1.8

        const baseRadius =
  1.05 +
  random(stream + 25) *
  0.55

        for (
          let i = 0;
          i < samples;
          i++
        ) {

          const t =
            i /
            (samples - 1)

          const theta =
            startAngle +
            t *
            Math.PI *
            2 *
            twist

          const latitude =
  Math.sin(
    t * Math.PI * (2.0 + random(stream + 41) * 3.0) +
    phase
  ) *
  tilt

          const turbulence =
            Math.sin(
              t * 10.0 +
              phase
            ) * 0.08

          const radius =
            baseRadius +
            turbulence

          const cosLat =
            Math.cos(latitude)

          points.push(
            new THREE.Vector3(
              Math.cos(theta) *
                cosLat *
                radius,

              Math.sin(latitude) *
                radius,

              Math.sin(theta) *
                cosLat *
                radius,
            ),
          )
        }

        const curve =
          new THREE.CatmullRomCurve3(
            points,
            false,
            'centripetal',
            0.5,
          )

        return new THREE.TubeGeometry(
          curve,
          samples,
          0.007 +
            random(stream + 33) *
            0.008,
          8,
          false,
        )
      },
    )

  }, [])

  useFrame(({ clock }) => {

    materialRef.current.uniforms.uTime.value =
      clock.elapsedTime
  })

  return (
    <group>

      {tubes.map(
        (geometry, index) => (
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

/* =========================================================
   ENERGY ORBITALS
   ========================================================= */

/* =========================================================
   CORE MOTION
   ========================================================= */

function CoreMotion() {

  const groupRef =
    useRef<THREE.Group>(null)

  useFrame(
    (state) => {

      if (
        !groupRef.current
      )
        return

      const time =
        state.clock.elapsedTime

      groupRef.current.rotation.y =
        time *
        0.045

      groupRef.current.rotation.x =
        Math.sin(
          time *
          0.16
        ) *
        0.075

      groupRef.current.rotation.z =
        Math.cos(
          time *
          0.11
        ) *
        0.045

      const pulse =
        1 +
        Math.sin(
          time *
          1.5
        ) *
        0.012

      groupRef.current.scale.setScalar(
        pulse,
      )
    },
  )

  return (
  <group ref={groupRef}>
    <PlasmaCore />
    <ParticleHalo />
    <NeuralFilaments />
  </group>
 )
}

/* =========================================================
   SCENE
   ========================================================= */

function Scene() {

  return (
    <>
      <CoreMotion />

      <ambientLight
        intensity={
          0.015
        }
      />

      <pointLight
        color="#143eff"
        intensity={2.5}
        distance={5}
      />

      <EffectComposer>

        <Bloom
          intensity={
            1.35
          }
          luminanceThreshold={
            0.45
          }
          luminanceSmoothing={
            0.9
          }
          mipmapBlur
        />

      </EffectComposer>
    </>
  )
}

/* =========================================================
   APP
   ========================================================= */

function App() {

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',

        background:
          'radial-gradient(circle at center, #03040b 0%, #000106 52%, #000000 100%)',
      }}
    >

      <Canvas
        camera={{
          position: [
            0,
            0,
            5.4,
          ],
          fov: 48,
        }}

        dpr={[
          1,
          2,
        ]}

        gl={{
          antialias:
            true,

          powerPreference:
            'high-performance',

          toneMapping:
            THREE.ACESFilmicToneMapping,

          toneMappingExposure:
            1.0,
        }}
      >

        <Scene />

      </Canvas>

    </div>
  )
}

export default App