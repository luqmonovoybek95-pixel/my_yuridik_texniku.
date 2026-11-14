import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { UserAccount } from '../../types';
import { SytLogo } from '../common/SytLogo';
import { ThemeAndFontControls } from '../common/ThemeAndFontControls';

interface NavbarProps {
  currentUser: UserAccount;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
  unreadAnnouncementsCount: number;
  onOpenAnnouncements: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onToggleMobileSidebar,
  unreadAnnouncementsCount,
  onOpenAnnouncements,
}) => {
  const roleTitle =
    currentUser.role === 'admin'
      ? 'Administrator'
      : currentUser.role === 'teacher'
      ? 'O‘qituvchi'
      : 'O‘quvchi';

  const roleBadgeColor =
    currentUser.role === 'admin'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : currentUser.role === 'teacher'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-blue-500/15 text-blue-300 border-blue-500/30';

  return (
    <header className="h-16 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-md select-none transition-colors">
      {/* Left side: Hamburger + Official College Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <SytLogo size="md" textColor="light" />
      </div>

      {/* Right side: Theme & Font Controls + Announcements + Profile + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Day/Night & Font Size Controls */}
        <ThemeAndFontControls />
        {/* Notifications / Announcements */}
        <button
          type="button"
          onClick={onOpenAnnouncements}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="E’lonlar va xabarnomalar"
        >
          <Bell className="w-5 h-5" />
          {unreadAnnouncementsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-blue-900 border border-blue-700/60 flex items-center justify-center text-blue-200 font-bold text-xs">
            {currentUser.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-white truncate max-w-[150px]">
              {currentUser.fullName}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold border ${roleBadgeColor}`}>
                {roleTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          title="Tizimdan chiqish"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
