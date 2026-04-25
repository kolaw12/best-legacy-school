/**
 * Lightweight Sentry initialiser.
 *
 * Activates ONLY when `VITE_SENTRY_DSN` is set in the environment AND the
 * @sentry/react package is installed. In dev / when no DSN is configured
 * this is a complete no-op — no requests, no console noise, no resolution
 * of the optional package by Vite.
 *
 * To turn on in production:
 *   1. `npm install @sentry/react`
 *   2. set VITE_SENTRY_DSN=https://<key>@o<id>.ingest.sentry.io/<project>
 *      and VITE_SENTRY_ENV=production
 *
 * NB: the specifier is built from a variable on purpose — Vite's static
 * dependency scanner won't see the literal `@sentry/react` and so won't
 * fail the build when the package isn't installed.
 */
export async function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return; // dev / opted-out — silent no-op

    // Construct the specifier piecewise so Vite's static analyser ignores it.
    const pkg = ['@sentry', 'react'].join('/');

    try {
        const Sentry = await import(/* @vite-ignore */ pkg);
        Sentry.init({
            dsn,
            environment: import.meta.env.VITE_SENTRY_ENV || 'production',
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0.5,
        });
        // eslint-disable-next-line no-console
        console.info('[sentry] initialised');
    } catch {
        // Package not installed or load failed — fail soft.
        // eslint-disable-next-line no-console
        console.warn('[sentry] DSN set but @sentry/react not loadable; skipping.');
    }
}
