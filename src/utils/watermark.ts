const WATERMARK_FIGURE = require('../../assets/Pose_6-removebg-preview.png');
const WATERMARK_FIGURE_SRC =
  typeof WATERMARK_FIGURE === 'string'
    ? WATERMARK_FIGURE
    : WATERMARK_FIGURE?.default || WATERMARK_FIGURE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Adds a lower-right Photo Healthy figure watermark to an image data URL.
 */
export async function addWatermark(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const figure = await loadImage(WATERMARK_FIGURE_SRC).catch(() => null);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare photo watermark');

  ctx.drawImage(img, 0, 0);

  if (figure) {
    const shortestSide = Math.max(1, Math.min(img.width, img.height));
    const padding = Math.max(16, Math.round(shortestSide * 0.025));
    const cropHeight = Math.round(figure.height * 0.74);
    const figureAspect = figure.width / Math.max(1, cropHeight);
    const drawW = Math.min(
      Math.round(img.width * 0.18),
      Math.max(54, Math.round(shortestSide * 0.2))
    );
    const drawH = Math.round(drawW / figureAspect);
    const x = canvas.width - padding - drawW;
    const y = canvas.height - padding - drawH;

    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(4, Math.round(shortestSide * 0.01));
    ctx.drawImage(figure, 0, 0, figure.width, cropHeight, x, y, drawW, drawH);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
