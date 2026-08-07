import type { AppWindow } from '#engine/app-window'
import { WindowCloseEvent } from '#engine/events/application-events'
import type { Layer } from '#engine/layers/layer'
import { LayerStack } from '#engine/layers/layer-stack'
import { coreLogger } from '#engine/log/index'

/**
 * Construction-time inputs for {@link Application}.
 */
export type ApplicationConfig = {
  /** Human-readable name, used as the logger scope and in diagnostics. */
  readonly name: string
  /**
   * The engine window this application renders into. The engine never
   * queries the DOM to discover a canvas on its own — the consumer creates
   * the {@link AppWindow} and passes it in.
   */
  readonly window: AppWindow
}

/**
 * Top-level engine host. Owns the {@link LayerStack} and the main loop.
 *
 * Events are single-channel: the window's DOM listeners are routed straight
 * into {@link LayerStack.onEvent} (top-to-bottom, first claimer wins). Each
 * frame the main loop drives {@link LayerStack.onUpdate} with the frame's
 * delta time. Created via {@link createApplication} or directly with a
 * config.
 */
export class Application {
  /** Human-readable name passed at construction. */
  readonly name: string
  /** The engine window this application renders into. */
  readonly window: AppWindow
  private readonly layerStack = new LayerStack()
  private running = false
  private rAFId: number | null = null
  private lastFrameTime = 0

  constructor(config: ApplicationConfig) {
    this.name = config.name
    this.window = config.window
    this.window.attach((event) => this.layerStack.onEvent(event))
    coreLogger.info(`Created application: ${this.name}`)
  }

  /**
   * Add a layer below all overlays. The application calls {@link Layer.onAttach}
   * after insertion — not the {@link LayerStack}, which stays a pure data
   * structure.
   *
   * @param layer  The layer to insert.
   */
  pushLayer(layer: Layer): void {
    this.layerStack.pushLayer(layer)
    layer.onAttach()
  }

  /**
   * Pin a layer to the very top, above every layer and overlay. The
   * application calls {@link Layer.onAttach} after insertion. Overlays are for
   * cross-cutting UI (menus, debug panels).
   *
   * @param layer  The overlay to pin.
   */
  pushOverlay(layer: Layer): void {
    this.layerStack.pushOverlay(layer)
    layer.onAttach()
  }

  /**
   * Remove a layer from the layer region. The {@link LayerStack} calls
   * {@link Layer.onDetach} — asymmetric with {@link pushLayer}, where the
   * application calls {@link Layer.onAttach}. No-op if the layer is absent.
   *
   * @param layer  The layer to remove.
   */
  popLayer(layer: Layer): void {
    this.layerStack.popLayer(layer)
  }

  /**
   * Remove an overlay from the top region. The {@link LayerStack} calls
   * {@link Layer.onDetach}. No-op if the overlay is absent.
   *
   * @param layer  The overlay to remove.
   */
  popOverlay(layer: Layer): void {
    this.layerStack.popOverlay(layer)
  }

  /**
   * Start the main loop. Idempotent: calling `run` while already running logs
   * a warning and returns without side effects.
   */
  run(): void {
    if (this.running) {
      coreLogger.warn('Application is already running')
      return
    }
    this.running = true
    this.lastFrameTime = 0
    coreLogger.info('Main loop started')
    this.rAFId = requestAnimationFrame((time) => this.tick(time))
  }

  /**
   * Stop the main loop, tear down the layers, and detach the window bridge.
   *
   * Layers get a {@link WindowCloseEvent} first (top-to-bottom, so they can
   * save state), then each layer's {@link Layer.onDetach}. Safe to call when
   * the application is not running. After `close`, `run` may be called again
   * to restart the loop, but previously pushed layers are gone and must be
   * re-pushed.
   */
  close(): void {
    this.layerStack.onEvent(new WindowCloseEvent())
    this.layerStack.shutdown()
    this.window.detach()
    if (this.rAFId !== null) {
      cancelAnimationFrame(this.rAFId)
      this.rAFId = null
    }
    this.running = false
    coreLogger.info('Application closed')
  }

  private tick(time: number): void {
    const ts = this.lastFrameTime === 0 ? 0 : (time - this.lastFrameTime) / 1000
    this.lastFrameTime = time
    this.layerStack.onUpdate(ts)
    this.rAFId = requestAnimationFrame((time) => this.tick(time))
  }
}

/**
 * Convenience factory for {@link Application}. Equivalent to
 * `new Application(config)`; preferred at composition sites to keep the
 * `new` keyword out of consumer code.
 */
export function createApplication(config: ApplicationConfig): Application {
  return new Application(config)
}
