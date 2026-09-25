import {
  getUltronEntityState,
} from '../simulation/entitySimulation'

export function getEntityVisualState() {

  const state =
    getUltronEntityState()

  return {
    energy: state.energy,
    activity: state.activity,
    attention: state.attention,
    processing: state.processing,
    urgency: state.urgency,
    networkActivity: state.networkActivity,
    memoryActivity: state.memoryActivity,
    taskActivity: state.taskActivity,
  }
}