import React from 'react';
import {
  Calendar,
  BookOpenCheck,
  CheckSquare,
  Award,
  Clock,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { NavTabId } from '../layout/Sidebar';
import { UserAccount } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { SytLogo } from '../common/SytLogo';

interface TeacherDashboardProps {
  currentUser: UserAccount;
  onNavigate: (tab: NavTabId) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const timetable = CollegeDataService.getTimetable();
  const homeworks = CollegeDataService.getHomeworks();
  const groups = CollegeDataService.getGroups();

  const todayWeekday = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][
    new Date().getDay()
  ];

  // Lessons taught by this teacher today
  const myTodayLessons = timetable.filter(
    (l) =>
      l.day === todayWeekday &&
      (l.teacherName.toLowerCase().includes(currentUser.fullName.toLowerCase()) ||
        (l.splitSecondaryTeacher &&
          l.splitSecondaryTeacher.toLowerCase().includes(currentUser.fullName.toLowerCase())))
  );

  const curatedGroups = groups.filter(
    (g) =>
      g.curatorTeacherId === currentUser.linkedEntityId ||
      (g.curatorName &&
        (g.curatorName.toLowerCase().includes(currentUser.fullName.toLowerCase()) ||
          currentUser.fullName.toLowerCase().includes(g.curatorName.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Teacher Greeting Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SytLogo size="md" textColor="light" />
            <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold">
              O‘qituvchi ish maydoni
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Assalomu alaykum, {currentUser.fullName}!
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
            Bugun <b className="text-white">{todayWeekday}</b>. Siz uchun {myTodayLessons.length} ta dars rejalashtirilgan.
          </p>
          {curatedGroups.length > 0 && (
            <div className="mt-2 text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <span>Mas’ul kurator:</span>
              <span className="bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                {curatedGroups.map((g) => g.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {curatedGroups.length > 0 && (
            <button
              onClick={() => onNavigate('curator')}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Kuratorlik kabineti →
            </button>
          )}
          <button
            onClick={() => onNavigate('journal')}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Jurnalni to‘ldirish →
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('timetable')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bugungi darslar</span>
            <Calendar className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{myTodayLessons.length} ta</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Jadvalingiz bo‘yicha</div>
        </div>

        <div
          onClick={() => onNavigate('journal')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Guruhlarim</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">2 ta</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">12-guruh, 21-guruh</div>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Davomat nazorati</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">96%</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">O‘rtacha qatnashish</div>
        </div>

        <div
          onClick={() => onNavigate('homework')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Faol vazifalar</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{homeworks.length} ta</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Berilgan topshiriqlar</div>
        </div>
      </div>

      {/* Today's Schedule and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sizning bugungi mashg‘ulotlaringiz ({todayWeekday})</h3>
              <p className="text-[11px] text-slate-500">Dars vaqti va xonalar</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Haftalik jadval →
            </button>
          </div>

          <div className="space-y-2.5">
            {myTodayLessons.length > 0 ? (
              myTodayLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center shrink-0">
                      {l.pairRoman}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{l.subjectName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {l.groupName} · Xona: {l.room || 'o‘quv xonasi'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {l.time}
                    </span>
                    <button
                      onClick={() => onNavigate('journal')}
                      className="py-1 px-2.5 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                    >
                      Jurnal
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Bugun sizga biriktirilgan darslar yo‘q yoki dam olish kuni.
              </div>
            )}
          </div>
        </div>

        {/* Quick action shortcuts */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Tezkor amallar
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('journal')}
              className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs flex items-center gap-3 transition-colors text-left"
            >
              <BookOpenCheck className="w-5 h-5 text-blue-900" />
              <div>
                <div>Guruh jurnalini yuritish</div>
                <div className="text-[10px] text-blue-700 font-normal">Davomat va baholarni kiritish</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('attendance')}
              className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs flex items-center gap-3 transition-colors text-left"
            >
              <CheckSquare className="w-5 h-5 text-emerald-700" />
              <div>
                <div>Tezkor davomat belgilash</div>
                <div className="text-[10px] text-emerald-700 font-normal">O‘quvchilar qatnashish nazorati</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('homework')}
              className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center gap-3 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-amber-700" />
              <div>
                <div>Yangi uyga vazifa berish</div>
                <div className="text-[10px] text-amber-700 font-normal">Topshiriq va materiallar qo‘shish</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
