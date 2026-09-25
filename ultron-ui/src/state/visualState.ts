import type { UltronMode } from './entityState'

/* =========================================================
   ULTRON VISUAL STATE
   =========================================================

   These values describe HOW ULTRON should visually behave.

   They are semantic rather than renderer-specific.

   RED   = ULTRON / computation
   BLUE  = listening / information
   GOLD  = execution / high-value activity

   Other visual systems consume these values later.
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
    redWeight: 0.72,
    blueWeight: 0.08,
    goldWeight: 0.20,

    intensity: 0.78,
    coreGlow: 0.82,

    motion: 0.40,
    turbulence: 0.30,

    informationDensity: 0.15,
    informationSpeed: 0.25,

    eventDensity: 0.12,
    eventIntensity: 0.25,
  },

  /* -------------------------------------------------------
     IDLE
     -------------------------------------------------------

     ULTRON's default identity.

     RED DOMINATES.
     */

  idle: {
    redWeight: 0.94,
    blueWeight: 0.05,
    goldWeight: 0.01,

    intensity: 0.72,
    coreGlow: 0.82,

    motion: 0.25,
    turbulence: 0.18,

    informationDensity: 0.08,
    informationSpeed: 0.12,

    eventDensity: 0.04,
    eventIntensity: 0.08,
  },

  /* -------------------------------------------------------
     LISTENING
     -------------------------------------------------------

     BLUE becomes dominant because ULTRON is receiving
     information from the user.
     */

  listening: {
    redWeight: 0.12,
    blueWeight: 0.84,
    goldWeight: 0.04,

    intensity: 0.82,
    coreGlow: 0.90,

    motion: 0.38,
    turbulence: 0.22,

    informationDensity: 0.68,
    informationSpeed: 0.58,

    eventDensity: 0.08,
    eventIntensity: 0.12,
  },

  /* -------------------------------------------------------
     THINKING
     -------------------------------------------------------

     Red + blue interference.

     This should visually feel like ULTRON is working
     through a problem rather than simply changing color.
     */

  thinking: {
    redWeight: 0.43,
    blueWeight: 0.49,
    goldWeight: 0.08,

    intensity: 0.94,
    coreGlow: 1.00,

    motion: 0.72,
    turbulence: 0.66,

    informationDensity: 0.82,
    informationSpeed: 0.82,

    eventDensity: 0.18,
    eventIntensity: 0.30,
  },

  /* -------------------------------------------------------
     EXECUTING
     -------------------------------------------------------

     GOLD dominates.

     This represents heavy active execution.
     */

  executing: {
    redWeight: 0.10,
    blueWeight: 0.16,
    goldWeight: 0.74,

    intensity: 1.00,
    coreGlow: 1.15,

    motion: 0.92,
    turbulence: 0.88,

    informationDensity: 0.92,
    informationSpeed: 0.96,

    eventDensity: 0.52,
    eventIntensity: 0.78,
  },

  /* -------------------------------------------------------
     ALERT
     -------------------------------------------------------

     Red returns aggressively, with gold warning energy.
     */

  alert: {
    redWeight: 0.78,
    blueWeight: 0.03,
    goldWeight: 0.19,

    intensity: 1.12,
    coreGlow: 1.25,

    motion: 0.96,
    turbulence: 1.00,

    informationDensity: 0.74,
    informationSpeed: 0.88,

    eventDensity: 0.82,
    eventIntensity: 1.00,
  },

  /* -------------------------------------------------------
     FOCUS
     -------------------------------------------------------

     Concentrated red + blue cognitive state.
     */

  focus: {
    redWeight: 0.55,
    blueWeight: 0.41,
    goldWeight: 0.04,

    intensity: 0.98,
    coreGlow: 1.08,

    motion: 0.64,
    turbulence: 0.48,

    informationDensity: 0.74,
    informationSpeed: 0.72,

    eventDensity: 0.16,
    eventIntensity: 0.24,
  },

  /* -------------------------------------------------------
     SLEEP
     ------------------------------------------------------- */

  sleep: {
    redWeight: 0.22,
    blueWeight: 0.01,
    goldWeight: 0.0,

    intensity: 0.16,
    coreGlow: 0.20,

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