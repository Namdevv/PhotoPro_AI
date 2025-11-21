import React, { useState } from 'react';
import { EditorMode, CropRatio } from '../types';
import { Crop, Square, RectangleVertical, RectangleHorizontal, Check, X } from 'lucide-react';

interface Props {
  mode: EditorMode;
  onCrop: (ratioW: number, ratioH: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

const CropPanel: React.FC<Props> = ({ mode, onCrop, onApply, onCancel }) => {
  const [customW, setCustomW] = useState<string>('');
  const [customH, setCustomH] = useState<string>('');

  if (mode !== EditorMode.CROP) return null;

  const ratios: CropRatio[] = [
    { label: "1:1 (Vuông)", width: 1, height: 1 },
    { label: "3:4 (Ảnh thẻ)", width: 3, height: 4 },
    { label: "4:6 (Bưu thiếp)", width: 4, height: 6 },
    { label: "16:9 (Màn hình)", width: 16, height: 9 },
    { label: "9:16 (Story)", width: 9, height: 16 },
    { label: "2:3 (DSLR)", width: 2, height: 3 },
  ];

  const handleCustomCrop = () => {
      const w = parseFloat(customW);
      const h = parseFloat(customH);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          onCrop(w, h);
      }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-6 flex flex-col">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
        <Crop size={20} /> Cắt ảnh chuẩn
      </h3>
      
      <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-800/50">
          <p className="text-xs text-blue-200">
            Đang ở chế độ xem trước. Chọn tỷ lệ để thay đổi. Nhấn "Áp dụng" để lưu.
          </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ratios.map((r, idx) => (
            <button
                key={idx}
                onClick={() => onCrop(r.width, r.height)}
                className="flex flex-col items-center justify-center p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-lg transition-all group"
            >
                <div className="mb-1 text-gray-400 group-hover:text-blue-400">
                    {r.width === r.height ? <Square size={20} /> : 
                     r.width > r.height ? <RectangleHorizontal size={20} /> : 
                     <RectangleVertical size={20} />}
                </div>
                <span className="text-xs font-medium">{r.label}</span>
                <span className="text-[10px] text-gray-500">{r.width}:{r.height}</span>
            </button>
        ))}
      </div>

      {/* Custom Ratio */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Tùy chỉnh tỷ lệ</h4>
          <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Rộng" 
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
              />
              <span className="text-gray-500">:</span>
              <input 
                type="number" 
                placeholder="Cao" 
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
              />
          </div>
          <button 
            onClick={handleCustomCrop}
            className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded text-white"
          >
              Xem thử
          </button>
      </div>

      <div className="mt-auto space-y-2 pt-6">
          <button 
            onClick={onApply}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
              <Check size={18} /> Áp dụng cắt
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
              <X size={18} /> Hủy bỏ
          </button>
      </div>
    </div>
  );
};

export default CropPanel;