// Bit-flag event categories, modelled on Hazel's `enum class EventCategory`.
// Each member is a single bit so a single integer can express membership in
// multiple groups at once (e.g. a mouse-button event belongs to Input, Mouse,
// and MouseButton simultaneously). Subscribers filter with `isInCategory`.
//
// Usage: `EventCategory.EventCategoryApplication`,
// `EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse`.
export const EventCategory = {
  None: 0,
  EventCategoryApplication: 1 << 0,
  EventCategoryInput: 1 << 1,
  EventCategoryKeyboard: 1 << 2,
  EventCategoryMouse: 1 << 3,
  EventCategoryMouseButton: 1 << 4,
} as const

export type EventCategoryValue = (typeof EventCategory)[keyof typeof EventCategory]

export function isInCategory(
  flags: EventCategoryValue,
  category: EventCategoryValue,
): boolean {
  return (flags & category) !== 0
}

