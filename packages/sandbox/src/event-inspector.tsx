import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { Application } from '@geaac/engine'

import { EventFeed } from '#sandbox/event-feed'

/**
 * Live inspector over the application's event bus.
 *
 * Owns a single {@link EventFeed} whose lifecycle tracks the application's:
 * it attaches when the app's bus is available and detaches when the app (or
 * the inspector itself) unmounts. Two panels read from the feed through
 * `useSyncExternalStore`, so they re-render only when their snapshot actually
 * changes — the counts panel picks up the ~60fps AppTick/AppRender every
 * frame, while the stream panel only re-renders on discrete events.
 *
 * StrictMode-safe: the `feedRef` guard plus effect cleanup mean the double
 * mount cycle attaches a fresh feed and detaches the previous one.
 */
export function EventInspector({ application }: { application: Application | null }) {
  const [feed, setFeed] = useState<EventFeed | null>(null)
  const feedRef = useRef<EventFeed | null>(null)

  useEffect(() => {
    if (!application || feedRef.current) return
    const next = new EventFeed(application.events)
    next.attach()
    feedRef.current = next
    setFeed(next)
    return () => {
      next.detach()
      feedRef.current = null
    }
  }, [application])

  if (!application || !feed) {
    return <p className="mt-2 text-sm text-slate-500">Waiting for the application event bus…</p>
  }

  return (
    <section className="mt-2 grid gap-2 lg:grid-cols-2">
      {/* Key each panel by the feed so remounting resets local state. */}
      <EventTypePanel key={feed.startedAt} feed={feed} />
      <EventStreamPanel key={feed.startedAt} feed={feed} />
    </section>
  )
}

/** One row per listenable {@link EventType}: name, running count, latest payload. */
function EventTypePanel({ feed }: { feed: EventFeed }) {
  const counts = useSyncExternalStore(feed.subscribe, feed.getCountsSnapshot)
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Event types</h2>
        <span className="shrink-0 text-xs text-slate-500">{counts.total} events</span>
      </div>
      <ul className="mt-2 space-y-0.5 font-mono text-xs">
        {counts.rows.map((row) => (
          <li
            key={row.type}
            className={`flex gap-2 ${row.count === 0 ? 'opacity-40' : ''}`}
            title={row.latestSummary ?? 'no events since attach'}
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
function EventStreamPanel({ feed }: { feed: EventFeed }) {
  const [includePerFrame, setIncludePerFrame] = useState(feed.includePerFrameEvents)
  const stream = useSyncExternalStore(feed.subscribe, feed.getStreamSnapshot)

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Stream</h2>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={includePerFrame}
            onChange={(e) => {
              feed.setIncludePerFrameEvents(e.target.checked)
              setIncludePerFrame(e.target.checked)
            }}
          />
          Include per-frame events
        </label>
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
                [{entry.categoryLabels.join(', ')}] +{(entry.at - feed.startedAt).toFixed(0)}ms
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
