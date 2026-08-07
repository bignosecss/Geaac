import { useSyncExternalStore } from 'react'

import type { EventInspectorLayer } from '#sandbox/event-inspector-layer'

/**
 * Live inspector over the engine's event stream.
 *
 * Reads its store from the {@link EventInspectorLayer} the host pushed as an
 * overlay — the topmost layer sees every event first without claiming it. Two
 * panels read from the layer through `useSyncExternalStore`, so they re-render
 * only when their snapshot actually changes: the counts panel refreshes every
 * frame (the layer's `onUpdate` advances the frame counter), while the stream
 * panel only re-renders on discrete events.
 */
export function EventInspector({ layer }: { layer: EventInspectorLayer | null }) {
  if (!layer) {
    return <p className="mt-2 text-sm text-slate-500">Waiting for the inspector layer…</p>
  }

  return (
    <section className="mt-2 grid gap-2 lg:grid-cols-2">
      <EventTypePanel layer={layer} />
      <EventStreamPanel layer={layer} />
    </section>
  )
}

/** One row per listenable {@link EventType}: name, running count, latest payload. */
function EventTypePanel({ layer }: { layer: EventInspectorLayer }) {
  const counts = useSyncExternalStore(layer.subscribe, layer.getCountsSnapshot)
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Event types</h2>
        <span className="shrink-0 text-xs text-slate-500">
          {counts.total} events · {counts.frames} frames
        </span>
      </div>
      <ul className="mt-2 space-y-0.5 font-mono text-xs">
        {counts.rows.map((row) => (
          <li
            key={row.type}
            className={`flex gap-2 ${row.count === 0 ? 'opacity-40' : ''}`}
            title={row.latestSummary ?? 'no events yet'}
          >
            <span className="shrink-0 text-slate-700">{row.name}</span>
            <span className="w-10 shrink-0 text-right text-slate-400">{row.count}</span>
            <span className="min-w-0 truncate text-slate-500">{row.latestSummary ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Rolling chronological stream of feed entries, newest first. */
function EventStreamPanel({ layer }: { layer: EventInspectorLayer }) {
  const stream = useSyncExternalStore(layer.subscribe, layer.getStreamSnapshot)
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Stream</h2>
      </div>
      {stream.entries.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">
          No events yet — move the mouse, click, scroll, or press a key.
        </p>
      ) : (
        <ul className="mt-2 max-h-80 space-y-0.5 overflow-y-auto font-mono text-xs">
          {stream.entries.map((entry) => (
            <li key={entry.seq} className="flex gap-2">
              <span className="shrink-0 text-slate-300">#{entry.seq}</span>
              <span className="shrink-0 text-slate-700">{entry.name}</span>
              <span className="min-w-0 truncate text-slate-500">{entry.summary}</span>
              <span className="shrink-0 text-slate-400">
                [{entry.categoryLabels.join(', ')}] +{(entry.at - layer.startedAt).toFixed(0)}ms
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
