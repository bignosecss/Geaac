import { describe, expect, it } from 'vitest'

import {
  AppRenderEvent,
  AppTickEvent,
  EventBus,
  EventType,
  KeyPressedEvent,
  MouseMovedEvent,
} from '@geaac/engine'

import { EventFeed } from '#sandbox/event-feed'

describe('EventFeed', () => {
  it('lists every listenable type with None excluded', () => {
    const feed = new EventFeed(new EventBus())
    feed.attach()
    const { rows, total } = feed.getCountsSnapshot()
    expect(rows).toHaveLength(11)
    expect(rows.some((row) => row.type === EventType.None)).toBe(false)
    // A fresh feed has seen no events: every row sits at zero.
    const keyTyped = rows.find((row) => row.type === EventType.KeyTyped)
    expect(keyTyped?.count).toBe(0)
    expect(keyTyped?.latestSummary).toBeNull()
    expect(total).toBe(0)
  })

  it('accumulates per-type counts and keeps the latest summary', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    bus.publish(new MouseMovedEvent(10, 10))
    bus.publish(new MouseMovedEvent(20, 30))
    const row = feed.getCountsSnapshot().rows.find((r) => r.type === EventType.MouseMoved)
    expect(row?.count).toBe(2)
    expect(row?.latestSummary).toBe('MouseMoved: 20, 30')
    expect(feed.getCountsSnapshot().total).toBe(2)
  })

  it('counts per-frame events but keeps them out of the stream by default', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    bus.publish(new AppTickEvent())
    bus.publish(new MouseMovedEvent(1, 2))
    const tickRow = feed.getCountsSnapshot().rows.find((r) => r.type === EventType.AppTick)
    expect(tickRow?.count).toBe(1)
    const entries = feed.getStreamSnapshot().entries
    expect(entries).toHaveLength(1)
    expect(entries[0]?.type).toBe(EventType.MouseMoved)
  })

  it('streams per-frame events once opted in, and only future ones', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    bus.publish(new AppTickEvent()) // excluded
    feed.setIncludePerFrameEvents(true)
    bus.publish(new AppTickEvent()) // included
    expect(feed.getStreamSnapshot().entries.map((e) => e.type)).toEqual([EventType.AppTick])
    feed.setIncludePerFrameEvents(false)
    bus.publish(new AppRenderEvent()) // excluded again, still counted
    expect(feed.getStreamSnapshot().entries.map((e) => e.type)).toEqual([EventType.AppTick])
    const renderRow = feed.getCountsSnapshot().rows.find((r) => r.type === EventType.AppRender)
    expect(renderRow?.count).toBe(1)
  })

  it('caps the stream and keeps the newest entries', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus, { streamCapacity: 5 })
    feed.attach()
    for (let i = 0; i < 10; i++) bus.publish(new MouseMovedEvent(i, 0))
    const entries = feed.getStreamSnapshot().entries
    expect(entries).toHaveLength(5)
    expect(entries[0]?.seq).toBe(10)
    expect(entries[4]?.seq).toBe(6)
  })

  it('increments seq across filtered and streamed events', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    bus.publish(new AppTickEvent()) // seq 1, filtered out of the stream
    bus.publish(new MouseMovedEvent(0, 0)) // seq 2, streamed
    const entries = feed.getStreamSnapshot().entries
    expect(entries[0]?.seq).toBe(2)
    expect(feed.getCountsSnapshot().total).toBe(2)
  })

  it('labels categories from the event flags', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    bus.publish(new KeyPressedEvent('KeyW', 0))
    const entry = feed.getStreamSnapshot().entries[0]
    expect(entry?.categoryLabels).toEqual(['Input', 'Keyboard'])
  })

  it('stops receiving events after detach', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    feed.detach()
    bus.publish(new MouseMovedEvent(0, 0))
    expect(feed.getCountsSnapshot().total).toBe(0)
  })

  it('notifies subscribers and honors the returned disposer', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    let calls = 0
    const unsubscribe = feed.subscribe(() => {
      calls += 1
    })
    bus.publish(new MouseMovedEvent(0, 0))
    expect(calls).toBe(1)
    unsubscribe()
    bus.publish(new MouseMovedEvent(1, 1))
    expect(calls).toBe(1)
  })

  it('keeps snapshot references stable between emits', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    const streamA = feed.getStreamSnapshot()
    const countsA = feed.getCountsSnapshot()
    bus.publish(new AppTickEvent()) // filtered → stream snapshot unchanged
    expect(feed.getStreamSnapshot()).toBe(streamA)
    bus.publish(new MouseMovedEvent(0, 0)) // streamed → both snapshots change
    expect(feed.getStreamSnapshot()).not.toBe(streamA)
    expect(feed.getCountsSnapshot()).not.toBe(countsA)
  })

  it('attach is idempotent (re-attach first detaches)', () => {
    const bus = new EventBus()
    const feed = new EventFeed(bus)
    feed.attach()
    feed.attach()
    bus.publish(new MouseMovedEvent(0, 0))
    expect(feed.getCountsSnapshot().total).toBe(1)
  })
})
