import React from 'react';
import { EditorMode } from '../types';
import { Eraser, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  mode: EditorMode;
  onApply: () => void;
  onCancel: () => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  isProcessing: boolean;
}

const EraserPanel: React.FC<Props> = ({ mode, onApply, onCancel, brushSize, setBrushSize, isProcessing }) => {
  if (mode !== EditorMode.ERASE) return null;

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2 text-red-400">
        <Eraser size={24} />
        <h3 className="text-lg font-bold">Xóa vật thể (AI)</h3>
      </div>

      <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-2 items-start">
        <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-gray-300">
            Tô màu đỏ lên vật thể bạn muốn xóa khỏi ảnh. AI sẽ tự động phân tích và lấp đầy nền.
        </p>
      </div>

      <div className="space-y-4 border-t border-gray-700 pt-4">
        <div className="flex justify-between text-sm text-gray-300">
            <label>Kích thước bút</label>
            <span>{brushSize}px</span>
        </div>
        <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        
        {/* Visual brush preview */}
        <div className="flex justify-center py-4 h-24 items-center bg-gray-900 rounded-lg">
            <div 
                style={{ width: brushSize, height: brushSize }}
                className="rounded-full bg-red-500/50 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-4">
        <button
            onClick={onApply}
            disabled={isProcessing}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
            <Check size={18} /> {isProcessing ? "Đang xóa..." : "Xóa vật thể"}
        </button>
        
        <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
            <X size={18} /> Hủy bỏ
        </button>
      </div>
    </div>
  );
};

export default EraserPanel;
