import { useEffect, useRef } from 'react'

import type { Event, EventBus, EventTypeValue } from '@geaac/engine'

/**
 * Subscribe a React component to a single engine event type.
 *
 * Wraps `EventBus.on` (which returns an unsubscribe disposer) so the
 * subscription lives as long as the component and is torn down on unmount.
 * The handler is stored in a ref, so changing it never re-subscribes — the
 * subscription only re-binds when the bus or event type changes.
 *
 * Pass `null` for `events` when the application (and its bus) does not exist
 * yet; the hook subscribes as soon as a bus is supplied.
 *
 * @param events  The event bus to subscribe to, or `null` while unavailable.
 * @param type    The exact {@link EventTypeValue} to listen for.
 * @param handler Called synchronously for each matching event; any state it
 *                updates causes the component to re-render.
 */
export function useEvent<E extends Event>(
  events: EventBus | null,
  type: EventTypeValue,
  handler: (event: E) => void,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (events === null) return
    return events.on<E>(type, (event) => handlerRef.current(event))
  }, [events, type])
}
