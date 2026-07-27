/**
 * Stub for the `server-only` package.
 *
 * That package resolves to a module that throws unless the bundler sets the
 * `react-server` export condition, which Vitest does not — turning on that
 * condition globally would change how React itself resolves and break component
 * tests. Server modules keep the guard for the real build; here it is a no-op.
 */
export {};
