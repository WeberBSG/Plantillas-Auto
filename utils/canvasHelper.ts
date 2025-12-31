
import { Template, CanvasElement } from '../types';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) { currentLine += " " + word; } else { lines.push(currentLine); currentLine = word; }
  }
  lines.push(currentLine);
  return lines;
};

export const generateExportImage = async (template: Template): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as any; // Using any to access experimental letterSpacing if needed
  if (!ctx) throw new Error("Could not create canvas context");

  const baseImg = await loadImage(template.baseImage);
  const { width, height } = baseImg;
  canvas.width = width;
  canvas.height = height;

  // Draw background with styles
  ctx.save();
  ctx.globalAlpha = template.baseOpacity ?? 1;
  if (template.baseBlendMode && template.baseBlendMode !== 'normal') {
    ctx.globalCompositeOperation = template.baseBlendMode as GlobalCompositeOperation;
  }
  
  const borderRadius = template.baseBorderRadius || 0;
  
  if (template.baseRotation) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((template.baseRotation * Math.PI) / 180);
    
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, borderRadius);
      ctx.clip();
    }
    
    ctx.drawImage(baseImg, -width / 2, -height / 2, width, height);
  } else {
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, borderRadius);
      ctx.clip();
    }
    ctx.drawImage(baseImg, 0, 0, width, height);
  }
  ctx.restore();

  const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    const elX = (el.x / 100) * width;
    const elY = (el.y / 100) * height;
    const elW = el.width || 0; 
    const elH = el.height || 0;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    
    // Mapping for blend modes
    if (el.blendMode && el.blendMode !== 'normal') {
        if (el.blendMode === 'linear-burn') {
            ctx.globalCompositeOperation = 'multiply';
        } else {
            ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;
        }
    }

    const centerX = elX + elW / 2;
    const centerY = elY + elH / 2;
    ctx.translate(centerX, centerY);
    if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

    if (el.type === 'text') {
      const style = el.styling;
      const weight = style.bold ? 'bold' : (style.semibold ? '600' : 'normal');
      const fontStr = `${style.italic ? 'italic ' : ''}${weight} ${style.fontSize}px "${style.fontFamily}", sans-serif`;
      
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${style.letterSpacing || 0}px`;
      }
      
      ctx.font = fontStr;
      ctx.fillStyle = style.color;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const contentLines = el.content.split('\n');
      let currentY = -elH / 2;
      const drawX = -elW / 2;
      contentLines.forEach((line) => {
        const linesToDraw = elW > 0 ? wrapText(ctx, line, elW) : [line];
        linesToDraw.forEach((ld) => {
          ctx.fillText(ld, drawX, currentY);
          currentY += style.fontSize * 1.2;
        });
      });
    } else if (el.type === 'photo') {
      try {
        const photoImg = await loadImage(el.content);
        const elBorderRadius = el.borderRadius || 0;
        
        if (elBorderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(-elW / 2, -elH / 2, elW, elH, elBorderRadius);
          ctx.clip();
        }
        
        ctx.drawImage(photoImg, -elW / 2, -elH / 2, elW, elH);
      } catch (err) { console.warn(`Failed to load element image: ${el.id}`); }
    }
    ctx.restore();
  }
  return canvas.toDataURL('image/png', 1.0);
};
