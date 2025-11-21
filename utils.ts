import { FilterState } from './types';

export const applyFiltersToCanvas = (
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement, 
  filters: FilterState,
  width: number,
  height: number
) => {
  ctx.clearRect(0, 0, width, height);
  
  // Construct filter string
  const filterString = `
    brightness(${filters.brightness}%) 
    contrast(${filters.contrast}%) 
    saturate(${filters.saturation}%) 
    grayscale(${filters.grayscale}%) 
    sepia(${filters.sepia}%) 
    blur(${filters.blur}px)
  `;
  
  ctx.filter = filterString;
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none'; // Reset
};

export const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const cropImageToRatio = (base64Image: string, ratioW: number, ratioH: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Image);

      // Calculate crop dimensions (Center Crop)
      const sourceRatio = img.width / img.height;
      const targetRatio = ratioW / ratioH;

      let newWidth = img.width;
      let newHeight = img.height;
      let startX = 0;
      let startY = 0;

      if (sourceRatio > targetRatio) {
        // Image is wider than target: Crop width
        newWidth = img.height * targetRatio;
        startX = (img.width - newWidth) / 2;
      } else {
        // Image is taller than target: Crop height
        newHeight = img.width / targetRatio;
        startY = (img.height - newHeight) / 2;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.drawImage(
        img, 
        startX, startY, newWidth, newHeight, // Source rect
        0, 0, newWidth, newHeight // Dest rect
      );

      resolve(canvas.toDataURL('image/png'));
    };
  });
};

export const mergeImageAndMask = (baseImage: string, maskCanvas: HTMLCanvasElement): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = baseImage;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(!ctx) return resolve(baseImage);

            // Draw Original Image
            ctx.drawImage(img, 0, 0);

            // Draw Mask on top (The maskCanvas might need scaling if it differs in size, 
            // but assuming CanvasWorkspace handles scaling, we draw strictly)
            // Note: In a robust app we match dimensions strictly.
            ctx.drawImage(maskCanvas, 0, 0, img.width, img.height);
            
            resolve(canvas.toDataURL('image/png'));
        };
    });
};
