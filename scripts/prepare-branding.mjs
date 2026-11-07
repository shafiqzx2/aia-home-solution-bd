// Deterministic derivatives of the supplied artwork. No tracing or redrawing.
// Run from the project root after installing the locked Next.js dependencies.
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const directory = new URL("../public/branding/", import.meta.url);
const ivory = { r: 247, g: 244, b: 237 };
await mkdir(directory, { recursive: true });

async function pixels(input) {
  return sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}
function bounds({ data, info }, from = 0, to = info.height) {
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = from; y < to; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] <= 8) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) throw new Error("Logo has no visible artwork");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}
async function recolor(input, color) {
  const { data, info } = await pixels(input);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r; data[i + 1] = color.g; data[i + 2] = color.b;
  }
  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
}
async function asset(name, bytes, extension = "png") {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const filename = `${name}.${hash}.${extension}`;
  await writeFile(new URL(filename, directory), bytes);
  const { width, height } = await sharp(bytes).metadata();
  return { src: `/branding/${filename}`, width, height };
}

const full = await readFile(new URL("originals/AIA_LOGO.png", directory));
const square = await readFile(new URL("originals/AIA_LOGO_G.png", directory));
const visibleBounds = bounds(await pixels(full));
// Two pixels of transparent guard preserve the artwork's antialiased fringe;
// very faint isolated alpha noise outside the visible mark is margin, not ink.
const crop = { left: visibleBounds.left - 2, top: visibleBounds.top - 2,
  width: visibleBounds.width + 4, height: visibleBounds.height + 4 };
const black = await sharp(full).extract(crop).resize({ width: 640, withoutEnlargement: true })
  .webp({ lossless: true, effort: 6 }).toBuffer();
const light = await asset("aia-logo-black", black, "webp");
const dark = await asset("aia-logo-ivory", await sharp(await recolor(black, ivory)).webp({ lossless: true }).toBuffer(), "webp");

// An inner edge mask derived from the unchanged alpha channel. It never adds
// strokes outside the supplied artwork; the original image remains underneath.
const { data, info } = await pixels(black);
const edge = Buffer.alloc(data.length);
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  const i = (y * info.width + x) * 4;
  let minimum = data[i + 3];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, ny = y + dy;
    minimum = Math.min(minimum, nx < 0 || ny < 0 || nx >= info.width || ny >= info.height ? 0 : data[(ny * info.width + nx) * 4 + 3]);
  }
  edge[i] = edge[i + 1] = edge[i + 2] = 255;
  edge[i + 3] = data[i + 3] - minimum;
}
const edgeMask = await asset("aia-logo-edges", await sharp(edge, { raw: info }).webp({ lossless: true }).toBuffer(), "webp");

// Extract the existing AIA mark above the transparent gap before its caption.
const squarePixels = await pixels(square);
const squareBounds = bounds(squarePixels);
let lastInk = squareBounds.top, markEnd = -1;
for (let y = squareBounds.top; y < squareBounds.top + squareBounds.height; y++) {
  let ink = false;
  for (let x = 0; x < squarePixels.info.width; x++) {
    if (squarePixels.data[(y * squarePixels.info.width + x) * 4 + 3]) { ink = true; break; }
  }
  if (ink) {
    if (y - lastInk > 10) { markEnd = lastInk + 1; break; }
    lastInk = y;
  }
}
if (markEnd < 0) throw new Error("Cannot safely isolate the supplied AIA mark");
const markBounds = bounds(squarePixels, squareBounds.top, markEnd);
const mark = await sharp(square).extract(markBounds).png().toBuffer();
async function icon(size, onDark = false) {
  const inset = size <= 16 ? 1 : Math.round(size / 12);
  const content = await sharp(onDark ? await recolor(mark, ivory) : mark)
    .resize(size - inset * 2, size - inset * 2, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: onDark ? "#191e1a" : "#f7f4ed" } })
    .composite([{ input: content, gravity: "centre" }]).png({ compressionLevel: 9 }).toBuffer();
}
const lightIcon = await asset("aia-icon-light", await icon(32));
const darkIcon = await asset("aia-icon-dark", await icon(32, true));
const apple = await asset("aia-apple-icon", await icon(180));
const frames = await Promise.all([16, 32, 48].map(size => icon(size)));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const p = 6 + index * 16, size = [16, 32, 48][index];
  header[p] = header[p + 1] = size;
  header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(frame.length, p + 8); header.writeUInt32LE(offset, p + 12);
  offset += frame.length;
});
await writeFile(new URL("../app/favicon.ico", import.meta.url), Buffer.concat([header, ...frames]));
const manifest = {
  originals: [
    { file: "originals/AIA_LOGO.png", sha256: createHash("sha256").update(full).digest("hex"), crop },
    { file: "originals/AIA_LOGO_G.png", sha256: createHash("sha256").update(square).digest("hex"), markCrop: markBounds },
  ],
  light, dark, edgeMask,
  favicon: { light: lightIcon, dark: darkIcon, apple, fallback: "/favicon.ico" },
};
await writeFile(new URL("asset-manifest.json", directory), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ logo: { width: light.width, height: light.height }, files: [light, dark, edgeMask, lightIcon, darkIcon, apple].map(item => item.src) }, null, 2));
