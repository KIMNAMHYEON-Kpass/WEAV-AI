
import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from 'react';
import { 
  Search, X, Info, Rocket, History, Ghost, BookOpen, Lightbulb, 
  TrendingUp, Globe, MonitorPlay, ChevronRight, Flame, Lock, 
  Loader2, CheckCircle2, PlayCircle, Layers, Trash2, Link as LinkIcon,
  Sparkles, Clock, LayoutDashboard, Target, Cpu, 
  AlertTriangle, Terminal, ShieldCheck, Image as ImageIcon, Type,
  Video, Wand2, Eye, MessageSquare, Camera, Plus, ChevronDown, ChevronUp,
  Mic2, FileText, AlignLeft, Settings2, Sliders, ArrowUp, ArrowDown, Users,
  Music4, Activity, Smartphone, Monitor, PenTool, Share2, RefreshCcw, Utensils,
  MessageCircle, GripVertical, Zap, Hash, Compass, Sword, Microscope, Palette,
  Map, Film, Church, Heart, FileUp, FileType, Star, Gift, Laptop, Leaf, Coffee, Smile,
  BarChart3, Fingerprint, ClipboardCheck, Quote, ChevronLeft, Box, Boxes, Wand, UploadCloud, EyeOff, CheckSquare, Edit3, ImagePlus, ScanLine
} from 'lucide-react';
import { StudioGlobalContextType, StudioScene, StudioScriptSegment, StudioAnalysisResult, StudioScriptPlanningData } from '@/types/studio';
import { 
  analyzeTopic, analyzeUrlPattern, generateTopics, generatePlanningStep, 
  synthesizeMasterScript, splitScriptIntoScenes, generateSceneImage,
  analyzeReferenceImage, generateScenePrompt
} from '@/services/studio/geminiService';

// --- [전역 상태 관리] ---
const GlobalContext = createContext<StudioGlobalContextType | undefined>(undefined);

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlAnalysisData, setUrlAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [videoFormat, setVideoFormat] = useState('9:16');
  const [inputMode, setInputMode] = useState<'tag' | 'description'>('tag'); 
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isFileLoaded, setIsFileLoaded] = useState(false);

  const [masterScript, setMasterScript] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [referenceImage, setReferenceImage] = useState('');
  const [analyzedStylePrompt, setAnalyzedStylePrompt] = useState('');

  const [analysisResult, setAnalysisResult] = useState<StudioAnalysisResult>({
    niche: [],
    trending: [],
    confidence: '--',
    error: null,
    isAnalyzing: false,
    isUrlAnalyzing: false
  });

  const [scenes, setScenes] = useState<StudioScene[]>([]);
  const [scriptSegments, setScriptSegments] = useState<StudioScriptSegment[]>([]);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [referenceScript, setReferenceScript] = useState('');
  const [scriptStyle, setScriptStyle] = useState('type-a');
  const [scriptLength, setScriptLength] = useState('short');
  const [planningData, setPlanningData] = useState<StudioScriptPlanningData>({
    contentType: '',
    summary: '',
    opening: '',
    body: '',
    climax: '',
    outro: '',
    targetDuration: '1m'
  });

  useEffect(() => {
    const saved = localStorage.getItem('weav_studio_pro_v12');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setActiveTags(p.activeTags || []);
        setUrlInput(p.urlInput || '');
        setVideoFormat(p.videoFormat || '9:16');
        setInputMode(p.inputMode || 'tag');
        setDescriptionInput(p.descriptionInput || '');
        if (p.scenes) setScenes(p.scenes);
        if (p.scriptStyle) setScriptStyle(p.scriptStyle);
        if (p.scriptLength) setScriptLength(p.scriptLength);
        if (p.planningData) setPlanningData(p.planningData);
        if (p.currentStep) setCurrentStep(p.currentStep);
        if (p.selectedTopic) setSelectedTopic(p.selectedTopic);
        if (p.generatedTopics) setGeneratedTopics(p.generatedTopics);
        if (p.masterScript) setMasterScript(p.masterScript);
        if (p.selectedStyle) setSelectedStyle(p.selectedStyle);
        if (p.referenceImage) setReferenceImage(p.referenceImage);
        if (p.analyzedStylePrompt) setAnalyzedStylePrompt(p.analyzedStylePrompt);
      } catch (e) { console.error("Restore Error"); }
    }
  }, []);

  useEffect(() => {
    const data = { 
      currentStep, activeTags, urlInput, videoFormat, inputMode, 
      descriptionInput, scenes, scriptStyle, scriptLength, planningData, 
      selectedTopic, generatedTopics, masterScript, selectedStyle, 
      referenceImage, analyzedStylePrompt 
    };
    localStorage.setItem('weav_studio_pro_v12', JSON.stringify(data));
  }, [currentStep, activeTags, urlInput, videoFormat, inputMode, descriptionInput, scenes, scriptStyle, scriptLength, planningData, selectedTopic, generatedTopics, masterScript, selectedStyle, referenceImage, analyzedStylePrompt]);

  const value = {
    currentStep, setCurrentStep, activeTags, setActiveTags, urlInput, setUrlInput, urlAnalysisData, setUrlAnalysisData,
    isLoading, setIsLoading, isDevMode, setIsDevMode, videoFormat, setVideoFormat,
    analysisResult, setAnalysisResult, inputMode, setInputMode, descriptionInput, setDescriptionInput,
    scenes, setScenes, scriptSegments, setScriptSegments,
    generatedTopics, setGeneratedTopics, selectedTopic, setSelectedTopic, referenceScript, setReferenceScript,
    scriptStyle, setScriptStyle, scriptLength, setScriptLength, planningData, setPlanningData,
    isFileLoaded, setIsFileLoaded, masterScript, setMasterScript, selectedStyle, setSelectedStyle,
    referenceImage, setReferenceImage, analyzedStylePrompt, setAnalyzedStylePrompt
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within GlobalProvider");
  return context;
};

// --- [공통 UI 컴포넌트] ---

const AutoResizeTextarea: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
  isHighlighted?: boolean;
  className?: string;
}> = ({ value, onChange, placeholder, isHighlighted, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`${isHighlighted ? 'ring-2 ring-rose-500 rounded-2xl' : ''}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ui-textarea resize-none leading-relaxed overflow-hidden ${className || ''}`}
        rows={1}
      />
    </div>
  );
};

const StandardTagInput: React.FC = () => {
  const { activeTags, setActiveTags } = useGlobal();
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback((val: string) => {
    const tags = val.split(/[,\s]+/).map(t => t.trim().replace(/#/g, '')).filter(t => t.length > 0);
    if (tags.length > 0) {
      setActiveTags(prev => {
        const next = [...prev];
        tags.forEach(t => {
          if (!next.includes(t) && next.length < 15) next.push(t);
        });
        return next;
      });
    }
    setInputValue('');
  }, [setActiveTags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && activeTags.length > 0) {
      setActiveTags(activeTags.slice(0, -1));
    }
  };

  return (
    <div className="planner-tagbox">
      {activeTags.map((tag, idx) => (
        <span key={idx} className="planner-tag">
          <Hash size={12} /> {tag}
          <button onClick={() => setActiveTags(activeTags.filter(t => t !== tag))} className="planner-tag__remove">
            <X size={12} />
          </button>
        </span>
      ))}
      <div className="planner-tagbox__field">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeTags.length === 0 ? "영상 키워드 입력 (엔터/콤마)" : "키워드 추가..."}
          className="planner-tagbox__input"
        />
        {inputValue && (
          <button onClick={() => addTag(inputValue)} className="planner-tagbox__add">
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({
  kicker,
  title,
  subtitle,
  right
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) => (
  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
    <div className="space-y-3">
      <span className="ui-label">{kicker}</span>
      <h2 className="ui-title">{title}</h2>
      {subtitle && <p className="ui-subtitle max-w-2xl">{subtitle}</p>}
    </div>
    {right}
  </div>
);

// --- [사이드바] ---
const Sidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean, toggleSidebar: () => void }) => {
  const { currentStep, setCurrentStep, isDevMode, setIsDevMode } = useGlobal();
  const steps = [
    { id: 1, name: '1. 기획 및 전략 분석', icon: <Target size={18}/> },
    { id: 2, name: '2. 영상 주제 선정', icon: <Sparkles size={18}/> },
    { id: 3, name: '3. 대본 구조 설계', icon: <PenTool size={18}/> },
    { id: 4, name: '4. 이미지 및 대본 생성', icon: <ImageIcon size={18}/> },
    { id: 5, name: '5. AI 음성 합성', icon: <Mic2 size={18}/> },
    { id: 6, name: '6. AI 영상 생성', icon: <Video size={18}/> },
    { id: 7, name: '7. 최적화 메타 설정', icon: <Monitor size={18}/> },
    { id: 8, name: '8. 썸네일 연구소', icon: <ImageIcon size={18}/> }
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[45] backdrop-blur-sm lg:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300 shadow-2xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shrink-0`}>
        <div className="h-32 px-12 border-b border-slate-100 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Zap size={18} fill="currentColor" className="text-yellow-400" />
            </div>
            <div className="flex flex-col">
              <span className="ui-label">WEAV STUDIO</span>
              <span className="font-serif text-lg text-slate-900">Creative Suite</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-hide">
          {steps.map(s => {
            const isActive = currentStep === s.id;
            const isLocked = !isDevMode && s.id > currentStep;
            return (
              <div
                key={s.id}
                className={`group flex items-center gap-7 px-12 py-6 cursor-pointer transition-all duration-500 relative ${isActive ? 'bg-slate-50/70' : isLocked ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50/40'}`}
                onClick={() => !isLocked && (setCurrentStep(s.id), window.innerWidth < 1024 && toggleSidebar())}
              >
                <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-[13px] font-black border-2 transition-all duration-500 ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-xl rotate-6' : 'bg-white border-slate-200 text-slate-700 group-hover:text-slate-900'}`}>
                  {isLocked ? <Lock size={12} /> : s.id}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className={`text-[14px] font-black uppercase tracking-tight transition-colors duration-300 ${isActive ? 'text-slate-900 italic' : 'text-slate-700 group-hover:text-slate-900'}`}>{s.name}</span>
                  {isActive && <div className="h-[2.5px] w-full bg-rose-600 mt-1.5 animate-in slide-in-from-left duration-700 shadow-lg shadow-rose-200" />}
                </div>
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-rose-600 rounded-l-full shadow-xl shadow-rose-200" />}
              </div>
            );
          })}
        </nav>

        <div className="p-12 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <button onClick={() => setIsDevMode(!isDevMode)} className={`p-4 rounded-[1.2rem] transition-all duration-500 shadow-sm border ${isDevMode ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900'}`}>
            <Terminal size={20} />
          </button>
          <div className="flex flex-col items-end">
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDevMode ? 'text-slate-900' : 'text-slate-700'}`}>Workspace Status</p>
            <p className="text-[9px] text-slate-700 font-bold mt-2 tracking-tighter italic">V 1.2 PRO STABLE</p>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- [Step 1: 기획 및 전략 분석] ---
const TopicAnalysisStep = ({ showToast }: { showToast: (msg: string) => void }) => {
  const { 
    activeTags, setActiveTags, analysisResult, setAnalysisResult, inputMode, setInputMode, descriptionInput, setDescriptionInput,
    videoFormat, setVideoFormat, urlInput, setUrlInput, setGeneratedTopics, urlAnalysisData, setIsLoading, isFileLoaded, setUrlAnalysisData, setCurrentStep
  } = useGlobal();
  
  const [templateMode, setTemplateMode] = useState<'mainstream' | 'niche'>('mainstream');

  const mainstreamCategories = [
    { name: '뉴스/시사', icon: <Globe size={20} />, color: 'bg-blue-50 text-blue-600' },
    { name: '여행/투어', icon: <Map size={20} />, color: 'bg-sky-50 text-sky-600' },
    { name: '요리/맛집', icon: <Utensils size={20} />, color: 'bg-rose-50 text-rose-600' },
    { name: '일상/브이로그', icon: <Camera size={20} />, color: 'bg-indigo-50 text-indigo-600' },
    { name: '과학/지식', icon: <Microscope size={20} />, color: 'bg-emerald-50 text-emerald-600' },
    { name: '영화/드라마', icon: <Film size={20} />, color: 'bg-pink-50 text-pink-600' },
    { name: 'IT/리뷰', icon: <Gift size={20} />, color: 'bg-amber-50 text-amber-600' },
    { name: '자기계발', icon: <Activity size={20} />, color: 'bg-green-50 text-green-600' },
  ];

  const nicheCategories = [
    { name: '미스터리', icon: <Ghost size={20} />, color: 'bg-slate-900 text-white' },
    { name: '전문가 노하우', icon: <PenTool size={20} />, color: 'bg-slate-50 text-slate-600' },
    { name: '오프그리드', icon: <Leaf size={20} />, color: 'bg-emerald-50 text-emerald-600' },
    { name: '골동품 복원', icon: <Settings2 size={20} />, color: 'bg-blue-50 text-blue-600' },
    { name: '밀리터리', icon: <Sword size={20} />, color: 'bg-indigo-50 text-indigo-600' },
    { name: '심리 상담', icon: <Heart size={20} />, color: 'bg-rose-50 text-rose-600' },
    { name: '아카이브/역사', icon: <History size={20} />, color: 'bg-amber-50 text-amber-600' },
    { name: '로컬 탐방', icon: <Compass size={20} />, color: 'bg-sky-50 text-sky-600' },
  ];

  const categories = templateMode === 'mainstream' ? mainstreamCategories : nicheCategories;
  const formatOptions = [
    { id: '9:16', label: '세로형', sub: 'Shorts / Reels', icon: <Smartphone size={16} /> },
    { id: '16:9', label: '가로형', sub: 'YouTube / Standard', icon: <Monitor size={16} /> }
  ];

  const viralTrends = [
    { name: "두바이 초콜릿 제작기", growth: "+1,240%", color: "text-amber-600" },
    { name: "데스크테리어 ASMR", growth: "+850%", color: "text-rose-600" },
    { name: "1인칭 시점 숏무비", growth: "+620%", color: "text-indigo-600" },
    { name: "Y2K 레트로 편집법", growth: "+430%", color: "text-emerald-600" }
  ];

  const runTopicAnalysis = async () => {
    const triggerValue = inputMode === 'tag' ? activeTags.join(', ') : descriptionInput.trim();
    if (triggerValue.length < 2) return showToast("분석할 내용을 입력해주세요.");

    setAnalysisResult(p => ({ ...p, isAnalyzing: true, error: null }));
    try {
      const res = await analyzeTopic(triggerValue, inputMode);
      setAnalysisResult(prev => ({
        ...prev,
        isAnalyzing: false,
        niche: res.niche,
        trending: res.trending,
        confidence: res.confidence
      }));
    } catch (err) {
      setAnalysisResult(p => ({ ...p, isAnalyzing: false, error: "분석 실패" }));
      showToast("분석 엔진 호출 중 오류가 발생했습니다.");
    }
  };

  const runUrlAnalysis = async (url: string) => {
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube\.com\/shorts)\/.+$/;
    if (!ytRegex.test(url)) return showToast("유효한 유튜브 주소가 아닙니다.");
    
    setAnalysisResult(p => ({ ...p, isUrlAnalyzing: true, error: null }));
    try {
      const result = await analyzeUrlPattern(url);
      setUrlAnalysisData(result);
      setAnalysisResult(p => ({
        ...p,
        isUrlAnalyzing: false,
        confidence: 85,
        niche: [result.summary, ...result.patterns.slice(0, 2)],
        trending: ["벤치마킹 데이터 로드 완료"]
      }));
    } catch (e) {
      setAnalysisResult(p => ({ ...p, isUrlAnalyzing: false, error: "분석 실패" }));
      showToast("URL 분석에 실패했습니다.");
    }
  };

  const handleStartTopicGen = async () => {
    if (activeTags.length === 0 && !descriptionInput) return showToast("기획 정보를 입력해주세요.");
    setIsLoading(true);
    try {
      const res = await generateTopics({ tags: activeTags, description: descriptionInput, urlData: urlAnalysisData });
      setGeneratedTopics(res.topics);
      setCurrentStep(2);
    } catch (e) {
      showToast("주제 생성 실패.");
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceValue = typeof analysisResult.confidence === 'number'
    ? analysisResult.confidence
    : parseInt(String(analysisResult.confidence), 10) || 0;

  return (
    <div className="space-y-10 pb-24 max-w-[1200px] mx-auto">
      <SectionHeader
        kicker="Step 1 / Strategy"
        title="기획 분석"
        subtitle="아이디어를 정리하고, 시장과 콘텐츠 방향성을 빠르게 정교화합니다."
      />

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="wf-panel">
            <div className="wf-panel__header">
              <div>
                <div className="wf-panel__title">설정</div>
              </div>
            </div>

            <div className="wf-split">
              <div className="wf-split__col">
                <div className="wf-subhead">
                  <span>영상 포맷</span>
                  <span className="wf-hint">콘텐츠 성격에 맞게 선택</span>
                </div>
                <div className="format-grid">
                  {formatOptions.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setVideoFormat(f.id)}
                      className={`format-option ${videoFormat === f.id ? 'is-active' : ''}`}
                    >
                      <span className="format-option__icon">{f.icon}</span>
                      <span className="format-option__text">
                        <span className="format-option__title">{f.label}</span>
                        <span className="format-option__meta">{f.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="wf-split__divider" />

              <div className="wf-split__col">
                <div className="wf-subhead">
                  <span>시장 카테고리</span>
                  <div className="planner-toggle">
                    <button onClick={() => setTemplateMode('mainstream')} className={`planner-toggle__item ${templateMode === 'mainstream' ? 'is-active' : ''}`}>인기</button>
                    <button onClick={() => setTemplateMode('niche')} className={`planner-toggle__item ${templateMode === 'niche' ? 'is-active' : ''}`}>틈새</button>
                  </div>
                </div>
                <div className="planner-chips">
                  {categories.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setActiveTags(prev => prev.includes(c.name) ? prev.filter(x => x !== c.name) : [...prev, c.name].slice(0, 15))}
                      className={`planner-chip ${activeTags.includes(c.name) ? 'is-active' : ''}`}
                    >
                      <span className="planner-chip__icon">{c.icon}</span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="wf-panel">
            <div className="wf-panel__header">
              <div>
                <div className="wf-panel__title">아이디어</div>
              </div>
              <div className="planner-tabs">
                <button onClick={() => setInputMode('tag')} className={`planner-tab ${inputMode === 'tag' ? 'is-active' : ''}`}>키워드</button>
                <button onClick={() => setInputMode('description')} className={`planner-tab ${inputMode === 'description' ? 'is-active' : ''}`}>설명</button>
              </div>
            </div>
            {inputMode === 'tag' ? (
              <StandardTagInput />
            ) : (
              <div className="space-y-3">
                {isFileLoaded && <span className="ui-badge"><FileText size={12} /> 파일 데이터 로드됨</span>}
                <AutoResizeTextarea
                  value={descriptionInput}
                  onChange={setDescriptionInput}
                  placeholder="영상 기획 내용을 자유롭게 입력하세요."
                  className="min-h-[120px]"
                />
              </div>
            )}
            <button onClick={runTopicAnalysis} disabled={analysisResult?.isAnalyzing} className="wf-primary">
              {analysisResult?.isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              기획 데이터 분석
            </button>
          </div>

          <div className="wf-panel">
            <div className="wf-panel__header">
              <div>
                <div className="wf-panel__title">벤치마킹</div>
              </div>
            </div>
            <div className="wf-inline">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="참고할 유튜브 주소를 입력하세요..." className="ui-input" />
              <button onClick={() => runUrlAnalysis(urlInput)} className="wf-secondary">패턴 분석</button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="wf-panel wf-panel--run space-y-5 relative">
            {analysisResult?.isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <Loader2 size={24} className="animate-spin text-rose-600" />
              </div>
            )}
            <div className="wf-header">
              <div>
                <span className="wf-label">Workflow</span>
                <div className="wf-title">Ideation Run</div>
              </div>
              <div className="wf-score">
                <span className="wf-score__value">{analysisResult?.confidence}</span>
                <span className="wf-score__label">Confidence</span>
              </div>
            </div>
            <div className="wf-progress">
              <div className="wf-progress__bar" style={{ width: `${Math.min(confidenceValue, 100)}%` }} />
            </div>
            <div className="wf-list max-h-[320px] overflow-y-auto scrollbar-hide">
              {analysisResult?.niche?.length > 0 ? (
                <>
                  <div className="wf-node wf-node--active">
                    <div className="wf-node__left">
                      <span className="wf-node__dot" />
                      <span>전략 인사이트 생성</span>
                    </div>
                    <span className="wf-node__status">Running</span>
                  </div>
                  {analysisResult.niche.map((v: any, i: number) => (
                    <div key={i} className="wf-node">
                      <div className="wf-node__left">
                        <span className="wf-node__dot wf-node__dot--muted" />
                        <span>{String(v)}</span>
                      </div>
                      <span className="wf-node__status">Ready</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="wf-empty">
                  <Search size={16} /> 분석 결과가 여기에 표시됩니다.
                </div>
              )}
            </div>
            <button onClick={handleStartTopicGen} disabled={analysisResult?.niche?.length === 0} className="wf-primary">
              주제 생성하기 <ChevronRight size={16} />
            </button>
          </div>

          <div className="wf-panel">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span className="wf-label">Trend Signals</span>
            </div>
            <div className="wf-list text-sm">
              {viralTrends.map((trend, idx) => (
                <div key={idx} className="wf-node wf-node--compact">
                  <div className="wf-node__left">
                    <span className="wf-node__dot wf-node__dot--muted" />
                    <span>{trend.name}</span>
                  </div>
                  <span className="wf-node__status">{trend.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [Step 2: 주제 선정] ---
const TopicGenerationStep = ({ showToast }: { showToast: (msg: string) => void }) => {
  const { generatedTopics, selectedTopic, setSelectedTopic, setCurrentStep } = useGlobal();
  const [manualTopic, setManualTopic] = useState('');

  const handleFinalize = async () => {
    const topic = selectedTopic === 'manual' ? manualTopic : selectedTopic;
    if (!topic) return showToast("분석에 사용할 주제를 선택하거나 직접 입력해주세요.");
    setCurrentStep(3);
  };

  return (
    <div className="space-y-10 pb-24 max-w-[1000px] mx-auto">
      <SectionHeader
        kicker="Step 2 / Topic"
        title="주제 선택"
        subtitle="AI가 추천한 주제 중 하나를 선택하거나 직접 입력하세요."
      />

      <div className="ui-card ui-card--flush overflow-hidden">
        {generatedTopics.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedTopic(topic)}
            className={`topic-row w-full flex items-center justify-between px-6 py-5 text-left transition-colors ${selectedTopic === topic ? 'is-selected' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className={`ui-step__num ${selectedTopic === topic ? 'is-selected' : ''}`}>{(idx + 1).toString().padStart(2, '0')}</span>
              <span className="text-base font-semibold">{topic}</span>
            </div>
            {selectedTopic === topic && <CheckCircle2 size={20} />}
          </button>
        ))}
      </div>

      <div className="ui-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="ui-label">직접 입력</span>
          <button onClick={() => setSelectedTopic('manual')} className="ui-btn ui-btn--secondary">선택</button>
        </div>
        <textarea
          value={manualTopic}
          onChange={e => { setManualTopic(e.target.value); if (selectedTopic !== 'manual') setSelectedTopic('manual'); }}
          placeholder="직접 기획한 고유 주제를 입력하세요..."
          className="ui-textarea min-h-[120px]"
        />
      </div>

      <div className="flex justify-end">
        <button onClick={handleFinalize} disabled={!selectedTopic} className="ui-btn ui-btn--primary">
          주제 확정 및 시나리오 설계
        </button>
      </div>
    </div>
  );
};

// --- [Step 3: 대본 아키텍처] ---
const ScriptPlanningStep = () => {
  const { 
    selectedTopic, scriptStyle, setScriptStyle, scriptLength, setScriptLength,
    planningData, setPlanningData, setCurrentStep, setIsLoading, setScenes,
    masterScript, setMasterScript
  } = useGlobal();

  const [activeSubStep, setActiveSubStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<'architecture' | 'script'>('architecture'); 

  const archetypes = [
    { id: 'type-a', name: '내러티브 중심형', desc: '이야기의 흐름을 따라가는 몰입형 스토리', icon: <AlignLeft size={18} /> },
    { id: 'type-b', name: '정보 큐레이션형', desc: '핵심을 요약하여 전달하는 지식 전달형', icon: <Layers size={18} /> },
    { id: 'type-c', name: '심층 분석 브리핑', desc: '데이터와 근거 기반의 논리적 분석 스타일', icon: <Compass size={18} /> },
    { id: 'type-d', name: '감성 스토리텔링', desc: '공감과 무드를 강조하는 서정적 문체', icon: <BookOpen size={18} /> },
    { id: 'type-e', name: '속보/사건 보고형', desc: '빠른 팩트 전달 중심의 현장감 강조형', icon: <Zap size={18} /> },
    { id: 'type-f', name: 'POV (1인칭 관찰)', desc: '화자의 시선에서 생생하게 전달하는 방식', icon: <MessageCircle size={18} /> },
    { id: 'custom', name: '사용자 지정 스타일', desc: '고유의 개성을 담은 커스텀 디자인 문체', icon: <PenTool size={18} /> },
  ];

  const steps = [
    { id: 1, key: 'contentType', name: '1) 콘텐츠 타입' },
    { id: 2, key: 'summary', name: '2) 전체 이야기 한 줄 요약' },
    { id: 3, key: 'opening', name: '3) 오프닝 기획' },
    { id: 4, key: 'body', name: '4) 본문 구성 설계 파트 별로' },
    { id: 5, key: 'climax', name: '5) 클라이맥스/ 핵심 메시지' },
    { id: 6, key: 'outro', name: '6) 아웃트로 설계' },
  ];

  const durations = [
    { id: '30s', label: '30초 (Short)', icon: <Flame size={14}/> },
    { id: '1m', label: '1분 (Standard)', icon: <Smartphone size={14}/> },
    { id: '3m', label: '3분 (Long)', icon: <MonitorPlay size={14}/> },
    { id: '5m', label: '5분 (Deep)', icon: <Film size={14}/> },
    { id: 'custom', label: '직접 입력', icon: <PenTool size={14}/> }
  ];

  const stepGuides: Record<string, string> = {
    contentType: "이 영상의 정체성을 정의합니다. 어떤 장르이며, 누구에게 어떤 가치를 주고자 하는지 명확히 하세요.",
    summary: "기획의 핵심 줄기를 잡는 과정입니다. 시청자가 기억하게 될 한 문장 메시지를 정의하세요.",
    opening: "첫 5초가 승부처입니다. 시청자의 시선을 즉시 사로잡을 수 있는 강력한 훅을 설계하세요.",
    body: "전달하고자 하는 정보를 논리적인 파트별로 배치합니다. 자연스러운 연결 고리를 설계하세요.",
    climax: "영상의 감정이 고조되거나 지식이 완결되는 가장 임팩트 있는 순간입니다.",
    outro: "영상의 여운을 남기는 마무리입니다. CTA를 명확히 설정하세요."
  };

  const runStepAI = async (key: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await generatePlanningStep(name, { topic: selectedTopic, style: scriptStyle, length: scriptLength, planningData });
      setPlanningData(p => ({ ...p, [key]: res.result }));
    } finally { setIsLoading(false); }
  };

  const handleSynthesizeScript = async () => {
    setIsLoading(true);
    try {
      const res = await synthesizeMasterScript({ 
        topic: selectedTopic, 
        planningData, 
        style: archetypes.find(a=>a.id===scriptStyle)?.name || 'Standard' 
      });
      setMasterScript(res.master_script);
      setReviewMode('script');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToVisualStep = () => {
    setIsPreviewOpen(false);
    setCurrentStep(4);
  };

  return (
    <div className="space-y-10 pb-24 relative max-w-[1200px] mx-auto">
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-5xl w-full ui-card relative space-y-6">
            <button onClick={() => setIsPreviewOpen(false)} className="ui-btn ui-btn--ghost absolute right-4 top-4">
              <X size={16} />
            </button>
            <div className="space-y-2 pr-10">
              <span className="ui-label">{reviewMode === 'architecture' ? '설계안 검토' : '시나리오 교정'}</span>
              <h2 className="font-serif text-2xl text-slate-900">
                {reviewMode === 'architecture' ? '기획 파트 흐름 점검' : '완성 원고 확인'}
              </h2>
              <p className="text-sm text-slate-600">
                {reviewMode === 'architecture'
                  ? '작성된 파트를 검토한 뒤 통합 시나리오를 생성하세요.'
                  : '말투와 흐름을 다듬고 시각화 단계로 이동합니다.'}
              </p>
            </div>

            <div className="max-h-[55vh] overflow-y-auto scrollbar-hide pr-2">
              {reviewMode === 'architecture' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {steps.map(s => (
                    <div key={s.id} className="ui-card--muted space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="ui-label">{s.name}</span>
                        <span className="ui-pill">0{s.id}</span>
                      </div>
                      <AutoResizeTextarea
                        value={planningData[s.key as keyof StudioScriptPlanningData]}
                        onChange={v => setPlanningData(p => ({ ...p, [s.key]: v }))}
                        placeholder={`${s.name} 내용을 입력하세요...`}
                        className="min-h-[120px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ui-card--muted">
                  <AutoResizeTextarea
                    value={masterScript}
                    onChange={setMasterScript}
                    placeholder="전체 원고가 여기에 나타납니다."
                    className="min-h-[320px] text-lg font-semibold"
                  />
                </div>
              )}
            </div>

            {reviewMode === 'architecture' ? (
              <button onClick={handleSynthesizeScript} className="ui-btn ui-btn--primary w-full">
                통합 시나리오 생성하기 <Sparkles size={16} />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setReviewMode('architecture')} className="ui-btn ui-btn--secondary w-full sm:w-auto">
                  설계도 다시 수정
                </button>
                <button onClick={handleGoToVisualStep} className="ui-btn ui-btn--primary w-full sm:flex-1">
                  이미지 및 대본 생성 단계로 <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SectionHeader
        kicker="Step 3 / Script"
        title="시나리오 구조 설계"
        subtitle="전개 구조와 문체를 정리하고, 핵심 메시지를 설계합니다."
      />

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="ui-card space-y-4">
            <span className="ui-label">스타일 선택</span>
            <div className="space-y-2">
              {archetypes.map(a => (
                <button
                  key={a.id}
                  onClick={() => setScriptStyle(a.id)}
                  className={`style-choice w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${scriptStyle === a.id ? 'is-selected' : ''}`}
                >
                  <div className="mt-0.5 style-choice__icon">{a.icon}</div>
                  <div className="text-left">
                    <div className="style-choice__title">{a.name}</div>
                    <div className="style-choice__desc">{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="ui-card space-y-3">
            <span className="ui-label">목표 길이</span>
            <div className="flex flex-wrap gap-2">
              {durations.map(d => (
                <button
                  key={d.id}
                  onClick={() => setPlanningData(p => ({ ...p, targetDuration: d.id === 'custom' ? '' : d.id }))}
                  className={`duration-pill ui-btn ${planningData.targetDuration === d.id || (d.id === 'custom' && !durations.some(x => x.id === planningData.targetDuration)) ? 'ui-btn--primary is-selected' : 'ui-btn--secondary'}`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="ui-card">
            <div className="flex flex-wrap gap-2">
              {steps.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubStep(s.id)}
                  className={`substep-pill ui-btn ${activeSubStep === s.id ? 'ui-btn--primary is-selected' : 'ui-btn--secondary'}`}
                >
                  {s.id}. {s.name.replace(/^\d+\)\s/, '')}
                </button>
              ))}
            </div>
          </div>

          <div className="ui-card space-y-6 min-h-[520px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="ui-label">현재 파트</span>
                <h3 className="font-serif text-2xl text-slate-900">
                  {steps[activeSubStep - 1].name.replace(/^\d+\)\s/, '')}
                </h3>
              </div>
              <button onClick={() => runStepAI(steps[activeSubStep - 1].key, steps[activeSubStep - 1].name)} className="ui-btn ui-btn--secondary">
                <Sparkles size={16} /> AI 초안
              </button>
            </div>

            <div className="ui-card--muted text-sm text-slate-700">
              {stepGuides[steps[activeSubStep - 1].key]}
            </div>

            <AutoResizeTextarea
              value={planningData[steps[activeSubStep - 1].key as keyof StudioScriptPlanningData]}
              onChange={v => setPlanningData(p => ({ ...p, [steps[activeSubStep - 1].key]: v }))}
              className="min-h-[240px] text-lg font-semibold"
              placeholder="아이디어를 상세히 기술하세요..."
            />

            <div className="flex items-center justify-between">
              <button onClick={() => setActiveSubStep(p => Math.max(1, p - 1))} className="ui-btn ui-btn--ghost">
                <ChevronLeft size={16} /> 이전
              </button>
              {activeSubStep < 6 ? (
                <button onClick={() => setActiveSubStep(p => p + 1)} className="ui-btn ui-btn--primary">
                  다음 파트 <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setReviewMode('architecture');
                    setIsPreviewOpen(true);
                  }}
                  className="ui-btn ui-btn--primary"
                >
                  구성 점검 <CheckSquare size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [Step 4: 이미지 및 대본 생성] ---
const ImageAndScriptStep = ({ showToast }: { showToast: (msg: string) => void }) => {
  const { 
    masterScript, scenes, setScenes, setIsLoading, selectedStyle, setSelectedStyle, videoFormat,
    referenceImage, setReferenceImage, analyzedStylePrompt, setAnalyzedStylePrompt
  } = useGlobal();

  const [isImgDragging, setIsImgDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styleLab = [
    { 
      id: 'Realistic', 
      name: '리얼(Realistic)', 
      model: 'fal-ai/imagen4/preview', 
      price: '$0.05', 
      desc: '압도적 고퀄리티 실사 렌더링 스타일', 
      icon: <Camera size={24}/>,
      meta: "최종본(최고퀄): imagen4/preview/ultra ($0.06)" 
    },
    { 
      id: 'Photo', 
      name: '사진풍(Photo)', 
      model: 'fal-ai/nano-banana', 
      price: '$0.039', 
      desc: '자연스러운 채광과 사실적인 렌즈 질감', 
      icon: <ScanLine size={24}/>,
      meta: "최종본(브랜딩): nano-banana-pro ($0.15)"
    },
    { 
      id: 'Illustration', 
      name: '일러스트(Concept)', 
      model: 'fal-ai/flux/dev', 
      price: '$0.025', 
      desc: '감각적인 컨셉 아트 및 드로잉 스타일', 
      icon: <Palette size={24}/>,
      meta: "빠름(러프): flux/schnell ($0.003)"
    },
    { 
      id: 'Anime', 
      name: '애니메이션(Anime)', 
      model: 'fal-ai/fast-sdxl', 
      price: '$0.002', 
      desc: '전통적인 2D/3D 애니메이션 캐릭터 화풍', 
      icon: <Smile size={24}/>,
      meta: "표현확장: flux/dev ($0.025)"
    },
    { 
      id: '3D', 
      name: '3D 렌더(3D Render)', 
      model: 'fal-ai/flux/dev', 
      price: '$0.025', 
      desc: '입체적 재질과 시네마틱 라이팅 렌더링', 
      icon: <Box size={24}/>,
      meta: "실사재질: imagen4/preview ($0.05)"
    },
    { 
      id: 'LineArt', 
      name: '라인 아트(Line Art)', 
      model: 'fal-ai/fast-sdxl', 
      price: '$0.002', 
      desc: '간결한 선과 세련된 명암 대비의 그래픽', 
      icon: <PenTool size={24}/>,
      meta: "정교함: flux/dev ($0.025)"
    },
    { 
      id: 'Custom', 
      name: '사용자 지정(Custom)', 
      model: 'fal-ai/nano-banana', 
      price: '$0.039', 
      desc: '고유의 개성적인 화풍과 창의적 연출 스타일', 
      icon: <Sliders size={24}/>,
      meta: "고퀄기본: flux/dev ($0.025)"
    },
  ];

  const handleStudioSceneSplitting = async () => {
    if (!masterScript) return showToast("시나리오 데이터가 없습니다. 3단계에서 시나리오를 먼저 생성하세요.");
    setIsLoading(true);
    try {
      const splitRes = await splitScriptIntoStudioScenes(masterScript);
      const mapped = splitRes.map((s: any, i: number) => ({
        id: Date.now() + i,
        narrative: s.script_segment,
        aiPrompt: s.scene_description,
        imageUrl: '',
        duration: 5,
        cameraWork: 'Static',
        isPromptVisible: true,
        isSyncing: false,
        isGenerating: false
      }));
      setScenes(mapped);
      showToast("전문가급 씬 매핑이 완료되었습니다.");
    } catch (e) {
      showToast("시나리오 분석 실패.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImgUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setReferenceImage(base64);
      setIsLoading(true);
      try {
        const styleText = await analyzeReferenceImage(base64);
        setAnalyzedStylePrompt(styleText);
        showToast("레퍼런스 이미지 스타일 분석 완료.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addManualStudioScene = () => {
    const newScene: StudioScene = {
      id: Date.now(),
      narrative: '',
      aiPrompt: '',
      imageUrl: '',
      duration: 5,
      cameraWork: 'Static',
      isPromptVisible: true,
      isSyncing: false,
      isGenerating: false
    };
    setScenes([...scenes, newScene]);
    showToast("새 장면이 추가되었습니다.");
  };

  const refinePrompt = async (idx: number) => {
    const scene = scenes[idx];
    const styleObj = styleLab.find(s => s.id === selectedStyle);
    setIsLoading(true);
    try {
      const prompt = await generateStudioScenePrompt(scene.narrative, styleObj?.desc || '', analyzedStylePrompt);
      const next = [...scenes];
      next[idx].aiPrompt = prompt;
      setScenes(next);
      showToast(`${idx+1}번 장면 프롬프트 정밀화 완료.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenImage = async (idx: number) => {
    const scene = scenes[idx];
    const next = [...scenes];
    next[idx].isGenerating = true;
    setScenes(next);
    try {
      const url = await generateStudioSceneImage(scene.aiPrompt, selectedStyle, videoFormat as any);
      const updated = [...scenes];
      updated[idx].imageUrl = url;
      updated[idx].isGenerating = false;
      setScenes(updated);
      showToast(`${idx+1}번 장면 비주얼 생성 완료.`);
    } catch (e) {
      const reset = [...scenes];
      reset[idx].isGenerating = false;
      setScenes(reset);
      showToast("생성 실패.");
    }
  };

  const generateAll = async () => {
    if (scenes.length === 0) return;
    showToast("모든 이미지를 순차적으로 생성합니다...");
    for (let i = 0; i < scenes.length; i++) {
      if (!scenes[i].imageUrl) {
        await handleGenImage(i);
      }
    }
  };

  return (
    <div className="space-y-10 pb-24 max-w-[1200px] mx-auto">
      <SectionHeader
        kicker="Step 4 / Visual"
        title="이미지 및 대본 생성"
        subtitle="장면 단위로 시각적 연출과 프롬프트를 정리합니다."
        right={(
          <div className="flex flex-wrap gap-2">
            <button onClick={handleStudioSceneSplitting} className="ui-btn ui-btn--secondary">
              <ScanLine size={16} /> 대본 분할
            </button>
            <button onClick={generateAll} className="ui-btn ui-btn--primary">
              <Zap size={16} /> 전체 생성
            </button>
          </div>
        )}
      />

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="ui-card space-y-4">
            <span className="ui-label">스타일 선택</span>
            <div className="space-y-2">
              {styleLab.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`style-choice w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${selectedStyle === style.id ? 'is-selected' : ''}`}
                >
                  <div className="mt-0.5 style-choice__icon">{style.icon}</div>
                  <div className="text-left">
                    <div className="style-choice__title">{style.name}</div>
                    <div className="style-choice__desc">{style.desc}</div>
                  </div>
                  <span className="style-choice__price ml-auto">{style.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ui-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="ui-label">레퍼런스</span>
              <button onClick={() => fileInputRef.current?.click()} className="ui-btn ui-btn--secondary">업로드</button>
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleImgUpload(e.target.files[0])} accept="image/*" />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsImgDragging(true); }}
              onDragLeave={() => setIsImgDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsImgDragging(false); if (e.dataTransfer.files[0]) handleImgUpload(e.dataTransfer.files[0]); }}
              className={`aspect-square rounded-2xl border border-dashed flex items-center justify-center overflow-hidden cursor-pointer ${isImgDragging ? 'bg-rose-50 border-rose-500' : 'border-slate-300 bg-white'}`}
            >
              {referenceImage ? (
                <img src={referenceImage} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <ImagePlus size={28} className="mx-auto" />
                  <p className="text-sm">이미지를 드래그하거나 클릭하세요</p>
                </div>
              )}
            </div>
            {analyzedStylePrompt && (
              <div className="ui-card--muted text-sm text-slate-700">
                {analyzedStylePrompt}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="ui-card flex items-center justify-between">
            <span className="ui-label">StudioScene Timeline</span>
            <button onClick={addManualStudioScene} className="ui-btn ui-btn--secondary">
              <Plus size={14} /> 씬 추가
            </button>
          </div>

          {scenes.length > 0 ? (
            scenes.map((scene, idx) => (
              <div key={scene.id} className="ui-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="ui-label">StudioScene {String(idx + 1).padStart(2, '0')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => refinePrompt(idx)} className="ui-btn ui-btn--secondary">
                      <Wand2 size={14} /> 프롬프트 정밀화
                    </button>
                    <button onClick={() => setScenes(scenes.filter(s => s.id !== scene.id))} className="ui-btn ui-btn--ghost">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <span className="ui-label">대본</span>
                      <AutoResizeTextarea
                        value={scene.narrative}
                        onChange={v => { const n = [...scenes]; n[idx].narrative = v; setScenes(n); }}
                        placeholder="대본 조각을 입력하세요..."
                        className="min-h-[120px] text-base font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="ui-label">프롬프트</span>
                      <AutoResizeTextarea
                        value={scene.aiPrompt}
                        onChange={v => { const n = [...scenes]; n[idx].aiPrompt = v; setScenes(n); }}
                        placeholder="장면 연출 설명을 입력하세요..."
                        className="min-h-[140px] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="aspect-video rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative">
                      {scene.isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-rose-600" />
                        </div>
                      )}
                      {scene.imageUrl ? (
                        <img src={scene.imageUrl} alt={`StudioScene ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-500 text-sm">미리보기 없음</div>
                      )}
                    </div>
                    <button onClick={() => handleGenImage(idx)} disabled={scene.isGenerating} className="ui-btn ui-btn--primary w-full">
                      <Wand2 size={14} /> {styleLab.find(s => s.id === selectedStyle)?.name} 생성
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="ui-card--ghost ui-card--airy text-center text-slate-500">
              대본 분할 또는 씬 추가로 시작하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- [메인 레이아웃 쉘] ---
const AppContent = ({ projectName }: { projectName: string }) => {
  const { currentStep, setCurrentStep, isLoading, setIsLoading, setDescriptionInput, setIsFileLoaded, isDevMode, setIsDevMode } = useGlobal();
  const [toast, setToast] = useState<string | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  const showToast = useCallback((msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3500); 
  }, []);

  const handleFileAction = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // 간단한 텍스트 로드 시 기획의도 필드로 주입
        setDescriptionInput(content);
        setIsFileLoaded(true);
        showToast("외부 데이터 소스가 기획 필드에 성공적으로 로드되었습니다.");
      } catch (err) {
        showToast("파일 로드 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  const stepTitles = [
    '1. 기획 및 전략 분석',
    '2. 영상 주제 선정',
    '3. 대본 구조 설계',
    '4. 이미지 및 대본 생성',
    '5. AI 음성 합성',
    '6. AI 영상 생성',
    '7. 최적화 메타 설정',
    '8. 썸네일 연구소'
  ];

  const topSteps = [
    { id: 1, label: '기획', icon: <Target size={14}/> },
    { id: 2, label: '주제', icon: <Sparkles size={14}/> },
    { id: 3, label: '구조', icon: <PenTool size={14}/> },
    { id: 4, label: '비주얼', icon: <ImageIcon size={14}/> },
    { id: 5, label: '음성', icon: <Mic2 size={14}/> },
    { id: 6, label: '영상', icon: <Video size={14}/> },
    { id: 7, label: '메타', icon: <Monitor size={14}/> },
    { id: 8, label: '썸네일', icon: <ImageIcon size={14}/> }
  ];

  return (
    <div 
      className="ui-shell flex flex-1 text-slate-900 overflow-hidden font-sans relative"
      onDragOver={(e) => { e.preventDefault(); setIsGlobalDragging(true); }}
      onDragEnter={(e) => { e.preventDefault(); setIsGlobalDragging(true); }}
      onDragLeave={(e) => { if (e.relatedTarget === null) setIsGlobalDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsGlobalDragging(false); if (e.dataTransfer.files[0]) handleFileAction(e.dataTransfer.files[0]); }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
          <Loader2 size={40} className="text-rose-600 animate-spin mb-4"/>
          <p className="ui-label">Loading</p>
        </div>
      )}
      
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] ui-card">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            {String(toast)}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-hide relative bg-transparent">
        <div className="p-6 lg:p-10 w-full">
          <div className="pb-8">
            <div className="mb-6 text-center">
              <h1 className="font-serif text-3xl text-slate-900 mb-2">{projectName}</h1>
              <span className="ui-label">WEAV Studio Project</span>
            </div>
            <div className="flex justify-center">
              <div className="step-pillbar">
                {topSteps.map(step => {
                  const isActive = currentStep === step.id;
                  const isLocked = !isDevMode && step.id > currentStep;
                  return (
                    <button
                      key={step.id}
                      onClick={() => !isLocked && setCurrentStep(step.id)}
                      className={`step-pill ${isActive ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}`}
                    >
                      <span className="step-pill__num">{step.id}</span>
                      <span className="step-pill__label">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {currentStep === 1 && <TopicAnalysisStep showToast={showToast} />}
          {currentStep === 2 && <TopicGenerationStep showToast={showToast} />}
          {currentStep === 3 && <ScriptPlanningStep />}
          {currentStep === 4 && <ImageAndScriptStep showToast={showToast} />}
        </div>
      </main>
      
      <button
        onClick={() => setIsDevMode(!isDevMode)}
        className="fixed left-6 bottom-6 ui-btn ui-btn--secondary z-40"
      >
        <Terminal size={14} /> Dev
      </button>
    </div>
  );
};

type StudioViewProps = {
  projectName: string;
};

export function StudioView({ projectName }: StudioViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 화면 전환 시 스크롤을 최상단으로 이동
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    // main 태그도 스크롤 가능할 수 있으므로 확인
    const mainElement = containerRef.current?.closest('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
    // window 스크롤도 확인
    window.scrollTo(0, 0);
  }, [projectName]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      <GlobalProvider>
        <AppContent projectName={projectName} />
      </GlobalProvider>
    </div>
  );
}
