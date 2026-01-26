import React, { useState, useRef, useEffect } from 'react';
import { Settings, Clock, Monitor, Palette, Zap, X } from 'lucide-react';
import { AIModel } from '../../types';

export interface VideoOptions {
  duration: string;
  resolution: string;
  style: string;
  aspectRatio: string;
}

interface VideoOptionsProps {
  model: AIModel;
  options: VideoOptions;
  onOptionsChange: (options: VideoOptions) => void;
  disabled?: boolean;
}

import { MODEL_CONFIGS } from '../../constants/videoModels';

export const VideoOptions: React.FC<VideoOptionsProps> = ({
  model,
  options,
  onOptionsChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const modelKey = model.id === 'sora' ? 'sora' : 'sora';
  const config = MODEL_CONFIGS[modelKey];

  const updateOption = <K extends keyof VideoOptions>(key: K, value: VideoOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  // Ensure selected options are valid for the current model
  useEffect(() => {
    // Only validate if we have options and they restrict the current selection
    let newOptions = { ...options };
    let hasChanges = false;

    if (!config.durations.includes(options.duration as any)) {
      newOptions.duration = config.durations[0];
      hasChanges = true;
    }
    if (!config.resolutions.includes(options.resolution as any)) {
      newOptions.resolution = config.resolutions[0];
      hasChanges = true;
    }
    if (!config.aspectRatios.includes(options.aspectRatio as any)) {
      newOptions.aspectRatio = config.aspectRatios[0];
      hasChanges = true;
    }

    // Check if style exists in new config
    const styleExists = config.styles.some(s => s.id === options.style);
    if (!styleExists) {
      newOptions.style = config.styles[0].id;
      hasChanges = true;
    }

    if (hasChanges) {
      onOptionsChange(newOptions);
    }
  }, [model.id]); // Run when model changes

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!model.isVideo) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 
          ${isOpen
            ? 'bg-red-500/10 text-red-400 border-red-500/30'
            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
          } disabled:opacity-50`}
      >
        <Settings size={14} className={isOpen ? 'animate-spin-slow' : ''} />
        <span className="hidden sm:inline">동영상 옵션</span>
        <span className="sm:hidden">옵션</span>
      </button>

      {/* Floating Popover - Positioned absolute above the button */}
      <div
        className={`absolute bottom-full mb-3 left-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-5 shadow-2xl transition-all duration-300 origin-bottom-left z-50
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings size={16} className="text-red-500" />
            {model.name} 설정
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Section 1: Spec (Duration, Resolution, Ratio) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={10} /> 길이
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {config.durations.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => updateOption('duration', duration)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${options.duration === duration
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-transparent hover:bg-neutral-800'
                      }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={10} /> 화면비
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {config.aspectRatios.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => updateOption('aspectRatio', ratio)}
                    className={`px-1 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center justify-center ${options.aspectRatio === ratio
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-transparent hover:bg-neutral-800'
                      }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution (Full Width) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={10} /> 해상도
            </label>
            <div className="flex bg-neutral-900 p-1 rounded-xl">
              {config.resolutions.map((resolution) => (
                <button
                  key={resolution}
                  onClick={() => updateOption('resolution', resolution)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${options.resolution === resolution
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  {resolution}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={10} /> 스타일
            </label>
            <div className="space-y-2">
              {config.styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateOption('style', style.id)}
                  className={`w-full group text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${options.style === style.id
                    ? 'bg-neutral-800 border-white/20 text-white'
                    : 'bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full transition-colors ${options.style === style.id ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-neutral-700 group-hover:bg-neutral-600'
                    }`} />
                  <div>
                    <div className={`text-xs font-medium ${options.style === style.id ? 'text-white' : 'text-neutral-300'}`}>{style.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-5 pt-3 border-t border-neutral-800/50 flex items-center justify-between text-[10px] text-neutral-500">
          <span>예상 소요 시간: {
            options.duration === '60s' ? '5분+' :
              options.duration === '30s' ? '2분' :
                options.duration === '5s' ? '30초' : '1분'
          }</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            생성 가능
          </span>
        </div>
      </div>
    </div>
  );
};