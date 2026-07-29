/**
 * Bit-flag event categories, modelled on Hazel's `enum class EventCategory`.
 *
 * Each member is a single bit so a single integer can express membership in
 * multiple groups at once (e.g. a mouse-button event belongs to Input, Mouse,
 * and MouseButton simultaneously). Subscribers filter with {@link isInCategory}
 * or {@link Event.isInCategory}.
 *
 * Usage:
 * ```ts
 * EventCategory.EventCategoryApplication
 * EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse
 * ```
 */
export const EventCategory = {
  None: 0,
  EventCategoryApplication: 1 << 0,
  EventCategoryInput: 1 << 1,
  EventCategoryKeyboard: 1 << 2,
  EventCategoryMouse: 1 << 3,
  EventCategoryMouseButton: 1 << 4,
} as const

/** Union of every {@link EventCategory} bit value. */
export type EventCategoryValue = (typeof EventCategory)[keyof typeof EventCategory]

/**
 * `true` if any bit set in `category` is also set in `flags` (i.e. they
 * share at least one category). Use this to test category membership without
 * caring about exact equality.
 */
export function isInCategory(flags: EventCategoryValue, category: EventCategoryValue): boolean {
  return (flags & category) !== 0
}
