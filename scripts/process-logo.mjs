import sharp from "sharp";
import fs from "fs";

const srcPath =
  "C:/Users/Jackson Le/.cursor/projects/d-SpotiPaid-SpotiPaid/assets/c__Users_Jackson_Le_AppData_Roaming_Cursor_User_workspaceStorage_dee98ece22874351e5416f39050b875f_images_image-f6d898b0-593d-43ca-9446-5eef062a32d2.png";

const img = sharp(srcPath);
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * info.channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r + g + b > 40) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 4;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad);
maxY = Math.min(h - 1, maxY + pad);
const cw = maxX - minX + 1;
const ch = maxY - minY + 1;
console.log({ w, h, minX, minY, cw, ch });

const cropped = await sharp(srcPath)
  .extract({ left: minX, top: minY, width: cw, height: ch })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.from(cropped.data);
for (let i = 0; i < out.length; i += 4) {
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];
  if (r + g + b < 35) out[i + 3] = 0;
}

const circlePng = await sharp(out, {
  raw: {
    width: cropped.info.width,
    height: cropped.info.height,
    channels: 4,
  },
})
  .png()
  .toBuffer();

await sharp(circlePng)
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("public/logo.png");

await sharp(circlePng)
  .resize(192, 192, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("public/favicon.png");

await sharp(circlePng)
  .resize(32, 32, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("public/favicon-32.png");

await sharp(circlePng)
  .resize(180, 180, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("public/apple-touch-icon.png");

await sharp(circlePng)
  .resize(32, 32, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("src/app/icon.png");

// Replace favicon.ico with a 32px png that browsers still pick up via metadata;
// also overwrite app favicon.ico as png bytes (Next accepts icon.png better).
fs.copyFileSync("public/favicon-32.png", "src/app/favicon.ico");

console.log("logo.png", fs.statSync("public/logo.png").size);
console.log("done");
