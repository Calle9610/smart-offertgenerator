/**
 * Tests för apiClient
 * 
 * Testar:
 * - CSRF token management
 * - Automatisk refresh-retry
 * - Error handling
 * - Request/response wrapper
 * 
 * How to run:
 * npm test -- apiClient.test.ts
 */

import { get, post, put, del, csrf, ApiError } from '../apiClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset CSRF token before each test
    csrf.invalidate()
  })

  describe('CSRF Management', () => {
    it('should fetch and cache CSRF token', async () => {
      const mockToken = 'test-csrf-token'
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: mockToken })
      })

      const token = await csrf.get()
      expect(token).toBe(mockToken)
      expect(fetch).toHaveBeenCalledWith('/api/csrf-token', {
        credentials: 'include'
      })
    })

    it('should return cached token on subsequent calls', async () => {
      const mockToken = 'test-csrf-token'
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: mockToken })
      })

      // First call - fetches token
      await csrf.get()
      // Second call - uses cached token
      const token = await csrf.get()
      
      expect(token).toBe(mockToken)
      expect(fetch).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should handle CSRF token fetch failure', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(csrf.get()).rejects.toThrow('Network error')
    })
  })

  describe('GET requests', () => {
    it('should make GET request with credentials and CSRF', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData)
      })

      // Mock CSRF token
      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await get('/api/test')
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-token'
        },
        credentials: 'include'
      })
    })

    it('should handle GET request error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      await expect(get('/api/test')).rejects.toThrow('Request failed with status 404')
    })
  })

  describe('POST requests', () => {
    it('should make POST request with body and CSRF', async () => {
      const mockData = { success: true }
      const postData = { name: 'Test' }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData)
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await post('/api/test', postData)
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-token'
        },
        credentials: 'include',
        body: JSON.stringify(postData)
      })
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request with body and CSRF', async () => {
      const mockData = { success: true }
      const putData = { id: 1, name: 'Updated' }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData)
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await put('/api/test/1', putData)
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-token'
        },
        credentials: 'include',
        body: JSON.stringify(putData)
      })
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request with CSRF', async () => {
      const mockData = { success: true }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData)
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await del('/api/test/1')
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-token'
        },
        credentials: 'include'
      })
    })
  })

  describe('Authentication refresh', () => {
    it('should retry request after successful auth refresh', async () => {
      const mockData = { success: true }
      
      // First call returns 401, second call succeeds
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(mockData)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(mockData)
        })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await get('/api/protected')
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledTimes(3) // Original + refresh + retry
    })

    it('should not retry if auth refresh fails', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      await expect(get('/api/protected')).rejects.toThrow('Request failed with status 401')
      expect(fetch).toHaveBeenCalledTimes(2) // Original + failed refresh
    })
  })

  describe('Error handling', () => {
    it('should wrap network errors in ApiError', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError('fetch is not defined'))

      await expect(get('/api/test')).rejects.toThrow('Network error - check your connection')
    })

    it('should handle non-JSON responses', async () => {
      const mockText = 'Plain text response'
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockText)
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await get('/api/test')
      expect(result).toBe(mockText)
    })
  })

  describe('Utility functions', () => {
    it('should handle file uploads', async () => {
      const mockData = { success: true }
      const formData = new FormData()
      formData.append('file', new Blob(['test']))
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData)
      })

      jest.spyOn(csrf, 'get').mockResolvedValue('test-token')

      const result = await import('../apiClient').then(m => m.upload('/api/upload', formData))
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'test-token'
        },
        credentials: 'include',
        body: formData
      })
    })
  })
})
