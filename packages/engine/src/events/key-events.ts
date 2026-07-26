import {
  EventCategoryInput,
  EventCategoryKeyboard,
  type EventCategoryBits,
} from '#engine/events/category'
import { Event } from '#engine/events/event'

export class KeyPressedEvent extends Event {
  public readonly type = 'KeyPressed'
  // Keyboard events belong to both Input and Keyboard so subscribers can
  // filter on either granularity.
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryKeyboard

  constructor(
    public readonly keyCode: number,
    public readonly repeatCount: number,
  ) {
    super()
  }

  public toString(): string {
    return `KeyPressed: ${this.keyCode} (${this.repeatCount} repeats)`
  }
}

export class KeyReleasedEvent extends Event {
  public readonly type = 'KeyReleased'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryKeyboard

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
  public readonly type = 'KeyTyped'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryKeyboard

  constructor(public readonly keyCode: number) {
    super()
  }

  public toString(): string {
    return `KeyTyped: ${this.keyCode}`
  }
}

