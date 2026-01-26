import React, { useState, useEffect, useRef } from 'react';
import { Settings, Clock, Monitor, Palette, Zap, Sparkles, X, Clapperboard, ChevronRight, ChevronDown, Download, Play, RotateCcw, CheckCircle2, LayoutGrid } from 'lucide-react';
import { AIModel } from '../../types';
import { MODEL_CONFIGS } from '../../constants/videoModels';
import { MODELS } from '../../constants/models';
import { VideoOptions } from './VideoOptions';
import { useChatContext } from '../../contexts/ChatContext'; // Import context
import { MediaGalleryModal } from '../../components/gallery/MediaGalleryModal';

interface DropdownProps {
    value: string;
    options: { value: string; label: string; desc?: string }[];
    onChange: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative w-full" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-all hover:bg-white/10 ${isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}`}
            >
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                    <span className="font-bold text-sm truncate w-full text-left">{selectedOption?.label}</span>
                </div>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-200 origin-top ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition-colors ${option.value === value ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-neutral-300'}`}
                        >
                            <span className="text-sm font-bold">{option.label}</span>
                            {option.desc && <span className={`text-[10px] ${option.value === value ? 'text-indigo-200' : 'text-neutral-500'}`}>{option.desc}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface VideoCreationStudioProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    selectedModel: AIModel;
    onModelSelect: (model: AIModel) => void;
    videoOptions: VideoOptions;
    onVideoOptionsChange: (options: VideoOptions) => void;
    onClose: () => void;
}

export const VideoCreationStudio: React.FC<VideoCreationStudioProps> = ({
    inputValue,
    onInputChange,
    onSend,
    isLoading,
    selectedModel,
    onModelSelect,
    videoOptions,
    onVideoOptionsChange,
    onClose
}) => {
    const { messages } = useChatContext(); // Get messages to find generated video
    const [isVisible, setIsVisible] = useState(false);

    // UI States: 'input' -> 'generating' -> 'result'
    const [uiState, setUiState] = useState<'input' | 'generating' | 'result'>('input');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generatingPrompt, setGeneratingPrompt] = useState<string>("");
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Mobile Tab State: 'prompt' or 'settings'
    const [activeTab, setActiveTab] = useState<'prompt' | 'settings'>('prompt');

    // Animation delay for smooth entry
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, [selectedModel.id]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500);
    };

    const modelKey = selectedModel.id === 'sora' ? 'sora' : 'sora';
    const config = MODEL_CONFIGS[modelKey];

    // Auto-correct invalid options (e.g. 1080p when only 720p is allowed)
    useEffect(() => {
        if (!config) return;

        let newOptions = { ...videoOptions };
        let needsUpdate = false;

        if (!config.resolutions.includes(videoOptions.resolution)) {
            newOptions.resolution = config.resolutions[0];
            needsUpdate = true;
        }
        if (!config.durations.includes(videoOptions.duration)) {
            newOptions.duration = config.durations[0];
            needsUpdate = true;
        }
        if (!config.aspectRatios.includes(videoOptions.aspectRatio)) {
            newOptions.aspectRatio = config.aspectRatios[0];
            needsUpdate = true;
        }

        if (needsUpdate) {
            onVideoOptionsChange(newOptions);
        }
    }, [modelKey, config, videoOptions.resolution, videoOptions.duration, videoOptions.aspectRatio]); // Check dependencies carefully


    const updateOption = <K extends keyof VideoOptions>(key: K, value: VideoOptions[K]) => {
        onVideoOptionsChange({ ...videoOptions, [key]: value });
    };

    const handleModelSwitch = () => {
        // Sora만 사용하므로 스위칭 불필요
        return;
    };

    const handleCreateVideo = async () => {
        const currentPrompt = inputValue;
        setGeneratingPrompt(currentPrompt);
        setUiState('generating');
        await onSend();
        // Restore prompt as requested by user ("프롬프트 작성한거 그대로 남아있는 상태로")
        onInputChange(currentPrompt);
    };

    // Watch for Generation Progress
    const lastMsg = messages[messages.length - 1];
    const progress = lastMsg?.role === 'model' && lastMsg.isStreaming ? lastMsg.progress || 0 : 0;
    const estimatedTime = lastMsg?.role === 'model' && lastMsg.isStreaming ? lastMsg.estimatedTime : null;

    // Watch for Generation Completion
    useEffect(() => {
        if (uiState === 'generating' && !isLoading) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === 'model' && lastMsg.type === 'video') {
                if (lastMsg.mediaUrl) {
                    setGeneratedVideoUrl(lastMsg.mediaUrl);
                    setUiState('result');
                } else if (lastMsg.content.includes("실패") || lastMsg.content.includes("Error") || lastMsg.content.includes("Failed")) {
                    // Start of Error Handling
                    setUiState('input'); // Return to input screen
                    // Optional: You could add a toast here if you have a toast function
                    console.error("Video Generation Error Identified in UI:", lastMsg.content);
                }
            }
        }
    }, [isLoading, messages, uiState]);

    // Reset to input if needed
    const handleReset = () => {
        setUiState('input');
        setGeneratedVideoUrl(null);
    };

    const handleDownload = async () => {
        if (!generatedVideoUrl) return;

        try {
            // Attempt to force download by fetching blob
            const response = await fetch(generatedVideoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Generate filename from prompt
            const filename = `weav_video_${inputValue.slice(0, 30).trim().replace(/\s+/g, '_')}_${Date.now()}.mp4`;
            a.download = filename;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed, falling back to direct link:", error);
            // Fallback: Open in new tab if CORS blocks blob fetch
            window.open(generatedVideoUrl, '_blank');
        }
    };

    return (
        <div
            className={`w-full bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] relative group origin-bottom`}
            style={{
                height: isVisible ? 'calc(100vh - 140px)' : '60px',
                maxHeight: '1200px',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(100px) scale(0.95)',
                marginBottom: '0px'
            }}
        >
            {/* Background Glow Effect */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Top Bar - 반응형으로 개선 */}
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-white/5 relative z-10 min-h-[70px] sm:h-[80px]">
                <div className="flex items-center gap-2 sm:gap-5 flex-1 min-w-0">
                    {/* Model Switcher Button - 모바일에서 간소화 */}
                    <button
                        onClick={uiState === 'input' ? handleModelSwitch : undefined}
                        className={`group relative flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-xl transition-all duration-300 border border-transparent flex-shrink-0
                        ${uiState === 'input' ? 'hover:border-white/10 hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-default'}
                        ${modelKey === 'sora' ? 'text-white' : 'text-white'}`}
                    >
                        <div className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 shadow-lg ${modelKey === 'sora' ? 'bg-black shadow-white/5' : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-blue-500/20'}`}>
                            {modelKey === 'sora' ? (
                                <img src="/sora-logo.png" alt="Sora 2" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                            ) : <Clapperboard size={18} className="sm:w-[22px] sm:h-[22px]" />}
                        </div>

                        {/* 모바일에서는 모델 이름만 표시 */}
                        <div className="text-left hidden sm:block">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-2xl font-bold tracking-tight">
                                    Sora 2
                                </h2>
                                <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border border-white/20 text-neutral-400 font-medium tracking-widest uppercase">
                                    STUDIO
                                </span>
                            </div>
                        </div>
                        {/* 모바일에서 모델 이름 표시 */}
                        <div className="text-left sm:hidden">
                            <h2 className="text-sm font-bold tracking-tight">
                                Sora 2
                            </h2>
                        </div>
                    </button>

                    <div className="hidden sm:block h-10 w-[1px] bg-white/10 mx-2" />

                    {/* Configuration - 반응형으로 개선 */}
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Configuration</span>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-neutral-300 overflow-hidden">
                            {uiState === 'result' ? (
                                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs flex items-center gap-1 flex-shrink-0">
                                    <CheckCircle2 size={8} className="sm:w-[10px] sm:h-[10px]" /> Completed
                                </span>
                            ) : (
                                <div className="flex gap-1 overflow-hidden">
                                    <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs flex-shrink-0">{videoOptions.resolution}</span>
                                    <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs flex-shrink-0 hidden xs:inline">{videoOptions.aspectRatio}</span>
                                    <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs flex-shrink-0">{videoOptions.duration}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons - 반응형으로 개선 */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        onClick={() => setIsGalleryOpen(true)}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs sm:text-sm text-neutral-300 hover:text-white group"
                    >
                        <LayoutGrid size={14} className="sm:w-4 sm:h-4 group-hover:text-indigo-400 transition-colors" />
                        <span className="font-medium hidden sm:inline">Gallery</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs sm:text-sm text-neutral-300 hover:text-white"
                    >
                        <span className="font-medium hidden sm:inline">Exit Studio</span>
                        <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content - 완전히 새로운 반응형 레이아웃 */}
            <div className={`h-[calc(100%-70px)] sm:h-[calc(100%-80px)] overflow-hidden transition-opacity duration-500 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

                {/* 모바일: 세로 스크롤 레이아웃 */}
                <div className="block lg:hidden h-full overflow-y-auto">
                    {/* UI State에 따른 모바일 레이아웃 */}
                    {uiState === 'input' && (
                        <div className="p-4 space-y-6">
                            {/* 프롬프트 섹션 */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles size={12} className="text-yellow-500" />
                                    Prompt Engineering
                                </label>
                                <div className="relative bg-black/20 rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-colors focus-within:border-indigo-500/50 focus-within:bg-black/40 group/input">
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => onInputChange(e.target.value)}
                                        disabled={uiState !== 'input'}
                                        placeholder="상상하는 장면을 상세하게 묘사해보세요.&#13;&#10;[팁] 샷 종류(Wide/Close-up), 피사체, 행동, 배경, 조명을 포함하면 더 좋습니다.&#13;&#10;(예: Wide shot of a neon-lit Tokyo street, cinematic lighting, 4K)"
                                        className="w-full h-32 bg-transparent text-base text-white placeholder-neutral-600 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                                        spellCheck={false}
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-neutral-600 font-medium group-focus-within/input:text-neutral-400">
                                        {inputValue.length} chars
                                    </div>
                                </div>
                            </div>

                            {/* 설정 섹션들 */}
                            <div className="space-y-4">
                                {/* Style Selector */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Palette size={12} /> Style Preset
                                    </label>
                                    <Dropdown
                                        options={config.styles.map(s => ({ value: s.id, label: s.name, desc: s.desc }))}
                                        value={videoOptions.style}
                                        onChange={(val) => updateOption('style', val)}
                                    />
                                </div>

                                {/* 해상도, 비율, 기간을 세로로 배치 */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Zap size={12} /> Resolution
                                        </label>
                                        <Dropdown
                                            options={config.resolutions.map(r => ({ value: r, label: r }))}
                                            value={videoOptions.resolution}
                                            onChange={(val) => updateOption('resolution', val)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Monitor size={12} /> Aspect Ratio
                                        </label>
                                        <Dropdown
                                            options={config.aspectRatios.map(r => ({ value: r, label: r }))}
                                            value={videoOptions.aspectRatio}
                                            onChange={(val) => updateOption('aspectRatio', val)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Clock size={12} /> Duration
                                        </label>
                                        <Dropdown
                                            options={config.durations.map(d => ({ value: d, label: d }))}
                                            value={videoOptions.duration}
                                            onChange={(val) => updateOption('duration', val)}
                                        />
                                    </div>
                                </div>

                                {/* 미리보기 */}
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 group min-h-[200px]">
                                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700
                                    ${videoOptions.style === 'realistic' ? 'from-slate-900 to-slate-700' :
                                            videoOptions.style === 'cinematic' ? 'from-amber-900/40 to-black' :
                                                videoOptions.style === '3d-animation' ? 'from-blue-600/40 to-purple-900/40' :
                                                    videoOptions.style === 'anime' ? 'from-pink-500/20 to-purple-900/40' :
                                                        videoOptions.style === 'fantasy' ? 'from-emerald-900/40 to-black' :
                                                            'from-neutral-900 to-black'
                                        }`} />

                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center mb-4 shadow-2xl border border-white/10">
                                            <Sparkles className="text-white/50" size={24} />
                                        </div>
                                        <p className="text-white font-bold text-base sm:text-lg mb-1">{config.styles.find(s => s.id === videoOptions.style)?.name}</p>
                                        <p className="text-neutral-400 text-xs sm:text-sm max-w-[80%]">{config.styles.find(s => s.id === videoOptions.style)?.desc}</p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest text-center">Preview</div>
                                    </div>
                                </div>
                            </div>

                            {/* 비용 및 생성 버튼 */}
                            <div className="space-y-4">
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-neutral-500 tracking-wider">ESTIMATED COST</span>
                                        <span className="text-xs font-bold text-emerald-400">~{parseInt(videoOptions.duration || '0') * 5 + (videoOptions.resolution === '4K' ? 50 : 25)} TOKENS</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${(parseInt(videoOptions.duration || '0') / (modelKey === 'sora' ? 20 : 8)) * 100}%` }} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateVideo}
                                    disabled={!inputValue.trim() || uiState !== 'input'}
                                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform items-center justify-center gap-2 flex text-base
                                    ${inputValue.trim() && uiState === 'input'
                                            ? 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                            : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                        }`}
                                >
                                    <Clapperboard size={20} />
                                    <span>Create Video</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 모바일 생성 중 상태 */}
                    {uiState === 'generating' && (
                        <div className="h-full flex flex-col items-center justify-center p-6 gap-8">
                            <div className="w-full max-w-sm">
                                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-4 uppercase tracking-widest">
                                    <span>Generating Video</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative mb-4">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] skew-x-12" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-neutral-500 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>{progress < 30 ? 'Initializing...' : progress < 70 ? 'Rendering...' : 'Finalizing...'}</span>
                                    </div>
                                    <div className="text-xs text-neutral-600 font-mono">
                                        ETA: {estimatedTime || 'Calculating...'}
                                    </div>
                                </div>

                                <div className="bg-[#111] p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white/5 rounded-xl flex-shrink-0">
                                            <Clapperboard size={16} className="text-white" />
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-white">Generation in Progress</h3>
                                            <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                                                "{generatingPrompt || inputValue}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 모바일 결과 상태 */}
                    {uiState === 'result' && (
                        <div className="h-full flex flex-col p-4 gap-4">
                            <div className="flex-1 bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
                                {generatedVideoUrl ? (
                                    <video
                                        src={generatedVideoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-neutral-500">Video not found</div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={handleDownload} className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                                    <Download size={18} />
                                    <span className="text-sm">Download</span>
                                </button>
                                <button onClick={handleReset} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 데스크톱: 기존 2단 레이아웃 유지 */}
                <div className="hidden lg:flex lg:flex-row h-full overflow-hidden">
                    {/* Left Column: Prompting */}
                    <div className="w-[45%] p-6 border-r border-white/5 flex flex-col">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Sparkles size={12} className="text-yellow-500" />
                            Prompt Engineering
                        </label>
                        <div className="flex-1 relative bg-black/20 rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-colors focus-within:border-indigo-500/50 focus-within:bg-black/40 group/input">
                            <textarea
                                value={inputValue}
                                onChange={(e) => onInputChange(e.target.value)}
                                disabled={uiState !== 'input'}
                                placeholder="상상하는 장면을 상세하게 묘사해보세요.&#13;&#10;[팁] 샷 종류(Wide/Close-up), 피사체, 행동, 배경, 조명을 포함하면 더 좋습니다.&#13;&#10;(예: Wide shot of a neon-lit Tokyo street, cinematic lighting, 4K)"
                                className="w-full h-full bg-transparent text-lg text-white placeholder-neutral-600 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                                spellCheck={false}
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-neutral-600 font-medium group-focus-within/input:text-neutral-400">
                                {inputValue.length} chars
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-xs text-neutral-500">
                                {uiState === 'input' ? '* AI가 프롬프트를 자동으로 보정합니다.' : 'AI is creating your masterpiece...'}
                            </div>
                            <button
                                onClick={handleCreateVideo}
                                disabled={!inputValue.trim() || uiState !== 'input'}
                                className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 transform items-center gap-2 flex
                                ${inputValue.trim() && uiState === 'input'
                                        ? 'bg-white text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed hidden'
                                    }`}
                            >
                                <Clapperboard size={18} />
                                <span>Create Video</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Settings & Results */}
                    <div className="flex-1 p-6 relative flex flex-col overflow-hidden">
                        {/* Input Controls */}
                        <div className={`transition-all duration-700 absolute inset-0 flex flex-col gap-6
                            ${uiState === 'input' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-full opacity-0 z-0 pointer-events-none'}`}>

                            <div className="flex flex-col gap-6 flex-1">
                                {/* Style Selector */}
                                <div className="relative z-30">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <Palette size={12} /> Style Preset
                                    </label>
                                    <Dropdown
                                        options={config.styles.map(s => ({ value: s.id, label: s.name, desc: s.desc }))}
                                        value={videoOptions.style}
                                        onChange={(val) => updateOption('style', val)}
                                    />
                                </div>

                                {/* Settings Grid */}
                                <div className="grid grid-cols-3 gap-4 relative z-20">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Zap size={12} /> Resolution
                                        </label>
                                        <Dropdown
                                            options={config.resolutions.map(r => ({ value: r, label: r }))}
                                            value={videoOptions.resolution}
                                            onChange={(val) => updateOption('resolution', val)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Monitor size={12} /> Ratio
                                        </label>
                                        <Dropdown
                                            options={config.aspectRatios.map(r => ({ value: r, label: r }))}
                                            value={videoOptions.aspectRatio}
                                            onChange={(val) => updateOption('aspectRatio', val)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Clock size={12} /> Duration
                                        </label>
                                        <Dropdown
                                            options={config.durations.map(d => ({ value: d, label: d }))}
                                            value={videoOptions.duration}
                                            onChange={(val) => updateOption('duration', val)}
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 group min-h-[200px] relative z-10">
                                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700
                                    ${videoOptions.style === 'realistic' ? 'from-slate-900 to-slate-700' :
                                            videoOptions.style === 'cinematic' ? 'from-amber-900/40 to-black' :
                                                videoOptions.style === '3d-animation' ? 'from-blue-600/40 to-purple-900/40' :
                                                    videoOptions.style === 'anime' ? 'from-pink-500/20 to-purple-900/40' :
                                                        videoOptions.style === 'fantasy' ? 'from-emerald-900/40 to-black' :
                                                            'from-neutral-900 to-black'
                                        }`} />

                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center mb-4 shadow-2xl border border-white/10">
                                            <Sparkles className="text-white/50" size={32} />
                                        </div>
                                        <p className="text-white font-bold text-lg mb-1">{config.styles.find(s => s.id === videoOptions.style)?.name}</p>
                                        <p className="text-neutral-400 text-sm max-w-[80%]">{config.styles.find(s => s.id === videoOptions.style)?.desc}</p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest text-center">Preview Image</div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-neutral-500 tracking-wider">ESTIMATED COST</span>
                                    <span className="text-xs font-bold text-emerald-400">~{parseInt(videoOptions.duration || '0') * 5 + (videoOptions.resolution === '4K' ? 50 : 25)} TOKENS</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${(parseInt(videoOptions.duration || '0') / (modelKey === 'sora' ? 20 : 8)) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Generating State */}
                        <div className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col items-center justify-center gap-8
                            ${uiState === 'generating' ? 'translate-x-0 opacity-100 z-20' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>

                            <div className="relative w-full max-w-md">
                                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest">
                                    <span>Generating Video</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] skew-x-12" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2 text-neutral-500 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>{progress < 30 ? 'Initializing GPU...' : progress < 70 ? 'Rendering Frames...' : 'Finalizing Encoding...'}</span>
                                    </div>
                                    <div className="text-xs text-neutral-600 font-mono">
                                        ETA: {estimatedTime || 'Calculating...'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 w-full max-w-md">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <Clapperboard size={20} className="text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-white">Generation in Progress</h3>
                                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                                            "{generatingPrompt || inputValue}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result State */}
                        <div className={`transition-all duration-700 absolute inset-0 p-6 flex flex-col gap-6
                            ${uiState === 'result' ? 'translate-x-0 opacity-100 z-30' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>

                            <div className="flex-1 bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
                                {generatedVideoUrl ? (
                                    <video
                                        src={generatedVideoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-neutral-500">Video not found</div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={handleDownload} className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                                    <Download size={20} />
                                    Download Video
                                </button>
                                <button onClick={handleReset} className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
