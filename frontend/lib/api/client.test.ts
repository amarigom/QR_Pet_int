import { describe, expect, it } from 'vitest'
import { getApiAssetUrl, getApiOrigin } from './client'

describe('getApiAssetUrl', () => {
  it('resolves static paths against the backend origin', () => {
    expect(getApiAssetUrl('/static/brands/clinic.webp')).toBe(
      `${getApiOrigin()}/static/brands/clinic.webp`,
    )
  })

  it('preserves absolute asset URLs', () => {
    expect(getApiAssetUrl('https://cdn.example.test/clinic.webp')).toBe(
      'https://cdn.example.test/clinic.webp',
    )
  })
})
