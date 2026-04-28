import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'public');

// Try to render from the existing logo (best brand fidelity); fall back to favicon.svg.
// Pad to a brand-tinted square so the touch icon doesn't look cropped.
const candidates = [
  path.join(out, 'images', 'ICAC Full Logo.webp'),
  path.join(out, 'favicon.svg'),
];
let src = candidates.find(p => fs.existsSync(p));
if (!src) { console.error('No logo source found'); process.exit(1); }

console.log('Source:', src);

const sizes = [
  { name: 'favicon-32x32.png', size: 32, padded: false },
  { name: 'favicon-192x192.png', size: 192, padded: true },
  { name: 'favicon-512x512.png', size: 512, padded: true },
  { name: 'apple-touch-icon.png', size: 180, padded: true },
];

const navy = { r: 26, g: 46, b: 69, alpha: 1 }; // brand navy-700

for (const { name, size, padded } of sizes) {
  const innerSize = padded ? Math.round(size * 0.78) : size;
  const buf = await sharp(src)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();
  if (padded) {
    await sharp({
      create: { width: size, height: size, channels: 4, background: navy }
    })
    .composite([{ input: buf, gravity: 'center' }])
    .png()
    .toFile(path.join(out, name));
  } else {
    await sharp(buf).png().toFile(path.join(out, name));
  }
  console.log('Wrote', name);
}

// Also overwrite favicon.png (referenced from BaseLayout currently as 404)
await sharp(path.join(out, 'favicon-32x32.png')).toFile(path.join(out, 'favicon.png'));
console.log('Wrote favicon.png');
