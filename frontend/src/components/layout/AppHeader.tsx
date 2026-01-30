import React from 'react';
import { Menu } from 'lucide-react';

type AppHeaderProps = { onMenuClick: () => void };

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-gray-900 border-b border-gray-700">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded hover:bg-gray-700 text-gray-300"
        aria-label="메뉴 열기"
      >
        <Menu size={24} />
      </button>
      <span className="ml-3 font-semibold text-white">WEAV AI</span>
    </header>
  );
}
