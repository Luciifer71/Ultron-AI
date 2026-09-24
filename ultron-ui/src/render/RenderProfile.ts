import type { GPUCapabilities } from './GPUCapabilities'

/* =========================================================
   RENDER QUALITY
   ========================================================= */

export type RenderQuality =
  | 'low'
  | 'medium'
  | 'high'
  | 'ultra'

/* =========================================================
   RENDER PROFILE
   ========================================================= */

export type RenderProfile = {
  quality: RenderQuality

  /* Display */
  pixelRatioMin: number
  pixelRatioMax: number

  /* GPU particle system */
  particleCount: number
  particleTextureSize: number

  /* Computational structures */
  fragmentCount: number
  nodeCount: number
  spokeCount: number

  /* Energy system */
  energyEventCount: number
  energyEventIntensity: number

  /* Core */
  coreSegments: number
  coreDetail: number

  /* Post processing */
  bloomEnabled: boolean
  bloomIntensity: number

  /* Runtime */
  targetFPS: number
  adaptiveScaling: boolean

  /* Limits */
  maxTextureDimension: number
  maxStorageBufferSize: number
}

/* =========================================================
   QUALITY PRESETS
   ========================================================= */

const QUALITY_PRESETS: Record<
  RenderQuality,
  Omit<
    RenderProfile,
    | 'quality'
    | 'maxTextureDimension'
    | 'maxStorageBufferSize'
  >
> = {
  low: {
    pixelRatioMin: 0.75,
    pixelRatioMax: 1.0,

    particleCount: 3000,
    particleTextureSize: 64,

    fragmentCount: 40,
    nodeCount: 20,
    spokeCount: 6,

    energyEventCount: 6,
    energyEventIntensity: 0.65,

    coreSegments: 32,
    coreDetail: 1,

    bloomEnabled: true,
    bloomIntensity: 0.75,

    targetFPS: 60,

    adaptiveScaling: true,
  },

  medium: {
    pixelRatioMin: 0.8,
    pixelRatioMax: 1.25,

    particleCount: 7000,
    particleTextureSize: 96,

    fragmentCount: 70,
    nodeCount: 36,
    spokeCount: 10,

    energyEventCount: 10,
    energyEventIntensity: 0.85,

    coreSegments: 48,
    coreDetail: 2,

    bloomEnabled: true,
    bloomIntensity: 1.0,

    targetFPS: 60,

    adaptiveScaling: true,
  },

  high: {
    pixelRatioMin: 0.9,
    pixelRatioMax: 1.75,

    particleCount: 14000,
    particleTextureSize: 128,

    fragmentCount: 120,
    nodeCount: 64,
    spokeCount: 16,

    energyEventCount: 18,
    energyEventIntensity: 1.0,

    coreSegments: 72,
    coreDetail: 3,

    bloomEnabled: true,
    bloomIntensity: 1.3,

    targetFPS: 60,

    adaptiveScaling: true,
  },

  ultra: {
    pixelRatioMin: 1.0,
    pixelRatioMax: 2.0,

    particleCount: 30000,
    particleTextureSize: 192,

    fragmentCount: 220,
    nodeCount: 110,
    spokeCount: 26,

    energyEventCount: 32,
    energyEventIntensity: 1.25,

    coreSegments: 96,
    coreDetail: 4,

    bloomEnabled: true,
    bloomIntensity: 1.55,

    targetFPS: 60,

    adaptiveScaling: true,
  },
}

/* =========================================================
   RESOLUTION FACTOR
   ========================================================= */

function getResolutionFactor(): number {
  const width =
    window.innerWidth

  const height =
    window.innerHeight

  const pixels =
    width * height

  /*
   * We don't want a 4K/5K monitor
   * to blindly multiply the simulation.
   */
  if (pixels >= 20_000_000) {
    return 0.70
  }

  if (pixels >= 12_000_000) {
    return 0.80
  }

  if (pixels >= 8_000_000) {
    return 0.90
  }

  return 1.0
}

/* =========================================================
   HARDWARE ADAPTATION
   ========================================================= */

function chooseQuality(
  capabilities: GPUCapabilities,
): RenderQuality {

  /*
   * WebGPU-capable systems get access
   * to the higher visual tiers.
   */
  if (
    capabilities.webgpu &&
    capabilities.estimatedTier === 'ultra'
  ) {
    return 'ultra'
  }

  if (
    capabilities.webgpu &&
    capabilities.estimatedTier === 'high'
  ) {
    return 'high'
  }

  if (
    capabilities.webgpu &&
    capabilities.estimatedTier === 'medium'
  ) {
    return 'medium'
  }

  if (
    capabilities.webgpu
  ) {
    return 'medium'
  }

  return capabilities.estimatedTier
}

/* =========================================================
   CREATE PROFILE
   ========================================================= */

export function createRenderProfile(
  capabilities: GPUCapabilities,
): RenderProfile {

  const quality =
    chooseQuality(
      capabilities,
    )

  const preset =
    QUALITY_PRESETS[
      quality
    ]

  const resolutionFactor =
    getResolutionFactor()

  /*
   * High-DPI displays get a slightly
   * conservative DPR ceiling.
   */
  const pixelRatioMax =
    Math.min(
      preset.pixelRatioMax,
      Math.max(
        capabilities.devicePixelRatio,
        1,
      ),
    )

  /*
   * Keep simulation budgets reasonable
   * even when the display is enormous.
   */
  const particleCount =
    Math.floor(
      preset.particleCount *
      resolutionFactor,
    )

  const fragmentCount =
    Math.floor(
      preset.fragmentCount *
      resolutionFactor,
    )

  const nodeCount =
    Math.floor(
      preset.nodeCount *
      resolutionFactor,
    )

  const spokeCount =
    Math.floor(
      preset.spokeCount *
      resolutionFactor,
    )

  const energyEventCount =
    Math.floor(
      preset.energyEventCount *
      resolutionFactor,
    )

  return {
    quality,

    pixelRatioMin:
      preset.pixelRatioMin,

    pixelRatioMax,

    particleCount,

    particleTextureSize:
      preset.particleTextureSize,

    fragmentCount,

    nodeCount,

    spokeCount,

    energyEventCount,

    energyEventIntensity:
      preset.energyEventIntensity,

    coreSegments:
      preset.coreSegments,

    coreDetail:
      preset.coreDetail,

    bloomEnabled:
      preset.bloomEnabled,

    bloomIntensity:
      preset.bloomIntensity,

    targetFPS:
      preset.targetFPS,

    adaptiveScaling:
      preset.adaptiveScaling,

    maxTextureDimension:
      capabilities
        .maxTextureDimension2D,

    maxStorageBufferSize:
      capabilities
        .maxStorageBufferBindingSize,
  }
}

/* =========================================================
   SAFETY LIMITS
   ========================================================= */

export function clampRenderProfile(
  profile: RenderProfile,
): RenderProfile {

  const maxTextureSafe =
    profile.maxTextureDimension >=
    8192

  /*
   * If the GPU reports unusually low
   * limits, automatically reduce the
   * simulation rather than failing.
   */
  if (!maxTextureSafe) {

    return {
      ...profile,

      particleCount:
        Math.min(
          profile.particleCount,
          7000,
        ),

      fragmentCount:
        Math.min(
          profile.fragmentCount,
          70,
        ),

      nodeCount:
        Math.min(
          profile.nodeCount,
          36,
        ),

      spokeCount:
        Math.min(
          profile.spokeCount,
          10,
        ),

      energyEventCount:
        Math.min(
          profile.energyEventCount,
          10,
        ),
    }
  }

  return profile
}

/* =========================================================
   DEBUG SUMMARY
   ========================================================= */

export function describeRenderProfile(
  profile: RenderProfile,
): string {

  return [
    `Quality: ${profile.quality}`,
    `Particles: ${profile.particleCount}`,
    `Texture: ${profile.particleTextureSize}²`,
    `Fragments: ${profile.fragmentCount}`,
    `Nodes: ${profile.nodeCount}`,
    `Spokes: ${profile.spokeCount}`,
    `Energy events: ${profile.energyEventCount}`,
    `Core detail: ${profile.coreDetail}`,
    `DPR: ${profile.pixelRatioMin.toFixed(2)}-${profile.pixelRatioMax.toFixed(2)}`,
    `Adaptive: ${profile.adaptiveScaling}`,
  ].join(' | ')
}