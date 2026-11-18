const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@speeko/core'],
  /**
   * Same-origin API proxy for the free hosting stack (Vercel web + Render API).
   *
   * `*.vercel.app` and `*.onrender.com` are different sites, so the session
   * cookie (SameSite=Lax) would never be sent on cross-site requests. Routing
   * `/api/*` through the web origin keeps the cookie first-party.
   *
   * The target is read at build time, so set API_PROXY_TARGET in the Vercel
   * project before building. With the variable unset (local dev, CI e2e), no
   * rewrite is emitted and the web app keeps calling NEXT_PUBLIC_API_URL
   * directly.
   */
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
