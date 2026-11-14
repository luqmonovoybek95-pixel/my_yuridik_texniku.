import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  Menu,
} from 'lucide-react';
import { NavTabId } from './Sidebar';
import { UserRole } from '../../types';

interface MobileNavProps {
  role: UserRole;
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenSidebar: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  role,
  currentTab,
  onSelectTab,
  onOpenSidebar,
}) => {
  return (
    <nav
      aria-label="Mobil navigatsiya"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] no-print select-none transition-colors"
    >
      {/* 1. Bosh sahifa */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-blue-900 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950 font-black shadow-2xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'text-blue-900 stroke-[2.5]' : 'text-slate-500'}`} />
        <span className="leading-none">Bosh sahifa</span>
      </button>

      {/* 2. Jadval */}
      <button
        type="button"
        onClick={() => onSelectTab('timetable')}
        className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'timetable'
            ? 'text-blue-900 bg-blue-50/90 font-black shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 active:scale-95'
        }`}
      >
        <CalendarDays className={`w-5 h-5 ${currentTab === 'timetable' ? 'text-blue-900 stroke-[2.5]' : 'text-slate-500'}`} />
        <span className="leading-none">Jadval</span>
      </button>

      {/* 3. Jurnal */}
      <button
        type="button"
        onClick={() => onSelectTab('journal')}
        className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'journal'
            ? 'text-blue-900 bg-blue-50/90 font-black shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 active:scale-95'
        }`}
      >
        <BookOpenCheck className={`w-5 h-5 ${currentTab === 'journal' ? 'text-blue-900 stroke-[2.5]' : 'text-slate-500'}`} />
        <span className="leading-none">Jurnal</span>
      </button>

      {/* 4. Barchasi */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          !['dashboard', 'timetable', 'journal'].includes(currentTab)
            ? 'text-blue-900 bg-blue-50/90 font-black shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 active:scale-95'
        }`}
      >
        <Menu className="w-5 h-5 text-slate-500" />
        <span className="leading-none">Barchasi</span>
      </button>
    </nav>
  );
};
