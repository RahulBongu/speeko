#!/usr/bin/env node
/**
 * Verifies the mascot voice assets on the final source.
 *
 * - Every key in the mascot reaction catalog has a bundled MP3 under
 *   `apps/web/public/mascot` and `apps/mobile/assets/mascot`.
 * - Files are non-empty and decode via ffprobe with a non-zero duration.
 * - Writes a machine-readable inventory to `review/mascot-voice-inventory.md`.
 *
 * Usage: node scripts/check-mascot-voice.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const ffprobe = 'ffprobe';

const JOBS = [
  { key: 'correct', phrase: 'Hurray! You did it!' },
  { key: 'incorrect', phrase: "Almost! Let's try again." },
  { key: 'complete', phrase: 'Amazing work!' },
  { key: 'discovery', phrase: 'Ooh, let us learn something new!' },
  { key: 'streak', phrase: 'Your streak is growing!' },
  { key: 'encouragement', phrase: "Let's figure it out together." },
];

const dirs = [
  { label: 'web', dir: join(root, 'apps/web/public/mascot') },
  { label: 'mobile', dir: join(root, 'apps/mobile/assets/mascot') },
];

let allOk = true;
const rows = [];

for (const { label, dir } of dirs) {
  for (const job of JOBS) {
    const file = join(dir, `${job.key}.mp3`);
    const exists = existsSync(file);
    const size = exists ? statSync(file).size : 0;
    let duration = 0;
    if (exists && size > 0) {
      try {
        const out = execFileSync(ffprobe, [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', file,
        ], { encoding: 'utf8' }).trim();
        duration = Number(out) || 0;
      } catch {
        duration = 0;
      }
    }
    const ok = exists && size > 1000 && duration > 0;
    if (!ok) allOk = false;
    rows.push({ label, ...job, file: `${label}/${job.key}.mp3`, size, duration, ok });
    console.log(`${exists ? 'OK ' : 'MISS'} ${label}/${job.key}.mp3 ${size}B ${duration.toFixed(2)}s`);
  }
}

const lines = [
  '# Speeko mascot voice inventory',
  '',
  'Both web (`/mascot/*.mp3`) and mobile (`assets/mascot/*.mp3`) bundle the same six reaction lines.',
  'All lines are synthetic speech generated via Microsoft Edge TTS (`en-US-AvaNeural`), not a native-speaker recording.',
  '',
  '| Key | Reaction phrase | Web file | Mobile file | Duration (s) | Valid |',
  '| --- | --- | --- | --- | ---: | --- |',
];
for (const job of JOBS) {
  const web = rows.find((r) => r.label === 'web' && r.key === job.key);
  const mobile = rows.find((r) => r.label === 'mobile' && r.key === job.key);
  lines.push(
    `| ${job.key} | ${job.phrase} | ${web?.size ?? 0} B | ${mobile?.size ?? 0} B | ${(web?.duration ?? 0).toFixed(2)} | ${web?.ok && mobile?.ok ? 'yes' : 'NO'} |`,
  );
}
lines.push('');
lines.push(`Validated on ${new Date().toISOString()}. Voice: \`en-US-AvaNeural\`, engine: Microsoft Edge TTS (free service, bundled offline). ${
  allOk ? 'ALL CHECKS PASS' : 'FAILURES DETECTED'
}`);
writeFileSync(join(root, 'review/mascot-voice-inventory.md'), lines.join('\n') + '\n');

if (!allOk) {
  console.error('MASCOT VOICE CHECK FAILED');
  process.exit(1);
}
console.log('MASCOT VOICE CHECK PASS');
