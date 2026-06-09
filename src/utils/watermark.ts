/**
 * Adds a Photo Healthy watermark to an image data URL.
 */
export async function addWatermark(
  dataUrl: string,
  text = 'Photo Healthy'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Small, low-contrast mark for attribution without taking over the photo.
      const fontSize = Math.max(13, Math.round(img.width * 0.018));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const padding = Math.round(fontSize * 0.9);
      const textWidth = ctx.measureText(text).width;
      const badgePadX = Math.round(fontSize * 0.55);
      const badgePadY = Math.round(fontSize * 0.32);
      const badgeW = textWidth + badgePadX * 2;
      const badgeH = fontSize + badgePadY * 2;
      const x = canvas.width - padding;
      const y = canvas.height - padding;

      ctx.fillStyle = 'rgba(8, 12, 24, 0.28)';
      ctx.fillRect(x - badgeW, y - badgeH, badgeW, badgeH);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 2;
      ctx.fillText(text, x - badgePadX, y - badgePadY);

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
