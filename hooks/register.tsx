import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { scene } from './scene.js'

const busy = atom({ plugin: 'rain-watcher', key: 'busy' } as const, false)

const IDLE: string = scene(false)
const WORKING: string = scene(true)

// Sets the look and reports, in the status line, when no attached app draws it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setLook($: any, where: string) {
  try {
    const set = await $.theme.set({
      backdrop: { scene: 'rain-watcher', glass: { blur: 8, tint: '#0b0f17', opacity: 0.5 } },
      overrideColorScheme: 'dark',
    })
    $.ui.status(set.isDrawn ? undefined : `rain-watcher not drawn (${where}): ${set.reason}`)
  } catch (error) {
    $.ui.log(String(error))
    $.ui.status(`rain-watcher error: ${String(error)}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await setLook($, 'start')
    return next(e)
  })

  // A phone or desktop app that attaches later gets the look set again.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    await setLook($, e.surface)
    return result
  })

  on('turn.start', async ($, e, next) => {
    await update($, busy, () => true)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await update($, busy, () => false)
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const working = await read($, busy)
    return <Svg source={working ? WORKING : IDLE} alt="Misty pine forest in the rain, with lightning while Claude works" />
  })
}
