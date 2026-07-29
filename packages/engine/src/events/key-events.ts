import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

/**
 * Emitted when a keyboard key transitions to the pressed state. Fires
 * repeatedly while held (see `repeatCount`). For text-input-style handling,
 * use {@link KeyTypedEvent} instead — it fires only for keys that produce a
 * character, after layout and modifiers.
 */
export class KeyPressedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.KeyPressed
  // Keyboard events belong to both Input and Keyboard so subscribers can
  // filter on either granularity.
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryKeyboard

  constructor(
    /** Platform-specific key code (no layout applied). */
    public readonly keyCode: number,
    /**
     * 0 on the initial press, `n > 0` for auto-repeat events while the key
     * is held.
     */
    public readonly repeatCount: number,
  ) {
    super()
  }

  public toString(): string {
    return `KeyPressed: ${this.keyCode} (${this.repeatCount} repeats)`
  }
}

/** Emitted when a keyboard key transitions to the released state. */
export class KeyReleasedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.KeyReleased
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryKeyboard

  /**
   * Platform-specific key code (no layout applied).
   */
  constructor(public readonly keyCode: number) {
    super()
  }

  public toString(): string {
    return `KeyReleased: ${this.keyCode}`
  }
}

// Distinct from KeyPressed: emitted only for keys that produce a character
// (post-layout, post-modifier). Useful for text-input-style handlers that
// don't want raw scan codes.
export class KeyTypedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.KeyTyped
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryKeyboard

  /**
   * Code of the key that produced the typed character. Note: not necessarily
   * the same as a `KeyPressed` keyCode for the same physical key once layout
   * and modifiers are applied.
   */
  constructor(public readonly keyCode: number) {
    super()
  }

  public toString(): string {
    return `KeyTyped: ${this.keyCode}`
  }
}
