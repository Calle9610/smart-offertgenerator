import { useState, useCallback, useRef } from 'react'
import { useCopy } from '@/copy/useCopy'

export type PromiseState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error'
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
}

export type PromiseStateActions<T> = {
  execute: (promise: Promise<T>) => Promise<T>
  reset: () => void
  setData: (data: T) => void
  setError: (error: Error) => void
}

export function usePromiseState<T>(initialData: T | null = null): PromiseState<T> & PromiseStateActions<T> {
  const [state, setState] = useState<PromiseState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (promise: Promise<T>): Promise<T> => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      status: 'loading',
      isLoading: true,
      isSuccess: false,
      isError: false,
      isIdle: false,
      error: null
    }))

    try {
      const result = await promise
      
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        const copy = useCopy()
        throw new Error(copy.errors.requestCancelled)
      }

      setState(prev => ({
        ...prev,
        status: 'success',
        data: result,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false
      }))

      return result
    } catch (error) {
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        const copy = useCopy()
        throw new Error(copy.errors.requestCancelled)
      }

      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorObj,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false
      }))

      throw errorObj
    }
  }, [])

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setState(prev => ({
      ...prev,
      status: 'idle',
      data: initialData,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true
    }))
  }, [initialData])

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      status: 'success',
      data,
      isLoading: false,
      isSuccess: true,
      isError: false,
      isIdle: false,
      error: null
    }))
  }, [])

  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      isLoading: false,
      isSuccess: false,
      isError: true,
      isIdle: false
    }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError
  }
}

// Convenience hook for simple data fetching
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  _dependencies: unknown[] = []
): PromiseState<T> & PromiseStateActions<T> & { refetch: () => void } {
  const state = usePromiseState<T>()
  
  const refetch = useCallback(() => {
    state.execute(fetchFn())
  }, [fetchFn, state])

  return {
    ...state,
    refetch
  }
}
