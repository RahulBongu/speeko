import { createAuthClient } from 'better-auth/react';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * `same-origin` means: call /api/* on this origin and let next.config.mjs
 * proxy it to API_PROXY_TARGET. This is the free hosting stack, where the web
 * and API live on different sites and a cross-site session cookie would not be
 * sent (SameSite=Lax).
 *
 * Any other value is used as an absolute API URL; unset keeps local dev on
 * http://localhost:3001.
 */
export const API_URL =
  configuredApiUrl === 'same-origin'
    ? ''
    : (configuredApiUrl ?? 'http://localhost:3001');

export const authClient = createAuthClient({
  baseURL: API_URL || undefined,
});

export type SessionUser = typeof authClient.$Infer.Session.user;
