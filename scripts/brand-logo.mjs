import sharp from 'sharp';
const [src, white, out] = process.argv.slice(2);
// Renkli logo: açık zemini saydamlaştır (luminance tabanlı alfa), sonra kırp
async function knockout(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const min = Math.min(r, g, b);
    // beyaza yakınlık: 245+ tamamen saydam, 200 altı opak
    const a = min >= 245 ? 0 : min <= 200 ? 255 : Math.round(255 * (245 - min) / 45);
    if (a < 255 && a > 0) { // un-premultiply against white
      const f = a / 255;
      data[i]   = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - f)) / f)));
      data[i+1] = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - f)) / f)));
      data[i+2] = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - f)) / f)));
    }
    data[i+3] = a;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}
const color = await sharp(await knockout(src)).trim({ threshold: 1 }).png().toBuffer();
const meta = await sharp(color).metadata();
console.log('color trimmed', meta.width, meta.height);
await sharp(color).resize({ height: 160 }).png({ compressionLevel: 9 }).toFile(out + '/lagen-logo.png');
await sharp(color).resize({ height: 160 }).webp({ quality: 92, alphaQuality: 100 }).toFile(out + '/lagen-logo.webp');
// Sadece işaret (sol ~%27)
const markW = Math.round(meta.width * 0.245);
const mark = await sharp(color).extract({ left: 0, top: 0, width: markW, height: meta.height }).trim({ threshold: 1 }).png().toBuffer();
await sharp(mark).resize(512, 512, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).png().toFile(out + '/lagen-mark.png');
const wm = await sharp(white).trim({ threshold: 1 }).png().toBuffer();
const wmeta = await sharp(wm).metadata(); console.log('white trimmed', wmeta.width, wmeta.height);
await sharp(wm).resize({ height: 160 }).png({ compressionLevel: 9 }).toFile(out + '/lagen-logo-white.png');
await sharp(wm).resize({ height: 160 }).webp({ quality: 92, alphaQuality: 100 }).toFile(out + '/lagen-logo-white.webp');

// Koyu tema: işaret renkli kalır, yazı beyaz
{
  const { data, info } = await sharp(color).raw().toBuffer({ resolveWithObject: true });
  const split = Math.round(info.width * 0.245);
  for (let y = 0; y < info.height; y++) for (let x = split; x < info.width; x++) {
    const i = (y * info.width + x) * 4; data[i] = data[i+1] = data[i+2] = 255;
  }
  const dark = await sharp(data, { raw: info }).png().toBuffer();
  await sharp(dark).resize({ height: 160 }).png({ compressionLevel: 9 }).toFile(out + '/lagen-logo-dark.png');
  await sharp(dark).resize({ height: 160 }).webp({ quality: 92, alphaQuality: 100 }).toFile(out + '/lagen-logo-dark.webp');
}
// Favicon / uygulama ikonları
const pad = (s, p) => sharp(mark).resize(s - p * 2, s - p * 2, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).extend({ top:p,bottom:p,left:p,right:p, background: { r:0,g:0,b:0,alpha:0 } });
await pad(512, 24).png().toFile(out + '/icon-512.png');
await sharp(await pad(180, 22).png().toBuffer()).flatten({ background: '#ffffff' }).png().toFile(out + '/apple-icon.png');
await pad(32, 1).png().toFile(out + '/icon-32.png');
