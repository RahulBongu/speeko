import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateCourseFile,
  validateDirectory,
  buildCourses,
  scaffoldCourse,
  collectAudioEntries,
} from './index.js';
import { validateCourse } from '@speeko/core';

function withTempDir(fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'speeko-content-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('validateCourseFile', () => {
  it('accepts a scaffolded course', () => {
    withTempDir((dir) => {
      const course = scaffoldCourse('hi', 'test-course');
      const file = join(dir, 'course.json');
      writeFileSync(file, JSON.stringify(course));
      const res = validateCourseFile(file);
      expect(res.ok).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  it('rejects malformed JSON', () => {
    withTempDir((dir) => {
      const file = join(dir, 'bad.json');
      writeFileSync(file, '{ not json');
      const res = validateCourseFile(file);
      expect(res.ok).toBe(false);
      expect(res.errors[0]).toMatch(/JSON parse error/);
    });
  });

  it('rejects schema-invalid courses', () => {
    withTempDir((dir) => {
      const file = join(dir, 'bad.json');
      writeFileSync(file, JSON.stringify({ id: 'x' }));
      const res = validateCourseFile(file);
      expect(res.ok).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('validateDirectory', () => {
  it('skips dist/ and _-prefixed entries', () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, '_config'));
      writeFileSync(join(dir, '_config', 'phrases.json'), '{}');
      mkdirSync(join(dir, 'dist'));
      writeFileSync(join(dir, 'dist', 'manifest.json'), '[1,2,3]');
      const course = scaffoldCourse('ta', 'skip-test');
      writeFileSync(join(dir, 'course.json'), JSON.stringify(course));
      const results = validateDirectory(dir);
      expect(results).toHaveLength(1);
      expect(results[0]!.ok).toBe(true);
    });
  });
});

describe('buildCourses', () => {
  it('compiles courses and writes a manifest', () => {
    withTempDir((dir) => {
      const src = join(dir, 'src');
      const out = join(dir, 'out');
      mkdirSync(src);
      writeFileSync(join(src, 'a.json'), JSON.stringify(scaffoldCourse('or', 'a')));
      writeFileSync(join(src, 'b.json'), JSON.stringify(scaffoldCourse('mr', 'b')));
      const res = buildCourses(src, out);
      expect(res.courses).toBe(2);
      const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
      expect(manifest).toHaveLength(2);
      expect(manifest.map((m: any) => m.id).sort()).toEqual(['a', 'b']);
    });
  });

  it('throws on invalid input', () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, 'out'));
      writeFileSync(join(dir, 'bad.json'), '{}');
      expect(() => buildCourses(dir, join(dir, 'out'))).toThrow();
    });
  });
});

describe('scaffoldCourse', () => {
  it('produces a schema-valid course for every supported locale', () => {
    const locales = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'or'] as const;
    for (const locale of locales) {
      expect(() => validateCourse(scaffoldCourse(locale, `scaf-${locale}`))).not.toThrow();
    }
  });
});

describe('collectAudioEntries', () => {
  it('collects unique audio texts per locale', () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, 'course.json'), JSON.stringify(scaffoldCourse('hi', 'audio-test')));
      const entries = collectAudioEntries(dir);
      expect(entries.length).toBeGreaterThan(0);
      expect(new Set(entries.map((e) => e.file)).size).toBe(entries.length);
      expect(entries.every((e) => e.locale === 'hi')).toBe(true);
    });
  });
});
