import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FilterState, EditorMode } from '../types';
import { applyFiltersToCanvas } from '../utils';

interface Props {
  imageSrc: string | null;
  filters: FilterState;
  mode: EditorMode;
  brushSize: number;
}

export interface CanvasWorkspaceRef {
  getMaskedImage: () => Promise<string | null>;
  getCurrentImage: () => Promise<string>;
  resetView: () => void;
}

const CanvasWorkspace = forwardRef<CanvasWorkspaceRef, Props>(({ imageSrc, filters, mode, brushSize }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  
  // Transform state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isDrawing, setIsDrawing] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
      
      // Reset mask
      if (maskCanvasRef.current) {
          const ctx = maskCanvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
      
      // Reset view logic handled via imperative handle or separate effect if needed, 
      // but here we auto-fit on load.
      fitImageToContainer(img);
    };
  }, [imageSrc]);

  // Clear mask when switching OUT of Eraser mode (Fix for Cancel button)
  useEffect(() => {
    if (mode !== EditorMode.ERASE && maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
    }
  }, [mode]);

  const fitImageToContainer = (img: HTMLImageElement) => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const scaleW = (containerW - 40) / img.width;
        const scaleH = (containerH - 40) / img.height;
        const newScale = Math.min(scaleW, scaleH, 1);
        setScale(newScale);
        setPosition({ x: 0, y: 0 }); // Reset position center
      }
  };

  // Redraw Image + Filters
  useEffect(() => {
    if (!canvasRef.current || !imageObj) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    applyFiltersToCanvas(ctx, imageObj, filters, canvas.width, canvas.height);

    if (maskCanvasRef.current) {
        if (maskCanvasRef.current.width !== imageObj.width || maskCanvasRef.current.height !== imageObj.height) {
            maskCanvasRef.current.width = imageObj.width;
            maskCanvasRef.current.height = imageObj.height;
        }
    }
  }, [imageObj, filters]);

  useImperativeHandle(ref, () => ({
    getCurrentImage: async () => {
        if (canvasRef.current) return canvasRef.current.toDataURL('image/png');
        return imageSrc || '';
    },
    getMaskedImage: async () => {
        if (!canvasRef.current || !maskCanvasRef.current) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tCtx = tempCanvas.getContext('2d');
        if (!tCtx) return null;
        tCtx.drawImage(canvasRef.current, 0, 0);
        tCtx.drawImage(maskCanvasRef.current, 0, 0);
        return tempCanvas.toDataURL('image/png');
    },
    resetView: () => {
        if (imageObj) fitImageToContainer(imageObj);
    }
  }));

  // --- ZOOM / PAN HANDLERS ---

  const handleWheel = (e: React.WheelEvent) => {
      // Always prevent default scroll behavior to control zoom/pan
      // e.preventDefault() is not allowed in React passive event, but we handle logic here.
      
      if (isDrawing) return;

      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale + delta), 10);
      
      setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (mode === EditorMode.ERASE) {
          startDrawing(e);
      } else {
          setIsDragging(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (mode === EditorMode.ERASE) {
          draw(e);
      } else if (isDragging) {
          setPosition({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUp = () => {
      if (mode === EditorMode.ERASE) {
          stopDrawing();
      }
      setIsDragging(false);
  };

  // --- DRAWING LOGIC (ERASER) ---
  
  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
      if (!maskCanvasRef.current) return { x: 0, y: 0 };
      const rect = maskCanvasRef.current.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: (clientX - rect.left) * (maskCanvasRef.current.width / rect.width),
          y: (clientY - rect.top) * (maskCanvasRef.current.height / rect.height)
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (mode !== EditorMode.ERASE || !maskCanvasRef.current) return;
      setIsDrawing(true);
      const ctx = maskCanvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = brushSize; 
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || mode !== EditorMode.ERASE || !maskCanvasRef.current) return;
      if ('preventDefault' in e) e.preventDefault(); 
      const ctx = maskCanvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const pos = getMousePos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
  };

  if (!imageSrc) {
    return <div className="flex items-center justify-center h-full text-gray-500">Chưa có ảnh nào được chọn</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center overflow-hidden relative canvas-container 
        ${mode === EditorMode.ERASE ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transition: isDragging || isDrawing ? 'none' : 'transform 0.1s ease-out',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
        className="border-4 border-gray-800 bg-white relative origin-center will-change-transform"
      >
        <canvas ref={canvasRef} className="block max-w-none pointer-events-none" />
        
        {/* Mask Canvas Overlay */}
        <canvas 
            ref={maskCanvasRef}
            className={`absolute top-0 left-0 touch-none ${mode === EditorMode.ERASE ? 'pointer-events-auto' : 'pointer-events-none'}`}
            // Touch events for mobile drawing
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur px-3 py-1 rounded-full text-xs text-white font-mono pointer-events-none select-none z-10">
          {Math.round(scale * 100)}%
      </div>
    </div>
  );
});

export default CanvasWorkspace;