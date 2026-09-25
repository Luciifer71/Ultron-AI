import {
  getUltronEntityState,
} from '../simulation/entitySimulation'

import {
  getCurrentUltronVisualState,
} from './visualStateRuntime'

export function getEntityVisualState() {

  const state =
    getUltronEntityState()

  const visual =
    getCurrentUltronVisualState()

  return {

    /* =====================================================
       ENTITY STATE
       ===================================================== */

    energy:
      state.energy,

    activity:
      state.activity,

    attention:
      state.attention,

    processing:
      state.processing,

    urgency:
      state.urgency,

    networkActivity:
      state.networkActivity,

    memoryActivity:
      state.memoryActivity,

    taskActivity:
      state.taskActivity,

    /* =====================================================
       VISUAL STATE
       ===================================================== */

    redWeight:
      visual.redWeight,

    blueWeight:
      visual.blueWeight,

    goldWeight:
      visual.goldWeight,

    intensity:
      visual.intensity,

    coreGlow:
      visual.coreGlow,

    motion:
      visual.motion,

    turbulence:
      visual.turbulence,

    informationDensity:
      visual.informationDensity,

    informationSpeed:
      visual.informationSpeed,

    eventDensity:
      visual.eventDensity,

    eventIntensity:
      visual.eventIntensity,
  }
}