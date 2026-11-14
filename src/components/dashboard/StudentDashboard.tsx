import React from 'react';
import {
  GraduationCap,
  Calendar,
  Award,
  CheckSquare,
  Clock,
  Sparkles,
  FileText,
  Bell,
  Scale,
} from 'lucide-react';
import { NavTabId } from '../layout/Sidebar';
import { UserAccount, Student } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { SytLogo } from '../common/SytLogo';

interface StudentDashboardProps {
  currentUser: UserAccount;
  onNavigate: (tab: NavTabId) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const students = CollegeDataService.getStudents();
  const timetable = CollegeDataService.getTimetable();
  const grades = CollegeDataService.getGrades();
  const homeworks = CollegeDataService.getHomeworks();
  const announcements = CollegeDataService.getAnnouncements();

  // Find linked student entity
  const student =
    students.find((s) => s.id === currentUser.linkedEntityId) ||
    students.find((s) => s.login.toLowerCase() === currentUser.login.toLowerCase()) ||
    students.find((s) => s.id === currentUser.id) || {
      id: currentUser.linkedEntityId || currentUser.id,
      fullName: currentUser.fullName,
      login: currentUser.login,
      groupId: 'grp-12',
      groupName: '12-guruh',
      phone: currentUser.phone || '—',
      status: 'Faol',
      averageGrade: 0,
      attendancePercent: 100,
      createdAt: currentUser.createdAt,
    };

  const studentGrades = grades.filter((g) => g.studentId === student?.id);

  // Today & Tomorrow
  const todayWeekday = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][
    new Date().getDay()
  ];
  const tomorrowWeekday = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][
    (new Date().getDay() + 1) % 7
  ];

  const todayLessons = timetable.filter(
    (l) => l.groupId === student?.groupId && l.day === todayWeekday && l.subjectName
  );
  const tomorrowLessons = timetable.filter(
    (l) => l.groupId === student?.groupId && l.day === tomorrowWeekday && l.subjectName
  );

  const groups = CollegeDataService.getGroups();
  const studentGroup = groups.find((g) => g.id === student?.groupId);
  const curatorDisplay =
    studentGroup?.curatorName &&
    studentGroup.curatorName !== 'Sinf kuratori hali tayinlanmagan' &&
    !studentGroup.curatorName.includes('tayinlanmagan')
      ? studentGroup.curatorName
      : 'Sinf kuratori hali tayinlanmagan';

  return (
    <div className="space-y-6">
      {/* Student Profile Hero Header with Group & Curator Details */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SytLogo size="md" textColor="light" />
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                O‘quvchi shaxsiy kabineti
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalomu alaykum, {student?.fullName || currentUser.fullName}!
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-blue-900/80 border border-blue-700/60 font-bold text-white">
                Guruh: {studentGroup?.name || student?.groupName || '12-guruh'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold">
                Yo‘nalish: {studentGroup?.specialty || 'Kompyuter tarmoqlari va IT'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${
                curatorDisplay !== 'Sinf kuratori hali tayinlanmagan'
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <span>Sinf kuratori:</span>
                <b className="font-bold">{curatorDisplay}</b>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              Mening profilim
            </button>
            <button
              onClick={() => onNavigate('group_detail')}
              className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Guruhim sahifasi
            </button>
            <button
              onClick={() => onNavigate('timetable')}
              className="py-2.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Dars jadvali →
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Mening baholarim, Mening davomatim */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('grades')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘rtacha baho</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {student?.averageGrade || 4.8} / 5.0
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">A’lo darajadagi o‘zlashtirish</div>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Davomatim</span>
            <CheckSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900">
            {student?.attendancePercent || 96}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Darslarga qatnashish</div>
        </div>

        <div
          onClick={() => onNavigate('timetable')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bugungi darslar</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {todayLessons.length || 3} ta
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">{todayWeekday} kungi darslar</div>
        </div>

        <div
          onClick={() => onNavigate('homework')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Uyga vazifalar</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {homeworks.length} ta
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Topshirish muddatlari</div>
        </div>
      </div>

      {/* Today and Tomorrow Schedule Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bugungi darslar ({todayWeekday})</h3>
              <p className="text-[11px] text-slate-500">12-guruh rasmiy jadvali</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Haftalik jadval →
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
                  <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {l.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Bugun jadvalda darslar yo‘q.
              </div>
            )}
          </div>
        </div>

        {/* Tomorrow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ertangi darslar ({tomorrowWeekday})</h3>
              <p className="text-[11px] text-slate-500">Ertaga bo‘ladigan mashg‘ulotlar</p>
            </div>
          </div>

          <div className="space-y-2">
            {tomorrowLessons.length > 0 ? (
              tomorrowLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-900 text-white font-black flex items-center justify-center shrink-0">
                      {l.pairRoman}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{l.subjectName}</div>
                      <div className="text-[11px] text-slate-500">{l.teacherName} · Xona: {l.room || 'o‘quv xonasi'}</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {l.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Ertaga darslar kiritilmagan yoki dam olish kuni.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Grades & Homeworks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Mening so‘nggi baholarim</h3>
            <button
              onClick={() => onNavigate('grades')}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Barcha baholar →
            </button>
          </div>

          <div className="space-y-2">
            {studentGrades.slice(0, 4).map((g) => (
              <div
                key={g.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{g.subjectName}</div>
                  <div className="text-[11px] text-slate-500">{g.date} · {g.type}</div>
                </div>
                <span
                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-black text-xs ${
                    g.gradeValue === 5
                      ? 'bg-emerald-600 text-white'
                      : g.gradeValue === 4
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {g.gradeValue}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Yaqinlashayotgan topshiriqlar</h3>
            <button
              onClick={() => onNavigate('homework')}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Barchasi →
            </button>
          </div>

          <div className="space-y-2">
            {homeworks.slice(0, 3).map((hw) => (
              <div
                key={hw.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{hw.subjectName}</span>
                  <span className="text-[10px] text-rose-600">Muddati: {hw.dueDate}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium truncate">{hw.topic}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
