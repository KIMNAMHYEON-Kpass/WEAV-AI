import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useChat } from '@/contexts/ChatContext';
import { ModelSelector } from './ModelSelector';

export function ChatInput() {
  const { currentSession } = useApp();
  const { sendChatMessage, sendImageRequest, sending, error, clearError } = useChat();
  const [prompt, setPrompt] = useState('');
  const [chatModel, setChatModel] = useState('google/gemini-2.5-flash');
  const [imageModel, setImageModel] = useState('fal-ai/imagen4/preview');

  if (!currentSession) return null;

  const isChat = currentSession.kind === 'chat';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || sending) return;
    setPrompt('');
    if (isChat) await sendChatMessage(text, chatModel);
    else await sendImageRequest(text, imageModel);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 border-t border-gray-700">
      {error && (
        <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between rounded bg-red-900/50 text-red-200 px-3 py-2 text-sm">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="hover:underline">
            닫기
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <ModelSelector
            kind={currentSession.kind}
            value={isChat ? chatModel : imageModel}
            onChange={isChat ? setChatModel : setImageModel}
          />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isChat ? '메시지를 입력하세요...' : '이미지 설명을 입력하세요...'}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !prompt.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
          >
            {sending ? '처리 중...' : isChat ? '전송' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
}
