import { useState, useEffect } from 'react';
import { Persona, PromptTemplate } from '../types';
import { PERSONAS } from '../constants/personas';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

export const useAppLogic = () => {
    const { user, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [userPersona, setUserPersona] = useState<Persona | null>(null);

    const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>(() => {
        const saved = localStorage.getItem('weav_custom_prompts');
        return saved ? JSON.parse(saved) : [];
    });

    const {
        currentSessionId, setSystemInstruction, systemInstruction
    } = useChatContext();

    // Load Prompts persistence
    useEffect(() => {
        localStorage.setItem('weav_custom_prompts', JSON.stringify(customPrompts));
    }, [customPrompts]);

    const handleSavePrompt = (prompt: PromptTemplate) => {
        setCustomPrompts(prev => [...prev, prompt]);
    };

    const handleDeletePrompt = (id: string) => {
        setCustomPrompts(prev => prev.filter(p => p.id !== id));
    };

    // Initial Persona & Onboarding Logic
    useEffect(() => {
        if (loading) return;

        // Key based on User ID if logged in, otherwise default key (though guest won't use it)
        const storageKey = user ? `weav_user_persona_${user.uid}` : 'weav_user_persona_guest';

        // 1. Guest Rule: Do NOT show onboarding. Set default empty state or skip.
        if (!user) {
            setShowOnboarding(false);
            setUserPersona(null);
            return;
        }

        // 2. Logged-in User Rule: Check if they have a persona saved
        const storedPersonaId = localStorage.getItem(storageKey);

        if (storedPersonaId && PERSONAS[storedPersonaId as keyof typeof PERSONAS]) {
            // User has onboarded before
            setUserPersona(PERSONAS[storedPersonaId as keyof typeof PERSONAS]);
            setShowOnboarding(false);
        } else {
            // New user (or first time on this device) -> Show Onboarding
            setShowOnboarding(true);
        }
    }, [user, loading]);

    // Update System Instruction when Persona changes (if chat is empty)
    useEffect(() => {
        if (userPersona && !currentSessionId && !systemInstruction) {
            setSystemInstruction(userPersona.systemInstruction);
        }
    }, [userPersona, currentSessionId, systemInstruction, setSystemInstruction]);

    const handleOnboardingComplete = (persona: Persona) => {
        if (user) {
            localStorage.setItem(`weav_user_persona_${user.uid}`, persona.id);
        }
        setUserPersona(persona);
        setShowOnboarding(false);
        if (!currentSessionId) {
            setSystemInstruction(persona.systemInstruction);
        }
    };

    // Responsive Logic
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const contentStyle = isMobile
        ? { left: 0, width: '100%' }
        : {
            left: isMenuOpen ? '280px' : '72px',
            width: `calc(100% - ${isMenuOpen ? '280px' : '72px'})`
        };

    return {
        isMenuOpen, setIsMenuOpen,
        showSettings, setShowSettings,
        showOnboarding, setShowOnboarding,
        userPersona,
        customPrompts,
        handleSavePrompt,
        handleDeletePrompt,
        handleOnboardingComplete,
        isMobile,
        contentStyle
    };
};