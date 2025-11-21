import React, { useState } from 'react';
import { EditorMode } from '../types';
import { Sparkles, User, Scissors, Image as ImageIcon, FileText, Loader2, Zap, MonitorUp } from 'lucide-react';

interface Props {
  mode: EditorMode;
  onExecuteAI: (prompt: string, type?: 'EDIT' | 'UPSCALE') => Promise<void>;
  isProcessing: boolean;
}

const AIPanel: React.FC<Props> = ({ mode, onExecuteAI, isProcessing }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  if (mode !== EditorMode.AI) return null;

  const smartFilters = [
    {
      icon: <User size={18} className="text-pink-400" />,
      label: "Chân dung chuyên nghiệp",
      prompt: "Enhance this portrait. Smooth skin naturally, improve lighting, soft bokeh background, correct color balance for a professional studio look."
    },
    {
        icon: <ImageIcon size={18} className="text-green-400" />,
        label: "Phong cảnh rực rỡ",
        prompt: "Enhance this landscape. Boost saturation slightly, increase dynamic range (HDR effect), sharpen foliage, make the sky pop."
    },
    {
        icon: <FileText size={18} className="text-gray-200" />,
        label: "Tài liệu rõ nét",
        prompt: "Clean up this document. Remove shadows, increase contrast (black text on white background), straighten text, sharpen edges for printing."
    }
  ];

  const tools = [
    {
      icon: <User size={18} />,
      label: "Ảnh thẻ phông xanh",
      prompt: "Change the background to a solid blue color suitable for ID photos. Keep the person sharp."
    },
    {
      icon: <User size={18} className="text-white" />,
      label: "Ảnh thẻ phông trắng",
      prompt: "Change the background to a solid white color suitable for ID photos. Keep the person sharp."
    },
    {
      icon: <Scissors size={18} />,
      label: "Xóa phông nền",
      prompt: "Remove the background completely, leaving a white background. Focus on the main subject."
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onExecuteAI(customPrompt);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2 text-purple-400">
        <Sparkles size={24} />
        <h3 className="text-lg font-bold">Gemini Magic Studio</h3>
      </div>

      {/* AI Upscaler */}
      <div className="space-y-2 border-b border-gray-700 pb-6">
        <h4 className="text-sm font-medium text-gray-300 uppercase flex items-center gap-2">
            <MonitorUp size={14}/> Nâng cấp ảnh (Upscale)
        </h4>
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => onExecuteAI("2x", "UPSCALE")}
                disabled={isProcessing}
                className="p-2 bg-gray-800 hover:bg-purple-900/50 border border-gray-700 rounded-lg text-sm font-bold text-purple-300 transition-all"
            >
                2x HD
            </button>
            <button
                onClick={() => onExecuteAI("4x", "UPSCALE")}
                disabled={isProcessing}
                className="p-2 bg-gray-800 hover:bg-purple-900/50 border border-gray-700 rounded-lg text-sm font-bold text-purple-300 transition-all"
            >
                4x Ultra HD
            </button>
        </div>
      </div>

      {/* Smart Filters */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300 uppercase flex items-center gap-2">
            <Zap size={14}/> Bộ lọc thông minh
        </h4>
        <div className="grid grid-cols-1 gap-2">
            {smartFilters.map((preset, idx) => (
                <button
                key={idx}
                onClick={() => onExecuteAI(preset.prompt)}
                disabled={isProcessing}
                className="flex items-center gap-3 w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all text-sm text-left group disabled:opacity-50"
                >
                <div className="p-2 bg-gray-900 rounded-md group-hover:scale-110 transition-transform">
                    {preset.icon}
                </div>
                <span>{preset.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Quick Tools */}
      <div className="space-y-2 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 uppercase mb-2">Công cụ Ảnh thẻ</h4>
        <div className="grid grid-cols-1 gap-2">
          {tools.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onExecuteAI(preset.prompt)}
              disabled={isProcessing}
              className="flex items-center gap-3 w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all text-sm text-left group disabled:opacity-50"
            >
              <div className="p-2 bg-gray-900 rounded-md text-blue-400 group-hover:text-blue-300">
                {preset.icon}
              </div>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="border-t border-gray-700 pt-6">
        <h4 className="text-sm font-medium text-gray-300 uppercase mb-3">Yêu cầu tùy chỉnh</h4>
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Biến áo sơ mi thành màu trắng, xóa vết bẩn trên tường..."
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-24 resize-none"
          />
          <button
            type="submit"
            disabled={!customPrompt.trim() || isProcessing}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-purple-900 disabled:text-gray-400"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Thực hiện
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIPanel;
