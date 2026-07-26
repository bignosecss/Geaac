import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { LogLevel, ConsoleLogger, coreLogger, createLogger } from '#engine/log/index'

import type { Logger } from '#engine/log/index'

function createMockedLogger(name: string, level?: LogLevel): Logger {
  return new ConsoleLogger(name, level)
}

describe('ConsoleLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'trace').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls console.trace for trace-level messages', () => {
    const log = createMockedLogger('Test')
    log.trace('hello')
    expect(console.trace).toHaveBeenCalledWith('[Test]', 'hello')
  })

  it('calls console.debug for debug-level messages', () => {
    const log = createMockedLogger('Test')
    log.debug('hello')
    expect(console.debug).toHaveBeenCalledWith('[Test]', 'hello')
  })

  it('calls console.info for info-level messages', () => {
    const log = createMockedLogger('Test')
    log.info('hello')
    expect(console.info).toHaveBeenCalledWith('[Test]', 'hello')
  })

  it('calls console.warn for warn-level messages', () => {
    const log = createMockedLogger('Test')
    log.warn('hello')
    expect(console.warn).toHaveBeenCalledWith('[Test]', 'hello')
  })

  it('calls console.error for error-level messages', () => {
    const log = createMockedLogger('Test')
    log.error('hello')
    expect(console.error).toHaveBeenCalledWith('[Test]', 'hello')
  })

  it('passes multiple arguments through', () => {
    const log = createMockedLogger('Test')
    log.info('key', 42, { nested: true })
    expect(console.info).toHaveBeenCalledWith('[Test]', 'key', 42, { nested: true })
  })

  it('handles zero arguments', () => {
    const log = createMockedLogger('Test')
    log.info()
    expect(console.info).toHaveBeenCalledWith('[Test]')
  })

  it('suppresses messages below the configured level', () => {
    const log = createMockedLogger('Test', LogLevel.WARN)
    log.trace('trace')
    log.debug('debug')
    log.info('info')
    expect(console.trace).not.toHaveBeenCalled()
    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })

  it('passes messages at or above the configured level', () => {
    const log = createMockedLogger('Test', LogLevel.WARN)
    log.warn('warning')
    log.error('error')
    expect(console.warn).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })

  it('defaults to TRACE level', () => {
    const log = createMockedLogger('Default')
    expect(log.level).toBe(LogLevel.TRACE)
  })

  it('reports its name', () => {
    const log = createMockedLogger('MyLogger')
    expect(log.name).toBe('MyLogger')
  })

  it('reports its level', () => {
    const log = createMockedLogger('Test', LogLevel.ERROR)
    expect(log.level).toBe(LogLevel.ERROR)
  })
})

describe('coreLogger', () => {
  it('is named "Engine"', () => {
    expect(coreLogger.name).toBe('Engine')
  })

  it('defaults to TRACE level', () => {
    expect(coreLogger.level).toBe(LogLevel.TRACE)
  })
})

describe('createLogger', () => {
  it('creates a logger with the given name', () => {
    const log = createLogger('Sandbox')
    expect(log.name).toBe('Sandbox')
  })

  it('defaults to TRACE level when no level is given', () => {
    const log = createLogger('Sandbox')
    expect(log.level).toBe(LogLevel.TRACE)
  })

  it('respects the given level', () => {
    const log = createLogger('Sandbox', LogLevel.ERROR)
    expect(log.level).toBe(LogLevel.ERROR)
  })
})
