import type { Event } from '#engine/events/event'
import { WindowResizeEvent } from '#engine/events/application-events'
import { KeyPressedEvent, KeyReleasedEvent } from '#engine/events/key-events'
import { MouseMovedEvent, MouseScrolledEvent } from '#engine/events/mouse-events'
import {
  MouseButtonPressedEvent,
  MouseButtonReleasedEvent,
} from '#engine/events/mouse-button-events'
import { coreLogger } from '#engine/log/index'

/**
 * Construction-time inputs for {@link AppWindow}.
 *
 * Only `title` is required — the engine never manages canvas sizing. Canvas
 * dimensions are owned by the host (sandbox), which controls CSS layout and
 * resize behaviour. {@link AppWindow.width} and {@link AppWindow.height} are
 * live getters that read the canvas element's current layout size on every
 * access, so the engine always sees the host's truth without caching stale
 * values or fighting CSS.
 *
 * Analogous to Hazel's `WindowProps` struct, except Hazel creates its own
 * native window (via GLFW) and therefore owns the size. In the browser the DOM
 * is the source of truth for layout; the engine respects that split.
 */
export type AppWindowConfig = {
  /** Window title, available for display and diagnostics. */
  readonly title: string
}

/**
 * Receives engine {@link Event} instances produced by an {@link AppWindow}.
 *
 * The window translates native DOM events into engine events and hands them to
 * this sink; it never knows who consumes them. Analogous to Hazel's
 * `EventCallback` — {@link Application} wires its {@link EventBus} publish
 * into this sink via {@link AppWindow.attach}.
 */
export type EventSink = (event: Event) => void

/**
 * Wraps a host-owned `HTMLCanvasElement` and exposes its CSS layout
 * dimensions as live getters. Analogous to Hazel's `WindowsWindow` — the
 * sole platform implementation of the window abstraction.
 *
 * The canvas is always externally injected — the engine never creates DOM
 * elements. The consumer (sandbox) owns DOM placement and passes the element
 * in.
 *
 * After construction the window is passive: it becomes the DOM→Event bridge
 * only once {@link AppWindow.attach} is called, and stops being one after
 * {@link AppWindow.detach}. {@link Application} owns that lifecycle.
 */
export class AppWindow {
  /** Window title passed at construction. */
  readonly title: string
  /** The host-owned canvas this window wraps. */
  readonly canvas: HTMLCanvasElement
  /** The active event sink, or `null` while the window is detached. */
  private sink: EventSink | null = null
  /** Observes canvas layout changes to produce {@link WindowResizeEvent}. */
  private resizeObserver: ResizeObserver | null = null

  constructor(config: AppWindowConfig, canvas: HTMLCanvasElement) {
    this.title = config.title
    this.canvas = canvas
    coreLogger.info(`Created window: ${this.title} (${this.width}x${this.height})`)
  }

  /** Live canvas width in CSS pixels (reads `clientWidth` on each access). */
  get width(): number {
    return this.canvas.clientWidth
  }

  /** Live canvas height in CSS pixels (reads `clientHeight` on each access). */
  get height(): number {
    return this.canvas.clientHeight
  }

  /**
   * Start producing engine events: register DOM listeners on the host window
   * and canvas, then translate every native event into the matching engine
   * {@link Event} and forward it to `sink`.
   *
   * Idempotent: calling `attach` while already attached detaches the previous
   * sink (and its listeners) first, then re-attaches. Teardown is
   * {@link AppWindow.detach}; the two mirror each other exactly.
   */
  attach(sink: EventSink): void {
    if (this.sink !== null) {
      coreLogger.warn('AppWindow is already attached; detaching previous sink')
      this.detach()
    }
    this.sink = sink
    // Make the canvas focusable: a canvas is not focusable by default, and
    // keyboard events only reach the focused element. Focusability is engine
    // input infrastructure; the host decides *when* to focus it.
    this.canvas.tabIndex = 0
    // Keyboard attaches to the canvas, not `window`: the canvas is the game
    // boundary (the analog of GLFW's window). While another page element is
    // focused, its keys never leak into the game; once the canvas is focused,
    // the game owns the keyboard.
    this.canvas.addEventListener('keydown', this.handleKeyDown)
    this.canvas.addEventListener('keyup', this.handleKeyUp)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('wheel', this.handleWheel)
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.sink?.(new WindowResizeEvent(width, height))
      }
    })
    this.resizeObserver.observe(this.canvas)
  }

  /**
   * Stop producing engine events: remove every DOM listener and disconnect the
   * resize observer. Safe to call repeatedly and when never attached.
   */
  detach(): void {
    if (this.sink === null) return
    this.canvas.removeEventListener('keydown', this.handleKeyDown)
    this.canvas.removeEventListener('keyup', this.handleKeyUp)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.sink = null
  }

  // Bound handlers: arrow-function properties so add/removeEventListener always
  // reference the same function identity.

  private handleKeyDown = (e: KeyboardEvent): void => {
    // `code` is the physical key (layout-independent); DOM reports repeat as a
    // boolean flag while the event wants a count.
    this.sink?.(new KeyPressedEvent(e.code, e.repeat ? 1 : 0))
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.sink?.(new KeyReleasedEvent(e.code))
  }

  private handleMouseMove = (e: MouseEvent): void => {
    // DOM coordinates are viewport-relative; the event wants canvas-relative.
    const rect = this.canvas.getBoundingClientRect()
    this.sink?.(new MouseMovedEvent(e.clientX - rect.left, e.clientY - rect.top))
  }

  private handleWheel = (e: WheelEvent): void => {
    this.sink?.(new MouseScrolledEvent(e.deltaX, e.deltaY))
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.sink?.(new MouseButtonPressedEvent(e.button))
  }

  private handleMouseUp = (e: MouseEvent): void => {
    this.sink?.(new MouseButtonReleasedEvent(e.button))
  }
}

const DEFAULT_TITLE = 'Geaac'

/**
 * Create an {@link AppWindow} with sensible defaults. The `canvas` parameter
 * is always required — the engine never creates its own drawing surface.
 *
 * Defaults (when omitted):
 * - `title` → `'Geaac'`
 *
 * Canvas dimensions are **not** configurable here. The host controls sizing
 * via CSS; {@link AppWindow.width} and {@link AppWindow.height} read the
 * live layout values from the canvas element on every access.
 */
export function createAppWindow(
  canvas: HTMLCanvasElement,
  config?: Partial<AppWindowConfig>,
): AppWindow {
  return new AppWindow(
    {
      title: config?.title ?? DEFAULT_TITLE,
    },
    canvas,
  )
}
