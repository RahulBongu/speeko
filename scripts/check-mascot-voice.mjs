#!/usr/bin/env node
/**
 * Verifies the mascot voice & sound-effect assets on the final source.
 *
 * - Every reaction voice clip and SFX chime in the catalog has a bundled MP3
 *   under `apps/web/public/{mascot,sounds}` and `apps/mobile/assets/{mascot,sounds}`.
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

const VOICE_JOBS = [
  { key: 'correct', phrase: 'Hurray! You nailed it!' },
  { key: 'correct-2', phrase: 'Spot on! Keep that momentum going!' },
  { key: 'correct-3', phrase: 'Woohoo! Clean and sharp!' },
  { key: 'correct-4', phrase: 'Awesome work! Look at you go!' },
  { key: 'correct-5', phrase: 'Boom! That answer was pure gold!' },
  { key: 'correct-6', phrase: 'Magnificent! That sounded effortless!' },
  { key: 'correct-7', phrase: 'Right on the money! Keep soaring!' },
  { key: 'correct-8', phrase: 'Genius pick! Clean answer!' },
  { key: 'correct-9', phrase: 'Super sharp! Right in the groove!' },
  { key: 'incorrect', phrase: "Ooh, close! Let's peek at the right one." },
  { key: 'incorrect-2', phrase: 'Not quite yet — every miss sharpens your ear!' },
  { key: 'incorrect-3', phrase: 'Tricky one! Shake it off and keep rolling.' },
  { key: 'incorrect-4', phrase: "Good try! You'll lock this in next time." },
  { key: 'incorrect-5', phrase: 'Almost had it! One quick look locks it in.' },
  { key: 'incorrect-6', phrase: 'Tough round! You will nail this next time.' },
  { key: 'complete', phrase: 'Amazing work! Lesson conquered!' },
  { key: 'complete-2', phrase: 'Fantastic finish! You crushed every step!' },
  { key: 'complete-3', phrase: 'Woohoo! Your skills just leveled up!' },
  { key: 'complete-4', phrase: 'Smooth finish! You breezed right through!' },
  { key: 'complete-5', phrase: 'Champion run! Every exercise clicked!' },
  { key: 'complete-6', phrase: 'Top-notch lesson! Your progress is soaring!' },
  { key: 'unit-complete', phrase: 'Module complete! You mastered every lesson in this unit!' },
  { key: 'unit-complete-2', phrase: 'Unit conquered! Look how strong your foundation just got!' },
  { key: 'unit-complete-3', phrase: 'What a milestone! Ready to cross into the next module?' },
  { key: 'unit-complete-4', phrase: 'Whole module unlocked! That victory cheer is all yours!' },
  { key: 'unit-complete-5', phrase: 'Brilliant unit finish! Onward to fresh words!' },
  { key: 'unit-complete-6', phrase: 'Every lesson in this module cleared! Look at you climbing!' },
  { key: 'streak', phrase: 'Your streak is growing! Unstoppable!' },
  { key: 'streak-2', phrase: 'What a combo! You are on fire!' },
  { key: 'discovery', phrase: "Ooh, let's learn something fresh today!" },
  { key: 'discovery-2', phrase: "Ready for a fun new challenge? Let's dive in!" },
  { key: 'encouragement', phrase: "Let's figure it out together, step by step." },
  { key: 'encouragement-2', phrase: 'Every single try makes your memory stronger.' },
];

const SFX_JOBS = [
  'correct',
  'correct-2',
  'correct-3',
  'correct-4',
  'correct-5',
  'incorrect',
  'incorrect-2',
  'incorrect-3',
  'complete',
  'complete-2',
  'complete-3',
  'unit-complete',
  'unit-complete-2',
  'unit-complete-3',
];

function probeAudio(file) {
  const exists = existsSync(file);
  const size = exists ? statSync(file).size : 0;
  let duration = 0;
  if (exists && size > 0) {
    try {
      const out = execFileSync(
        ffprobe,
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
        { encoding: 'utf8' },
      ).trim();
      duration = Number(out) || 0;
    } catch {
      duration = 0;
    }
  }
  const ok = exists && size > 1000 && duration > 0;
  return { exists, size, duration, ok };
}

let allOk = true;
const voiceRows = [];

for (const job of VOICE_JOBS) {
  const webFile = join(root, 'apps/web/public/mascot', `${job.key}.mp3`);
  const mobFile = join(root, 'apps/mobile/assets/mascot', `${job.key}.mp3`);
  const web = probeAudio(webFile);
  const mobile = probeAudio(mobFile);
  if (!web.ok || !mobile.ok) allOk = false;
  voiceRows.push({ ...job, web, mobile });
  console.log(`${web.ok ? 'OK ' : 'MISS'} web/mascot/${job.key}.mp3 ${web.size}B ${web.duration.toFixed(2)}s`);
  console.log(`${mobile.ok ? 'OK ' : 'MISS'} mobile/mascot/${job.key}.mp3 ${mobile.size}B ${mobile.duration.toFixed(2)}s`);
}

for (const key of SFX_JOBS) {
  const web = probeAudio(join(root, 'apps/web/public/sounds', `${key}.mp3`));
  const mobile = probeAudio(join(root, 'apps/mobile/assets/sounds', `${key}.mp3`));
  if (!web.ok || !mobile.ok) allOk = false;
  console.log(`${web.ok ? 'OK ' : 'MISS'} web/sounds/${key}.mp3 ${web.size}B ${web.duration.toFixed(2)}s`);
  console.log(`${mobile.ok ? 'OK ' : 'MISS'} mobile/sounds/${key}.mp3 ${mobile.size}B ${mobile.duration.toFixed(2)}s`);
}

const lines = [
  '# Speeko mascot voice & sound inventory',
  '',
  `Both web (\`/mascot/*.mp3\`, \`/sounds/*.mp3\`) and mobile (\`assets/mascot/*.mp3\`, \`assets/sounds/*.mp3\`) bundle ${VOICE_JOBS.length} varied mascot voice lines and ${SFX_JOBS.length} harmonic chime SFX clips.`,
  'Voice lines are synthetic speech generated locally via Flow MCP Kokoro TTS (`af_heart`, `af_bella`, `af_emma`/`bf_emma`, `am_puck`, 0 credits), not a native-speaker recording.',
  '',
  '| Key | Reaction phrase | Web size | Mobile size | Duration (s) | Valid |',
  '| --- | --- | ---: | ---: | ---: | --- |',
];
for (const row of voiceRows) {
  lines.push(
    `| ${row.key} | ${row.phrase} | ${row.web.size} B | ${row.mobile.size} B | ${row.web.duration.toFixed(2)} | ${row.web.ok && row.mobile.ok ? 'yes' : 'NO'} |`,
  );
}
lines.push('');
lines.push(
  `Validated on ${new Date().toISOString()}. ${allOk ? 'ALL CHECKS PASS' : 'FAILURES DETECTED'}`,
);
writeFileSync(join(root, 'review/mascot-voice-inventory.md'), lines.join('\n') + '\n');

if (!allOk) {
  console.error('MASCOT VOICE CHECK FAILED');
  process.exit(1);
}
console.log('MASCOT VOICE CHECK PASS');
