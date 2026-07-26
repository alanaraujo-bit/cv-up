// Generates every PWA/browser icon from a single vector definition.
// Run with `pnpm icons` after changing the mark or the brand colour.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BRAND = "#4062e0";
const OUT_ICONS = path.resolve("public/icons");
const OUT_BRAND = path.resolve("public/brand");

/**
 * The mark: a document sheet with an ascending chevron. Authored on a 512x512
 * canvas as monochrome strokes so the same geometry works as a white glyph on
 * the brand tile and as `currentColor` inside the app (see components/brand).
 */
const GLYPH = `
    <g fill="none" stroke="#fff" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">
      <rect x="136" y="100" width="240" height="312" rx="40"/>
      <path d="M196 258 L256 198 L316 258"/>
      <path d="M256 198 V342"/>
    </g>`;

/** Rounded tile, used for favicons and non-maskable PWA icons. */
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" rx="112" fill="${BRAND}"/>${GLYPH}
</svg>`;

/** Full-bleed tile with the mark inside the 80% safe zone Android crops to. */
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="${BRAND}"/>
    <g transform="translate(256 256) scale(0.68) translate(-256 -256)">${GLYPH}</g>
</svg>`;

const TARGETS = [
  { svg: iconSvg, size: 192, file: "icon-192.png" },
  { svg: iconSvg, size: 512, file: "icon-512.png" },
  { svg: iconSvg, size: 180, file: "apple-touch-icon.png" },
  { svg: maskableSvg, size: 192, file: "icon-maskable-192.png" },
  { svg: maskableSvg, size: 512, file: "icon-maskable-512.png" },
];

await mkdir(OUT_ICONS, { recursive: true });
await mkdir(OUT_BRAND, { recursive: true });

await writeFile(path.join(OUT_BRAND, "icon.svg"), `${iconSvg}\n`, "utf8");

for (const { svg, size, file } of TARGETS) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_ICONS, file));
  console.log(`icons: ${file} (${size}x${size})`);
}

console.log("icons: done");
