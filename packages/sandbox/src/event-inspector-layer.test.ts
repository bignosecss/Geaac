import { describe, expect, it } from 'vitest'

import { AppTickEvent, EventType, KeyPressedEvent, Layer, MouseMovedEvent } from '@geaac/engine'

import { EventInspectorLayer } from '#sandbox/event-inspector-layer'

describe('EventInspectorLayer', () => {
  it('is an engine Layer with a stable debug name', () => {
    const layer = new EventInspectorLayer()
    expect(layer).toBeInstanceOf(Layer)
    expect(layer.debugName).toBe('EventInspector')
  })

  it('lists every listenable type with None excluded', () => {
    const layer = new EventInspectorLayer()
    const { rows, total, frames } = layer.getCountsSnapshot()
    expect(rows).toHaveLength(11)
    expect(rows.some((row) => row.type === EventType.None)).toBe(false)
    // A fresh layer has seen no events: every row sits at zero.
    const keyTyped = rows.find((row) => row.type === EventType.KeyTyped)
    expect(keyTyped?.count).toBe(0)
    expect(keyTyped?.latestSummary).toBeNull()
    expect(total).toBe(0)
    expect(frames).toBe(0)
  })

  it('accumulates per-type counts and keeps the latest summary', () => {
    const layer = new EventInspectorLayer()
    layer.onEvent(new MouseMovedEvent(10, 10))
    layer.onEvent(new MouseMovedEvent(20, 30))
    const row = layer.getCountsSnapshot().rows.find((r) => r.type === EventType.MouseMoved)
    expect(row?.count).toBe(2)
    expect(row?.latestSummary).toBe('MouseMoved: 20, 30')
    expect(layer.getCountsSnapshot().total).toBe(2)
  })

  it('records every event into the stream, newest first', () => {
    const layer = new EventInspectorLayer()
    layer.onEvent(new AppTickEvent())
    layer.onEvent(new MouseMovedEvent(1, 2))
    const entries = layer.getStreamSnapshot().entries
    expect(entries.map((e) => e.type)).toEqual([EventType.MouseMoved, EventType.AppTick])
    expect(layer.getCountsSnapshot().total).toBe(2)
  })

  it('caps the stream and keeps the newest entries', () => {
    const layer = new EventInspectorLayer({ streamCapacity: 5 })
    for (let i = 0; i < 10; i++) layer.onEvent(new MouseMovedEvent(i, 0))
    const entries = layer.getStreamSnapshot().entries
    expect(entries).toHaveLength(5)
    expect(entries[0]?.seq).toBe(10)
    expect(entries[4]?.seq).toBe(6)
  })

  it('increments seq across every event', () => {
    const layer = new EventInspectorLayer()
    layer.onEvent(new AppTickEvent()) // seq 1
    layer.onEvent(new MouseMovedEvent(0, 0)) // seq 2
    const entries = layer.getStreamSnapshot().entries
    expect(entries[0]?.seq).toBe(2)
    expect(layer.getCountsSnapshot().total).toBe(2)
  })

  it('labels categories from the event flags', () => {
    const layer = new EventInspectorLayer()
    layer.onEvent(new KeyPressedEvent('KeyW', 0))
    const entry = layer.getStreamSnapshot().entries[0]
    expect(entry?.categoryLabels).toEqual(['Input', 'Keyboard'])
  })

  it('never claims events — it is an observer', () => {
    const layer = new EventInspectorLayer()
    const event = new KeyPressedEvent('KeyW', 0)
    layer.onEvent(event)
    expect(event.handled).toBe(false)
  })

  it('notifies subscribers and honors the returned disposer', () => {
    const layer = new EventInspectorLayer()
    let calls = 0
    const unsubscribe = layer.subscribe(() => {
      calls += 1
    })
    layer.onEvent(new MouseMovedEvent(0, 0))
    expect(calls).toBe(1)
    unsubscribe()
    layer.onEvent(new MouseMovedEvent(1, 1))
    expect(calls).toBe(1)
  })

  it('keeps snapshot references stable while nothing is emitted', () => {
    const layer = new EventInspectorLayer()
    expect(layer.getStreamSnapshot()).toBe(layer.getStreamSnapshot())
    expect(layer.getCountsSnapshot()).toBe(layer.getCountsSnapshot())
  })

  it('rebuilds snapshots on the next event', () => {
    const layer = new EventInspectorLayer()
    const streamA = layer.getStreamSnapshot()
    const countsA = layer.getCountsSnapshot()
    layer.onEvent(new MouseMovedEvent(0, 0))
    expect(layer.getStreamSnapshot()).not.toBe(streamA)
    expect(layer.getCountsSnapshot()).not.toBe(countsA)
  })

  it('advances the frame counter and notifies on every onUpdate', () => {
    const layer = new EventInspectorLayer()
    let calls = 0
    layer.subscribe(() => {
      calls += 1
    })
    layer.onUpdate()
    layer.onUpdate()
    expect(layer.getCountsSnapshot().frames).toBe(2)
    expect(calls).toBe(2)
  })
})
