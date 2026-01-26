import { useState } from 'react';
import { Message, AIModel, ChatSession } from '../types';
import { aiService } from '../services/aiService';
import { MODELS } from '../constants/models';

interface UseChatProps {
  onChatStart?: (firstMessage: string) => void;
}

export const useChat = ({ onChatStart }: UseChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>(MODELS[0]);
  const [systemInstruction, setSystemInstruction] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Helper: Add initial bot placeholder
  const addPlaceholderMessage = (id: string, type: 'text'|'image'|'video', content: string, isStreaming = false) => {
    setMessages(prev => [...prev, {
      id,
      role: 'model',
      content,
      type,
      timestamp: Date.now(),
      isStreaming
    }]);
  };

  // Helper: Update existing message
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg));
  };

  // Reset Chat Function
  const resetChat = () => {
    setMessages([]);
    setInputValue('');
    setHasStarted(false);
    setIsLoading(false);
    // Don't reset systemInstruction here, as it might be set by the Persona globally
    // It will be updated by loadChatSession if loading a saved chat
    setCurrentSessionId(null);
    setSelectedModel(MODELS[0]);
  };

  // Load a specific chat session
  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages);
    setHasStarted(session.messages.length > 0);
    setSystemInstruction(session.systemInstruction);
    setCurrentSessionId(session.id);
    
    // Find model by ID, default to first if not found
    const model = MODELS.find(m => m.id === session.modelId) || MODELS[0];
    setSelectedModel(model);
    setInputValue('');
  };

  // Handlers for specific model types
  const processVideo = async (botMessageId: string, prompt: string, model: AIModel) => {
    addPlaceholderMessage(botMessageId, 'video', '비디오 생성 중...');
    const videoUrl = await aiService.generateVideo(model, prompt);
    updateMessage(botMessageId, {
      mediaUrl: videoUrl || undefined,
      content: videoUrl ? '비디오가 성공적으로 생성되었습니다.' : '비디오 생성에 실패했습니다. (API 키 권한을 확인해주세요)'
    });
  };

  const processImage = async (botMessageId: string, prompt: string, model: AIModel) => {
    addPlaceholderMessage(botMessageId, 'image', '이미지 생성 중...');
    const imageUrl = await aiService.generateImage(model, prompt);
    updateMessage(botMessageId, {
      mediaUrl: imageUrl || undefined,
      content: imageUrl ? '이미지가 성공적으로 생성되었습니다.' : '이미지 생성에 실패했습니다.',
      type: imageUrl ? 'image' : 'text'
    });
  };

  const processText = async (botMessageId: string, prompt: string, model: AIModel) => {
    addPlaceholderMessage(botMessageId, 'text', '', true);
    
    let fullText = '';
    // Pass current messages (before this user prompt) as history
    const stream = aiService.generateTextStream(model, prompt, messages, systemInstruction);
    
    for await (const textChunk of stream) {
      fullText += textChunk;
      updateMessage(botMessageId, { content: fullText });
    }
    
    updateMessage(botMessageId, { isStreaming: false });
  };

  // Main Send Function
  const sendMessage = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || inputValue;
    if (!promptToSend.trim() || isLoading) return;

    // Trigger onChatStart only once
    if (!hasStarted) {
        setHasStarted(true);
        onChatStart?.(promptToSend);
    }

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      type: 'text',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 2. Process Bot Response
    const botMessageId = (Date.now() + 1).toString();

    try {
      if (selectedModel.isVideo) {
        await processVideo(botMessageId, promptToSend, selectedModel);
      } else if (selectedModel.isImage) {
        await processImage(botMessageId, promptToSend, selectedModel);
      } else {
        await processText(botMessageId, promptToSend, selectedModel);
      }
    } catch (error) {
      console.error("Chat Error", error);
      // Remove placeholder if it exists or add error message
      setMessages(prev => {
        const exists = prev.some(m => m.id === botMessageId);
        if (exists) {
          return prev.map(m => m.id === botMessageId ? { ...m, content: "오류: 요청을 처리할 수 없습니다.", isStreaming: false } : m);
        }
        return [...prev, {
          id: botMessageId,
          role: 'model',
          content: "오류: 요청을 처리할 수 없습니다.",
          type: 'text',
          timestamp: Date.now()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    selectedModel,
    setSelectedModel,
    isLoading,
    hasStarted,
    sendMessage,
    resetChat,
    loadChatSession,
    currentSessionId,
    setCurrentSessionId, // Exported for App.tsx to manage IDs
    setSystemInstruction // Exported to allow Persona injection
  };
};