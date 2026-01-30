import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { sessionApi } from '@/services/api/sessionApi';
import type { Session } from '@/types';

type AppContextValue = {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  loadSessions: () => Promise<void>;
  selectSession: (session: Session | null) => Promise<void>;
  createSession: (kind: 'chat' | 'image', title?: string) => Promise<Session>;
  refreshCurrent: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const list = await sessionApi.list();
      setSessions(list);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCurrent = useCallback(async () => {
    if (!currentSession) return;
    try {
      const updated = await sessionApi.get(currentSession.id);
      setCurrentSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      // ignore
    }
  }, [currentSession?.id]);

  const createSession = useCallback(async (kind: 'chat' | 'image', title?: string) => {
    const session = await sessionApi.create(kind, title);
    setSessions((prev) => [session, ...prev]);
    setCurrentSession(session);
    return session;
  }, []);

  const selectSession = useCallback(async (session: Session | null) => {
    if (!session) {
      setCurrentSession(null);
      return;
    }
    const full = await sessionApi.get(session.id);
    setCurrentSession(full);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const value: AppContextValue = {
    sessions,
    currentSession,
    loading,
    loadSessions,
    selectSession,
    createSession,
    refreshCurrent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
