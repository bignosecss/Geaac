import { EventDispatcher, KeyTypedEvent, Layer, coreLogger } from '@geaac/engine'
import type { Event } from '@geaac/engine'

/**
 * Sandbox demo layer that makes the two-pass model visible in the console.
 *
 * Pushed below the {@link EventInspectorLayer} overlay, so the inspector still
 * observes every event first (it is the topmost layer). This layer then
 * demonstrates traversal B's truncation: it claims every {@link KeyTypedEvent}
 * with `handled = true`, so any layer below it would never see character keys.
 */
export class ExampleLayer extends Layer {
  private frames = 0

  constructor() {
    super('ExampleLayer')
  }

  override onAttach(): void {
    coreLogger.info('[ExampleLayer] attached')
  }

  override onDetach(): void {
    coreLogger.info(`[ExampleLayer] detached after ${this.frames} frames`)
  }

  override onUpdate(): void {
    this.frames++
  }

  override onEvent(event: Event): void {
    new EventDispatcher(event).dispatch(KeyTypedEvent, (typed) => {
      coreLogger.info(`[ExampleLayer] consumed key typed: '${typed.key}'`)
      return true // handled → traversal B stops, layers below never see it
    })
  }
}
