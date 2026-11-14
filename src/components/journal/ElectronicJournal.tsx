import React, { useState, useMemo, useEffect } from 'react';
import {
  Student,
  Group,
  Subject,
  AttendanceRecord,
  GradeRecord,
  JournalLessonTopic,
  UserRole,
  AttendanceStatus,
  ShowToastFn,
} from '../../types';
import { CollegeDataService } from '../../services/storage';
import {
  Check,
  Printer,
  Calendar,
  Save,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Search,
  User,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Award,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface ElectronicJournalProps {
  role: UserRole;
  currentTeacherName?: string;
  currentStudentId?: string;
  onShowToast: ShowToastFn;
}

export const ElectronicJournal: React.FC<ElectronicJournalProps> = ({
  role,
  currentTeacherName,
  currentStudentId,
  onShowToast,
}) => {
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    CollegeDataService.getSubjects()
  );
  const [students, setStudents] = useState<Student[]>(() =>
    CollegeDataService.getStudents()
  );
  const [grades, setGrades] = useState<GradeRecord[]>(() =>
    CollegeDataService.getGrades()
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    CollegeDataService.getAttendance()
  );
  const [topics, setTopics] = useState<JournalLessonTopic[]>(() =>
    CollegeDataService.getTopics()
  );

  // Active filters
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-12');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-it');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedPair, setSelectedPair] = useState<number>(2);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Lesson topic inputs
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentHomework, setCurrentHomework] = useState<string>('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Display mode for mobile/desktop: 'cards' is primary default on phones
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

  // Reload on updates
  useEffect(() => {
    const handleStorage = () => {
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
      setStudents(CollegeDataService.getStudents());
      setGrades(CollegeDataService.getGrades());
      setAttendance(CollegeDataService.getAttendance());
      setTopics(CollegeDataService.getTopics());
    };
    window.addEventListener('syt-storage-update', handleStorage);
    return () => window.removeEventListener('syt-storage-update', handleStorage);
  }, []);

  // Update topic when date/subject/group changes
  useEffect(() => {
    const foundTopic = topics.find(
      (t) =>
        t.groupId === selectedGroupId &&
        t.subjectId === selectedSubjectId &&
        t.date === selectedDate &&
        t.pairNumber === selectedPair
    );
    if (foundTopic) {
      setCurrentTopic(foundTopic.topic);
      setCurrentHomework(foundTopic.homework || '');
    } else {
      setCurrentTopic('');
      setCurrentHomework('');
    }
  }, [selectedGroupId, selectedSubjectId, selectedDate, selectedPair, topics]);

  // Auto-align selected group with student's own group
  useEffect(() => {
    if (role === 'student' && currentStudentId) {
      const myStudent = students.find(
        (s) =>
          s.id === currentStudentId ||
          s.login.toLowerCase() === currentStudentId.toLowerCase()
      );
      if (myStudent && myStudent.groupId && myStudent.groupId !== selectedGroupId) {
        setSelectedGroupId(myStudent.groupId);
      }
    }
  }, [role, currentStudentId, students, selectedGroupId]);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // 44. O‘QUVCHILARNING MAXFIYLIGI VA ELEKTRON JURNAL
  // O‘quvchi faqat va faqat o‘z qatori va o‘z baholarini ko‘ra oladi, boshqalar umuman ko‘rinmaydi
  const groupStudents = useMemo(() => {
    if (role === 'student') {
      const myStudent = students.find(
        (s) =>
          s.id === currentStudentId ||
          (currentStudentId && s.login.toLowerCase() === currentStudentId.toLowerCase())
      );
      return myStudent ? [myStudent] : [];
    }

    let list = students.filter((s) => s.groupId === selectedGroupId);
    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase();
    return list.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.login.toLowerCase().includes(q)
    );
  }, [students, selectedGroupId, studentSearch, role, currentStudentId]);

  // Helper: Get all grades for a specific student in the selected subject
  const getStudentGradesForSubject = (studentId: string) => {
    return grades
      .filter((g) => g.studentId === studentId && g.subjectId === selectedSubjectId)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Helper: Get subject GPA for this student
  const getStudentSubjectAverage = (studentId: string) => {
    const list = getStudentGradesForSubject(studentId);
    if (list.length === 0) return null;
    const sum = list.reduce((acc, curr) => acc + curr.gradeValue, 0);
    return (sum / list.length).toFixed(1);
  };

  // Handle Mark Attendance for a student
  const handleMarkAttendance = (student: Student, status: AttendanceStatus) => {
    if (role === 'student') return;

    const record: AttendanceRecord = {
      id: `att-${student.id}-${selectedDate}-${selectedPair}`,
      studentId: student.id,
      studentName: student.fullName,
      groupId: selectedGroupId,
      groupName: activeGroup?.name || '12-guruh',
      subjectId: selectedSubjectId,
      subjectName: activeSubject?.name || 'Fan',
      teacherId: role === 'teacher' ? 't-2' : 'admin',
      teacherName: currentTeacherName || 'O‘qituvchi',
      date: selectedDate,
      pairNumber: selectedPair,
      status,
      updatedAt: new Date().toISOString(),
    };

    CollegeDataService.saveAttendance(record);
    setAttendance(CollegeDataService.getAttendance());
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Batch "Barchasi keldi"
  const handleMarkAllPresent = () => {
    if (role === 'student') return;

    const records: AttendanceRecord[] = groupStudents.map((student) => ({
      id: `att-${student.id}-${selectedDate}-${selectedPair}`,
      studentId: student.id,
      studentName: student.fullName,
      groupId: selectedGroupId,
      groupName: activeGroup?.name || '12-guruh',
      subjectId: selectedSubjectId,
      subjectName: activeSubject?.name || 'Fan',
      teacherId: role === 'teacher' ? 't-2' : 'admin',
      teacherName: currentTeacherName || 'O‘qituvchi',
      date: selectedDate,
      pairNumber: selectedPair,
      status: 'Keldi',
      updatedAt: new Date().toISOString(),
    }));

    CollegeDataService.batchSaveAttendance(records);
    setAttendance(CollegeDataService.getAttendance());
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
    onShowToast(`Barcha ${groupStudents.length} ta o‘quvchiga "Keldi" belgilandi`, 'success');
  };

  // Handle Grade Change for today's lesson
  const handleSetGrade = (student: Student, gradeVal: number | null) => {
    if (role === 'student') return;
    if (role === 'admin') {
      onShowToast('Qat’iy qoida: Administrator baho qo‘ya olmaydi va tahrirlay olmaydi. Bahoni faqat o‘qituvchi qo‘yadi.', 'error');
      return;
    }

    const existingGrade = grades.find(
      (g) =>
        g.studentId === student.id &&
        g.subjectId === selectedSubjectId &&
        g.date === selectedDate
    );

    if (gradeVal === null) {
      if (existingGrade) {
        CollegeDataService.deleteGrade(existingGrade.id);
        setGrades(CollegeDataService.getGrades());
        onShowToast('Baho o‘chirildi', 'info');
      }
      return;
    }

    const newGrade: GradeRecord = {
      id: existingGrade ? existingGrade.id : `grd-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.fullName,
      groupId: selectedGroupId,
      groupName: activeGroup?.name || '12-guruh',
      subjectId: selectedSubjectId,
      subjectName: activeSubject?.name || 'Fan',
      teacherId: role === 'teacher' ? 't-2' : 'admin',
      teacherName: currentTeacherName || 'O‘qituvchi',
      date: selectedDate,
      gradeValue: gradeVal,
      type: 'Joriy',
      updatedAt: new Date().toISOString(),
    };

    CollegeDataService.saveGrade(newGrade);
    setGrades(CollegeDataService.getGrades());
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
    onShowToast(`${student.fullName.split(' ')[0]}ga ${gradeVal} ball qo‘yildi`, 'success');
  };

  // Save lesson topic & homework
  const handleSaveTopicAndHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTopic.trim()) {
      onShowToast('Iltimos, bugungi dars mavzusini kiriting', 'error');
      return;
    }

    const topicRecord: JournalLessonTopic = {
      id: `top-${selectedGroupId}-${selectedSubjectId}-${selectedDate}-${selectedPair}`,
      groupId: selectedGroupId,
      subjectId: selectedSubjectId,
      teacherId: role === 'teacher' ? 't-2' : 'admin',
      date: selectedDate,
      pairNumber: selectedPair,
      topic: currentTopic.trim(),
      homework: currentHomework.trim(),
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };

    CollegeDataService.saveTopic(topicRecord);
    setTopics(CollegeDataService.getTopics());

    if (currentHomework.trim()) {
      CollegeDataService.saveHomework({
        id: `hw-${Date.now()}`,
        groupId: selectedGroupId,
        groupName: activeGroup?.name || '12-guruh',
        subjectId: selectedSubjectId,
        subjectName: activeSubject?.name || 'Fan',
        teacherId: role === 'teacher' ? 't-2' : 'admin',
        teacherName: currentTeacherName || 'O‘qituvchi',
        dateAssigned: selectedDate,
        dueDate: topicRecord.deadline || selectedDate,
        topic: currentTopic.trim(),
        description: currentHomework.trim(),
        status: 'Faol',
      });
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
    onShowToast('Dars mavzusi va uyga vazifa muvaffaqiyatli saqlandi', 'success');
  };

  // Export Journal to CSV
  const handleExportJournalCSV = () => {
    const rows = [
      ['№', 'O‘quvchining F.I.SH', 'Guruh', 'Fan', 'Sana', 'Davomat', 'Baho', 'Mavzu'],
    ];

    groupStudents.forEach((student, idx) => {
      const att = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.subjectId === selectedSubjectId &&
          a.date === selectedDate &&
          a.pairNumber === selectedPair
      );
      const grd = grades.find(
        (g) =>
          g.studentId === student.id &&
          g.subjectId === selectedSubjectId &&
          g.date === selectedDate
      );

      rows.push([
        String(idx + 1),
        student.fullName,
        activeGroup?.name || '12-guruh',
        activeSubject?.name || 'Fan',
        selectedDate,
        att ? att.status : 'Belgilanmagan',
        grd ? String(grd.gradeValue) : '—',
        currentTopic || '—',
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
      `JURNAL_${activeGroup?.name || 'GURUH'}_${activeSubject?.name || 'FAN'}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Jurnal ma’lumotlari CSV formatida yuklab olindi', 'success');
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full">
      {/* Top Filter and Info Card */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  Elektron jurnal — HEMIS
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeGroup?.name} · {activeSubject?.name} · Davomat va 5 ballik baholash
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSavedRecently && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>Saqlandi</span>
              </span>
            )}

            {/* View Mode Switcher: Cards vs Table */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDisplayMode('cards')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'cards'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kartalar ko‘rinishi (Mobil qurilmalarga to‘liq mos)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartalar</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Katta jadval ko‘rinishi"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Jadval</span>
              </button>
            </div>

            <button
              onClick={handleExportJournalCSV}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="CSV yuklab olish"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Chop etish"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Chop etish</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Guruh
            </label>
            {role === 'student' ? (
              <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800">
                {activeGroup?.name || '12-guruh'} (Sizning guruhingiz)
              </div>
            ) : (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.specialty}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fan
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Dars sanasi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Juftlik
            </label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value={1}>I-juftlik (08:30-09:50)</option>
              <option value={2}>II-juftlik (10:00-11:20)</option>
              <option value={3}>III-juftlik (11:40-13:00)</option>
              <option value={4}>IV-juftlik (13:10-14:30)</option>
            </select>
          </div>
        </div>

        {/* Lesson Topic & Homework Entry */}
        {role !== 'student' && (
          <form
            onSubmit={handleSaveTopicAndHomework}
            className="pt-3 border-t border-slate-100 flex flex-col md:grid md:grid-cols-12 gap-2.5"
          >
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bugungi dars mavzusi
              </label>
              <input
                type="text"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                placeholder="Masalan: Axborot xavfsizligida kriptografik kalitlar va shifrlash"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Uyga vazifa (topshiriq)
              </label>
              <input
                type="text"
                value={currentHomework}
                onChange={(e) => setCurrentHomework(e.target.value)}
                placeholder="Masalan: 3-amaliy mashg‘ulot hisobotini tayyorlash"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Mavzuni saqlash</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Search & Attendance Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="O‘quvchini ismi bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
          />
        </div>

        {role !== 'student' && (
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Barchasiga "Keldi" belgilash</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. MOBILE RESPONSIVE STUDENT CARDS (No Sideways Scroll)   */}
      {/* ======================================================== */}
      <div className={displayMode === 'cards' ? 'block md:hidden space-y-3' : 'hidden'}>
        <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-600">
          <span>O‘quvchilar: {groupStudents.length} nafar</span>
          <span className="text-[11px] text-slate-400">Har bir o‘quvchi alohida karta shaklida</span>
        </div>

        {groupStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Mos keluvchi o‘quvchilar topilmadi.
          </div>
        ) : (
          groupStudents.map((student, idx) => {
            const attRecord = attendance.find(
              (a) =>
                a.studentId === student.id &&
                a.subjectId === selectedSubjectId &&
                a.date === selectedDate &&
                a.pairNumber === selectedPair
            );

            const currentAttStatus = attRecord?.status;

            const gradeRecord = grades.find(
              (g) =>
                g.studentId === student.id &&
                g.subjectId === selectedSubjectId &&
                g.date === selectedDate
            );

            const currentGrade = gradeRecord ? gradeRecord.gradeValue : null;
            const allSubjectGrades = getStudentGradesForSubject(student.id);
            const subjectAvg = getStudentSubjectAverage(student.id);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-3.5 transition-all hover:border-slate-300"
              >
                {/* 1. Student Name & Header - Never truncated */}
                <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug break-words">
                        {student.fullName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="font-mono bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                          {student.login}
                        </span>
                        <span>·</span>
                        <span>{student.groupName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-extrabold text-[11px]">
                      GPA: {student.averageGrade}
                    </div>
                  </div>
                </div>

                {/* 2. All Subject Grades History Section */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{activeSubject?.name} bo‘yicha barcha baholari:</span>
                    </span>
                    {subjectAvg && (
                      <span className="font-extrabold text-blue-900">
                        O‘rtacha: {subjectAvg}
                      </span>
                    )}
                  </div>

                  {allSubjectGrades.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">
                      Hozircha ushbu fan bo‘yicha baho qo‘yilmagan
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {allSubjectGrades.map((g) => {
                        const pillBg =
                          g.gradeValue === 5
                            ? 'bg-emerald-600 text-white'
                            : g.gradeValue === 4
                            ? 'bg-blue-600 text-white'
                            : g.gradeValue === 3
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white';
                        return (
                          <span
                            key={g.id}
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shadow-2xs ${pillBg}`}
                            title={`${g.date}: ${g.gradeValue} ball (${g.type})`}
                          >
                            {g.gradeValue}
                          </span>
                        );
                      })}
                      <span className="text-[10px] text-slate-400 font-medium ml-1">
                        ({allSubjectGrades.length} ta baho)
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Today's Lesson Attendance Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Davomat ({selectedDate}):</span>
                    {currentAttStatus && (
                      <span className="text-blue-900 font-extrabold lowercase">
                        holat: <b>{currentAttStatus}</b>
                      </span>
                    )}
                  </div>

                  {role === 'student' ? (
                    <span
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold ${
                        currentAttStatus === 'Keldi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentAttStatus === 'Sababli'
                          ? 'bg-amber-100 text-amber-800'
                          : currentAttStatus === 'Kelmadi'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {currentAttStatus === 'Sababli' ? 'Sababli kelmadi' : currentAttStatus || 'Belgilanmagan'}
                    </span>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {/* Keldi */}
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(student, 'Keldi')}
                        className={`min-h-[42px] py-2 px-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentAttStatus === 'Keldi'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30 font-black'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Keldi</span>
                      </button>

                      {/* Kelmadi */}
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(student, 'Kelmadi')}
                        className={`min-h-[42px] py-2 px-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentAttStatus === 'Kelmadi'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30 font-black'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 active:scale-95'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Kelmadi</span>
                      </button>

                      {/* Sababli kelmadi */}
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(student, 'Sababli')}
                        className={`min-h-[42px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentAttStatus === 'Sababli'
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30 font-black'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 active:scale-95'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Sababli</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Today's Grade Selector */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Bugungi dars bahosi:</span>
                    {currentGrade ? (
                      <span className="font-extrabold text-blue-900 lowercase">
                        qo‘yilgan: <b>{currentGrade} ball</b>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal lowercase">qo‘yilmagan</span>
                    )}
                  </div>

                  {role === 'admin' ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            currentGrade === 5
                              ? 'bg-emerald-600 text-white'
                              : currentGrade === 4
                              ? 'bg-blue-600 text-white'
                              : currentGrade === 3
                              ? 'bg-amber-500 text-white'
                              : currentGrade === 2
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {currentGrade || '—'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {currentGrade ? `${currentGrade} ball qo‘yilgan` : 'Baho qo‘yilmagan'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        Faqat ko‘rish (Admin)
                      </span>
                    </div>
                  ) : role === 'student' ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold ${
                        currentGrade && currentGrade >= 4
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentGrade === 3
                          ? 'bg-amber-100 text-amber-800'
                          : currentGrade === 2
                          ? 'bg-rose-100 text-rose-800'
                          : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      {currentGrade ? `${currentGrade} ball` : 'Baho qo‘yilmagan'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-4 gap-1.5 flex-1">
                        {[5, 4, 3, 2].map((gVal) => {
                          const isSelected = currentGrade === gVal;
                          const colorClasses =
                            gVal === 5
                              ? isSelected
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30 shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : gVal === 4
                              ? isSelected
                                ? 'bg-blue-600 text-white ring-2 ring-blue-600/30 shadow-xs'
                                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                              : gVal === 3
                              ? isSelected
                                ? 'bg-amber-500 text-white ring-2 ring-amber-500/30 shadow-xs'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                              : isSelected
                              ? 'bg-rose-600 text-white ring-2 ring-rose-600/30 shadow-xs'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200';

                          return (
                            <button
                              key={gVal}
                              type="button"
                              onClick={() =>
                                handleSetGrade(student, isSelected ? null : gVal)
                              }
                              className={`min-h-[40px] py-2 rounded-xl text-center font-black text-sm transition-all cursor-pointer active:scale-95 ${colorClasses}`}
                              title={`${gVal} ball qo‘yish`}
                            >
                              {gVal}
                            </button>
                          );
                        })}
                      </div>

                      {currentGrade && (
                        <button
                          type="button"
                          onClick={() => handleSetGrade(student, null)}
                          className="min-h-[40px] py-2 px-3 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                          title="Bahoni bekor qilish"
                        >
                          Bekor qilish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP / TABLET FULL STICKY TABLE VIEW                */}
      {/* ======================================================== */}
      <div
        className={`${
          displayMode === 'table' ? 'block' : 'hidden md:block'
        } bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`}
      >
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900">
              {activeGroup?.name} · {activeSubject?.name} · {selectedDate} ({selectedPair}-juftlik)
            </span>
            <div className="text-[11px] text-slate-500">
              Jami o‘quvchilar: {groupStudents.length} nafar
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {currentTopic ? (
              <span className="text-slate-800 font-bold">Mavzu: {currentTopic}</span>
            ) : (
              <span className="italic text-slate-400">Mavzu kiritilmagan</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-200">№</th>
                <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">
                  O‘quvchining F.I.SH
                </th>
                <th className="py-3 px-3 min-w-[160px] border-r border-slate-200 text-center">
                  Fan bo‘yicha baholar
                </th>
                <th className="py-3 px-4 min-w-[260px] border-r border-slate-200 text-center">
                  Bugungi davomat
                </th>
                <th className="py-3 px-4 min-w-[190px] border-r border-slate-200 text-center">
                  Bugungi baho (5 ball)
                </th>
                <th className="py-3 px-4 min-w-[110px] text-center">
                  Umumiy GPA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupStudents.map((student, idx) => {
                const attRecord = attendance.find(
                  (a) =>
                    a.studentId === student.id &&
                    a.subjectId === selectedSubjectId &&
                    a.date === selectedDate &&
                    a.pairNumber === selectedPair
                );

                const currentAttStatus = attRecord?.status;

                const gradeRecord = grades.find(
                  (g) =>
                    g.studentId === student.id &&
                    g.subjectId === selectedSubjectId &&
                    g.date === selectedDate
                );

                const currentGrade = gradeRecord ? gradeRecord.gradeValue : null;
                const allSubjectGrades = getStudentGradesForSubject(student.id);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100">
                      <div>{student.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Login: {student.login}
                      </div>
                    </td>

                    {/* All Subject Grades */}
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      {allSubjectGrades.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {allSubjectGrades.map((g) => (
                            <span
                              key={g.id}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                g.gradeValue === 5
                                  ? 'bg-emerald-600 text-white'
                                  : g.gradeValue === 4
                                  ? 'bg-blue-600 text-white'
                                  : g.gradeValue === 3
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                              title={`${g.date}: ${g.gradeValue}`}
                            >
                              {g.gradeValue}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Today's Attendance */}
                    <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                      {role === 'student' ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                            currentAttStatus === 'Keldi'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentAttStatus === 'Sababli'
                              ? 'bg-amber-100 text-amber-800'
                              : currentAttStatus === 'Kelmadi'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {currentAttStatus === 'Sababli' ? 'Sababli kelmadi' : currentAttStatus || 'Belgilanmagan'}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(student, 'Keldi')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentAttStatus === 'Keldi'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            Keldi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(student, 'Kelmadi')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentAttStatus === 'Kelmadi'
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            Kelmadi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(student, 'Sababli')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentAttStatus === 'Sababli'
                                ? 'bg-amber-500 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            Sababli
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Today's Grade */}
                    <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                      {role === 'admin' ? (
                        <div className="inline-flex items-center gap-1.5" title="Administrator faqat ko‘rish rejimida (Baho qo‘yish yoki tahrirlash huquqi yo‘q)">
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                              currentGrade === 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : currentGrade === 4
                                ? 'bg-blue-100 text-blue-800'
                                : currentGrade === 3
                                ? 'bg-amber-100 text-amber-800'
                                : currentGrade === 2
                                ? 'bg-rose-100 text-rose-800'
                                : 'text-slate-400 bg-slate-100'
                            }`}
                          >
                            {currentGrade ? `${currentGrade} ball` : '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            Ko‘rish
                          </span>
                        </div>
                      ) : role === 'student' ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold ${
                            currentGrade && currentGrade >= 4
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentGrade === 3
                              ? 'bg-amber-100 text-amber-800'
                              : currentGrade === 2
                              ? 'bg-rose-100 text-rose-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {currentGrade ? `${currentGrade} ball` : '—'}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {[5, 4, 3, 2].map((gVal) => {
                            const isSelected = currentGrade === gVal;
                            const colorClass =
                              gVal === 5
                                ? isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : gVal === 4
                                ? isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                                : gVal === 3
                                ? isSelected
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : isSelected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100';

                            return (
                              <button
                                key={gVal}
                                type="button"
                                onClick={() =>
                                  handleSetGrade(student, isSelected ? null : gVal)
                                }
                                className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${colorClass}`}
                                title={`${gVal} ball qo‘yish / bekor qilish`}
                              >
                                {gVal}
                              </button>
                            );
                          })}

                          {currentGrade && (
                            <button
                              type="button"
                              onClick={() => handleSetGrade(student, null)}
                              className="text-[10px] text-slate-400 hover:text-rose-600 ml-1 font-semibold cursor-pointer"
                              title="Bahoni o‘chirish"
                            >
                              O‘chirish
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-center font-extrabold text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {student.averageGrade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 34. JURNALNI SAQLASH TUGMASI (MALUMOT YOZGANIDAN KEYIN SAQLASH TUGMASI) */}
      {role !== 'student' && role !== 'admin' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-blue-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">
              <Save className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Jurnal ma’lumotlarini saqlash
              </div>
              <div className="text-xs text-slate-500">
                Baholar, davomat va dars mavzusi kiritilganidan so‘ng ma’lumotlar bazasiga to‘liq saqlash
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setGrades(CollegeDataService.getGrades());
                setAttendance(CollegeDataService.getAttendance());
                setTopics(CollegeDataService.getTopics());
                onShowToast('Jurnal ma’lumotlari qayta yangilandi', 'info');
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Qayta yangilash
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSavedRecently(true);
                setTimeout(() => setIsSavedRecently(false), 2500);
                onShowToast(
                  `«${activeGroup?.name}» guruhi va «${activeSubject?.name}» fani bo‘yicha jurnal ma’lumotlari bazaga muvaffaqiyatli saqlandi!`,
                  'success'
                );
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Jurnalni saqlash</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
