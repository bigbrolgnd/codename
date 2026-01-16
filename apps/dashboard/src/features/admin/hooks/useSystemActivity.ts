/**
 * useSystemActivity Hook
 *
 * Convenience re-export of the useSystemActivity hook from SystemActivityContext.
 * Provides a clean import path for components that need to access activity state.
 *
 * @example
 * ```tsx
 * import { useSystemActivity } from '@/features/admin/hooks/useSystemActivity';
 *
 * function MyComponent() {
 *   const { state, setActivity } = useSystemActivity();
 *   // ...
 * }
 * ```
 */

export { useSystemActivity, SystemActivityProvider, SystemActivityContext, type ActivityLevel, type SystemActivityState, type SystemActivityContextValue } from '../components/SystemActivityContext';
