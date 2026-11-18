/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@speeko/core'],
  /**
   * The same-origin `/api/*` proxy lives in `middleware.ts`, not in
   * `rewrites()`. Middleware can forward the client IP and a shared secret to
   * the API, so rate limiting stays per caller behind the proxy; a rewrite
   * would expose only Vercel's egress address. With `API_PROXY_TARGET` unset
   * (local dev, CI e2e), the middleware is inert and the browser calls
   * `NEXT_PUBLIC_API_URL` directly.
   */
};

export default nextConfig;
