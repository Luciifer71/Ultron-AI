export type GPUCapabilities = {
  webgpu: boolean
  webgl2: boolean

  vendor: string
  architecture: string
  device: string
  description: string

  maxTextureDimension2D: number
  maxBufferSize: number
  maxStorageBufferBindingSize: number

  maxComputeWorkgroupsPerDimension: number
  maxComputeInvocationsPerWorkgroup: number

  devicePixelRatio: number
  hardwareConcurrency: number

  estimatedTier: 'low' | 'medium' | 'high' | 'ultra'
}

function getWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')

    return context !== null
  } catch {
    return false
  }
}

function estimateTier(
  limits: {
    maxTextureDimension2D: number
    maxBufferSize: number
    maxStorageBufferBindingSize: number
    maxComputeWorkgroupsPerDimension: number
    maxComputeInvocationsPerWorkgroup: number
  },
  hardwareConcurrency: number,
): GPUCapabilities['estimatedTier'] {

  let score = 0

  if (
    limits.maxTextureDimension2D >=
    16384
  ) {
    score += 2
  } else if (
    limits.maxTextureDimension2D >=
    8192
  ) {
    score += 1
  }

  if (
    limits.maxBufferSize >=
    512 * 1024 * 1024
  ) {
    score += 2
  } else if (
    limits.maxBufferSize >=
    256 * 1024 * 1024
  ) {
    score += 1
  }

  if (
    limits.maxStorageBufferBindingSize >=
    256 * 1024 * 1024
  ) {
    score += 2
  } else if (
    limits.maxStorageBufferBindingSize >=
    128 * 1024 * 1024
  ) {
    score += 1
  }

  if (
    limits.maxComputeWorkgroupsPerDimension >=
    65535
  ) {
    score += 2
  }

  if (
    limits.maxComputeInvocationsPerWorkgroup >=
    1024
  ) {
    score += 1
  }

  if (hardwareConcurrency >= 12) {
    score += 1
  }

  if (score >= 8) {
    return 'ultra'
  }

  if (score >= 5) {
    return 'high'
  }

  if (score >= 3) {
    return 'medium'
  }

  return 'low'
}

export async function detectGPUCapabilities(): Promise<GPUCapabilities> {

  const webgl2 =
    getWebGL2Support()

  const hardwareConcurrency =
    navigator.hardwareConcurrency || 4

  const devicePixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2,
    )

  const fallback: GPUCapabilities = {
    webgpu: false,
    webgl2,

    vendor: 'unknown',
    architecture: 'unknown',
    device: 'unknown',
    description: 'Unknown GPU',

    maxTextureDimension2D: 0,
    maxBufferSize: 0,
    maxStorageBufferBindingSize: 0,

    maxComputeWorkgroupsPerDimension: 0,
    maxComputeInvocationsPerWorkgroup: 0,

    devicePixelRatio,
    hardwareConcurrency,

    estimatedTier:
      webgl2
        ? 'medium'
        : 'low',
  }

  if (
    !('gpu' in navigator) ||
    !navigator.gpu
  ) {
    return fallback
  }

  try {

    const adapter =
      await navigator.gpu.requestAdapter({
        powerPreference:
          'high-performance',
      })

    if (!adapter) {
      return fallback
    }

    const limits =
      adapter.limits

    const info =
      adapter.info

    const capabilityLimits = {
      maxTextureDimension2D:
        limits.maxTextureDimension2D,

      maxBufferSize:
        limits.maxBufferSize,

      maxStorageBufferBindingSize:
        limits.maxStorageBufferBindingSize,

      maxComputeWorkgroupsPerDimension:
        limits.maxComputeWorkgroupsPerDimension,

      maxComputeInvocationsPerWorkgroup:
        limits.maxComputeInvocationsPerWorkgroup,
    }

    const estimatedTier =
      estimateTier(
        capabilityLimits,
        hardwareConcurrency,
      )

    return {
      webgpu: true,
      webgl2,

      vendor:
        info?.vendor ||
        'unknown',

      architecture:
        info?.architecture ||
        'unknown',

      device:
        info?.device ||
        'unknown',

      description:
        info?.description ||
        'WebGPU device',

      ...capabilityLimits,

      devicePixelRatio,
      hardwareConcurrency,

      estimatedTier,
    }

  } catch (error) {

    console.warn(
      '[ULTRON] GPU capability detection failed:',
      error,
    )

    return fallback
  }
}