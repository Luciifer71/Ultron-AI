import type {
  RenderProfile,
  RenderQuality,
} from './RenderProfile'

/* =========================================================
   GOVERNOR STATE
   ========================================================= */

export type GovernorState = {
  quality: RenderQuality
  scale: number

  averageFrameMs: number
  fps: number

  stable: boolean
  degrading: boolean
  recovering: boolean
}

/* =========================================================
   GOVERNOR OPTIONS
   ========================================================= */

export type PerformanceGovernorOptions = {
  targetFPS?: number

  sampleWindow?: number

  degradeAfterSamples?: number

  recoverAfterSamples?: number

  minimumScale?: number

  maximumScale?: number

  cooldownMs?: number

  onChange?: (
    state: GovernorState,
  ) => void
}

/* =========================================================
   QUALITY ORDER
   ========================================================= */

const QUALITY_ORDER: RenderQuality[] = [
  'low',
  'medium',
  'high',
  'ultra',
]

function qualityIndex(
  quality: RenderQuality,
): number {
  return QUALITY_ORDER.indexOf(
    quality,
  )
}

/* =========================================================
   PERFORMANCE GOVERNOR
   ========================================================= */

export class PerformanceGovernor {

  private readonly baseProfile: RenderProfile

  private readonly options: Required<
    PerformanceGovernorOptions
  >

  private frameSamples: number[] = []

  private badSamples = 0
  private goodSamples = 0

  private lastChangeTime = 0

  private state: GovernorState

  constructor(
    profile: RenderProfile,
    options: PerformanceGovernorOptions = {},
  ) {

    this.baseProfile =
      profile

    this.options = {
      targetFPS:
        options.targetFPS ??
        profile.targetFPS,

      sampleWindow:
        options.sampleWindow ??
        45,

      degradeAfterSamples:
        options.degradeAfterSamples ??
        18,

      recoverAfterSamples:
        options.recoverAfterSamples ??
        90,

      minimumScale:
        options.minimumScale ??
        0.55,

      maximumScale:
        options.maximumScale ??
        1.0,

      cooldownMs:
        options.cooldownMs ??
        2500,

      onChange:
        options.onChange ??
        (() => {}),
    }

    this.state = {
      quality:
        profile.quality,

      scale:
        this.options.maximumScale,

      averageFrameMs:
        1000 /
        this.options.targetFPS,

      fps:
        this.options.targetFPS,

      stable: true,

      degrading: false,

      recovering: false,
    }
  }

  /* =======================================================
     UPDATE
     ======================================================= */

  update(
    deltaSeconds: number,
  ): GovernorState {

    if (
      !Number.isFinite(
        deltaSeconds,
      )
    ) {
      return this.state
    }

    /*
     * Protect against tab switching,
     * debugger pauses, etc.
     */
    const clampedDelta =
      Math.min(
        Math.max(
          deltaSeconds,
          0.001,
        ),
        0.10,
      )

    const frameMs =
      clampedDelta * 1000

    this.frameSamples.push(
      frameMs,
    )

    if (
      this.frameSamples.length >
      this.options.sampleWindow
    ) {

      this.frameSamples.shift()
    }

    if (
      this.frameSamples.length <
      Math.min(
        10,
        this.options.sampleWindow,
      )
    ) {

      return this.state
    }

    const average =
      this.frameSamples.reduce(
        (
          sum,
          value,
        ) =>
          sum + value,
        0,
      ) /
      this.frameSamples.length

    const fps =
      1000 /
      Math.max(
        average,
        0.1,
      )

    const targetFrameMs =
      1000 /
      this.options.targetFPS

    /*
     * We allow a modest tolerance so the
     * governor doesn't constantly oscillate.
     */
    const degradeThreshold =
      targetFrameMs *
      1.18

    const recoverThreshold =
      targetFrameMs *
      0.88

    const now =
      performance.now()

    const cooldownElapsed =
      now -
      this.lastChangeTime >=
      this.options.cooldownMs

    let changed = false

    /*
     * =====================================================
     * DEGRADATION
     * =====================================================
     */

    if (
      average >
      degradeThreshold
    ) {

      this.badSamples += 1
      this.goodSamples = 0

      this.state = {
        ...this.state,
        averageFrameMs:
          average,

        fps,

        stable: false,

        degrading: true,

        recovering: false,
      }

      if (
        this.badSamples >=
          this.options.degradeAfterSamples &&
        cooldownElapsed
      ) {

        changed =
          this.degrade()

        if (changed) {

          this.badSamples = 0

          this.lastChangeTime =
            now
        }
      }

    /*
     * =====================================================
     * RECOVERY
     * =====================================================
     */

    } else if (
      average <
      recoverThreshold
    ) {

      this.goodSamples += 1
      this.badSamples = 0

      this.state = {
        ...this.state,

        averageFrameMs:
          average,

        fps,

        stable: false,

        degrading: false,

        recovering: true,
      }

      if (
        this.goodSamples >=
          this.options.recoverAfterSamples &&
        cooldownElapsed
      ) {

        changed =
          this.recover()

        if (changed) {

          this.goodSamples = 0

          this.lastChangeTime =
            now
        }
      }

    /*
     * =====================================================
     * STABLE
     * =====================================================
     */

    } else {

      this.goodSamples = 0
      this.badSamples = 0

      this.state = {
        ...this.state,

        averageFrameMs:
          average,

        fps,

        stable: true,

        degrading: false,

        recovering: false,
      }
    }

    if (changed) {

      this.options.onChange(
        this.state,
      )
    }

    return this.state
  }

  /* =======================================================
     DEGRADE
     * ======================================================= */

  private degrade(): boolean {

    const currentIndex =
      qualityIndex(
        this.state.quality,
      )

    /*
     * First reduce continuous
     * resolution scale.
     */

    if (
      this.state.scale >
      this.options.minimumScale
    ) {

      const nextScale =
        Math.max(
          this.options.minimumScale,

          this.state.scale -
            0.10,
        )

      this.state = {
        ...this.state,

        scale:
          Number(
            nextScale.toFixed(2),
          ),

        stable: false,

        degrading: true,

        recovering: false,
      }

      return true
    }

    /*
     * Then lower the quality tier.
     */

    if (
      currentIndex >
      0
    ) {

      const nextQuality =
        QUALITY_ORDER[
          currentIndex - 1
        ]

      this.state = {
        ...this.state,

        quality:
          nextQuality,

        scale:
          this.options.maximumScale,

        stable: false,

        degrading: true,

        recovering: false,
      }

      return true
    }

    return false
  }

  /* =======================================================
     RECOVER
     * ======================================================= */

  private recover(): boolean {

    /*
     * Restore resolution scale
     * before changing quality tier.
     */

    if (
      this.state.scale <
      this.options.maximumScale
    ) {

      const nextScale =
        Math.min(
          this.options.maximumScale,

          this.state.scale +
            0.10,
        )

      this.state = {
        ...this.state,

        scale:
          Number(
            nextScale.toFixed(2),
          ),

        stable: false,

        degrading: false,

        recovering: true,
      }

      return true
    }

    const currentIndex =
      qualityIndex(
        this.state.quality,
      )

    const baseIndex =
      qualityIndex(
        this.baseProfile.quality,
      )

    /*
     * Never recover above the quality
     * originally selected for the GPU.
     */

    if (
      currentIndex <
      baseIndex
    ) {

      const nextQuality =
        QUALITY_ORDER[
          currentIndex + 1
        ]

      this.state = {
        ...this.state,

        quality:
          nextQuality,

        scale:
          this.options.minimumScale,

        stable: false,

        degrading: false,

        recovering: true,
      }

      return true
    }

    return false
  }

  /* =======================================================
     READ STATE
     * ======================================================= */

  getState(): GovernorState {
    return {
      ...this.state,
    }
  }

  /* =======================================================
     GET SCALE
     * ======================================================= */

  getScale(): number {
    return this.state.scale
  }

  /* =======================================================
     GET QUALITY
     * ======================================================= */

  getQuality(): RenderQuality {
    return this.state.quality
  }

  /* =======================================================
     RESET
     * ======================================================= */

  reset(): void {

    this.frameSamples = []

    this.badSamples = 0

    this.goodSamples = 0

    this.lastChangeTime = 0

    this.state = {
      quality:
        this.baseProfile.quality,

      scale:
        this.options.maximumScale,

      averageFrameMs:
        1000 /
        this.options.targetFPS,

      fps:
        this.options.targetFPS,

      stable: true,

      degrading: false,

      recovering: false,
    }
  }

  /* =======================================================
     APPLY TO PROFILE
     * ======================================================= */

  applyToProfile(
    profile: RenderProfile,
  ): RenderProfile {

    const scale =
      this.state.scale

    return {
      ...profile,

      quality:
        this.state.quality,

      pixelRatioMax:
        Math.max(
          profile.pixelRatioMin,
          profile.pixelRatioMax *
            scale,
        ),

      particleCount:
        Math.max(
          500,
          Math.floor(
            profile.particleCount *
            scale *
            scale,
          ),
        ),

      fragmentCount:
        Math.max(
          12,
          Math.floor(
            profile.fragmentCount *
            scale,
          ),
        ),

      nodeCount:
        Math.max(
          8,
          Math.floor(
            profile.nodeCount *
            scale,
          ),
        ),

      spokeCount:
        Math.max(
          2,
          Math.floor(
            profile.spokeCount *
            scale,
          ),
        ),

      energyEventCount:
        Math.max(
          2,
          Math.floor(
            profile.energyEventCount *
            scale,
          ),
        ),

      energyEventIntensity:
        profile.energyEventIntensity *
        (
          0.75 +
          scale * 0.25
        ),

      bloomIntensity:
        profile.bloomIntensity *
        (
          0.85 +
          scale * 0.15
        ),
    }
  }
}