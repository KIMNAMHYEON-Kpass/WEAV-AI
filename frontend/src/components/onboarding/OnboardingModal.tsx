import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ONBOARDING_QUESTIONS, calculatePersona } from '../../constants/personas';
import { Persona } from '../../types';

interface OnboardingModalProps {
    onComplete: (persona: Persona) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0); // 0 to 4 are questions, 5 is result
    const [answers, setAnswers] = useState<('A' | 'B')[]>([]);
    const [result, setResult] = useState<Persona | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleSelect = (value: 'A' | 'B') => {
        if (isAnimating) return;
        
        setIsAnimating(true);
        const newAnswers = [...answers, value];
        setAnswers(newAnswers);

        setTimeout(() => {
            if (step < ONBOARDING_QUESTIONS.length - 1) {
                setStep(step + 1);
            } else {
                // Calculation
                const persona = calculatePersona(newAnswers);
                setResult(persona);
                setStep(step + 1); // Move to result view
            }
            setIsAnimating(false);
        }, 300); // Wait for fade out
    };

    const currentQuestion = ONBOARDING_QUESTIONS[step];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            {/* Increased max-width to 5xl for a larger presence */}
            <div className="w-full max-w-5xl bg-[#0a0a0a] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh] overflow-y-auto custom-scrollbar">
                
                {/* Background Texture */}
                <div 
                    className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle at 50% 0%, #ffffff 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }} 
                />

                {/* Content Container */}
                <div className="relative z-10 p-6 md:p-10 lg:p-16 min-h-[600px] md:min-h-[700px] flex flex-col justify-center">
                    
                    {/* Progress Bar (Only for questions) */}
                    {step < ONBOARDING_QUESTIONS.length && (
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-neutral-900">
                            <div 
                                className="h-full bg-white transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                style={{ width: `${((step + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }}
                            />
                        </div>
                    )}

                    {step < ONBOARDING_QUESTIONS.length ? (
                        /* Question View */
                        <div className={`transition-all duration-500 ease-out max-w-4xl mx-auto w-full ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
                            <span className="inline-block px-4 py-1.5 rounded-full bg-neutral-900 text-neutral-400 text-xs md:text-sm font-bold mb-6 md:mb-8 border border-neutral-800 tracking-wider">
                                QUESTION {step + 1} / {ONBOARDING_QUESTIONS.length}
                            </span>
                            
                            {/* Larger Question Text - Responsive Size */}
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-8 md:mb-12 leading-tight tracking-tight">
                                "{currentQuestion.situation}"
                            </h2>

                            {/* Increased Gap and Grid layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className="group relative p-6 md:p-8 h-full rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800 text-left transition-all hover:border-neutral-500 active:scale-[0.98] hover:shadow-lg"
                                    >
                                        <div className="flex flex-col gap-4 md:gap-6 h-full">
                                            <div className="flex items-center justify-between">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-neutral-700 bg-neutral-950 flex items-center justify-center text-base md:text-lg font-bold text-neutral-500 group-hover:text-white group-hover:border-white transition-colors">
                                                    {option.value}
                                                </div>
                                                <div className="text-sm md:text-base font-bold text-neutral-400 group-hover:text-white transition-colors">
                                                    {option.label}
                                                </div>
                                            </div>
                                            
                                            <div className="text-base md:text-lg text-neutral-300 leading-relaxed group-hover:text-white font-medium">
                                                {option.text}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : result ? (
                        /* Result View */
                        <div className="text-center animate-fade-in max-w-3xl mx-auto py-8">
                            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                                <Sparkles size={32} className="text-black md:hidden" />
                                <Sparkles size={48} className="text-black hidden md:block" />
                            </div>
                            
                            <h3 className="text-sm md:text-base font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                                당신의 수익 창출 페르소나
                            </h3>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                                {result.name}
                            </h1>
                            <p className="text-lg md:text-xl text-neutral-400 font-medium mb-8 md:mb-10">
                                {result.englishName}
                            </p>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 md:p-10 mb-8 md:mb-10 text-left backdrop-blur-sm">
                                <p className="text-xl md:text-3xl text-neutral-200 font-serif italic mb-6 md:mb-8 text-center leading-relaxed">
                                    "{result.quote}"
                                </p>
                                <hr className="border-neutral-800 my-6 md:my-8 opacity-50" />
                                <p className="text-base md:text-lg text-neutral-400 leading-loose text-center">
                                    {result.description}
                                </p>
                            </div>

                            <button
                                onClick={() => onComplete(result)}
                                className="w-full py-5 md:py-6 bg-white hover:bg-neutral-200 text-black text-base md:text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
                            >
                                <span>이 페르소나로 시작하기</span>
                                <ArrowRight size={20} className="md:hidden" />
                                <ArrowRight size={24} className="hidden md:block" />
                            </button>
                            
                            <p className="mt-6 text-xs md:text-sm text-neutral-600">
                                * 설정 &gt; 페르소나 변경에서 언제든지 바꿀 수 있습니다.
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};