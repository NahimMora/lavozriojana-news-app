import 'react';

declare module 'react' {
  /**
   * Per-request memoization for Server Components. Exported by the React
   * build Next.js 14 uses (next/dist/compiled/react); @types/react 18 only
   * types it under react/canary.
   */
  export function cache<CachedFunction extends (...args: never[]) => unknown>(fn: CachedFunction): CachedFunction;
}
