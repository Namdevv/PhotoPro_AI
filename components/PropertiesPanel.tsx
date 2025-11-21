import React from 'react';
import { FilterState, EditorMode } from '../types';
import { Sliders, Sun, Moon, Droplet, Eye, EyeOff, Layers } from 'lucide-react';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  mode: EditorMode;
}

const PropertiesPanel: React.FC<Props> = ({ filters, setFilters, mode }) => {
  const handleChange = (key: keyof FilterState, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (mode !== EditorMode.ADJUST) return null;

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Sliders size={20} /> Điều chỉnh cơ bản
      </h3>

      <div className="space-y-4">
        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-300">
            <label className="flex items-center gap-2"><Sun size={14} /> Độ sáng</label>
            <span>{filters.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.brightness}
            onChange={(e) => handleChange('brightness', Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-300">
            <label className="flex items-center gap-2"><Moon size={14} /> Tương phản</label>
            <span>{filters.contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.contrast}
            onChange={(e) => handleChange('contrast', Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-300">
            <label className="flex items-center gap-2"><Droplet size={14} /> Bão hòa màu</label>
            <span>{filters.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.saturation}
            onChange={(e) => handleChange('saturation', Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-400 uppercase">Hiệu ứng</h4>
            
            {/* Grayscale */}
            <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-300">
                <label className="flex items-center gap-2"><EyeOff size={14} /> Đen trắng</label>
                <span>{filters.grayscale}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={(e) => handleChange('grayscale', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            </div>

            {/* Sepia */}
            <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-300">
                <label className="flex items-center gap-2"><Layers size={14} /> Sepia</label>
                <span>{filters.sepia}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={filters.sepia}
                onChange={(e) => handleChange('sepia', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            </div>

             {/* Blur */}
             <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-300">
                <label className="flex items-center gap-2"><Eye size={14} /> Làm mờ</label>
                <span>{filters.blur}px</span>
            </div>
            <input
                type="range"
                min="0"
                max="20"
                value={filters.blur}
                onChange={(e) => handleChange('blur', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            </div>
        </div>
      </div>

      <button 
        onClick={() => setFilters({
            brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0
        })}
        className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded transition-colors"
      >
        Đặt lại mặc định
      </button>
    </div>
  );
};

export default PropertiesPanel;