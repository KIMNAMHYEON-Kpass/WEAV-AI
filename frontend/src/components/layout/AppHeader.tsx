import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AppHeaderProps {
    showHeader: boolean;
    onMenuClick: () => void;
    currentChatTitle: string | null;
    contentStyle: React.CSSProperties;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    showHeader,
    onMenuClick,
    currentChatTitle,
    contentStyle
}) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header
            className={`fixed top-0 z-30 p-4 md:p-6 flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showHeader ? 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md' : ''}`}
            style={contentStyle}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <Menu size={24} />
                </button>
                <h1 className={`font-medium tracking-tight text-lg transition-all duration-700 whitespace-nowrap text-gray-900 dark:text-white ${showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    WEAV AI
                </h1>
                {showHeader && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-neutral-500 animate-fade-in overflow-hidden">
                        {currentChatTitle && (
                            <>
                                <span className="mx-2 shrink-0">/</span>
                                <span className="text-gray-900 dark:text-white font-medium">{currentChatTitle}</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Theme Toggle Button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                    title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
};