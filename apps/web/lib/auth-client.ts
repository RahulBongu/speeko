import { createAuthClient } from 'better-auth/react';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export type SessionUser = typeof authClient.$Infer.Session.user;
