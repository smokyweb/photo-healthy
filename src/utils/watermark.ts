const WATERMARK_LOGO = require('../../assets/logo.png');
const WATERMARK_LOGO_SRC =
  typeof WATERMARK_LOGO === 'string'
    ? WATERMARK_LOGO
    : WATERMARK_LOGO?.default || WATERMARK_LOGO;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * Adds an unobtrusive Photo Healthy logo watermark to an image data URL.
 */
export async function addWatermark(
  dataUrl: string,
  text = 'Photo Healthy'
): Promise<string> {
  const img = await loadImage(dataUrl);
  const logo = await loadImage(WATERMARK_LOGO_SRC).catch(() => null);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare photo watermark');

  ctx.drawImage(img, 0, 0);

  const shortestSide = Math.max(1, Math.min(img.width, img.height));
  const fontSize = Math.max(14, Math.round(shortestSide * 0.028));
  const padding = Math.max(14, Math.round(shortestSide * 0.025));
  const innerPadX = Math.round(fontSize * 0.75);
  const innerPadY = Math.round(fontSize * 0.46);
  const logoH = Math.round(fontSize * 1.9);
  const logoW = logo ? Math.round(logoH * (logo.width / Math.max(1, logo.height))) : 0;
  const maxLogoW = Math.round(img.width * 0.16);
  const drawLogoW = logo ? Math.min(logoW, maxLogoW) : 0;
  const drawLogoH = logo ? Math.round(drawLogoW / (logo.width / Math.max(1, logo.height))) : 0;
  const textGap = logo ? Math.round(fontSize * 0.42) : 0;

  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const textWidth = ctx.measureText(text).width;
  const badgeW = innerPadX * 2 + drawLogoW + textGap + textWidth;
  const badgeH = Math.max(drawLogoH, fontSize) + innerPadY * 2;
  const x = canvas.width - padding - badgeW;
  const y = canvas.height - padding - badgeH;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.2));
  ctx.fillStyle = 'rgba(3, 7, 18, 0.34)';
  roundRect(ctx, x, y, badgeW, badgeH, Math.round(badgeH * 0.28));
  ctx.fill();
  ctx.restore();

  let cursorX = x + innerPadX;
  const centerY = y + badgeH / 2;
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.drawImage(logo, cursorX, centerY - drawLogoH / 2, drawLogoW, drawLogoH);
    ctx.restore();
    cursorX += drawLogoW + textGap;
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 2;
  ctx.fillText(text, cursorX, centerY);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}
