import { describe, expect, it } from 'vitest'

import { createApplication } from '@geaac/engine'

describe('createApplication', () => {
  it('creates an application from client configuration', () => {
    const application = createApplication({
      name: 'Test Application',
    })

    expect(application).toEqual({
      name: 'Test Application',
    })
  })
})
