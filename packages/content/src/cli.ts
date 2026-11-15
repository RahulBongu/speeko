#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateDirectory,
  buildCourses,
  collectAudioEntries,
  scaffoldCourse,
  validateCourseFile,
  importCourseFromPhrases,
} from './index.js';
import type { Locale } from '@speeko/core';

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`speeko-content <command> [options]

Commands:
  validate [dir]                  Validate all course JSON files under dir (default: ./content)
  build [inputDir] [outputDir]    Validate + compile courses to outputDir (default: ./content ./content/dist)
  scaffold <locale> <id> [dir]    Write a starter course JSON for a locale
  import <input.json> <out.json>  Import a normalized phrase list into a draft course
  audio [inputDir] [outFile]      Write an audio manifest (default: ./content ./content/audio-manifest.json)
`);
  process.exit(0);
}

if (!cmd || cmd === '--help' || cmd === '-h') usage();

if (cmd === 'validate') {
  const dir = resolve(args[1] ?? './content');
  const results = validateDirectory(dir);
  let failed = 0;
  for (const r of results) {
    if (r.ok) console.log(`OK   ${r.file}`);
    else {
      failed++;
      console.log(`FAIL ${r.file}`);
      for (const e of r.errors) console.log(`     - ${e}`);
    }
  }
  console.log(`\n${results.length - failed}/${results.length} valid`);
  process.exit(failed > 0 ? 1 : 0);
}

if (cmd === 'build') {
  const inputDir = resolve(args[1] ?? './content');
  const outputDir = resolve(args[2] ?? './content/dist');
  try {
    const res = buildCourses(inputDir, outputDir);
    console.log(`Built ${res.courses} course(s) -> ${res.outputDir}`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  process.exit(0);
}

if (cmd === 'scaffold') {
  const locale = args[1] as Locale;
  const id = args[2];
  const dir = resolve(args[3] ?? './content');
  if (!locale || !id) {
    console.error('Usage: scaffold <locale> <id> [dir]');
    process.exit(1);
  }
  const course = scaffoldCourse(locale, id);
  mkdirSync(resolve(dir, locale), { recursive: true });
  const out = resolve(dir, locale, `${id}.json`);
  writeFileSync(out, JSON.stringify(course, null, 2));
  console.log(`Scaffolded ${out}`);
  process.exit(0);
}

if (cmd === 'import') {
  const inputPath = resolve(args[1] ?? '');
  const outputPath = resolve(args[2] ?? './imported-course.json');
  if (!args[1] || !args[2]) {
    console.error('Usage: import <input.json> <output.json>');
    process.exit(1);
  }
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const course = importCourseFromPhrases(input);
  mkdirSync(resolve(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(course, null, 2));
  console.log(`Imported ${course.units.reduce((n, u) => n + u.lessons.length, 0)} lessons -> ${outputPath}`);
  process.exit(0);
}

if (cmd === 'audio') {
  const inputDir = resolve(args[1] ?? './content');
  const outFile = resolve(args[2] ?? './content/_config/audio-manifest.json');
  const entries = collectAudioEntries(inputDir);
  writeFileSync(outFile, JSON.stringify(entries, null, 2));
  console.log(`Wrote ${entries.length} audio entries -> ${outFile}`);
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
usage();
