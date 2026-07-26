// Bit-flag event categories. Mirrors Hazel's `enum class EventCategory`,
// using individual bits so a single integer can express membership in
// multiple categories at once (e.g. mouse-button events belong to both
// Input and Mouse and MouseButton).

export type EventCategoryBits = number

export const EventCategoryNone = 0
export const EventCategoryApplication = 1 << 0
export const EventCategoryInput = 1 << 1
export const EventCategoryKeyboard = 1 << 2
export const EventCategoryMouse = 1 << 3
export const EventCategoryMouseButton = 1 << 4

export function isInCategory(flags: EventCategoryBits, category: EventCategoryBits): boolean {
  return (flags & category) !== 0
}

