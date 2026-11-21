// Renders assets/icon.svg into every PNG size the app ships.
// Run: node scripts/render-icons.mjs
//
// Two variants come from the same artwork:
//   icon.png            full-bleed square (iOS applies its own mask)
//   icon-foreground.png transparent, artwork inside Android's 66% safe zone
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const svg = await readFile(join(root, 'assets', 'icon.svg'));
await mkdir(join(root, 'assets'), { recursive: true });

// Artwork occupies x 14..86, y 14..82 in the 100-unit space (plus stroke).
const BOX = { x: 14, y: 14, w: 72, h: 68 };
const MARGIN = 2; // stroke bleed

function place(fraction) {
  // Scale so the artwork spans `fraction` of the 1024 canvas on its long axis.
  const unitW = BOX.w + MARGIN * 2;
  const scale = (1024 * fraction) / unitW;
  const artCx = BOX.x + BOX.w / 2;
  const artCy = BOX.y + BOX.h / 2;
  const cx = 512;
  const cy = 512;
  return `translate(${cx} ${cy}) scale(${scale}) translate(${-artCx} ${-artCy})`;
}

const variants = [
  // iOS / general: full bleed, artwork at 80% (Apple's grid).
  { file: 'assets/icon.png', transform: place(0.8), background: { r: 22, g: 163, b: 74, alpha: 1 } },
  // Android adaptive foreground: transparent, inside the 66% safe zone.
  { file: 'assets/icon-foreground.png', transform: place(0.64), background: { r: 0, g: 0, b: 0, alpha: 0 }, transparent: true },
];

for (const { file, transform, background, transparent } of variants) {
  // Swap the placeholder transform in the SVG for this variant's, and drop the
  // background rect when the layer must be transparent (Android foreground).
  let placed = svg.toString().replace(/transform="translate\(512[^"]*"/, `transform="${transform}"`);
  if (transparent) placed = placed.replace(/<rect[^>]*fill="#16A34A"[^>]*\/>/, '');
  const out = join(root, file);
  await sharp(Buffer.from(placed), { density: 384 })
    .resize(1024, 1024, { fit: 'contain', background })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`${file}  ${meta.width}x${meta.height}  alpha=${meta.hasAlpha}`);
}
