import { NextResponse, type NextRequest } from 'next/server';

/**
 * Same-origin API proxy for the free Vercel + Render stack.
 *
 * Why middleware instead of a `rewrites()` entry: the API rate limiter needs
 * the browser's address, but a plain rewrite makes Render see Vercel's egress
 * address. This middleware reads the client IP that Vercel's edge resolved
 * (`x-forwarded-for`; Vercel overwrites it to prevent spoofing), then forwards
 * it to the API as `x-speeko-client-ip` together with the shared
 * `x-speeko-proxy-secret`. The API honours that pair only when the secret
 * matches its own `API_PROXY_SECRET`.
 *
 * Both variables are read from the server environment when the middleware
 * runs. Set them in the Vercel project (Production) before deploying; a
 * self-hosted `next start` needs them in its process environment too. With
 * `API_PROXY_TARGET` unset (local dev, CI e2e) the middleware is inert and the
 * browser calls `NEXT_PUBLIC_API_URL` directly.
 *
 * Bodies are buffered: every Speeko API request is small JSON, and buffering
 * avoids Edge streaming/duplex incompatibilities. Hop-by-hop and inbound
 * `x-speeko-*` headers are stripped so a browser can never supply the secret.
 */

const TARGET = process.env.API_PROXY_TARGET?.replace(/\/+$/, '');
const SECRET = process.env.API_PROXY_SECRET?.trim();

const CLIENT_IP_HEADER = 'x-speeko-client-ip';
const PROXY_SECRET_HEADER = 'x-speeko-proxy-secret';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (!first || first.length > 64) return null;
  return first;
}

function withoutHopByHop(headers: Headers): Headers {
  const next = new Headers(headers);
  for (const name of HOP_BY_HOP) next.delete(name);
  return next;
}

function setCookies(headers: Headers): string[] {
  const withCookies = headers as Headers & { getSetCookie?: () => string[] };
  return withCookies.getSetCookie?.() ?? [];
}

export async function middleware(request: NextRequest) {
  if (!TARGET) return NextResponse.next();

  const incoming = new URL(request.url);
  const target = new URL(`${TARGET}${incoming.pathname}${incoming.search}`);

  const headers = withoutHopByHop(request.headers);
  // Never accept proxy-trust headers from the browser.
  headers.delete(CLIENT_IP_HEADER);
  headers.delete(PROXY_SECRET_HEADER);
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');

  const ip = clientIp(request);
  if (ip) {
    headers.set(CLIENT_IP_HEADER, ip);
    headers.set('x-forwarded-for', ip);
  }
  if (SECRET) headers.set(PROXY_SECRET_HEADER, SECRET);

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const upstream = await fetch(target, {
    method,
    headers,
    ...(hasBody ? { body: await request.arrayBuffer() } : {}),
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = withoutHopByHop(upstream.headers);
  responseHeaders.delete('content-encoding');
  // Multiple Set-Cookie headers must survive the proxy hop. Only rewrite the
  // header when the runtime can enumerate them; otherwise keep the combined
  // header rather than dropping the session cookie entirely.
  const cookies = setCookies(upstream.headers);
  if (cookies.length > 0) {
    responseHeaders.delete('set-cookie');
    for (const cookie of cookies) responseHeaders.append('set-cookie', cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const config = {
  matcher: '/api/:path*',
};
