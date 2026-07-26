import type { Event } from '#engine/events/event'

// EventDispatcher wraps a single already-constructed event and lets a
// handler try to process it for a specific concrete type. Mirrors
// Hazel's `template <typename T> EventDispatcher::Dispatch`.
//
// Usage:
//   const dispatcher = new EventDispatcher(event)
//   dispatcher.dispatch(KeyPressedEvent, (e) => {
//     // ... handle
//     return true  // => marks event.handled
//   })
export class EventDispatcher<E extends Event> {
  constructor(private readonly event: E) {}

  // `ctor` is the concrete event class to match (e.g. `KeyPressedEvent`).
  // `handler` is invoked only when the wrapped event is an instance of `ctor`
  // and may return `true` to mark the event as handled.
  public dispatch<T extends Event>(
    ctor: new (...args: never[]) => T,
    handler: (e: T) => boolean,
  ): boolean {
    if (this.event instanceof ctor) {
      const handled = handler(this.event as unknown as T)
      if (handled) {
        this.event.handled = true
      }
      return true
    }
    return false
  }
}
