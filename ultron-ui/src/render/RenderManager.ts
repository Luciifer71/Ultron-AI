import {
  clampRenderProfile,
  createRenderProfile,
  describeRenderProfile,
  type RenderProfile,
} from './RenderProfile'

import {
  detectGPUCapabilities,
  type GPUCapabilities,
} from './GPUCapabilities'

import {
  PerformanceGovernor,
  type GovernorState,
} from './PerformanceGovernor'

/* =========================================================
   TYPES
   ========================================================= */

export type RenderManagerState = {
  capabilities: GPUCapabilities | null
  profile: RenderProfile | null
  governor: GovernorState | null
  initialized: boolean
}

/* =========================================================
   RENDER MANAGER
   ========================================================= */

export class RenderManager {

  private capabilities:
    GPUCapabilities | null = null

  private profile:
    RenderProfile | null = null

  private governor:
    PerformanceGovernor | null = null

  private initialized = false

  private listeners =
    new Set<
      (
        state: RenderManagerState,
      ) => void
    >()

  /* =======================================================
     INITIALIZE
     ======================================================= */

  async initialize(): Promise<RenderManagerState> {

    if (this.initialized) {
      return this.getState()
    }

    const capabilities =
      await detectGPUCapabilities()

    let profile =
      createRenderProfile(
        capabilities,
      )

    profile =
      clampRenderProfile(
        profile,
      )

    this.capabilities =
      capabilities

    this.profile =
      profile

    this.governor =
      new PerformanceGovernor(
        profile,
        {
          onChange: () => {
            this.emit()
          },
        },
      )

    this.initialized = true

    console.info(
      '[ULTRON] Render system initialized',
    )

    console.info(
      `[ULTRON] GPU: ${capabilities.vendor} ${capabilities.device}`,
    )

    console.info(
      `[ULTRON] WebGPU: ${capabilities.webgpu}`,
    )

    console.info(
      `[ULTRON] WebGL2: ${capabilities.webgl2}`,
    )

    console.info(
      `[ULTRON] Tier: ${capabilities.estimatedTier}`,
    )

    console.info(
      `[ULTRON] ${describeRenderProfile(profile)}`,
    )

    this.emit()

    return this.getState()
  }

  /* =======================================================
     FRAME UPDATE
     ======================================================= */

  update(
    deltaSeconds: number,
  ): GovernorState | null {

    if (!this.governor) {
      return null
    }

    const state =
      this.governor.update(
        deltaSeconds,
      )

    return state
  }

  /* =======================================================
     CURRENT STATE
     ======================================================= */

  getState(): RenderManagerState {

    return {
      capabilities:
        this.capabilities,

      profile:
        this.profile,

      governor:
        this.governor
          ? this.governor.getState()
          : null,

      initialized:
        this.initialized,
    }
  }

  /* =======================================================
     CURRENT PROFILE
     ======================================================= */

  getProfile(): RenderProfile | null {
    return this.profile
  }

  /* =======================================================
     CURRENT CAPABILITIES
     ======================================================= */

  getCapabilities():
    GPUCapabilities | null {

    return this.capabilities
  }

  /* =======================================================
     CURRENT GOVERNOR STATE
     ======================================================= */

  getGovernorState():
    GovernorState | null {

    return this.governor
      ? this.governor.getState()
      : null
  }

  /* =======================================================
     ADAPTIVE PROFILE
     ======================================================= */

  getAdaptiveProfile():
    RenderProfile | null {

    if (
      !this.profile ||
      !this.governor
    ) {
      return null
    }

    return this.governor.applyToProfile(
      this.profile,
    )
  }

  /* =======================================================
     SUBSCRIBE
     ======================================================= */

  subscribe(
    listener: (
      state: RenderManagerState,
    ) => void,
  ): () => void {

    this.listeners.add(
      listener,
    )

    /*
     * Return unsubscribe function.
     */
    return () => {
      this.listeners.delete(
        listener,
      )
    }
  }

  /* =======================================================
     RESET PERFORMANCE GOVERNOR
     ======================================================= */

  resetGovernor(): void {

    if (!this.governor) {
      return
    }

    this.governor.reset()

    this.emit()
  }

  /* =======================================================
     EMIT STATE
     ======================================================= */

  private emit(): void {

    const state =
      this.getState()

    this.listeners.forEach(
      (listener) => {

        try {
          listener(state)
        } catch (error) {
          console.error(
            '[ULTRON] RenderManager listener error:',
            error,
          )
        }
      },
    )
  }
}

/* =========================================================
   SINGLETON
   ========================================================= */

export const renderManager =
  new RenderManager()