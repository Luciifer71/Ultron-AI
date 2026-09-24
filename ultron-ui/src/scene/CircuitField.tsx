import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

/* =========================================================
   TYPES
   ========================================================= */

type FilamentData = {
  geometry: THREE.TubeGeometry
}

type CircuitData = {
  geometry: THREE.TubeGeometry
  color: string
  opacity: number
  rotation: [number, number, number]
}

/* =========================================================
   DETERMINISTIC RANDOM
   ========================================================= */

function random01(seed: number): number {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453123

  return value - Math.floor(value)
}

/* =========================================================
   DYNAMIC FILAMENT VERTEX SHADER
   ========================================================= */

const filamentVertexShader = `
uniform float uTime;

attribute float aPhase;
attribute float aSpeed;

varying float vProgress;
varying float vPhase;
varying float vSpeed;

void main() {

  vec3 p = position;

  float t = clamp(uv.x, 0.0, 1.0);

  float phase =
    aPhase +
    uTime * aSpeed;

  /* Fine deformation */
  float wave1 =
    sin(
      t * 18.0 +
      phase
    ) * 0.012;

  float wave2 =
    sin(
      t * 37.0 -
      phase * 1.6
    ) * 0.006;

  float envelope =
    sin(
      t * 3.14159265
    );

  float deformation =
    (wave1 + wave2) *
    (0.4 + envelope * 0.6);

  p +=
    normal *
    deformation;

  /*
   * Very slow independent rotation.
   * This keeps every filament alive.
   */
  float angle =
    phase * 0.055;

  float s = sin(angle);
  float c = cos(angle);

  p.xz =
    mat2(
      c, -s,
      s,  c
    ) * p.xz;

  /*
   * Subtle vertical breathing.
   */
  p.y +=
    sin(
      t * 8.0 +
      phase * 0.37
    ) *
    0.018 *
    envelope;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(p, 1.0);

  gl_Position =
    projectionMatrix *
    mvPosition;

  vProgress = t;
  vPhase = aPhase;
  vSpeed = aSpeed;
}
`

/* =========================================================
   DYNAMIC FILAMENT FRAGMENT SHADER
   ========================================================= */

const filamentFragmentShader = `
uniform float uTime;

varying float vProgress;
varying float vPhase;
varying float vSpeed;

void main() {

  /*
   * Main travelling energy packet.
   */
  float head =
    fract(
      uTime *
      (
        0.045 +
        vSpeed * 0.018
      ) +
      vPhase * 0.021
    );

  float distanceToHead =
    abs(
      vProgress -
      head
    );

  distanceToHead =
    min(
      distanceToHead,
      1.0 - distanceToHead
    );

  float pulse =
    smoothstep(
      0.085,
      0.0,
      distanceToHead
    );

  /*
   * Secondary weaker packet.
   */
  float head2 =
    fract(
      head +
      0.43 +
      sin(vPhase) * 0.06
    );

  float distanceToHead2 =
    abs(
      vProgress -
      head2
    );

  distanceToHead2 =
    min(
      distanceToHead2,
      1.0 - distanceToHead2
    );

  float pulse2 =
    smoothstep(
      0.065,
      0.0,
      distanceToHead2
    );

  /*
   * ULTRON palette.
   *
   * RED   = dominant
   * BLUE  = secondary
   * GOLD  = rare event energy
   */
  vec3 red =
    vec3(
      1.0,
      0.004,
      0.012
    );

  vec3 deepRed =
    vec3(
      0.20,
      0.001,
      0.004
    );

  vec3 blue =
    vec3(
      0.005,
      0.075,
      0.78
    );

  vec3 gold =
    vec3(
      1.0,
      0.30,
      0.008
    );

  /*
   * Deterministic filament identity.
   */
  float identityNoise =
    fract(
      sin(
        vPhase * 4.173
      ) *
      43758.5453
    );

  vec3 baseColor;

  if (identityNoise < 0.67) {

    baseColor =
      mix(
        deepRed,
        red,
        0.78
      );

  } else {

    baseColor =
      mix(
        deepRed,
        blue,
        0.80
      );
  }

  /*
   * Energy pulse becomes brighter red.
   */
  baseColor =
    mix(
      baseColor,
      red,
      pulse * 0.78
    );

  /*
   * Gold only appears at high-energy events.
   */
  float goldEvent =
    pulse *
    smoothstep(
      0.72,
      0.96,
      identityNoise
    );

  baseColor =
    mix(
      baseColor,
      gold,
      goldEvent * 0.82
    );

  /*
   * Quiet baseline.
   */
  float structuralEnergy =
    0.035 +
    0.025 *
    (
      0.5 +
      0.5 *
      sin(
        vProgress * 24.0 +
        vPhase
      )
    );

  float intensity =
    structuralEnergy +
    pulse * 1.55 +
    pulse2 * 0.42;

  float alpha =
    0.11 +
    pulse * 0.44 +
    pulse2 * 0.14;

  intensity =
    min(
      intensity,
      1.85
    );

  gl_FragColor =
    vec4(
      baseColor * intensity,
      alpha
    );
}
`

/* =========================================================
   CREATE FILAMENT GEOMETRIES
   ========================================================= */

function createFilaments(): FilamentData[] {

  const filamentCount = 18
  const samples = 76

  const output: FilamentData[] = []

  for (
    let filament = 0;
    filament < filamentCount;
    filament++
  ) {

    const seed =
      filament + 1

    const phase =
      filament *
      2.399963 +
      random01(
        seed + 100
      ) *
      Math.PI

    const startAngle =
      random01(
        seed + 10
      ) *
      Math.PI *
      2.0

    const radius =
      0.82 +
      random01(
        seed + 20
      ) *
      0.62

    const twist =
      0.70 +
      random01(
        seed + 30
      ) *
      1.70

    const tilt =
      0.30 +
      random01(
        seed + 40
      ) *
      0.95

    const points: THREE.Vector3[] = []

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
        2.0 *
        twist

      /*
       * Non-planar path.
       */
      const latitude =
        Math.sin(
          t *
          Math.PI *
          (
            1.0 +
            random01(
              seed + 50
            ) *
            1.8
          )
        ) *
        tilt

      /*
       * Small multi-frequency radial deformation.
       */
      const radiusWave =
        Math.sin(
          t * 7.0 +
          phase
        ) *
        0.055
        +
        Math.sin(
          t * 17.0 -
          phase * 0.8
        ) *
        0.022

      const r =
        radius +
        radiusWave

      const cosLatitude =
        Math.cos(latitude)

      const x =
        Math.cos(theta) *
        cosLatitude *
        r

      const y =
        Math.sin(latitude) *
        r

      const z =
        Math.sin(theta) *
        cosLatitude *
        r

      points.push(
        new THREE.Vector3(
          x,
          y,
          z
        )
      )
    }

    const curve =
      new THREE.CatmullRomCurve3(
        points,
        false,
        'centripetal',
        0.5
      )

    const geometry =
      new THREE.TubeGeometry(
        curve,
        samples,
        0.0035 +
        random01(
          seed + 60
        ) * 0.0045,
        5,
        false
      )

    const vertexCount =
      geometry.attributes.position.count

    const phases =
      new Float32Array(
        vertexCount
      )

    const speeds =
      new Float32Array(
        vertexCount
      )

    const speed =
      0.35 +
      random01(
        seed + 70
      ) * 1.10

    for (
      let i = 0;
      i < vertexCount;
      i++
    ) {

      phases[i] =
        phase

      speeds[i] =
        speed
    }

    geometry.setAttribute(
      'aPhase',
      new THREE.BufferAttribute(
        phases,
        1
      )
    )

    geometry.setAttribute(
      'aSpeed',
      new THREE.BufferAttribute(
        speeds,
        1
      )
    )

    output.push({
      geometry
    })
  }

  return output
}

/* =========================================================
   CREATE FRAGMENTED CIRCUIT ARCS
   ========================================================= */

function createCircuitArcs(): CircuitData[] {

  const arcCount = 26

  const output: CircuitData[] = []

  for (
    let arc = 0;
    arc < arcCount;
    arc++
  ) {

    const seed =
      arc + 500

    const startAngle =
      random01(
        seed
      ) *
      Math.PI *
      2.0

    const arcLength =
      0.20 +
      random01(
        seed + 1
      ) * 0.72

    const radius =
      0.88 +
      random01(
        seed + 2
      ) * 0.72

    const tilt =
      (
        random01(
          seed + 3
        ) -
        0.5
      ) *
      1.35

    const verticalOffset =
      (
        random01(
          seed + 4
        ) -
        0.5
      ) *
      0.40

    const points: THREE.Vector3[] = []

    const segments = 22

    for (
      let i = 0;
      i < segments;
      i++
    ) {

      const t =
        i /
        (segments - 1)

      const theta =
        startAngle +
        t *
        arcLength *
        Math.PI *
        2.0

      const jitter =
        (
          random01(
            seed + i * 0.71
          ) -
          0.5
        ) *
        0.05

      const r =
        radius +
        jitter

      const x =
        Math.cos(theta) *
        r

      const y =
        Math.sin(
          t * Math.PI
        ) *
        tilt +
        verticalOffset +
        jitter

      const z =
        Math.sin(theta) *
        r

      points.push(
        new THREE.Vector3(
          x,
          y,
          z
        )
      )
    }

    const curve =
      new THREE.CatmullRomCurve3(
        points,
        false,
        'centripetal',
        0.5
      )

    const geometry =
      new THREE.TubeGeometry(
        curve,
        30,
        0.0045 +
        random01(
          seed + 8
        ) * 0.004,
        5,
        false
      )

    let color = '#071f7a'

    if (
      arc % 7 === 0
    ) {

      color =
        '#ff8c18'

    } else if (
      arc % 3 === 0
    ) {

      color =
        '#0b45d6'

    } else if (
      arc % 2 === 0
    ) {

      color =
        '#8d0018'

    }

    const opacity =
      0.10 +
      random01(
        seed + 9
      ) *
      0.16

    const rotation: [
      number,
      number,
      number
    ] = [
      random01(
        seed + 10
      ) * Math.PI,
      random01(
        seed + 11
      ) * Math.PI,
      random01(
        seed + 12
      ) * Math.PI
    ]

    output.push({
      geometry,
      color,
      opacity,
      rotation
    })
  }

  return output
}

/* =========================================================
   MAIN CIRCUIT FIELD
   ========================================================= */

function NeuralFilaments() {

  const material =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uTime: {
              value: 0
            }
          },

          vertexShader:
            filamentVertexShader,

          fragmentShader:
            filamentFragmentShader,

          transparent: true,

          depthWrite: false,

          depthTest: true,

          blending:
            THREE.AdditiveBlending,

          toneMapped: false
        }),
      []
    )

  const filaments =
    useMemo(
      () =>
        createFilaments(),
      []
    )

  const circuitArcs =
    useMemo(
      () =>
        createCircuitArcs(),
      []
    )

  useFrame(
    ({
      clock
    }) => {

      material.uniforms
        .uTime
        .value =
        clock.elapsedTime

    }
  )

  return (
    <group>

      {/* =================================================
          THIN ACTIVE FILAMENTS
         ================================================= */}

      {filaments.map(
        (
          filament,
          index
        ) => (

          <mesh
            key={`filament-${index}`}
            geometry={
              filament.geometry
            }
            rotation={[
              0,
              index * 0.19,
              index * 0.07
            ]}
            frustumCulled={false}
          >

            <primitive
              object={material}
              attach="material"
            />

          </mesh>

        )
      )}

      {/* =================================================
          FRAGMENTED CIRCUIT STRUCTURES
         ================================================= */}

      {circuitArcs.map(
        (
          arc,
          index
        ) => (

          <mesh
            key={`arc-${index}`}
            geometry={
              arc.geometry
            }
            rotation={
              arc.rotation
            }
            frustumCulled={false}
          >

            <meshBasicMaterial
              color={
                arc.color
              }
              transparent
              opacity={
                arc.opacity
              }
              blending={
                THREE.AdditiveBlending
              }
              depthWrite={false}
              toneMapped={false}
            />

          </mesh>

        )
      )}

    </group>
  )
}

export default NeuralFilaments