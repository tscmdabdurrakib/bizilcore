import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "public");
const svgPath = path.join(root, "brand-icon.svg");
const iconsDir = path.join(root, "icons");

fs.mkdirSync(iconsDir, { recursive: true });

const svg = fs.readFileSync(svgPath);

async function generateIcon(size, outfile, padding = 0.12) {
  const inner = Math.round(size * (1 - padding * 2));
  const png = await sharp(svg)
    .resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: png, gravity: "center" }])
    .png()
    .toFile(path.join(iconsDir, outfile));
}

await generateIcon(192, "icon-192.png", 0.1);
await generateIcon(512, "icon-512.png", 0.1);
await generateIcon(512, "icon-512-maskable.png", 0.2);

console.log("PWA icons generated in public/icons/");
