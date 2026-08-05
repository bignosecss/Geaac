import { EventCategory, EventType, eventTypeName } from '@geaac/engine'
import type { Event, EventBus, EventCategoryValue, EventTypeValue } from '@geaac/engine'

/**
 * One normalized record in the event feed: everything a live inspector needs
 * to render a single published engine event. Built from the engine's own
 * `Event` shape (`name`, `toString`) so the feed stays generic — a future
 * event type needs no sandbox changes.
 */
export type FeedEntry = {
  /**
   * Global monotonic sequence number. Counts every event, including per-frame
   * events filtered out of the stream — so sequence numbers visibly jump
   * between streamed entries, a built-in "something was filtered" signal.
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

/** Per-type tally — one row in the {@link EventTypePanel}. */
export type TypeStat = {
  readonly type: EventTypeValue
  readonly name: string
  readonly count: number
  /** Payload of the most recent event of this type, or `null` before the first. */
  readonly latestSummary: string | null
}

/** Immutable snapshot of the per-type tallies. Rebuilt on every event. */
export type CountsSnapshot = {
  readonly rows: readonly TypeStat[]
  readonly total: number
}

/** Immutable snapshot of the rolling stream, newest first. */
export type StreamSnapshot = {
  readonly entries: readonly FeedEntry[]
}

export type EventFeedOptions = {
  /** Max stream entries before the oldest is dropped. Default `100`. */
  streamCapacity?: number
  /**
   * Whether per-frame events (AppTick/AppRender) are appended to the stream.
   * They are always counted regardless; this only gates stream appends.
   * Default `false` — at ~60fps they would otherwise rotate the buffer in
   * about 1.5s and evict every discrete input event.
   */
  includePerFrameEvents?: boolean
}

const DEFAULT_STREAM_CAPACITY = 100

// Per-frame events are published once per rAF, so they never make it into the
// stream unless the user opts in (see EventFeedOptions.includePerFrameEvents).
const PER_FRAME_EVENT_TYPES: ReadonlySet<EventTypeValue> = new Set([
  EventType.AppTick,
  EventType.AppRender,
])

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
 * Passive observer over an engine {@link EventBus} that turns every published
 * event into a renderable {@link FeedEntry}.
 *
 * Attaches once to the bus and subscribes to every type in the engine's
 * {@link EventType} registry (minus `None`), so the feed is data-driven: a new
 * event type is picked up automatically with no sandbox changes.
 *
 * Designed as an external store for React's `useSyncExternalStore`:
 * `subscribe` + `getCountsSnapshot` / `getStreamSnapshot` are arrow properties
 * so their identities stay stable across renders, and each snapshot is a
 * cached immutable reference that only changes inside the emit path (never
 * before listeners are notified). React sees a stable reference between
 * events and skips re-rendering.
 *
 * The feed is an observer, never a consumer: it does not set `event.handled`
 * (which would short-circuit the bus) and it never throws.
 */
export class EventFeed {
  /** `performance.now()` at construction; baseline for elapsed display. */
  readonly startedAt: number

  private readonly bus: EventBus
  private readonly streamCapacity: number
  private readonly listeners = new Set<() => void>()
  private readonly stats = new Map<EventTypeValue, TypeStat>()

  private rows: readonly TypeStat[] = []
  private entries: readonly FeedEntry[] = []
  private countsVersion: CountsSnapshot
  private streamVersion: StreamSnapshot
  private disposers: ReadonlyArray<() => void> = []
  private attached = false
  private total = 0
  private seq = 0
  private includePerFrame: boolean

  constructor(bus: EventBus, options?: EventFeedOptions) {
    this.bus = bus
    this.startedAt = performance.now()
    this.streamCapacity = options?.streamCapacity ?? DEFAULT_STREAM_CAPACITY
    this.includePerFrame = options?.includePerFrameEvents ?? false
    // One row per listenable type, seeded in engine enum order. `Object.values`
    // of an integer-keyed const object is ascending numeric order, so the panel
    // rows group Window/App/Key/Mouse without any sort logic.
    this.rows = Object.values(EventType)
      .filter((type) => type !== EventType.None)
      .map((type) => ({ type, name: eventTypeName(type), count: 0, latestSummary: null }))
    this.countsVersion = { rows: this.rows, total: 0 }
    this.streamVersion = { entries: this.entries }
  }

  /** Whether per-frame events are currently being streamed. */
  get includePerFrameEvents(): boolean {
    return this.includePerFrame
  }

  /**
   * Start observing: subscribe one handler to every {@link EventTypeValue}.
   * Idempotent — attaching while already attached detaches the previous
   * subscriptions first, mirroring `AppWindow.attach`.
   */
  attach(): void {
    if (this.attached) {
      this.detach()
    }
    this.attached = true
    for (const type of Object.values(EventType)) {
      if (type === EventType.None) continue
      this.disposers = [...this.disposers, this.bus.on(type, this.handleEvent)]
    }
  }

  /**
   * Stop observing: remove every subscription. Idempotent and safe when never
   * attached. Tallies are kept, so re-attaching continues where it left off.
   */
  detach(): void {
    for (const dispose of this.disposers) dispose()
    this.disposers = []
    this.attached = false
  }

  /** Toggle per-frame events in the stream. Affects only future appends. */
  setIncludePerFrameEvents(value: boolean): void {
    this.includePerFrame = value
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

  private handleEvent = (event: Event): void => {
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
    this.countsVersion = { rows: this.rows, total: this.total }

    if (this.includePerFrame || !PER_FRAME_EVENT_TYPES.has(type)) {
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
    }

    // Notify only after replacing the snapshots, so a listener (React) never
    // reads a stale snapshot on the same emit.
    for (const listener of this.listeners) listener()
  }
}
