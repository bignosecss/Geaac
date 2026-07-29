/**
 * Sequential event-type identifiers, modelled on Hazel's `enum class EventType`.
 *
 * Each concrete event class is assigned exactly one of these and exposes it
 * as `event.eventType`. The bus uses these values as map keys, which gives
 * type-safe subscription (typo-proof, autocomplete, single registry).
 */
export const EventType = {
  None: 0,
  WindowResize: 1,
  WindowClose: 2,
  AppTick: 3,
  AppRender: 4,
  KeyPressed: 5,
  KeyReleased: 6,
  KeyTyped: 7,
  MouseMoved: 8,
  MouseScrolled: 9,
  MouseButtonPressed: 10,
  MouseButtonReleased: 11,
} as const

/** Union of every {@link EventType} numeric value. */
export type EventTypeValue = (typeof EventType)[keyof typeof EventType]

/**
 * Typed reverse lookup. TS can't prove `EventType[event.eventType]` is safe
 * when indexing a `const` object by an arbitrary numeric value (the keys are
 * string literals, not numbers), so we keep an explicit name table.
 *
 * `Record<EventTypeValue, string>` makes the compiler verify every member is
 * covered — add a new {@link EventType} member and the build fails until you
 * name it.
 */
const EventTypeName: Record<EventTypeValue, string> = {
  [EventType.None]: 'None',
  [EventType.WindowResize]: 'WindowResize',
  [EventType.WindowClose]: 'WindowClose',
  [EventType.AppTick]: 'AppTick',
  [EventType.AppRender]: 'AppRender',
  [EventType.KeyPressed]: 'KeyPressed',
  [EventType.KeyReleased]: 'KeyReleased',
  [EventType.KeyTyped]: 'KeyTyped',
  [EventType.MouseMoved]: 'MouseMoved',
  [EventType.MouseScrolled]: 'MouseScrolled',
  [EventType.MouseButtonPressed]: 'MouseButtonPressed',
  [EventType.MouseButtonReleased]: 'MouseButtonReleased',
}

/**
 * Resolve an {@link EventTypeValue} back to its string name (e.g. `5` →
 * `'KeyPressed'`). Used by {@link Event.name} for log-friendly output.
 */
export function eventTypeName(type: EventTypeValue): string {
  return EventTypeName[type]
}
