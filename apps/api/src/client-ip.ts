import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

/**
 * Client-IP resolution for rate limiting behind the hosting topology.
 *
 * Two paths are supported:
 *
 *   1. **Signed proxy header (Vercel web -> Render API).** Vercel's edge knows
 *      the browser IP, but Render only sees Vercel's egress address. The web
 *      middleware forwards the browser IP in {@link CLIENT_IP_HEADER} together
 *      with a shared secret in {@link PROXY_SECRET_HEADER}. The API honours
 *      that pair only when `API_PROXY_SECRET` is configured and the supplied
 *      secret matches; otherwise both headers are ignored.
 *   2. **Fastify trustProxy (direct clients).** When `TRUST_PROXY_HOPS` is set,
 *      Fastify derives `request.ip` from `X-Forwarded-For` using exactly that
 *      many trusted hops. `TRUST_PROXY_HOPS=0` (the default) ignores the
 *      header and keys on the socket peer.
 *
 * A missing/wrong secret or invalid IP never bypasses the limiter: the caller
 * falls back to the request-derived address.
 */
export const CLIENT_IP_HEADER = 'x-speeko-client-ip';
export const PROXY_SECRET_HEADER = 'x-speeko-proxy-secret';

type HeaderValue = string | string[] | undefined;

function firstHeader(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Canonicalise an address so the same host cannot occupy two rate-limit
 * buckets (`::ffff:1.2.3.4` vs `1.2.3.4`, upper- vs lower-case IPv6).
 * Returns null for anything that is not an IP address.
 */
export function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  let ip = value.trim();
  if (!ip) return null;

  if (ip.startsWith('[')) {
    const end = ip.indexOf(']');
    if (end === -1) return null;
    ip = ip.slice(1, end);
  } else {
    // IPv4 with a port: "203.0.113.9:4711". IPv6 has multiple colons, so this
    // branch cannot accidentally strip an IPv6 segment.
    const colon = ip.indexOf(':');
    if (colon !== -1 && ip.indexOf(':', colon + 1) === -1) {
      const host = ip.slice(0, colon);
      const port = ip.slice(colon + 1);
      if (/^\d{1,5}$/.test(port) && isIP(host) === 4) ip = host;
    }
  }

  if (ip.toLowerCase().startsWith('::ffff:')) {
    const mapped = ip.slice(7);
    if (isIP(mapped) === 4) ip = mapped;
  }

  return isIP(ip) ? ip.toLowerCase() : null;
}

function secretsMatch(supplied: string, expected: string): boolean {
  const left = Buffer.from(supplied, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface ResolveClientIpOptions {
  /** Address Fastify already derived (socket peer or trusted XFF hop). */
  fallbackIp: string;
  headers: Record<string, HeaderValue>;
  /** Configured shared secret; when absent, the signed header is ignored. */
  proxySecret?: string;
}

/** Returns the rate-limit identity for one request. Never returns empty. */
export function resolveClientIp(options: ResolveClientIpOptions): string {
  const fallback = normalizeIp(options.fallbackIp);
  const secret = options.proxySecret;
  if (!secret) return fallback ?? options.fallbackIp;

  const suppliedSecret = firstHeader(options.headers[PROXY_SECRET_HEADER]);
  const forwarded = normalizeIp(firstHeader(options.headers[CLIENT_IP_HEADER]));
  if (suppliedSecret && forwarded && secretsMatch(suppliedSecret, secret)) {
    return forwarded;
  }

  return fallback ?? options.fallbackIp;
}

/**
 * Parse `TRUST_PROXY_HOPS`. Invalid or out-of-range values fail closed to 0
 * (ignore `X-Forwarded-For`) instead of trusting an attacker-controlled chain.
 */
export function parseTrustProxyHops(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 0;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 8) return 0;
  return value;
}
