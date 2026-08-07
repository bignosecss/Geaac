import { EventCategory, EventType, Layer, eventTypeName } from '@geaac/engine'
import type { Event, EventCategoryValue, EventTypeValue } from '@geaac/engine'

/**
 * One normalized record in the inspector: everything a live panel needs to
 * render a single engine event. Built from the engine's own `Event` shape
 * (`name`, `toString`) so the layer stays generic — a future event type needs
 * no sandbox changes.
 */
export type FeedEntry = {
  /**
   * Global monotonic sequence number. Counts every event the layer receives,
   * so sequence numbers track the full event stream.
   */
  readonly seq: number
  /** The event's {@link EventTypeValue}; also the React key for the entry. */
  readonly type: EventTypeValue
  /** Human-readable type name, e.g. `'KeyPressed'`. */
  readonly name: string
  /** `event.toString()`, e.g. `'KeyPressed: KeyW (0 repeats)'`. */
  readonly summary: string
  /** Names of the category bits the event belongs to, e.g. `['Input', 'Keyboard']`. */
  readonly categoryLabels: readonly string[]
  /** `performance.now()` at receipt, for elapsed display. */
  readonly at: number
}

/** Per-type tally — one row in the event-type panel. */
export type TypeStat = {
  readonly type: EventTypeValue
  readonly name: string
  readonly count: number
  /** Payload of the most recent event of this type, or `null` before the first. */
  readonly latestSummary: string | null
}

/** Immutable snapshot of the per-type tallies plus the frame counter. */
export type CountsSnapshot = {
  readonly rows: readonly TypeStat[]
  readonly total: number
  /** Number of main-loop ticks seen by {@link EventInspectorLayer.onUpdate}. */
  readonly frames: number
}

/** Immutable snapshot of the rolling stream, newest first. */
export type StreamSnapshot = {
  readonly entries: readonly FeedEntry[]
}

export type EventInspectorOptions = {
  /** Max stream entries before the oldest is dropped. Default `100`. */
  streamCapacity?: number
}

const DEFAULT_STREAM_CAPACITY = 100

// Bit → short label. Order here is the order category chips appear in.
const CATEGORY_LABELS: ReadonlyArray<readonly [EventCategoryValue, string]> = [
  [EventCategory.EventCategoryApplication, 'Application'],
  [EventCategory.EventCategoryInput, 'Input'],
  [EventCategory.EventCategoryKeyboard, 'Keyboard'],
  [EventCategory.EventCategoryMouse, 'Mouse'],
  [EventCategory.EventCategoryMouseButton, 'MouseButton'],
]

function categoryLabels(event: Event): readonly string[] {
  const labels: string[] = []
  for (const [bit, label] of CATEGORY_LABELS) {
    if (event.isInCategory(bit)) labels.push(label)
  }
  return labels
}

/**
 * Debug overlay that turns every engine event into a renderable
 * {@link FeedEntry}. The sandbox pushes it as an overlay, so it is the
 * topmost layer and receives every event first in traversal B.
 *
 * This is the Hazel pattern for debug UI: an observer layer that never claims.
 * `onEvent` records and notifies but never sets `event.handled`, so game
 * layers below still see every event.
 *
 * Per-frame UI heartbeat lives in `onUpdate` (the frame counter), replacing
 * the retired per-frame AppTick/AppRender bus events.
 *
 * Designed as an external store for React's `useSyncExternalStore`:
 * `subscribe` + `getCountsSnapshot` / `getStreamSnapshot` are arrow properties
 * so their identities stay stable across renders, and each snapshot is a
 * cached immutable reference that only changes inside the emit path (never
 * before listeners are notified). React sees a stable reference between
 * events and skips re-rendering.
 */
export class EventInspectorLayer extends Layer {
  /** `performance.now()` at construction; baseline for elapsed display. */
  readonly startedAt: number

  private readonly streamCapacity: number
  private readonly listeners = new Set<() => void>()
  private readonly stats = new Map<EventTypeValue, TypeStat>()

  private rows: readonly TypeStat[] = []
  private entries: readonly FeedEntry[] = []
  private countsVersion: CountsSnapshot
  private streamVersion: StreamSnapshot
  private total = 0
  private frames = 0
  private seq = 0

  constructor(options?: EventInspectorOptions) {
    super('EventInspector')
    this.startedAt = performance.now()
    this.streamCapacity = options?.streamCapacity ?? DEFAULT_STREAM_CAPACITY
    // One row per listenable type, seeded in engine enum order. `Object.values`
    // of an integer-keyed const object is ascending numeric order, so the panel
    // rows group Window/App/Key/Mouse without any sort logic.
    this.rows = Object.values(EventType)
      .filter((type) => type !== EventType.None)
      .map((type) => ({ type, name: eventTypeName(type), count: 0, latestSummary: null }))
    this.countsVersion = { rows: this.rows, total: 0, frames: 0 }
    this.streamVersion = { entries: this.entries }
  }

  /**
   * Record an event (observer, never a consumer — does not set
   * `event.handled`) and notify listeners.
   */
  override onEvent(event: Event): void {
    this.total += 1
    this.seq += 1
    const type = event.eventType
    const summary = event.toString()
    const previous = this.stats.get(type)
    const updated: TypeStat = {
      type,
      name: event.name,
      count: (previous?.count ?? 0) + 1,
      latestSummary: summary,
    }
    this.stats.set(type, updated)
    this.rows = this.rows.map((row) => (row.type === type ? updated : row))
    this.countsVersion = { rows: this.rows, total: this.total, frames: this.frames }

    const entry: FeedEntry = {
      seq: this.seq,
      type,
      name: event.name,
      summary,
      categoryLabels: categoryLabels(event),
      at: performance.now(),
    }
    // Rebuild, newest first, capped. Immutability keeps the previous snapshot
    // reference valid forever, which is what makes getSnapshot stable.
    this.entries = [entry, ...this.entries].slice(0, this.streamCapacity)
    this.streamVersion = { entries: this.entries }

    this.notify()
  }

  /**
   * Advance the frame counter so the counts panel stays live every tick.
   * Overriding `onUpdate` rather than waiting for events keeps the inspector
   * responsive even between discrete inputs.
   */
  override onUpdate(): void {
    this.frames += 1
    this.countsVersion = { rows: this.rows, total: this.total, frames: this.frames }
    this.notify()
  }

  /** Store subscription for `useSyncExternalStore`. Stable identity (arrow property). */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Cached {@link CountsSnapshot}. Arrow property: `this` bound, identity stable. */
  getCountsSnapshot = (): CountsSnapshot => this.countsVersion

  /** Cached {@link StreamSnapshot}. Arrow property: `this` bound, identity stable. */
  getStreamSnapshot = (): StreamSnapshot => this.streamVersion

  private notify(): void {
    // Notify only after replacing the snapshots, so a listener (React) never
    // reads a stale snapshot on the same emit.
    for (const listener of this.listeners) listener()
  }
}
