import { describe, expect, it } from 'vitest';
import {
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  normalizeIp,
  parseTrustProxyHops,
  resolveClientIp,
} from './client-ip.js';

const SECRET = 'test-proxy-secret';
const headers = (values: Record<string, string>) => values;

describe('normalizeIp', () => {
  it('accepts IPv4 and lower-cases IPv6', () => {
    expect(normalizeIp('203.0.113.9')).toBe('203.0.113.9');
    expect(normalizeIp('2001:DB8::1')).toBe('2001:db8::1');
  });

  it('strips an IPv4 port and IPv6 brackets', () => {
    expect(normalizeIp('203.0.113.9:4711')).toBe('203.0.113.9');
    expect(normalizeIp('[2001:db8::1]:443')).toBe('2001:db8::1');
  });

  it('unwraps IPv4-mapped IPv6 addresses', () => {
    expect(normalizeIp('::ffff:198.51.100.7')).toBe('198.51.100.7');
  });

  it('rejects junk and empty values', () => {
    expect(normalizeIp('')).toBeNull();
    expect(normalizeIp('not-an-ip')).toBeNull();
    expect(normalizeIp('203.0.113.9:not-a-port')).toBeNull();
    expect(normalizeIp('999.999.999.999')).toBeNull();
  });
});

describe('resolveClientIp', () => {
  it('uses the request-derived address when no headers are present', () => {
    expect(
      resolveClientIp({ fallbackIp: '198.51.100.2', headers: {} }),
    ).toBe('198.51.100.2');
  });

  it('ignores the forwarded header when no proxy secret is configured', () => {
    const ip = resolveClientIp({
      fallbackIp: '198.51.100.2',
      headers: headers({
        [CLIENT_IP_HEADER]: '203.0.113.9',
        [PROXY_SECRET_HEADER]: SECRET,
      }),
    });
    expect(ip).toBe('198.51.100.2');
  });

  it('ignores the forwarded header when the secret is wrong or absent', () => {
    const base = {
      fallbackIp: '198.51.100.2',
      proxySecret: SECRET,
    };
    expect(
      resolveClientIp({
        ...base,
        headers: headers({
          [CLIENT_IP_HEADER]: '203.0.113.9',
          [PROXY_SECRET_HEADER]: 'wrong',
        }),
      }),
    ).toBe('198.51.100.2');
    expect(
      resolveClientIp({
        ...base,
        headers: headers({ [CLIENT_IP_HEADER]: '203.0.113.9' }),
      }),
    ).toBe('198.51.100.2');
  });

  it('honours a matching secret and normalises the forwarded address', () => {
    const ip = resolveClientIp({
      fallbackIp: '198.51.100.2',
      proxySecret: SECRET,
      headers: headers({
        [CLIENT_IP_HEADER]: '::ffff:203.0.113.9',
        [PROXY_SECRET_HEADER]: SECRET,
      }),
    });
    expect(ip).toBe('203.0.113.9');
  });

  it('falls back when the forwarded value is not an IP', () => {
    const ip = resolveClientIp({
      fallbackIp: '198.51.100.2',
      proxySecret: SECRET,
      headers: headers({
        [CLIENT_IP_HEADER]: 'attacker-controlled',
        [PROXY_SECRET_HEADER]: SECRET,
      }),
    });
    expect(ip).toBe('198.51.100.2');
  });

  it('uses the first value when a header repeats', () => {
    const ip = resolveClientIp({
      fallbackIp: '198.51.100.2',
      proxySecret: SECRET,
      headers: {
        [CLIENT_IP_HEADER]: ['203.0.113.9', '10.0.0.1'],
        [PROXY_SECRET_HEADER]: [SECRET, 'ignored'],
      },
    });
    expect(ip).toBe('203.0.113.9');
  });
});

describe('parseTrustProxyHops', () => {
  it('defaults to zero and accepts small hop counts', () => {
    expect(parseTrustProxyHops(undefined)).toBe(0);
    expect(parseTrustProxyHops('')).toBe(0);
    expect(parseTrustProxyHops('0')).toBe(0);
    expect(parseTrustProxyHops('1')).toBe(1);
    expect(parseTrustProxyHops('2')).toBe(2);
  });

  it('fails closed for invalid or excessive values', () => {
    expect(parseTrustProxyHops('-1')).toBe(0);
    expect(parseTrustProxyHops('1.5')).toBe(0);
    expect(parseTrustProxyHops('nine')).toBe(0);
    expect(parseTrustProxyHops('9')).toBe(0);
  });
});
