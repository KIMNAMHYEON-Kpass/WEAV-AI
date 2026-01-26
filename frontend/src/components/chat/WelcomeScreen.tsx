import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const WelcomeScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-20 px-4">
        <div className="mb-8 text-center animate-fade-in">
            <div className="mb-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-neutral-700/50">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }} />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-neutral-300 font-medium">AI 준비 완료</span>
                </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3 text-gray-900 dark:text-white">
                안녕하세요, 크리에이터님.
            </h2>
            <p className="text-lg text-gray-600 dark:text-neutral-400">
                오늘은 무엇을 도와드릴까요?
            </p>
        </div>
    </div>
  );
};