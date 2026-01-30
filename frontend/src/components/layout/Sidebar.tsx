import React from 'react';
import { MessageSquare, Image, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { Session } from '@/types';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { sessions, currentSession, selectSession, createSession } = useApp();
  const chatSessions = sessions.filter((s) => s.kind === 'chat');
  const imageSessions = sessions.filter((s) => s.kind === 'image');

  const handleNewChat = async () => {
    await createSession('chat', '새 채팅');
  };
  const handleNewImage = async () => {
    await createSession('image', '새 이미지');
  };
  const handleSelect = async (s: Session) => {
    await selectSession(s);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-card text-foreground z-50 flex flex-col shadow-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold">WEAV AI</span>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded">
            ✕
          </button>
        </div>
        <div className="p-2 flex gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-muted hover:bg-muted-foreground text-sm"
          >
            <MessageSquare size={16} /> 새 채팅
          </button>
          <button
            type="button"
            onClick={handleNewImage}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-muted hover:bg-muted-foreground text-sm"
          >
            <Image size={16} /> 새 이미지
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">채팅</h3>
            {chatSessions.length === 0 && (
              <p className="text-muted-foreground text-sm px-2">채팅 내역이 없습니다.</p>
            )}
            {chatSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-3 py-2 rounded text-sm truncate block ${
                  currentSession?.id === s.id ? 'bg-accent' : 'hover:bg-accent'
                }`}
              >
                {s.title || `채팅 ${s.id}`}
              </button>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">이미지</h3>
            {imageSessions.length === 0 && (
              <p className="text-muted-foreground text-sm px-2">이미지 생성 내역이 없습니다.</p>
            )}
            {imageSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-3 py-2 rounded text-sm truncate block ${
                  currentSession?.id === s.id ? 'bg-accent' : 'hover:bg-accent'
                }`}
              >
                {s.title || `이미지 ${s.id}`}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
