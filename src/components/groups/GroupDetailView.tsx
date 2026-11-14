import React, { useState, useMemo } from 'react';
import {
  Group,
  UserRole,
  UserAccount,
  Student,
  Teacher,
  TimetableLesson,
  AttendanceRecord,
  AnnouncementItem,
  GroupMaterial,
  HomeworkItem,
  ImportantDateItem,
  ShowToastFn,
} from '../../types';
import { CollegeDataService } from '../../services/storage';
import {
  ArrowLeft,
  UserCheck,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckSquare,
  Bell,
  BookOpen,
  FileText,
  AlertTriangle,
  Plus,
  Download,
  CalendarDays,
  Clock,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface GroupDetailViewProps {
  group: Group;
  role: UserRole;
  currentUser: UserAccount;
  onBack: () => void;
  onShowToast: ShowToastFn;
  onOpenTimetable?: () => void;
  onOpenJournal?: () => void;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  group,
  role,
  currentUser,
  onBack,
  onShowToast,
  onOpenTimetable,
  onOpenJournal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'students' | 'timetable' | 'attendance' | 'announcements' | 'materials' | 'homework' | 'dates'
  >('students');

  const [students, setStudents] = useState<Student[]>(() =>
    CollegeDataService.getStudents().filter((s) => s.groupId === group.id)
  );
  const [timetable] = useState<TimetableLesson[]>(() =>
    CollegeDataService.getTimetable().filter((l) => l.groupId === group.id)
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    CollegeDataService.getAttendance().filter((a) => a.groupId === group.id)
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    CollegeDataService.getAnnouncements().filter(
      (a) => !a.targetGroupId || a.targetGroupId === group.id
    )
  );
  const [materials, setMaterials] = useState<GroupMaterial[]>(() =>
    CollegeDataService.getMaterials().filter((m) => m.groupId === group.id)
  );
  const [homeworks] = useState<HomeworkItem[]>(() =>
    CollegeDataService.getHomeworks().filter((h) => h.groupId === group.id)
  );
  const [importantDates, setImportantDates] = useState<ImportantDateItem[]>(() =>
    CollegeDataService.getImportantDates().filter(
      (d) => !d.groupId || d.groupId === group.id
    )
  );

  // Modal states
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<'Oddiy' | 'Muhim' | 'Shoshilinch'>('Oddiy');

  const [isMatModalOpen, setIsMatModalOpen] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatSubject, setNewMatSubject] = useState('');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [newMatType, setNewMatType] = useState<'pdf' | 'doc' | 'link'>('pdf');

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState('');
  const [newDateVal, setNewDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [newDateType, setNewDateType] = useState<'oraliq' | 'imtihon' | 'topshiriq' | 'dam_olish' | 'tadbir'>('oraliq');
  const [newDateDesc, setNewDateDesc] = useState('');

  // Check if current user is the curator of this group
  const isCuratorOfThisGroup =
    role === 'teacher' &&
    (group.curatorTeacherId === currentUser.linkedEntityId ||
      group.curatorName.toLowerCase().includes(currentUser.fullName.toLowerCase()));

  const canManageGroup = role === 'admin' || isCuratorOfThisGroup;

  // Has curator?
  const hasCurator =
    group.curatorName &&
    group.curatorName !== 'Sinf kuratori hali tayinlanmagan' &&
    !group.curatorName.includes('tayinlanmagan');

  // Attendance Statistics for this group
  const totalAttRecords = attendance.length;
  const presentRecords = attendance.filter((a) => a.status === 'Keldi').length;
  const excusedRecords = attendance.filter((a) => a.status === 'Sababli').length;
  const absentRecords = attendance.filter((a) => a.status === 'Kelmadi').length;
  const groupAttRate =
    totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 96;

  // Anomaly Detection: Students with multiple unexcused absences
  const studentAbsenceMap = useMemo(() => {
    const map: Record<string, { student: Student; unexcusedCount: number; excusedCount: number }> = {};
    students.forEach((s) => {
      const sRecords = attendance.filter((a) => a.studentId === s.id);
      const unexcused = sRecords.filter((a) => a.status === 'Kelmadi').length;
      const excused = sRecords.filter((a) => a.status === 'Sababli').length;
      map[s.id] = { student: s, unexcusedCount: unexcused, excusedCount: excused };
    });
    return map;
  }, [students, attendance]);

  const atRiskStudents = useMemo(() => {
    return Object.values(studentAbsenceMap).filter((item) => item.unexcusedCount >= 2);
  }, [studentAbsenceMap]);

  // Handlers for Curator / Admin Actions
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      onShowToast('Sarlavha va matn kiritilishi shart', 'error');
      return;
    }

    const created: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      authorName: `${currentUser.fullName} (${isCuratorOfThisGroup ? 'Sinf kuratori' : 'Administrator'})`,
      targetRole: 'Student',
      targetGroupId: group.id,
      date: new Date().toISOString().slice(0, 10),
      priority: newAnnPriority,
    };

    CollegeDataService.saveAnnouncement(created);
    setAnnouncements(
      CollegeDataService.getAnnouncements().filter(
        (a) => !a.targetGroupId || a.targetGroupId === group.id
      )
    );
    setIsAnnModalOpen(false);
    setNewAnnTitle('');
    setNewAnnContent('');
    onShowToast(`"${group.name}" uchun yangi e’lon joylandi`, 'success');
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) {
      onShowToast('Material nomi kiritilishi shart', 'error');
      return;
    }

    const created: GroupMaterial = {
      id: `mat-${Date.now()}`,
      groupId: group.id,
      title: newMatTitle.trim(),
      subjectName: newMatSubject.trim() || 'Umumiy darslik',
      fileType: newMatType,
      author: currentUser.fullName,
      uploadDate: new Date().toISOString().slice(0, 10),
      description: newMatDesc.trim(),
    };

    CollegeDataService.saveMaterial(created);
    setMaterials(CollegeDataService.getMaterials().filter((m) => m.groupId === group.id));
    setIsMatModalOpen(false);
    setNewMatTitle('');
    setNewMatSubject('');
    setNewMatDesc('');
    onShowToast('Yangi o‘quv materiali qo‘shildi', 'success');
  };

  const handleCreateDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateTitle.trim()) {
      onShowToast('Sana nomi kiritilishi shart', 'error');
      return;
    }

    const created: ImportantDateItem = {
      id: `dt-${Date.now()}`,
      groupId: group.id,
      title: newDateTitle.trim(),
      date: newDateVal,
      type: newDateType,
      description: newDateDesc.trim(),
    };

    CollegeDataService.saveImportantDate(created);
    setImportantDates(
      CollegeDataService.getImportantDates().filter(
        (d) => !d.groupId || d.groupId === group.id
      )
    );
    setIsDateModalOpen(false);
    setNewDateTitle('');
    setNewDateDesc('');
    onShowToast('Muhim sana kalendarga kiritildi', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Back button & top navigation breadcrumb */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Guruhlar ro‘yxatiga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenJournal && (
            <button
              onClick={onOpenJournal}
              className="py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Elektron jurnal →
            </button>
          )}
          {onOpenTimetable && (
            <button
              onClick={onOpenTimetable}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Dars jadvali →
            </button>
          )}
        </div>
      </div>

      {/* Main Group Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-amber-400/30">
              {group.courseYear}-bosqich
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-600/30 text-blue-200 font-bold text-xs border border-blue-500/30">
              {group.academicYear} o‘quv yili
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium text-xs">
              {students.length} nafar o‘quvchi
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {group.name}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-300 font-medium">
            Yo‘nalish: <span className="text-white font-bold">{group.specialty}</span>
          </p>

          {/* SINF KURATORI CARD ON HERO */}
          <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    Sinf kuratori (Guruh rahbari)
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {hasCurator ? group.curatorName : 'Sinf kuratori hali tayinlanmagan'}
                  </h3>

                  {hasCurator ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-200">
                      {group.curatorPhone && (
                        <a
                          href={`tel:${group.curatorPhone}`}
                          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>{group.curatorPhone}</span>
                        </a>
                      )}
                      {group.curatorEmail && (
                        <a
                          href={`mailto:${group.curatorEmail}`}
                          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>{group.curatorEmail}</span>
                        </a>
                      )}
                      {group.curatorRoom && (
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{group.curatorRoom}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 mt-1">
                      Ushbu guruhga texnikum ma’muriyati tomonidan mas’ul o‘qituvchi tayinlanadi.
                    </p>
                  )}
                </div>
              </div>

              {isCuratorOfThisGroup && (
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shrink-0">
                  Siz ushbu guruh kuratorisiz
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto custom-scrollbar no-print">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>O‘quvchilar ro‘yxati ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'timetable'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Dars jadvali</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Davomat statistikasi</span>
          {atRiskStudents.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ml-1">
              {atRiskStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Guruh e’lonlari</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'materials'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Darsliklar & Materiallar ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('homework')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'homework'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Uy vazifalari</span>
        </button>

        <button
          onClick={() => setActiveTab('dates')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dates'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Muhim sanalar</span>
        </button>
      </div>

      {/* TAB 1: STUDENTS LIST */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {group.name} o‘quvchilari tarkibi ({students.length} nafar)
              </h3>
              <p className="text-xs text-slate-500">
                O‘quvchilarning umumiy ko‘rsatkichlari, GPA va davomat foizlari.
              </p>
            </div>
          </div>

          {/* Mobile Cards for Students */}
          <div className="block md:hidden space-y-3">
            {students.map((student, idx) => (
              <div
                key={student.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{student.fullName}</h4>
                      <div className="text-[11px] font-mono text-blue-900 font-bold">{student.login}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                    GPA: {student.averageGrade}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span>Davomat: <b>{student.attendancePercent}%</b></span>
                  <span>{student.phone}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">№</th>
                  <th className="py-3 px-4">F.I.SH</th>
                  <th className="py-3 px-3">Login</th>
                  <th className="py-3 px-3">Telefon raqami</th>
                  <th className="py-3 px-3 text-center">O‘rtacha baho</th>
                  <th className="py-3 px-3 text-center">Davomat</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{student.fullName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">{student.login}</td>
                    <td className="py-3 px-3 text-slate-600">{student.phone}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                        {student.averageGrade} / 5.0
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {student.attendancePercent}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Faol
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {group.name} haftalik dars jadvali
              </h3>
              <p className="text-xs text-slate-500">
                Semestr bo‘yicha tasdiqlangan rasmiy mashg‘ulotlar rejasi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'] as const).map(
              (day) => {
                const dayLessons = timetable.filter((l) => l.day === day && l.subjectName);
                return (
                  <div
                    key={day}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                      <h4 className="font-bold text-sm tracking-wide">{day}</h4>
                      <span className="text-[11px] text-slate-300 font-medium">
                        {dayLessons.length} ta juftlik
                      </span>
                    </div>

                    <div className="p-3 space-y-2.5">
                      {dayLessons.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          Ushbu kunda darslar yo‘q.
                        </div>
                      ) : (
                        dayLessons.map((l) => (
                          <div
                            key={l.id}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-blue-900">
                                {l.pairRoman}-juftlik ({l.time})
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {l.room || 'o‘quv xonasi'}
                              </span>
                            </div>
                            <div className="font-extrabold text-slate-900">{l.subjectName}</div>
                            <div className="text-[11px] text-slate-600 font-medium">{l.teacherName}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & ANOMALIES */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Guruh davomat ko‘rsatkichi
              </span>
              <div className="text-2xl font-black text-slate-900">{groupAttRate}%</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">O‘rtacha ko‘rsatkich</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Kelganlar soni
              </span>
              <div className="text-2xl font-black text-emerald-700">{presentRecords} ta</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Qayd etilgan</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Sababli kelmaganlar
              </span>
              <div className="text-2xl font-black text-amber-600">{excusedRecords} ta</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Ma’lumotnoma bilan</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Sababsiz kelmaganlar
              </span>
              <div className="text-2xl font-black text-rose-600">{absentRecords} ta</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Dars qoldirish</div>
            </div>
          </div>

          {/* Anomaly / Warning section */}
          {atRiskStudents.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Diqqat: Surunkali sababsiz dars qoldirish aniqlandi ({atRiskStudents.length} nafar o‘quvchi)</span>
              </div>
              <p className="text-rose-700">
                Sinf kuratori va mas’ul ustozlar quyidagi o‘quvchilarning ota-onalari bilan bog‘lanishi tavsiya etiladi:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {atRiskStudents.map(({ student, unexcusedCount }) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-rose-300 font-bold text-rose-800"
                  >
                    <span>{student.fullName}</span>
                    <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-black">
                      {unexcusedCount} ta sababsiz
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-extrabold text-sm text-slate-900 mb-2">So‘nggi qayd etilgan davomatlar</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {attendance.slice(0, 8).map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{rec.studentName}</span>
                    <span className="text-slate-500 ml-2">({rec.subjectName} · {rec.date})</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                      rec.status === 'Keldi'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'Sababli'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.status === 'Sababli' ? 'Sababli kelmadi' : rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GROUP ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {group.name} uchun e’lonlar va bildirishnomalar
              </h3>
              <p className="text-xs text-slate-500">
                Sinf kuratori va o‘qituvchilar tomonidan joylashtirilgan rasmiy xabarlar.
              </p>
            </div>

            {canManageGroup && (
              <button
                onClick={() => setIsAnnModalOpen(true)}
                className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>E’lon berish</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                Ushbu guruh uchun hali e’lonlar joylashtirilmagan.
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">{ann.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        ann.priority === 'Shoshilinch'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.priority === 'Muhim'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Muallif: <b className="text-slate-600">{ann.authorName}</b></span>
                    <span>{ann.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUDY MATERIALS & TEXTBOOKS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {group.name} darsliklari va o‘quv-uslubiy materiallari
              </h3>
              <p className="text-xs text-slate-500">
                Kasbiy fanlar bo‘yicha rasmiy darsliklar, laboratoriya qo‘llanmalari va ma’ruzalar.
              </p>
            </div>

            {canManageGroup && (
              <button
                onClick={() => setIsMatModalOpen(true)}
                className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Material yuklash</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.length === 0 ? (
              <div className="col-span-full p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                Ushbu guruh uchun o‘quv materiallari hali joylanmagan.
              </div>
            ) : (
              materials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 text-[10px] font-extrabold uppercase">
                        {mat.fileType}
                      </span>
                      <span className="text-[10px] text-slate-400">{mat.uploadDate}</span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 leading-snug">{mat.title}</h4>
                    <div className="text-xs font-semibold text-blue-800">{mat.subjectName}</div>
                    {mat.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">{mat.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Ustoz: {mat.author}</span>
                    <button
                      onClick={() => onShowToast(`"${mat.title}" yuklab olish uchun tayyorlanmoqda`, 'info')}
                      className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Yuklab olish</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: HOMEWORK ASSIGNMENTS */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900">
              {group.name} uchun berilgan uy vazifalari ({homeworks.length} ta)
            </h3>
            <p className="text-xs text-slate-500">
              Fan o‘qituvchilari tomonidan berilgan amaliy vazifalar va topshirish muddatlari.
            </p>
          </div>

          <div className="space-y-3">
            {homeworks.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                Faol uy vazifalari mavjud emas.
              </div>
            ) : (
              homeworks.map((hw) => (
                <div
                  key={hw.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                        {hw.subjectName}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 mt-1">{hw.topic}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {hw.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{hw.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>O‘qituvchi: <b>{hw.teacherName}</b></span>
                    <span className="font-bold text-rose-700">Muddati: {hw.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: IMPORTANT DATES & CALENDAR */}
      {activeTab === 'dates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {group.name} muhim sanalari va eslatmalari
              </h3>
              <p className="text-xs text-slate-500">
                Oraliq nazoratlar, topshiriq muddatlari va texnikum tadbirlari.
              </p>
            </div>

            {canManageGroup && (
              <button
                onClick={() => setIsDateModalOpen(true)}
                className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sana kiritish</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {importantDates.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-extrabold uppercase">
                      {new Date(item.date).toLocaleDateString('uz-UZ', { month: 'short' })}
                    </span>
                    <span className="text-base font-black leading-none">
                      {new Date(item.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 shrink-0">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for Adding Group Content */}
      {isAnnModalOpen && (
        <Modal
          isOpen={isAnnModalOpen}
          onClose={() => setIsAnnModalOpen(false)}
          title={`"${group.name}" uchun yangi e’lon berish`}
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">E’lon sarlavhasi</label>
              <input
                type="text"
                required
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                placeholder="Masalan: Ertangi ochiq dars vaqti o‘zgardi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E’lon matni</label>
              <textarea
                required
                rows={4}
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                placeholder="E’lon mazmunini batafsil yozing..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Muhimlik darajasi</label>
              <select
                value={newAnnPriority}
                onChange={(e) => setNewAnnPriority(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                <option value="Oddiy">Oddiy</option>
                <option value="Muhim">Muhim</option>
                <option value="Shoshilinch">Shoshilinch</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                E’lonni joylash
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isMatModalOpen && (
        <Modal
          isOpen={isMatModalOpen}
          onClose={() => setIsMatModalOpen(false)}
          title={`"${group.name}" uchun o‘quv materiali qo‘shish`}
        >
          <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Material nomi / Darslik</label>
              <input
                type="text"
                required
                value={newMatTitle}
                onChange={(e) => setNewMatTitle(e.target.value)}
                placeholder="Masalan: Axborot xavfsizligi darsligi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tegishli fan</label>
                <input
                  type="text"
                  value={newMatSubject}
                  onChange={(e) => setNewMatSubject(e.target.value)}
                  placeholder="Masalan: Axborot texnalogiyalari"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Format turi</label>
                <select
                  value={newMatType}
                  onChange={(e) => setNewMatType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="pdf">PDF hujjat</option>
                  <option value="doc">Word / DOC</option>
                  <option value="link">Havola (Link)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Qisqacha tavsif</label>
              <textarea
                rows={3}
                value={newMatDesc}
                onChange={(e) => setNewMatDesc(e.target.value)}
                placeholder="Material mazmuni va o‘quvchilarga ko‘rsatmalar..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                Saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isDateModalOpen && (
        <Modal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          title={`"${group.name}" uchun muhim sana kiritish`}
        >
          <form onSubmit={handleCreateDate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tadbir / Muddat nomi</label>
              <input
                type="text"
                required
                value={newDateTitle}
                onChange={(e) => setNewDateTitle(e.target.value)}
                placeholder="Masalan: 1-Oraliq nazorat sinovi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sana</label>
                <input
                  type="date"
                  required
                  value={newDateVal}
                  onChange={(e) => setNewDateVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategoriya</label>
                <select
                  value={newDateType}
                  onChange={(e) => setNewDateType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="oraliq">Oraliq nazorat</option>
                  <option value="imtihon">Yakuniy imtihon</option>
                  <option value="topshiriq">Topshiriq muddati</option>
                  <option value="dam_olish">Dam olish kuni</option>
                  <option value="tadbir">Texnikum tadbiri</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tavsif</label>
              <input
                type="text"
                value={newDateDesc}
                onChange={(e) => setNewDateDesc(e.target.value)}
                placeholder="Masalan: 102-xonada soat 10:00 da o‘tkaziladi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                Kalendarga qo‘shish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
