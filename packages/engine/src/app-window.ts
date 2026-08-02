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
 * Wraps a host-owned `HTMLCanvasElement` and exposes its CSS layout
 * dimensions as live getters. Analogous to Hazel's `WindowsWindow` — the
 * sole platform implementation of the window abstraction.
 *
 * The canvas is always externally injected — the engine never creates DOM
 * elements. The consumer (sandbox) owns DOM placement and passes the element
 * in.
 */
export class AppWindow {
  /** Window title passed at construction. */
  readonly title: string
  /** The host-owned canvas this window wraps. */
  readonly canvas: HTMLCanvasElement

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
