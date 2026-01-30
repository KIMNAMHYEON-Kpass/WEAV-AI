import React, { createContext, useCallback, useContext, useState } from 'react';
import { chatApi } from '@/services/api/chatApi';
import { useApp } from './AppContext';

type ChatContextValue = {
  sending: boolean;
  error: string | null;
  sendChatMessage: (prompt: string, model: string) => Promise<void>;
  sendImageRequest: (prompt: string, model: string, aspectRatio?: string) => Promise<void>;
  clearError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const POLL_INTERVAL = 1500;
const POLL_MAX = 60;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentSession, refreshCurrent } = useApp();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollJob = useCallback(
    async (taskId: string) => {
      for (let i = 0; i < POLL_MAX; i++) {
        const status = await chatApi.jobStatus(taskId);
        if (status.status === 'success' || status.status === 'failure') {
          await refreshCurrent();
          if (status.status === 'failure' && status.error) setError(status.error);
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
      setError('응답 대기 시간이 초과되었습니다.');
    },
    [refreshCurrent]
  );

  const sendChatMessage = useCallback(
    async (prompt: string, model: string) => {
      if (!currentSession || currentSession.kind !== 'chat') return;
      setSending(true);
      setError(null);
      try {
        const res = await chatApi.completeChat(currentSession.id, prompt, model);
        await pollJob(res.task_id);
      } catch (e) {
        setError(e instanceof Error ? e.message : '전송 실패');
      } finally {
        setSending(false);
      }
    },
    [currentSession, pollJob]
  );

  const sendImageRequest = useCallback(
    async (prompt: string, model: string, aspectRatio?: string) => {
      if (!currentSession || currentSession.kind !== 'image') return;
      setSending(true);
      setError(null);
      try {
        const res = await chatApi.completeImage(currentSession.id, prompt, model, aspectRatio);
        await pollJob(res.task_id);
      } catch (e) {
        setError(e instanceof Error ? e.message : '생성 실패');
      } finally {
        setSending(false);
      }
    },
    [currentSession, pollJob]
  );

  const value: ChatContextValue = {
    sending,
    error,
    sendChatMessage,
    sendImageRequest,
    clearError: () => setError(null),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
