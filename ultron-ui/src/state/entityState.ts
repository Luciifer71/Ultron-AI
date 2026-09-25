/* =========================================================
   ULTRON ENTITY STATE
   Central semantic state for the living ULTRON entity.
   All values are normalized to 0.0 - 1.0 where applicable.
   ========================================================= */

export type UltronMode =
  | 'offline'
  | 'starting'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'alert'
  | 'focus'
  | 'sleep'

export interface UltronEntityState {

  /* -------------------------------------------------------
     PRIMARY STATE
     ------------------------------------------------------- */

  mode: UltronMode

  energy: number
  activity: number
  attention: number
  processing: number

  /* -------------------------------------------------------
     COMPUTATIONAL STATE
     ------------------------------------------------------- */

  stability: number
  urgency: number
  interaction: number

  /* -------------------------------------------------------
     SYSTEM ACTIVITY
     ------------------------------------------------------- */

  memoryActivity: number
  networkActivity: number
  taskActivity: number

  /* -------------------------------------------------------
     SIMULATION
     ------------------------------------------------------- */

  simulationTime: number
}

/* =========================================================
   DEFAULT ENTITY STATE
   ========================================================= */

export const DEFAULT_ULTRON_ENTITY_STATE: UltronEntityState = {

  mode: 'idle',

  energy: 0.55,
  activity: 0.20,
  attention: 0.35,
  processing: 0.10,

  stability: 0.90,
  urgency: 0.05,
  interaction: 0.0,

  memoryActivity: 0.10,
  networkActivity: 0.05,
  taskActivity: 0.0,

  simulationTime: 0,
}