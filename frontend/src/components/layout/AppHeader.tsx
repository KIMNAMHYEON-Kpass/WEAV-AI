import React from 'react';
import { Menu } from 'lucide-react';

type AppHeaderProps = { onMenuClick: () => void };

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-card border-b border-border">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded hover:bg-accent text-primary-foreground"
        aria-label="메뉴 열기"
      >
        <Menu size={24} />
      </button>
      <span className="ml-3 font-semibold text-foreground">WEAV AI</span>
    </header>
  );
}
