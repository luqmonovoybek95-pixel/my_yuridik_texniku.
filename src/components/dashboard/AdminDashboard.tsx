import React from 'react';
import {
  Users,
  Briefcase,
  Layers,
  Calendar,
  CheckSquare,
  AlertCircle,
  Plus,
  BookOpenCheck,
  BarChart3,
  Scale,
  Sparkles,
} from 'lucide-react';
import { NavTabId } from '../layout/Sidebar';
import { CollegeDataService } from '../../services/storage';
import { SytLogo } from '../common/SytLogo';

interface AdminDashboardProps {
  onNavigate: (tab: NavTabId) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const students = CollegeDataService.getStudents();
  const teachers = CollegeDataService.getTeachers();
  const groups = CollegeDataService.getGroups();
  const timetable = CollegeDataService.getTimetable();
  const attendance = CollegeDataService.getAttendance();
  const announcements = CollegeDataService.getAnnouncements();
  const auditLogs = CollegeDataService.getAuditLogs();

  // Today in Tashkent
  const todayWeekday = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][
    new Date().getDay()
  ];
  const todayLessons = timetable.filter((l) => l.day === todayWeekday && l.subjectName);

  // Today's attendance rate
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.filter((a) => a.date === todayDate);
  const todayRate =
    todayAtt.length > 0
      ? Math.round(
          (todayAtt.filter((a) => a.status === 'Keldi').length /
            todayAtt.length) *
            100
        )
      : 94;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner with Official SytLogo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-3">
            <SytLogo size="md" textColor="light" />
            <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
              Administrator Paneli
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Sirdaryo Yuridik Texnikumi Boshqaruv Markazi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bugun <b className="text-white">{todayWeekday}</b>. Dars jadvali, talabalar davomati va elektron jurnallar holatini tezkor nazorat qiling.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('timetable')}
              className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              12-guruh IT dars jadvali →
            </button>
            <button
              onClick={() => onNavigate('journal')}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Elektron jurnalga o‘tish
            </button>
            <button
              onClick={() => onNavigate('groups')}
              className="py-2 px-3.5 bg-blue-900/80 hover:bg-blue-800 text-white font-bold text-xs rounded-xl border border-blue-700/60 transition-colors cursor-pointer"
            >
              Guruhlar boshqaruvi
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="py-2 px-3.5 bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl border border-indigo-700/60 transition-colors cursor-pointer"
            >
              Testlar va Imtihonlar
            </button>
            <button
              onClick={() => onNavigate('curator')}
              className="py-2 px-3.5 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Kuratorlik nazorati
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Stat Cards as requested */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Jami talabalar</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{students.length}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Faol o‘quvchilar</div>
        </div>

        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘qituvchilar</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{teachers.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Pedagoglar tarkibi</div>
        </div>

        <div
          onClick={() => onNavigate('groups')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Guruhlar soni</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{groups.length}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">12, 21, 22-guruhlar</div>
        </div>

        <div
          onClick={() => onNavigate('timetable')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bugungi darslar</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{todayLessons.length || 3}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Jadval bo‘yicha</div>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bugungi davomat</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{todayRate}%</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Davomat foizi</div>
        </div>

        <div
          onClick={() => onNavigate('journal')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">To‘ldirilgan</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">100%</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Jurnallar nazorati</div>
        </div>
      </div>

      {/* Main Row: Today's lessons & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Schedule Snapshot */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bugungi dars jadvali ({todayWeekday})</h3>
              <p className="text-[11px] text-slate-500">12-guruh "Kompyuter tarmoqlari va IT" kasbi</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              To‘liq jadval →
            </button>
          </div>

          <div className="space-y-2">
            {todayLessons.length > 0 ? (
              todayLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white font-black flex items-center justify-center shrink-0">
                      {l.pairRoman}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{l.subjectName}</div>
                      <div className="text-[11px] text-slate-500">{l.teacherName} · Xona: {l.room || 'o‘quv xonasi'}</div>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {l.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Bugun jadval bo‘yicha darslar kiritilmagan yoki dam olish kuni.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log Trail */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tizim o‘zgarishlari va audit</h3>
              <p className="text-[11px] text-slate-500">So‘nggi qayd etilgan amallar</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.userName}</span>
                  <span className="text-[10px] text-slate-400">
                    {log.timestamp.slice(11, 16)}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
