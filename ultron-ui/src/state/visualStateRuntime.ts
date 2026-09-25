import {
  getUltronVisualProfile,
  type UltronVisualProfile,
} from './visualState'

import type {
  UltronMode,
} from './entityState'

/* =========================================================
   ULTRON VISUAL STATE RUNTIME
   =========================================================

   Converts semantic ULTRON modes into smoothly evolving
   visual values.

   Example:

   IDLE
     RED 0.94
        ↓
   LISTENING
     RED 0.12
     BLUE 0.84

   The entity does NOT instantly switch.
   It transitions continuously.
   ========================================================= */

let currentProfile:
  UltronVisualProfile = {
    ...getUltronVisualProfile('idle'),
  }

/* =========================================================
   SMOOTH APPROACH
   ========================================================= */

function approach(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {

  const amount =
    1 -
    Math.exp(
      -rate * dt,
    )

  return (
    current +
    (
      target -
      current
    ) * amount
  )
}

/* =========================================================
   UPDATE
   ========================================================= */

export function updateUltronVisualState(
  mode: UltronMode,
  dt: number,
): void {

  const target =
    getUltronVisualProfile(
      mode,
    )

  /*
   * Color transition.
   */
  currentProfile.redWeight =
    approach(
      currentProfile.redWeight,
      target.redWeight,
      3.2,
      dt,
    )

  currentProfile.blueWeight =
    approach(
      currentProfile.blueWeight,
      target.blueWeight,
      3.2,
      dt,
    )

  currentProfile.goldWeight =
    approach(
      currentProfile.goldWeight,
      target.goldWeight,
      3.2,
      dt,
    )

  /*
   * Global visual intensity.
   */
  currentProfile.intensity =
    approach(
      currentProfile.intensity,
      target.intensity,
      2.5,
      dt,
    )

  currentProfile.coreGlow =
    approach(
      currentProfile.coreGlow,
      target.coreGlow,
      2.8,
      dt,
    )

  /*
   * Motion.
   */
  currentProfile.motion =
    approach(
      currentProfile.motion,
      target.motion,
      2.4,
      dt,
    )

  currentProfile.turbulence =
    approach(
      currentProfile.turbulence,
      target.turbulence,
      2.2,
      dt,
    )

  /*
   * Information.
   */
  currentProfile.informationDensity =
    approach(
      currentProfile.informationDensity,
      target.informationDensity,
      3.0,
      dt,
    )

  currentProfile.informationSpeed =
    approach(
      currentProfile.informationSpeed,
      target.informationSpeed,
      3.0,
      dt,
    )

  /*
   * Events.
   */
  currentProfile.eventDensity =
    approach(
      currentProfile.eventDensity,
      target.eventDensity,
      2.6,
      dt,
    )

  currentProfile.eventIntensity =
    approach(
      currentProfile.eventIntensity,
      target.eventIntensity,
      2.6,
      dt,
    )
}

/* =========================================================
   READ CURRENT PROFILE
   ========================================================= */

export function getCurrentUltronVisualState():
  UltronVisualProfile {

  return currentProfile
}