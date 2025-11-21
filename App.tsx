import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sliders, Sparkles, RefreshCcw, ImagePlus, Crop as CropIcon, Eraser } from 'lucide-react';
import CanvasWorkspace, { CanvasWorkspaceRef } from './components/CanvasWorkspace';
import PropertiesPanel from './components/PropertiesPanel';
import AIPanel from './components/AIPanel';
import CropPanel from './components/CropPanel';
import EraserPanel from './components/EraserPanel';
import { FilterState, DEFAULT_FILTERS, EditorMode } from './types';
import { fileToDataUri, cropImageToRatio } from './utils';
import { editImageWithAI, removeObjectWithAI, upscaleImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Used to store the image BEFORE crop mode started, allowing non-destructive crop previewing
  const [baseImageForCrop, setBaseImageForCrop] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mode, setMode] = useState<EditorMode>(EditorMode.ADJUST);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<CanvasWorkspaceRef>(null);

  // Manage Mode Switching
  const handleModeChange = async (newMode: EditorMode) => {
      if (mode === newMode) return;

      // If leaving CROP mode without applying (clicking another tool), cancel the crop
      if (mode === EditorMode.CROP && baseImageForCrop) {
          setImageSrc(baseImageForCrop);
          setBaseImageForCrop(null);
      }

      // If entering CROP mode, save the current state
      if (newMode === EditorMode.CROP && imageSrc) {
          // Ensure we have the latest filters applied to the base image before cropping
          // For simplicity in this flow, we assume filters are applied real-time on canvas.
          // Ideally, we might want to "bake" filters before cropping, but keeping filters editable is better.
          // We just save the source.
          setBaseImageForCrop(imageSrc);
      }

      setMode(newMode);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const uri = await fileToDataUri(e.target.files[0]);
        setImageSrc(uri);
        setBaseImageForCrop(null); // Reset crop base
        setFilters(DEFAULT_FILTERS);
        setErrorMsg(null);
        setMode(EditorMode.ADJUST);
      } catch (err) {
        setErrorMsg("Lỗi khi tải ảnh lên.");
      }
    }
  };

  const handleDownload = async () => {
    if (canvasRef.current) {
        const currentImage = await canvasRef.current.getCurrentImage();
        const link = document.createElement('a');
        link.download = 'photopro-edited.png';
        link.href = currentImage;
        link.click();
    }
  };

  const executeAI = async (prompt: string, type: 'EDIT' | 'UPSCALE' = 'EDIT') => {
    if (!imageSrc || !canvasRef.current) return;
    
    setIsProcessingAI(true);
    setErrorMsg(null);

    try {
        const currentImage = await canvasRef.current.getCurrentImage();
        let processedImage: string;
        
        if (type === 'UPSCALE') {
            processedImage = await upscaleImageWithAI(currentImage, prompt as '2x' | '4x');
        } else {
            processedImage = await editImageWithAI(currentImage, prompt);
        }
        
        setImageSrc(processedImage);
        setFilters(DEFAULT_FILTERS);
    } catch (err) {
        console.error(err);
        setErrorMsg("Có lỗi xảy ra khi xử lý AI. Vui lòng thử lại.");
    } finally {
        setIsProcessingAI(false);
    }
  };

  const handleEraseObject = async () => {
      if (!canvasRef.current) return;
      setIsProcessingAI(true);
      try {
          const maskedImage = await canvasRef.current.getMaskedImage();
          if (!maskedImage) throw new Error("Failed to create mask");

          const result = await removeObjectWithAI(maskedImage);
          setImageSrc(result);
          setFilters(DEFAULT_FILTERS);
          setMode(EditorMode.ADJUST); 
      } catch (err) {
          setErrorMsg("Không thể xóa vật thể. Thử lại nhé.");
      } finally {
          setIsProcessingAI(false);
      }
  };

  // Crop Logic
  const handlePreviewCrop = async (w: number, h: number) => {
      // Always crop from the BASE image, not the currently displayed (potentially already cropped) image
      const source = baseImageForCrop || imageSrc; 
      if (!source) return;

      const cropped = await cropImageToRatio(source, w, h);
      setImageSrc(cropped);
      // Keep filters? Yes.
  };

  const handleApplyCrop = () => {
      // Commit the crop: The current imageSrc becomes the new truth, baseImageForCrop is cleared
      setBaseImageForCrop(null);
      setMode(EditorMode.ADJUST);
      if (canvasRef.current) canvasRef.current.resetView();
  };

  const handleCancelCrop = () => {
      if (baseImageForCrop) {
          setImageSrc(baseImageForCrop);
          setBaseImageForCrop(null);
      }
      setMode(EditorMode.ADJUST);
      if (canvasRef.current) canvasRef.current.resetView();
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden font-sans">
      {/* LEFT SIDEBAR - Navigation */}
      <aside className="w-20 flex flex-col items-center py-6 border-r border-gray-800 bg-gray-900 z-10">
        <div className="mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
             <ImagePlus className="text-white" size={24} />
          </div>
        </div>

        <nav className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => handleModeChange(EditorMode.ADJUST)}
            className={`flex flex-col items-center gap-1 p-2 w-full border-l-2 transition-all ${mode === EditorMode.ADJUST ? 'border-blue-500 text-blue-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Sliders size={24} />
            <span className="text-[10px] font-medium">Cơ bản</span>
          </button>

          <button 
            onClick={() => handleModeChange(EditorMode.CROP)}
            className={`flex flex-col items-center gap-1 p-2 w-full border-l-2 transition-all ${mode === EditorMode.CROP ? 'border-green-500 text-green-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <CropIcon size={24} />
            <span className="text-[10px] font-medium">Cắt ảnh</span>
          </button>

          <button 
            onClick={() => handleModeChange(EditorMode.ERASE)}
            className={`flex flex-col items-center gap-1 p-2 w-full border-l-2 transition-all ${mode === EditorMode.ERASE ? 'border-red-500 text-red-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Eraser size={24} />
            <span className="text-[10px] font-medium">Xóa vật</span>
          </button>

          <button 
            onClick={() => handleModeChange(EditorMode.AI)}
            className={`flex flex-col items-center gap-1 p-2 w-full border-l-2 transition-all ${mode === EditorMode.AI ? 'border-purple-500 text-purple-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Sparkles size={24} />
            <span className="text-[10px] font-medium">AI Magic</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 mb-4">
           <button 
            onClick={() => {
                setImageSrc(null);
                setFilters(DEFAULT_FILTERS);
                setBaseImageForCrop(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            title="Làm mới"
            className="p-3 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6 backdrop-blur-md z-10">
            <h1 className="text-lg font-semibold text-white tracking-wide">PhotoPro <span className="text-purple-500 font-light">AI</span></h1>
            
            <div className="flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                    <Upload size={16} />
                    <span>Tải ảnh lên</span>
                </button>

                <button 
                    onClick={handleDownload}
                    disabled={!imageSrc}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    <span>Xuất ảnh</span>
                </button>
            </div>
        </header>

        {/* Error Notification */}
        {errorMsg && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-md text-sm shadow-lg z-50 animate-bounce">
                {errorMsg}
                <button onClick={() => setErrorMsg(null)} className="ml-2 font-bold">✕</button>
            </div>
        )}

        {/* Loading Overlay */}
        {isProcessingAI && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-700 max-w-sm text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-1">Gemini đang làm việc</h3>
                    <p className="text-gray-400 text-sm">Đang xử lý ảnh của bạn với AI...</p>
                </div>
            </div>
        )}

        {/* Workspace */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden">
            {!imageSrc ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-64 h-40 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/50 transition-all"
                     >
                        <Upload className="mb-2 opacity-50" size={32} />
                        <span className="text-sm">Nhấn để tải ảnh</span>
                     </div>
                     <p className="mt-4 text-xs text-gray-600">Hỗ trợ JPG, PNG, WEBP</p>
                </div>
            ) : (
                <CanvasWorkspace 
                    ref={canvasRef}
                    imageSrc={imageSrc} 
                    filters={filters}
                    mode={mode}
                    brushSize={brushSize}
                />
            )}
        </div>
      </main>

      {/* RIGHT SIDEBAR - Properties */}
      <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shadow-xl z-20">
        {imageSrc ? (
           <>
            {mode === EditorMode.ADJUST && (
                <PropertiesPanel 
                    filters={filters} 
                    setFilters={setFilters} 
                    mode={mode} 
                />
            )}
            {mode === EditorMode.CROP && (
                <CropPanel 
                    mode={mode} 
                    onCrop={handlePreviewCrop} 
                    onApply={handleApplyCrop}
                    onCancel={handleCancelCrop}
                />
            )}
            {mode === EditorMode.ERASE && (
                <EraserPanel 
                    mode={mode} 
                    onApply={handleEraseObject}
                    onCancel={() => handleModeChange(EditorMode.ADJUST)}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    isProcessing={isProcessingAI}
                />
            )}
            {mode === EditorMode.AI && (
                <AIPanel 
                    mode={mode} 
                    onExecuteAI={executeAI}
                    isProcessing={isProcessingAI}
                />
            )}
           </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm p-6 text-center">
                Vui lòng tải ảnh lên để sử dụng các công cụ.
            </div>
        )}
        
        {/* Footer Info */}
        <div className="p-4 border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-500">Powered by Google Gemini 2.5 Flash</p>
        </div>
      </aside>
    </div>
  );
};

export default App;