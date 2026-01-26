import React, { useState } from 'react';
import { X, RefreshCcw, User, Shield, Zap, Sparkles, Plus, Trash2, Layout, BookOpen, Palette, Moon, Sun } from 'lucide-react';
import { Persona, PromptTemplate } from '../../types';
import { DEFAULT_PROMPTS } from '../../constants/prompts';
import { useTheme, POINT_COLORS } from '../../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona | null;
  onRetakeOnboarding: () => void;
  customPrompts: PromptTemplate[];
  onSavePrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (id: string) => void;
}

type TabType = 'profile' | 'prompts' | 'appearance';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onRetakeOnboarding,
  customPrompts,
  onSavePrompt,
  onDeletePrompt
}) => {
    const { theme, setTheme, pointColor, setPointColor } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
// ...

    
    // Prompt Form State
    const [isAddingPrompt, setIsAddingPrompt] = useState(false);
    const [newPromptTitle, setNewPromptTitle] = useState('');
    const [newPromptDesc, setNewPromptDesc] = useState('');
    const [newPromptContent, setNewPromptContent] = useState('');

    if (!isOpen) return null;

    const handleSaveNewPrompt = () => {
        if (!newPromptTitle.trim() || !newPromptContent.trim() || !onSavePrompt) return;
        
        const newPrompt: PromptTemplate = {
            id: Date.now().toString(),
            title: newPromptTitle,
            description: newPromptDesc,
            content: newPromptContent,
            isDefault: false
        };

        onSavePrompt(newPrompt);
        setIsAddingPrompt(false);
        setNewPromptTitle('');
        setNewPromptDesc('');
        setNewPromptContent('');
    };

    const allPrompts = [...DEFAULT_PROMPTS, ...customPrompts];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col h-[600px] max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800 shrink-0">
                    <h3 className="text-white font-medium text-lg flex items-center gap-2">
                        {activeTab === 'profile' && <User size={20} className="text-neutral-400" />}
                        {activeTab === 'prompts' && <BookOpen size={20} className="text-indigo-400" />}
                        {activeTab === 'appearance' && <Palette size={20} className="text-rose-400" />}
                        {activeTab === 'profile' ? '설정 및 활동' : activeTab === 'prompts' ? '프롬프트 관리' : '테마 및 스타일'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Container - Column on Mobile, Row on Desktop */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Sidebar Tabs - Top Scroll on Mobile, Left Sidebar on Desktop */}
                    <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/30 p-2 md:p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 md:flex-none text-left px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center md:justify-start gap-2 whitespace-nowrap
                                ${activeTab === 'profile' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}
                            `}
                        >
                            <Layout size={16} />
                            내 프로필
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`flex-1 md:flex-none text-left px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center md:justify-start gap-2 whitespace-nowrap
                                ${activeTab === 'prompts' ? 'bg-neutral-800 text-indigo-300 shadow-md border border-indigo-500/10' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}
                            `}
                        >
                            <Sparkles size={16} />
                            프롬프트 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`flex-1 md:flex-none text-left px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center md:justify-start gap-2 whitespace-nowrap
                                ${activeTab === 'appearance' ? 'bg-neutral-800 text-rose-300 shadow-md border border-rose-500/10' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}
                            `}
                        >
                            <Palette size={16} />
                            테마 및 스타일
                        </button>
                    </div>
                    
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-neutral-900">
                        
                        {/* --- PROFILE TAB --- */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
                                        나의 AI 파트너 (페르소나)
                                    </h4>
                                    
                                    {currentPersona ? (
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                                            {/* Background Gradient */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-white mb-1">
                                                            {currentPersona.name}
                                                        </h2>
                                                        <p className="text-sm text-neutral-400 font-medium">
                                                            {currentPersona.englishName}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-neutral-800 rounded-lg border border-neutral-700">
                                                        <Zap size={20} className="text-yellow-500" />
                                                    </div>
                                                </div>
                                                
                                                <p className="text-lg text-neutral-300 font-serif italic mb-6 leading-relaxed border-l-2 border-neutral-700 pl-4 py-1">
                                                    "{currentPersona.quote}"
                                                </p>
                                                
                                                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                                                    {currentPersona.description}
                                                </p>

                                                <button 
                                                    onClick={onRetakeOnboarding}
                                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <RefreshCcw size={16} />
                                                    <span>페르소나 다시 테스트하기</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 bg-neutral-900/50 rounded-xl border border-neutral-800 border-dashed">
                                            <p className="text-neutral-500 mb-4">설정된 페르소나가 없습니다.</p>
                                            <button 
                                                onClick={onRetakeOnboarding}
                                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                                            >
                                                테스트 시작하기
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
                                        애플리케이션 정보
                                    </h4>
                                    <div className="flex items-center justify-between p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                                        <div className="flex items-center gap-3">
                                            <Shield size={18} className="text-neutral-500" />
                                            <span className="text-sm text-neutral-300">현재 버전</span>
                                        </div>
                                        <span className="text-xs font-mono text-neutral-500">v1.2.0 (Monochrome)</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-4 text-center">
                                        WEAV AI Monochrome Edition &copy; 2024
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- PROMPTS TAB --- */}
                        {activeTab === 'prompts' && (
                            <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
                                {isAddingPrompt ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-white">새 템플릿 추가</h4>
                                            <button 
                                                onClick={() => setIsAddingPrompt(false)}
                                                className="text-xs text-neutral-500 hover:text-white underline"
                                            >
                                                취소
                                            </button>
                                        </div>
                                        <div className="space-y-4 flex-1 overflow-y-auto">
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1.5">템플릿 제목</label>
                                                <input 
                                                    value={newPromptTitle}
                                                    onChange={(e) => setNewPromptTitle(e.target.value)}
                                                    placeholder="예: 인스타그램 마케팅 기획안"
                                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1.5">설명 (선택사항)</label>
                                                <input 
                                                    value={newPromptDesc}
                                                    onChange={(e) => setNewPromptDesc(e.target.value)}
                                                    placeholder="어떤 상황에 사용하는지 간단히 설명"
                                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <label className="block text-xs text-neutral-500 mb-1.5">프롬프트 내용</label>
                                                <textarea 
                                                    value={newPromptContent}
                                                    onChange={(e) => setNewPromptContent(e.target.value)}
                                                    placeholder="AI에게 지시할 내용을 상세히 적어주세요..."
                                                    className="w-full h-48 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 resize-none custom-scrollbar"
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSaveNewPrompt}
                                                disabled={!newPromptTitle.trim() || !newPromptContent.trim()}
                                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                저장하기
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                                    나의 라이브러리
                                                </h4>
                                                <p className="text-[10px] text-neutral-600 mt-1">
                                                    자주 사용하는 프롬프트를 저장하고 채팅방에서 바로 불러오세요.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setIsAddingPrompt(true)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <Plus size={14} />
                                                추가
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {allPrompts.map((prompt) => (
                                                <div 
                                                    key={prompt.id}
                                                    className="group relative bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 hover:bg-neutral-900 transition-all hover:border-neutral-700"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h5 className="text-sm font-bold text-neutral-200">
                                                                    {prompt.title}
                                                                </h5>
                                                                {prompt.isDefault && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                        기본
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-neutral-500 line-clamp-1 mb-2">
                                                                {prompt.description || '설명 없음'}
                                                            </p>
                                                            <div className="text-[10px] text-neutral-600 bg-black/30 p-2 rounded-lg font-mono line-clamp-2 leading-relaxed">
                                                                {prompt.content}
                                                            </div>
                                                        </div>
                                                        
                                                        {!prompt.isDefault && onDeletePrompt && (
                                                            <button 
                                                                onClick={() => {
                                                                    if(window.confirm('이 템플릿을 삭제하시겠습니까?')) {
                                                                        onDeletePrompt(prompt.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- APPEARANCE TAB --- */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
                                        테마 설정
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all
                                                ${theme === 'dark'
                                                    ? 'bg-neutral-800 border-white/20 text-white shadow-lg'
                                                    : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                                            `}
                                        >
                                            <Moon size={24} />
                                            <span className="text-sm font-medium">다크 모드</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all
                                                ${theme === 'light'
                                                    ? 'bg-white border-neutral-200 text-black shadow-lg'
                                                    : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                                            `}
                                        >
                                            <Sun size={24} />
                                            <span className="text-sm font-medium">라이트 모드</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
                                        포인트 컬러
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                        {POINT_COLORS.map((color) => (
                                            <button
                                                key={color.id}
                                                onClick={() => setPointColor(color)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                                    ${pointColor.id === color.id
                                                        ? 'bg-neutral-800 border-white/20 shadow-md'
                                                        : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-700'}
                                                `}
                                                title={color.name}
                                            >
                                                <div
                                                    className="w-6 h-6 rounded-full shadow-inner"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                                <span className="text-[10px] text-neutral-400">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-neutral-600 mt-3">
                                        포인트 컬러는 버튼, 강조 요소 등에 적용됩니다. 모노크롬 감성을 유지하며 미세한 색상 차이를 제공합니다.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};