import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

/**
 * Header value used for non-cacheable API responses.
 *
 * API payloads are user- or session-specific; shared caches (and browsers)
 * must never store them. Sent on every `/api/*` response by this plugin.
 */
export const NO_STORE_CACHE_CONTROL = 'no-store';

/**
 * Header value for content-addressed static files (course content, hashed
 * assets). The filename already changes when the bytes change, so caches may
 * hold the response forever without revalidation.
 */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Helper that returns the immutable Cache-Control value suitable for
 * content/static course files with content hashes.
 */
export function getImmutableCacheControl(): string {
  return IMMUTABLE_CACHE_CONTROL;
}

const API_PATH = /^\/api(\/|$)/;

function pathnameOf(url: string): string {
  const queryIndex = url.indexOf('?');
  const withoutQuery = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const hashIndex = withoutQuery.indexOf('#');
  return hashIndex === -1 ? withoutQuery : withoutQuery.slice(0, hashIndex);
}

/**
 * Fastify plugin that forces `Cache-Control: no-store` on every `/api/*`
 * response. Register it at the root (before/alongside the route plugins):
 *
 *   import cacheHeaders from './cache-headers.js';
 *   await app.register(cacheHeaders);
 *
 * The plugin deliberately skips Fastify's encapsulation (the same mechanism
 * `fastify-plugin` uses, applied inline so @speeko/api needs no extra
 * dependency): the `onSend` hook is installed on the root instance and
 * therefore applies to every `/api/*` route, wherever it is registered.
 * Non-`/api/*` responses (e.g. `/health`) are left untouched.
 */
const cacheHeadersPlugin: FastifyPluginAsync = async function cacheHeaders(
  app: FastifyInstance,
): Promise<void> {
  app.addHook('onSend', async (request, reply, payload) => {
    const path = pathnameOf(request.raw.url ?? request.url);
    if (API_PATH.test(path)) {
      reply.header('Cache-Control', NO_STORE_CACHE_CONTROL);
    }
    return payload;
  });
};

// `fastify-plugin` does exactly this: mark the plugin so Fastify's avvio
// skips creating an encapsulated child context and the hook lands on the
// root instance. Without it, this plugin's hook would apply to nothing.
Object.defineProperty(cacheHeadersPlugin, Symbol.for('skip-override'), {
  value: true,
});

export default cacheHeadersPlugin;
