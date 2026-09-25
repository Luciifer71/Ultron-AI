/* =========================================================
   PLASMA CORE
   ========================================================= */

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

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
export default PlasmaCore