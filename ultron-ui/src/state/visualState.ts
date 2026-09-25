import type { UltronMode } from './entityState'

/* =========================================================
   ULTRON VISUAL STATE
   =========================================================

   These values describe HOW ULTRON should visually behave.

   They are semantic rather than renderer-specific.

   RED   = ULTRON / computation
   BLUE  = listening / information
   GOLD  = execution / high-value activity

   The geometry and simulation remain chaotic and organic.
   Visual intensity is controlled separately so we can reduce
   clutter without removing the underlying simulation.

   ========================================================= */

export interface UltronVisualProfile {

  /* -------------------------------------------------------
     COLOR COMPOSITION
     ------------------------------------------------------- */

  redWeight: number
  blueWeight: number
  goldWeight: number

  /* -------------------------------------------------------
     GLOBAL VISUAL ENERGY
     ------------------------------------------------------- */

  intensity: number
  coreGlow: number

  /* -------------------------------------------------------
     ENTITY MOTION
     ------------------------------------------------------- */

  motion: number
  turbulence: number

  /* -------------------------------------------------------
     INFORMATION ACTIVITY
     ------------------------------------------------------- */

  informationDensity: number
  informationSpeed: number

  /* -------------------------------------------------------
     EVENT ACTIVITY
     ------------------------------------------------------- */

  eventDensity: number
  eventIntensity: number
}

/* =========================================================
   VISUAL PROFILES
   ========================================================= */

const PROFILES:
  Record<
    UltronMode,
    UltronVisualProfile
  > = {

  /* -------------------------------------------------------
     OFFLINE
     ------------------------------------------------------- */

  offline: {
    redWeight: 0.0,
    blueWeight: 0.0,
    goldWeight: 0.0,

    intensity: 0.0,
    coreGlow: 0.0,

    motion: 0.0,
    turbulence: 0.0,

    informationDensity: 0.0,
    informationSpeed: 0.0,

    eventDensity: 0.0,
    eventIntensity: 0.0,
  },

  /* -------------------------------------------------------
     STARTING
     ------------------------------------------------------- */

  starting: {
    redWeight: 0.76,
    blueWeight: 0.08,
    goldWeight: 0.16,

    intensity: 0.62,
    coreGlow: 0.70,

    motion: 0.40,
    turbulence: 0.30,

    informationDensity: 0.15,
    informationSpeed: 0.25,

    eventDensity: 0.10,
    eventIntensity: 0.20,
  },

  /* -------------------------------------------------------
     IDLE
     -------------------------------------------------------

     ULTRON's default identity.

     Deep red dominates.
     Motion remains calm but alive.
     */

  idle: {
    redWeight: 0.94,
    blueWeight: 0.05,
    goldWeight: 0.01,

    intensity: 0.58,
    coreGlow: 0.68,

    motion: 0.25,
    turbulence: 0.18,

    informationDensity: 0.08,
    informationSpeed: 0.12,

    eventDensity: 0.035,
    eventIntensity: 0.06,
  },

  /* -------------------------------------------------------
     LISTENING
     -------------------------------------------------------

     BLUE becomes dominant because ULTRON is actively
     receiving information.

     Red still exists underneath so the entity never loses
     its core identity.
     */

  listening: {
    redWeight: 0.08,
    blueWeight: 0.88,
    goldWeight: 0.04,

    intensity: 0.64,
    coreGlow: 0.74,

    motion: 0.38,
    turbulence: 0.22,

    informationDensity: 0.68,
    informationSpeed: 0.58,

    eventDensity: 0.06,
    eventIntensity: 0.10,
  },

  /* -------------------------------------------------------
     THINKING
     -------------------------------------------------------

     Red + blue interference.

     This should feel like active cognition rather than
     a simple color change.

     The reduced intensity prevents the mixture from
     becoming excessively white or pink.
     */

  thinking: {
    redWeight: 0.43,
    blueWeight: 0.50,
    goldWeight: 0.07,

    intensity: 0.70,
    coreGlow: 0.82,

    motion: 0.72,
    turbulence: 0.66,

    informationDensity: 0.82,
    informationSpeed: 0.82,

    eventDensity: 0.14,
    eventIntensity: 0.24,
  },

  /* -------------------------------------------------------
     EXECUTING
     -------------------------------------------------------

     GOLD dominates.

     Execution should feel powerful and intense, but retain
     a rich molten-gold appearance rather than clipping
     toward pure white.
     */

  executing: {
    redWeight: 0.08,
    blueWeight: 0.12,
    goldWeight: 0.80,

    intensity: 0.78,
    coreGlow: 0.92,

    motion: 0.92,
    turbulence: 0.88,

    informationDensity: 0.92,
    informationSpeed: 0.96,

    eventDensity: 0.42,
    eventIntensity: 0.62,
  },

  /* -------------------------------------------------------
     ALERT
     -------------------------------------------------------

     Aggressive red returns with controlled gold warning
     energy.

     High motion remains intact.
     */

  alert: {
    redWeight: 0.80,
    blueWeight: 0.03,
    goldWeight: 0.17,

    intensity: 0.84,
    coreGlow: 0.98,

    motion: 0.96,
    turbulence: 1.00,

    informationDensity: 0.74,
    informationSpeed: 0.88,

    eventDensity: 0.68,
    eventIntensity: 0.82,
  },

  /* -------------------------------------------------------
     FOCUS
     -------------------------------------------------------

     Concentrated red + blue cognitive state.

     Less intense than the previous profile so the
     computational structure remains readable.
     */

  focus: {
    redWeight: 0.55,
    blueWeight: 0.41,
    goldWeight: 0.04,

    intensity: 0.76,
    coreGlow: 0.88,

    motion: 0.64,
    turbulence: 0.48,

    informationDensity: 0.74,
    informationSpeed: 0.72,

    eventDensity: 0.14,
    eventIntensity: 0.20,
  },

  /* -------------------------------------------------------
     SLEEP
     ------------------------------------------------------- */

  sleep: {
    redWeight: 0.22,
    blueWeight: 0.01,
    goldWeight: 0.0,

    intensity: 0.12,
    coreGlow: 0.16,

    motion: 0.04,
    turbulence: 0.02,

    informationDensity: 0.01,
    informationSpeed: 0.01,

    eventDensity: 0.0,
    eventIntensity: 0.0,
  },
}

/* =========================================================
   ACCESSOR
   ========================================================= */

export function getUltronVisualProfile(
  mode: UltronMode,
): UltronVisualProfile {

  return PROFILES[mode]
}