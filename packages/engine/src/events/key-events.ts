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
    /**
     * Physical key identifier (layout-independent), e.g. `KeyW`, `ArrowUp`,
     * `Space`. Maps directly to `KeyboardEvent.code`.
     */
    public readonly code: string,
    /**
     * 0 on the initial press, `n > 0` for auto-repeat events while the key
     * is held.
     */
    public readonly repeatCount: number,
  ) {
    super()
  }

  public toString(): string {
    return `KeyPressed: ${this.code} (${this.repeatCount} repeats)`
  }
}

/** Emitted when a keyboard key transitions to the released state. */
export class KeyReleasedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.KeyReleased
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryKeyboard

  /**
   * Physical key identifier (layout-independent), e.g. `KeyW`, `ArrowUp`,
   * `Space`. Maps directly to `KeyboardEvent.code`.
   */
  constructor(public readonly code: string) {
    super()
  }

  public toString(): string {
    return `KeyReleased: ${this.code}`
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
   * The character the key produced (post-layout, post-modifier), e.g. `a`,
   * `A`, `1`. Maps directly to `KeyboardEvent.key`. Note: not necessarily the
   * same as a `KeyPressed` `code` for the same physical key once layout and
   * modifiers are applied.
   */
  constructor(public readonly key: string) {
    super()
  }

  public toString(): string {
    return `KeyTyped: ${this.key}`
  }
}
