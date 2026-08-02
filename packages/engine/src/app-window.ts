/**
 * Construction-time inputs for {@link AppWindow}.
 * Analogous to Hazel's `WindowProps` struct.
 */
export type AppWindowConfig = {
  /** Window title, available for display and diagnostics. */
  readonly title: string
  /** Initial client-area width in CSS pixels. */
  readonly width: number
  /** Initial client-area height in CSS pixels. */
  readonly height: number
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
const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720

/**
 * Create an {@link AppWindow} with sensible defaults. The `canvas` parameter
 * is always required — the engine never creates its own drawing surface.
 *
 * Defaults (when omitted):
 * - `title`  → `'Geaac'`
 * - `width`  → `1280`
 * - `height` → `720`
 */
export function createAppWindow(
  canvas: HTMLCanvasElement,
  config?: Partial<AppWindowConfig>,
): AppWindow {
  return new AppWindow(
    {
      title: config?.title ?? DEFAULT_TITLE,
      width: config?.width ?? DEFAULT_WIDTH,
      height: config?.height ?? DEFAULT_HEIGHT,
    },
    canvas,
  )
}
