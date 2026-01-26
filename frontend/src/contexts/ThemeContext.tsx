import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface PointColor {
    id: string;
    name: string;
    value: string; // Tailwind color class or hex
    hoverValue: string;
    bgValue: string; // for light opacities
}

export const POINT_COLORS: PointColor[] = [
    { id: 'indigo', name: '인디고', value: '#6366f1', hoverValue: '#4f46e5', bgValue: 'rgba(99, 102, 241, 0.1)' },
    { id: 'blue', name: '블루', value: '#3b82f6', hoverValue: '#2563eb', bgValue: 'rgba(59, 130, 246, 0.1)' },
    { id: 'rose', name: '로즈', value: '#f43f5e', hoverValue: '#e11d48', bgValue: 'rgba(244, 63, 94, 0.1)' },
    { id: 'emerald', name: '에메랄드', value: '#10b981', hoverValue: '#059669', bgValue: 'rgba(16, 185, 129, 0.1)' },
    { id: 'amber', name: '앰버', value: '#f59e0b', hoverValue: '#d97706', bgValue: 'rgba(245, 158, 11, 0.1)' },
    { id: 'monochrome', name: '모노크롬', value: '#ffffff', hoverValue: '#e5e5e5', bgValue: 'rgba(255, 255, 255, 0.1)' },
];

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    pointColor: PointColor;
    setPointColor: (color: PointColor) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('weav_theme');
        return (saved as ThemeMode) || 'dark';
    });

    const [pointColor, setPointColor] = useState<PointColor>(() => {
        const savedId = localStorage.getItem('weav_point_color');
        return POINT_COLORS.find(c => c.id === savedId) || POINT_COLORS[0];
    });

    useEffect(() => {
        localStorage.setItem('weav_theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('weav_point_color', pointColor.id);
        const root = document.documentElement;
        root.style.setProperty('--point-color', pointColor.value);
        root.style.setProperty('--point-hover', pointColor.hoverValue);
        root.style.setProperty('--point-bg', pointColor.bgValue);
        root.style.setProperty('--point-bg-secondary', pointColor.bgValue.replace('0.1', '0.05'));
    }, [pointColor]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, pointColor, setPointColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};