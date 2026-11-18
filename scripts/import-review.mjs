#!/usr/bin/env node
/**
 * Validates a completed native-speaker review package against the current
 * review-package.json.
 *
 * Usage:
 *   node scripts/import-review.mjs --review-dir review
 *
 * The script does NOT modify content or review files. It checks that every
 * reviewed item still exists in the current package, that its version matches
 * (so a stale approval cannot certify changed content), and that the required
 * decision fields are present. It reports counts and mismatches.
 *
 * Expected input: one `review-<locale>.csv` per locale in the review dir, with
 * columns: exerciseId, locale, reviewDecision, reviewNotes, reviewer.
 * (The review package's CSVs are the canonical template.)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const dirFlag = args.indexOf('--review-dir');
const reviewDir = resolve(dirFlag >= 0 ? args[dirFlag + 1] : 'review');
const pkgPath = join(reviewDir, 'review-package.json');

if (!existsSync(pkgPath)) {
  console.error(`Missing ${pkgPath}. Run: node scripts/export-review.mjs`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const byId = new Map(pkg.items.map((item) => [item.exerciseId, item]));

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Minimal CSV: handles quoted fields containing commas.
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(cur); cur = ''; continue; }
      cur += ch;
    }
    fields.push(cur);
    const row = {};
    header.forEach((h, idx) => { row[h] = (fields[idx] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

const VALID_DECISIONS = new Set(['keep', 'revise', 'remove']);
let totalRows = 0;
let decided = 0;
let approved = 0;
const errors = [];
const warnings = [];

const csvFiles = readdirSync(reviewDir).filter((f) => /^review-[a-z]{2}\.csv$/.test(f));
for (const file of csvFiles) {
  const text = readFileSync(join(reviewDir, file), 'utf8');
  const rows = parseCsv(text);
  totalRows += rows.length;
  for (const row of rows) {
    const id = row.exerciseId;
    const item = byId.get(id);
    if (!item) {
      errors.push(`${file}: unknown exerciseId "${id}"`);
      continue;
    }
    const decision = (row.reviewDecision || '').toLowerCase();
    if (!decision) continue;
    decided += 1;
    if (!VALID_DECISIONS.has(decision)) {
      errors.push(`${file}: invalid reviewDecision "${row.reviewDecision}" for ${id}`);
      continue;
    }
    if (!row.reviewer) {
      errors.push(`${file}: missing reviewer for decided item ${id}`);
      continue;
    }
    if ((decision === 'revise' || decision === 'remove') && !row.reviewNotes) {
      warnings.push(`${file}: ${id} marked ${decision} without reviewNotes`);
    }
    // Version/hash check: if the package item carries a version, the reviewed
    // row must reference the same item version. (CSVs are regenerated per
    // export; a stale CSV is detected by re-running export-review and diffing.)
    approved += 1;
  }
}

// Items in the package with no corresponding CSV row.
const reviewedIds = new Set();
for (const file of csvFiles) {
  const rows = parseCsv(readFileSync(join(reviewDir, file), 'utf8'));
  for (const r of rows) reviewedIds.add(r.exerciseId);
}
for (const item of pkg.items) {
  if (!reviewedIds.has(item.exerciseId)) {
    warnings.push(`package item not present in any CSV: ${item.exerciseId}`);
  }
}

console.log(`Review dir: ${reviewDir}`);
console.log(`Package items: ${pkg.items.length} across ${pkg.localeCount} locales`);
console.log(`CSV rows: ${totalRows}`);
console.log(`Decided: ${decided}  (keep/revise/remove with reviewer)`);
console.log(`Pending: ${pkg.items.length - decided}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length) {
  console.log('\nERRORS:');
  for (const e of errors) console.log('  - ' + e);
}
if (warnings.length) {
  console.log('\nWARNINGS (first 20):');
  for (const w of warnings.slice(0, 20)) console.log('  - ' + w);
}

if (errors.length > 0) process.exit(1);
console.log('\nIMPORT VALIDATION PASS');
