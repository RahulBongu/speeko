import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { getDb } from './db/client.js';
import * as schema from './db/schema.js';

const isProduction = process.env.NODE_ENV === 'production';
const secret =
  process.env.BETTER_AUTH_SECRET ?? 'speeko-local-development-secret-please-change-me';

if (isProduction && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET must be set in production.');
}
if (isProduction && (process.env.BETTER_AUTH_SECRET ?? '').length < 32) {
  // A short secret is a credential; better-auth only warns — we refuse to boot.
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters in production.');
}

const trustedOrigins = (process.env.CLIENT_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  secret,
  trustedOrigins,
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});
