import { sv } from './sv'

/**
 * Hook för att hämta svenska UI-texter
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const copy = useCopy()
 *   
 *   return (
 *     <button>{copy.actions.save}</button>
 *   )
 * }
 * ```
 * 
 * @returns Objekt med svenska UI-texter organiserade i kategorier
 */
export function useCopy() {
  return sv
}

export default useCopy
