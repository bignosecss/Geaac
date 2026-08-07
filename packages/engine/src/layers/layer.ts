import type { Event } from '#engine/events/event'

/**
 * Frame delta in seconds, derived from consecutive `requestAnimationFrame`
 * timestamps. Passed to {@link Layer.onUpdate} every main-loop tick.
 */
export type TimeStep = number

/**
 * A unit of application behaviour contributed to the engine each frame.
 *
 * The application never knows a concrete subclass — it only drives the four
 * hooks below. This is the plugin seam between engine and game code: push a
 * `Layer` to add behaviour (render the world, move a camera, claim input),
 * pop it to remove the behaviour.
 *
 * The hooks are no-ops by default; override only what a layer needs.
 */
export class Layer {
  /** Human-readable name, used in logs and diagnostics. */
  readonly debugName: string

  constructor(debugName: string) {
    this.debugName = debugName
  }

  /**
   * Called once when the layer is pushed onto the application. Load assets,
   * subscribe resources — the layer's "power on" moment. Invoked by the
   * application's push methods, not by the {@link LayerStack}.
   */
  onAttach(): void {}

  /**
   * Called once when the layer is popped or the application closes. Release
   * whatever {@link onAttach} acquired. Invoked by the {@link LayerStack}
   * (pop / shutdown), asymmetric with {@link onAttach}.
   */
  onDetach(): void {}

  /**
   * Called every frame, bottom-to-top stack order, no short-circuit. Advance
   * game state; a layer may also render here.
   *
   * @param ts  Seconds since the previous frame.
   */
  onUpdate(ts: TimeStep): void {
    void ts // no-op by default; override to advance per-frame state
  }

  /**
   * Called for every engine event, top-to-bottom stack order, stopping as
   * soon as any layer sets `event.handled = true`. Use an
   * {@link EventDispatcher} inside to narrow by concrete type.
   *
   * @param event  The engine event; set `event.handled` to consume it.
   */
  onEvent(event: Event): void {
    void event // no-op by default; override to react to events
  }
}
