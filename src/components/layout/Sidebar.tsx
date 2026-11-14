import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  CheckSquare,
  Award,
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  BookOpen,
  FileText,
  Bell,
  BarChart3,
  UserCog,
  Settings,
  X,
  UserCheck,
  User,
  FileQuestion,
} from 'lucide-react';
import { UserRole } from '../../types';
import { CollegeDataService } from '../../services/storage';

export type NavTabId =
  | 'dashboard'
  | 'timetable'
  | 'journal'
  | 'attendance'
  | 'grades'
  | 'tests'
  | 'homework'
  | 'materials'
  | 'students'
  | 'teachers'
  | 'groups'
  | 'group_detail'
  | 'curator'
  | 'profile'
  | 'dates'
  | 'subjects'
  | 'announcements'
  | 'reports'
  | 'users'
  | 'settings';

interface SidebarProps {
  role: UserRole;
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUserName?: string;
}

interface MenuItem {
  id: NavTabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  currentUserName,
}) => {
  // Check if current user is curator of any group
  const isCurator = useMemo(() => {
    if (role === 'admin') return true;
    if (role !== 'teacher' || !currentUserName) return false;
    const groups = CollegeDataService.getGroups();
    const qName = currentUserName.toLowerCase();
    return groups.some(
      (g) => g.curatorName && (g.curatorName.toLowerCase().includes(qName) || qName.includes(g.curatorName.toLowerCase()))
    );
  }, [role, currentUserName]);

  const adminSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Boshqaruv',
      items: [
        { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
        { id: 'timetable', label: 'Dars jadvali', icon: CalendarDays },
        { id: 'journal', label: 'Elektron jurnal', icon: BookOpenCheck },
        { id: 'curator', label: 'Kuratorlik nazorati', icon: UserCheck },
      ],
    },
    {
      title: 'Ta’lim jarayoni',
      items: [
        { id: 'attendance', label: 'Davomat nazorati', icon: CheckSquare },
        { id: 'grades', label: 'Baholash tizimi', icon: Award },
        { id: 'tests', label: 'Testlar va Imtihonlar', icon: FileQuestion },
        { id: 'homework', label: 'Uyga vazifalar', icon: FileText },
        { id: 'materials', label: 'Darsliklar & Materiallar', icon: BookOpen },
        { id: 'dates', label: 'Muhim sanalar', icon: CalendarDays },
      ],
    },
    {
      title: 'Tarkib & Ro‘yxatlar',
      items: [
        { id: 'students', label: 'O‘quvchilar', icon: GraduationCap },
        { id: 'teachers', label: 'O‘qituvchilar', icon: Briefcase },
        { id: 'groups', label: 'Guruhlar', icon: Layers },
        { id: 'subjects', label: 'Fanlar ro‘yxati', icon: BookOpen },
      ],
    },
    {
      title: 'Ma’muriyat',
      items: [
        { id: 'announcements', label: 'E’lonlar', icon: Bell },
        { id: 'reports', label: 'Tahliliy hisobotlar', icon: BarChart3 },
        { id: 'users', label: 'Foydalanuvchilar', icon: UserCog },
        { id: 'settings', label: 'Tizim sozlamalari', icon: Settings },
      ],
    },
  ];

  const teacherItems: MenuItem[] = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'timetable', label: 'Dars jadvalim', icon: CalendarDays },
  ];

  if (isCurator) {
    teacherItems.push({
      id: 'curator',
      label: 'Kuratorlik',
      icon: UserCheck,
      badge: 'Sinf',
    });
  }

  const teacherSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Kabinet',
      items: teacherItems,
    },
    {
      title: 'O‘quv jarayoni',
      items: [
        { id: 'journal', label: 'Elektron jurnal', icon: BookOpenCheck },
        { id: 'attendance', label: 'Davomat belgilash', icon: CheckSquare },
        { id: 'grades', label: 'Baholar jurnali', icon: Award },
        { id: 'tests', label: 'Testlar va Imtihonlar', icon: FileQuestion },
        { id: 'homework', label: 'Uyga vazifalar', icon: FileText },
        { id: 'materials', label: 'Darsliklar yuklash', icon: BookOpen },
        { id: 'dates', label: 'Muhim sanalar', icon: CalendarDays },
      ],
    },
    {
      title: 'Axborot',
      items: [
        { id: 'groups', label: 'Guruhlar', icon: Layers },
        { id: 'announcements', label: 'E’lonlar', icon: Bell },
      ],
    },
  ];

  const studentSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Shaxsiy kabinet',
      items: [
        { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
        { id: 'profile', label: 'Mening profilim', icon: User },
        { id: 'group_detail', label: 'Guruhim sahifasi', icon: Layers },
        { id: 'timetable', label: 'Dars jadvalim', icon: CalendarDays },
        { id: 'journal', label: 'Guruh jurnali', icon: BookOpenCheck },
        { id: 'grades', label: 'Mening baholarim', icon: Award },
        { id: 'tests', label: 'Testlar va Sinovlar', icon: FileQuestion },
        { id: 'attendance', label: 'Mening davomatim', icon: CheckSquare },
        { id: 'homework', label: 'Uyga vazifalar', icon: FileText },
        { id: 'materials', label: 'Darsliklar & Materiallar', icon: BookOpen },
        { id: 'dates', label: 'Muhim sanalar', icon: CalendarDays },
        { id: 'announcements', label: 'E’lonlar', icon: Bell },
      ],
    },
  ];

  const sections =
    role === 'admin'
      ? adminSections
      : role === 'teacher'
      ? teacherSections
      : studentSections;

  const content = (
    <div className="h-full flex flex-col justify-between py-4 px-3">
      <div className="space-y-6">
        {/* Mobile close button header */}
        <div className="lg:hidden flex items-center justify-between px-2 pb-2 border-b border-slate-200">
          <span className="text-xs font-extrabold uppercase text-slate-400">Menyu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sections.map((sec, secIdx) => (
          <div key={secIdx}>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              {sec.title}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Branding Info */}
      <div className="pt-4 border-t border-slate-200/80 px-2">
        <div className="flex items-center gap-2.5">
          <img
            src="/syt-logo.svg"
            alt="SYT"
            className="w-8 h-8 object-contain shrink-0"
          />
          <div>
            <div className="text-xs font-bold text-slate-800 leading-tight">Sirdaryo YT</div>
            <div className="text-[10px] text-slate-400">Elektron ta’lim tizimi</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 bg-white border-r border-slate-200/80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
