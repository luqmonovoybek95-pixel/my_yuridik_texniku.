import React, { useState, useMemo } from 'react';
import {
  TimetableLesson,
  Weekday,
  UserRole,
  Group,
  Teacher,
  Subject,
  AppSettings,
  ShowToastFn,
} from '../../types';
import { CollegeDataService } from '../../services/storage';
import { TimetableEditorModal } from './TimetableEditorModal';
import {
  Printer,
  Download,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  MapPin,
  User,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

interface TimetableTableProps {
  role: UserRole;
  currentUserName: string;
  onShowToast: ShowToastFn;
}

export const TimetableTable: React.FC<TimetableTableProps> = ({
  role,
  currentUserName,
  onShowToast,
}) => {
  const [timetable, setTimetable] = useState<TimetableLesson[]>(() =>
    CollegeDataService.getTimetable()
  );
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    CollegeDataService.getTeachers()
  );
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    CollegeDataService.getSubjects()
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    CollegeDataService.getSettings()
  );

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-12');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Display mode: 'cards' is default on mobile, 'table' for desktop
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'cards' | 'table'>('cards');

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<TimetableLesson | null>(null);

  // Reload when storage updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setTimetable(CollegeDataService.getTimetable());
      setGroups(CollegeDataService.getGroups());
      setTeachers(CollegeDataService.getTeachers());
      setSubjects(CollegeDataService.getSubjects());
      setSettings(CollegeDataService.getSettings());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  // Today in Tashkent
  const todayWeekdayName: Weekday = useMemo(() => {
    const dayIndex = new Date().getDay();
    const map: Weekday[] = [
      'Yakshanba',
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
    ];
    return map[dayIndex];
  }, []);

  const tomorrowWeekdayName: Weekday = useMemo(() => {
    const dayIndex = (new Date().getDay() + 1) % 7;
    const map: Weekday[] = [
      'Yakshanba',
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
    ];
    return map[dayIndex];
  }, []);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const daysToRender: Weekday[] = useMemo(() => {
    if (selectedDayFilter === 'today') {
      return [todayWeekdayName];
    }
    if (selectedDayFilter === 'tomorrow') {
      return [tomorrowWeekdayName];
    }
    if (
      ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'].includes(
        selectedDayFilter
      )
    ) {
      return [selectedDayFilter as Weekday];
    }
    return ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  }, [selectedDayFilter, todayWeekdayName, tomorrowWeekdayName]);

  const handleSaveLesson = (lesson: TimetableLesson) => {
    CollegeDataService.saveLesson(lesson);
    setTimetable(CollegeDataService.getTimetable());
    onShowToast('Dars jadvali muvaffaqiyatli saqlandi', 'success');
  };

  const handleDeleteLesson = (lessonId: string) => {
    CollegeDataService.deleteLesson(lessonId);
    setTimetable(CollegeDataService.getTimetable());
    onShowToast('Dars jadvaldan o‘chirildi', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Hafta kuni', 'Juftlik', 'Vaqt', 'Fan nomi', 'O‘qituvchi', 'Xona', 'Guruh'],
    ];

    timetable.forEach((item) => {
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) return;
      rows.push([
        item.day,
        item.pairRoman,
        item.time,
        item.subjectName || 'Bo‘sh',
        item.teacherName || '—',
        item.room || '—',
        item.groupName,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `DARS_JADVALI_${activeGroup?.name || 'SIRDARYO_YT'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Dars jadvali CSV formatida yuklab olindi', 'success');
  };

  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => {
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) {
        return false;
      }
      if (selectedTeacherName !== 'all') {
        const matchesTeacher =
          item.teacherName.toLowerCase().includes(selectedTeacherName.toLowerCase()) ||
          (item.splitSecondaryTeacher &&
            item.splitSecondaryTeacher.toLowerCase().includes(selectedTeacherName.toLowerCase()));
        if (!matchesTeacher) return false;
      }
      return true;
    });
  }, [timetable, selectedGroupId, selectedTeacherName]);

  // Helper to get lessons for a given day
  const getDayLessons = (day: Weekday) => {
    return [1, 2, 3, 4].map((pairNum) => {
      return (
        filteredTimetable.find((l) => l.day === day && l.pairNumber === pairNum) || {
          id: `empty-${day}-${pairNum}`,
          groupId: selectedGroupId,
          groupName: activeGroup?.name || '12-guruh',
          academicYear: '2026-2027',
          semester: 1,
          day,
          pairNumber: pairNum,
          pairRoman: ['I', 'II', 'III', 'IV'][pairNum - 1],
          time: settings.lessonSlots[pairNum - 1]?.timeLabel || '08:30-09:50',
          subjectId: '',
          subjectName: '',
          teacherId: '',
          teacherName: '',
          room: '',
          colorType: 'white' as const,
        }
      );
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        {/* Row 1: Filters & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-auto">
            {/* Group Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 shrink-0">Guruh:</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 shrink-0">O‘qituvchi:</span>
              <select
                value={selectedTeacherName}
                onChange={(e) => setSelectedTeacherName(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
              >
                <option value="all">Barcha o‘qituvchilar</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.fullName}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {role === 'admin' && (
              <button
                onClick={() => {
                  setEditingLesson(null);
                  setIsEditorOpen(true);
                }}
                className="flex-1 sm:flex-none py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dars qo‘shish</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="CSV eksport"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="A4 formatda chop etish"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>
          </div>
        </div>

        {/* Row 2: Day Filter Pills & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Day filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto custom-scrollbar max-w-full">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDayFilter === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Haftalik (Barchasi)
            </button>
            <button
              onClick={() => setSelectedDayFilter('today')}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDayFilter === 'today'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bugun ({todayWeekdayName})
            </button>
            {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'].map(
              (d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`py-1.5 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedDayFilter === d
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.slice(0, 4)}
                </button>
              )
            )}
          </div>

          {/* View Mode Toggle: Cards vs Table on mobile */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMobileDisplayMode('cards')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mobileDisplayMode === 'cards'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kunlik kartalar ko‘rinishi (Telefonga mos)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartalar</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDisplayMode('table')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mobileDisplayMode === 'table'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Rasmiy to‘liq jadval"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Jadval</span>
            </button>
          </div>
        </div>
      </div>

      {/* Color Meaning Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2.5 no-print">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold shrink-0">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Ranglar ma’nosi:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-600 border border-red-700" />
            <span className="text-slate-700 font-medium text-[11px]">{settings.colorMeanings.red}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-700" />
            <span className="text-slate-700 font-medium text-[11px]">{settings.colorMeanings.green}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-500" />
            <span className="text-slate-700 font-medium text-[11px]">{settings.colorMeanings.amber}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Clean, No Sideways Scroll) */}
      {/* ======================================================== */}
      <div className={mobileDisplayMode === 'cards' ? 'block lg:hidden space-y-4' : 'hidden'}>
        {/* Document Header Mobile Card */}
        <div className="bg-blue-950 text-white p-4 rounded-2xl shadow-sm text-center border border-slate-800">
          <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
            {settings.academicYear} o‘quv yili · {settings.currentSemester}-semestr
          </div>
          <h2 className="text-sm font-extrabold text-white mt-1 uppercase">
            "{activeGroup?.specialty}" · {activeGroup?.name}
          </h2>
          <div className="text-xs text-slate-300 mt-1 font-semibold">
            Guruh rahbari: <b className="text-white">{activeGroup?.curatorName}</b>
          </div>
        </div>

        {daysToRender.map((day) => {
          const dayLessons = getDayLessons(day);
          const activeLessonsCount = dayLessons.filter((l) => l.subjectName).length;
          const isToday = day === todayWeekdayName;

          return (
            <div
              key={day}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                isToday ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
              }`}
            >
              {/* Day Header Banner */}
              <div
                className={`px-4 py-2.5 flex items-center justify-between border-b ${
                  isToday
                    ? 'bg-blue-900 text-white border-blue-800'
                    : 'bg-slate-100 text-slate-900 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="font-black text-sm uppercase tracking-wide">{day}</span>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                      Bugun
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {activeLessonsCount} ta dars
                </span>
              </div>

              {/* Lesson Items inside Day Card */}
              <div className="p-3 space-y-2.5">
                {dayLessons.map((lesson) => {
                  const isEditable = role === 'admin';

                  // If split lesson (e.g. Fizika red / IT green)
                  if (lesson.isSplit) {
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (isEditable) {
                            setEditingLesson(lesson);
                            setIsEditorOpen(true);
                          }
                        }}
                        className={`rounded-xl border border-slate-300 p-3 space-y-2.5 bg-slate-50 ${
                          isEditable ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                        }`}
                      >
                        {/* Pair & Time Header */}
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                          <span className="font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-white text-[11px]">
                            {lesson.pairRoman}-juftlik
                          </span>
                          <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {lesson.time}
                          </span>
                        </div>

                        {/* Split Upper Slot (Red) */}
                        <div className="bg-red-600 text-white p-2.5 rounded-lg shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-white/20 rounded">
                              1-kichik guruh
                            </span>
                            <span className="text-[11px] font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lesson.room || "o'quv xonasi"}
                            </span>
                          </div>
                          <div className="font-extrabold text-sm leading-tight break-words">
                            {lesson.subjectName || 'Mashg‘ulot'}
                          </div>
                          <div className="text-xs text-red-100 flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5" />
                            {lesson.teacherName || '—'}
                          </div>
                        </div>

                        {/* Split Lower Slot (Green) */}
                        <div className="bg-emerald-600 text-white p-2.5 rounded-lg shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-white/20 rounded">
                              2-kichik guruh
                            </span>
                            <span className="text-[11px] font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lesson.splitSecondaryRoom || lesson.room || "o'quv xonasi"}
                            </span>
                          </div>
                          <div className="font-extrabold text-sm leading-tight break-words">
                            {lesson.splitSecondarySubject || 'Mashg‘ulot'}
                          </div>
                          <div className="text-xs text-emerald-100 flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5" />
                            {lesson.splitSecondaryTeacher || '—'}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // If slot has a subject
                  if (lesson.subjectName) {
                    const borderAccent =
                      lesson.colorType === 'red'
                        ? 'border-l-4 border-l-red-600 bg-red-50/50'
                        : lesson.colorType === 'green'
                        ? 'border-l-4 border-l-emerald-600 bg-emerald-50/50'
                        : lesson.colorType === 'amber'
                        ? 'border-l-4 border-l-amber-500 bg-amber-50/50'
                        : 'border-l-4 border-l-blue-900 bg-white';

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (isEditable) {
                            setEditingLesson(lesson);
                            setIsEditorOpen(true);
                          }
                        }}
                        className={`p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 ${borderAccent} ${
                          isEditable ? 'cursor-pointer hover:border-blue-400 active:scale-[0.99] transition-all' : ''
                        }`}
                      >
                        {/* Pair & Time badge */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black px-2 py-0.5 rounded-md bg-blue-900 text-white text-[11px]">
                              {lesson.pairRoman}-juftlik
                            </span>
                            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {lesson.time}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lesson.room || "o'quv xonasi"}
                          </span>
                        </div>

                        {/* Subject Name - Big, Bold, Never Truncated */}
                        <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug pt-0.5 break-words">
                          {lesson.subjectName}
                        </div>

                        {/* Teacher */}
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lesson.teacherName || '—'}</span>
                        </div>
                      </div>
                    );
                  }

                  // Empty slot
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (isEditable) {
                          setEditingLesson(lesson);
                          setIsEditorOpen(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 ${
                        isEditable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                      }`}
                    >
                      <span className="font-bold text-[11px]">
                        {lesson.pairRoman}-juftlik ({lesson.time})
                      </span>
                      <span className="italic text-[11px]">Dars yo‘q (bo‘sh)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. OFFICIAL TABLE VIEW (Desktop / Tablet & Print Mode)   */}
      {/* ======================================================== */}
      <div
        className={`${
          mobileDisplayMode === 'table' ? 'block' : 'hidden lg:block'
        } bg-white p-3.5 sm:p-6 lg:p-8 rounded-2xl border-2 border-slate-900 shadow-md official-timetable-print`}
      >
        {/* Mobile hint if viewed in table mode on smaller screens */}
        <div className="lg:hidden text-center pb-2 text-[11px] font-bold text-blue-900 bg-blue-50 py-1.5 px-3 rounded-lg mb-3">
          👈 Jadvalni to‘liq ko‘rish uchun chapga-o‘ngga suring 👉
        </div>

        {/* Document Header exactly as photographed */}
        <div className="text-center pb-4 mb-4 border-b border-slate-900">
          <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            {settings.academicYear} o‘quv yili {settings.currentSemester}-semestr bo‘yicha
          </div>
          <div className="text-xs sm:text-base font-extrabold text-slate-950 uppercase mt-0.5 tracking-tight">
            "{activeGroup?.specialty}" kasbi {activeGroup?.courseYear}-bosqich {activeGroup?.name} o‘quvchilari uchun
          </div>
          <h2 className="text-base sm:text-xl font-black text-slate-950 uppercase mt-1 tracking-wider">
            DARS JADVALI
          </h2>
          <div className="text-[11px] text-slate-600 mt-1">
            Guruh rahbari: <span className="font-bold text-slate-900">{activeGroup?.curatorName}</span>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs text-slate-900 font-medium">
            <thead>
              <tr className="bg-[#ffc000] text-slate-950 print-header-bg border-2 border-slate-950 font-extrabold">
                <th className="border-2 border-slate-950 py-2.5 px-2 text-center w-28 uppercase">
                  Hafta kunlari
                </th>
                <th className="border-2 border-slate-950 py-2.5 px-2 text-center w-14 uppercase">
                  Juftlik
                </th>
                <th className="border-2 border-slate-950 py-2.5 px-2 text-center w-28 uppercase">
                  Dars vaqti
                </th>
                <th className="border-2 border-slate-950 py-2.5 px-3 text-center uppercase min-w-[170px]">
                  Fan nomi
                </th>
                <th className="border-2 border-slate-950 py-2.5 px-3 text-center uppercase min-w-[150px]">
                  O‘qituvchining F.I.SH
                </th>
                <th className="border-2 border-slate-950 py-2.5 px-2 text-center w-24 uppercase">
                  Xona raqami
                </th>
              </tr>
            </thead>
            <tbody>
              {daysToRender.map((day, dayIdx) => {
                const dayLessons = getDayLessons(day);

                return (
                  <React.Fragment key={day}>
                    {/* Purple divider row between days */}
                    {dayIdx > 0 && (
                      <tr className="bg-[#b4a7d6] print-purple-bg border-2 border-slate-950 h-3">
                        <td colSpan={6} className="border-2 border-slate-950 p-0 text-center text-[8px] text-[#5b4a7d]" />
                      </tr>
                    )}

                    {dayLessons.map((lesson, lessonIdx) => {
                      const isFirstRowOfDay = lessonIdx === 0;
                      const isEditable = role === 'admin';

                      // Handle split cell
                      if (lesson.isSplit) {
                        return (
                          <tr
                            key={lesson.id}
                            className={`border-2 border-slate-950 ${
                              isEditable ? 'hover:bg-blue-50/50 cursor-pointer' : ''
                            }`}
                            onClick={() => {
                              if (isEditable) {
                                setEditingLesson(lesson);
                                setIsEditorOpen(true);
                              }
                            }}
                          >
                            {/* Day column (spans 4 rows) */}
                            {isFirstRowOfDay && (
                              <td
                                rowSpan={4}
                                className="border-2 border-slate-950 p-2 text-center font-black uppercase text-sm tracking-wider align-middle bg-white print-day-col"
                              >
                                {day}
                              </td>
                            )}

                            {/* Pair Roman */}
                            <td className="border-2 border-slate-950 p-2 text-center font-bold text-slate-900 bg-white">
                              {lesson.pairRoman}
                            </td>

                            {/* Time */}
                            <td className="border-2 border-slate-950 p-2 text-center font-semibold text-slate-900 whitespace-nowrap bg-white">
                              {lesson.time}
                            </td>

                            {/* Split Subject column */}
                            <td className="border-2 border-slate-950 p-0 text-center">
                              <div className="flex flex-col h-full divide-y-2 divide-slate-950">
                                <div className="p-1.5 font-bold bg-[#ff0000] text-white print-red-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.subjectName}
                                </div>
                                <div className="p-1.5 font-bold bg-[#00b050] text-white print-green-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.splitSecondarySubject}
                                </div>
                              </div>
                            </td>

                            {/* Split Teacher column */}
                            <td className="border-2 border-slate-950 p-0 text-center">
                              <div className="flex flex-col h-full divide-y-2 divide-slate-950">
                                <div className="p-1.5 font-medium bg-[#ff0000] text-white print-red-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.teacherName}
                                </div>
                                <div className="p-1.5 font-medium bg-[#00b050] text-white print-green-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.splitSecondaryTeacher}
                                </div>
                              </div>
                            </td>

                            {/* Split Room column */}
                            <td className="border-2 border-slate-950 p-0 text-center">
                              <div className="flex flex-col h-full divide-y-2 divide-slate-950">
                                <div className="p-1.5 font-semibold bg-[#ff0000] text-white print-red-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.room}
                                </div>
                                <div className="p-1.5 font-semibold bg-[#00b050] text-white print-green-slot flex items-center justify-center min-h-[32px]">
                                  {lesson.splitSecondaryRoom || lesson.room}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Standard row with colorType
                      const bgClass =
                        lesson.colorType === 'red'
                          ? 'bg-[#ff0000] text-white print-red-slot'
                          : lesson.colorType === 'green'
                          ? 'bg-[#00b050] text-white print-green-slot'
                          : lesson.colorType === 'amber'
                          ? 'bg-[#ffe599] text-slate-950'
                          : 'bg-white text-slate-900';

                      return (
                        <tr
                          key={lesson.id}
                          className={`border-2 border-slate-950 ${
                            isEditable ? 'hover:brightness-95 cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (isEditable) {
                              setEditingLesson(lesson);
                              setIsEditorOpen(true);
                            }
                          }}
                        >
                          {/* Day column (spans 4 rows) */}
                          {isFirstRowOfDay && (
                            <td
                              rowSpan={4}
                              className="border-2 border-slate-950 p-2 text-center font-black uppercase text-sm tracking-wider align-middle bg-white print-day-col"
                            >
                              {day}
                            </td>
                          )}

                          {/* Pair Roman */}
                          <td className="border-2 border-slate-950 p-2 text-center font-bold text-slate-900 bg-white">
                            {lesson.pairRoman}
                          </td>

                          {/* Time */}
                          <td className="border-2 border-slate-950 p-2 text-center font-semibold text-slate-900 whitespace-nowrap bg-white">
                            {lesson.time}
                          </td>

                          {/* Subject */}
                          <td className={`border-2 border-slate-950 p-2 text-center font-extrabold ${bgClass}`}>
                            {lesson.subjectName || ''}
                          </td>

                          {/* Teacher */}
                          <td className={`border-2 border-slate-950 p-2 text-center font-medium ${bgClass}`}>
                            {lesson.teacherName || ''}
                          </td>

                          {/* Room */}
                          <td className={`border-2 border-slate-950 p-2 text-center font-semibold ${bgClass}`}>
                            {lesson.room || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timetable Editor Modal */}
      {isEditorOpen && (
        <TimetableEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingLesson(null);
          }}
          initialLesson={editingLesson}
          teachers={teachers}
          subjects={subjects}
          groups={groups}
          allLessons={timetable}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
