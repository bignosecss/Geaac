import type { Event } from '#engine/events/event'
import type { Layer, TimeStep } from '#engine/layers/layer'

/**
 * Ordered list of {@link Layer}s with a partition index separating plain
 * layers from overlays.
 *
 * The stack is purely a data structure — it never decides behaviour. Order in
 * the vector is everything: an earlier layer is "lower" (updated first, sees
 * events last), a later one is "higher". Overlays sit past the partition line
 * and are therefore always the highest.
 *
 * Every frame the application drives two passes in opposite directions:
 * {@link onUpdate} bottom-to-top for everyone, {@link onEvent} top-to-bottom
 * stopping at the first claimer.
 */
export class LayerStack {
  private readonly layers: Layer[] = []
  private insertIndex = 0

  /**
   * Insert a layer at the partition line and advance it. Later pushes land
   * above earlier ones. Does NOT call {@link Layer.onAttach} — the application
   * does, keeping the stack purely mechanical.
   *
   * @param layer  The layer to insert below all overlays.
   */
  public pushLayer(layer: Layer): void {
    this.layers.splice(this.insertIndex, 0, layer)
    this.insertIndex++
  }

  /**
   * Append a layer to the very end, above every existing layer and overlay.
   * Overlays are for cross-cutting UI (menus, debug panels) no game layer
   * should cover. Does NOT call {@link Layer.onAttach}.
   *
   * @param layer  The layer to pin to the top.
   */
  public pushOverlay(layer: Layer): void {
    this.layers.push(layer)
  }

  /**
   * Remove a layer from the layer region (below the partition line). Calls
   * {@link Layer.onDetach} — detach is the stack's job, asymmetric with
   * attach. No-op when the layer is absent from the layer region.
   *
   * @param layer  The layer to remove.
   */
  public popLayer(layer: Layer): void {
    const index = this.layers.findIndex((candidate) => candidate === layer)
    if (index === -1 || index >= this.insertIndex) return
    layer.onDetach()
    this.layers.splice(index, 1)
    this.insertIndex--
  }

  /**
   * Remove a layer from the overlay region (at/above the partition line).
   * Calls {@link Layer.onDetach}. No-op when the layer is absent there.
   *
   * @param layer  The overlay to remove.
   */
  public popOverlay(layer: Layer): void {
    const index = this.layers.findIndex((candidate) => candidate === layer)
    if (index === -1 || index < this.insertIndex) return
    layer.onDetach()
    this.layers.splice(index, 1)
  }

  /**
   * Pass 1, every frame: update all layers bottom-to-top. No short-circuit —
   * every layer contributes to this frame. Like a band where every player
   * plays every bar.
   *
   * @param ts  Seconds since the previous frame.
   */
  public onUpdate(ts: TimeStep): void {
    for (const layer of this.layers) layer.onUpdate(ts)
  }

  /**
   * Pass 2, per event: offer it to layers top-to-bottom, stopping as soon as
   * one sets `event.handled`. The first claimer wins; layers below never see
   * the event. Like a pen pressed onto the top sheet of a stack of
   * transparencies.
   *
   * @param event  The event to dispatch.
   */
  public onEvent(event: Event): void {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (event.handled) return
      this.layers[i]!.onEvent(event)
    }
  }

  /**
   * Tear down every layer with {@link Layer.onDetach}, then clear the stack.
   * Called from `Application.close`. Mirrors Hazel's `LayerStack` destructor.
   */
  public shutdown(): void {
    for (const layer of this.layers) layer.onDetach()
    this.layers.length = 0
    this.insertIndex = 0
  }
}
