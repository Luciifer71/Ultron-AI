import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* =========================================================
   PARTICLE SHADERS
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
      vec3(4.0, 7.0, 5.0)
    );

  float flow =
    sin(
      phase * 3.0 +
      uTime * 0.75
    );

  p +=
    normalize(p) *
    (flow * 0.045);

  float angle =
    uTime * 0.055;

  float s = sin(angle);
  float c = cos(angle);

  p.xz =
    mat2(c, -s, s, c) *
    p.xz;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(p, 1.0);

  float depthScale =
    210.0 /
    max(-mvPosition.z, 0.1);

  gl_PointSize =
    uSize * depthScale;

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
    gl_PointCoord - 0.5;

  float dist =
    length(uv);

  float alpha =
    1.0 -
    smoothstep(
      0.08,
      0.5,
      dist
    );

  if (alpha < 0.01) {
    discard;
  }

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

/* =========================================================
   PARTICLE HALO
   ========================================================= */

function ParticleHalo() {
  const materialRef =
    useRef<THREE.ShaderMaterial>(null)

  const geometry =
    useMemo(() => {
      const count = 4200

      const positions =
        new Float32Array(
          count * 3
        )

      const goldenAngle =
        Math.PI *
        (3.0 - Math.sqrt(5.0))

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const y =
          1 -
          (i / (count - 1)) * 2

        const radius =
          Math.sqrt(
            Math.max(
              0,
              1 - y * y
            )
          )

        const theta =
          goldenAngle * i

        const shell =
          1.50 +
          Math.sin(i * 5.17) * 0.18 +
          Math.sin(i * 1.37) * 0.05

        positions[i * 3] =
          Math.cos(theta) *
          radius *
          shell

        positions[i * 3 + 1] =
          y * shell

        positions[i * 3 + 2] =
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
          3
        )
      )

      return geo
    }, [])

  const material =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uTime: {
              value: 0
            },

            uSize: {
              value: 0.075
            }
          },

          vertexShader:
            particleVertexShader,

          fragmentShader:
            particleFragmentShader,

          transparent: true,

          depthWrite: false,

          blending:
            THREE.AdditiveBlending,

          toneMapped: false
        }),
      []
    )

  useFrame(({ clock }) => {
    if (!materialRef.current)
      return

    materialRef.current
      .uniforms
      .uTime
      .value =
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

export default ParticleHalo