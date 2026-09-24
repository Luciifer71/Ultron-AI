import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { renderManager } from './RenderManager'

export default function RenderRuntime() {
  const initialized =
    useRef(false)

  useEffect(() => {
    let active = true

    const initialize = async () => {
      if (initialized.current)
        return

      initialized.current = true

      const state =
        await renderManager.initialize()

      if (!active)
        return

      console.info(
        '[ULTRON] Render profile:',
        state.profile,
      )
    }

    void initialize()

    return () => {
      active = false
    }
  }, [])

  useFrame((_, delta) => {
    renderManager.update(delta)
  })

  return null
}