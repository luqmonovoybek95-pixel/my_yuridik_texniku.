import React, { useState, useMemo, useEffect } from 'react';
import {
  Group,
  Teacher,
  Student,
  AttendanceRecord,
  TimetableLesson,
  AnnouncementItem,
  GroupMaterial,
  ShowToastFn,
  UserAccount,
} from '../../types';
import { CollegeDataService } from '../../services/storage';
import {
  UserCheck,
  Users,
  Calendar,
  CheckSquare,
  Bell,
  BookOpen,
  AlertTriangle,
  Send,
  Phone,
  Mail,
  FileSpreadsheet,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface CuratorWorkspaceProps {
  currentUser: UserAccount;
  onShowToast: ShowToastFn;
  onOpenTimetable?: () => void;
  onOpenJournal?: () => void;
}

export const CuratorWorkspace: React.FC<CuratorWorkspaceProps> = ({
  currentUser,
  onShowToast,
  onOpenTimetable,
  onOpenJournal,
}) => {
  const [allGroups, setAllGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [allTeachers, setAllTeachers] = useState<Teacher[]>(() => CollegeDataService.getTeachers());
  const [students, setStudents] = useState<Student[]>(() => CollegeDataService.getStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => CollegeDataService.getAttendance());
  const [timetable, setTimetable] = useState<TimetableLesson[]>(() => CollegeDataService.getTimetable());
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    CollegeDataService.getAnnouncements()
  );
  const [materials, setMaterials] = useState<GroupMaterial[]>(() =>
    CollegeDataService.getMaterials()
  );

  useEffect(() => {
    const handleStorageUpdate = () => {
      setAllGroups(CollegeDataService.getGroups());
      setAllTeachers(CollegeDataService.getTeachers());
      setStudents(CollegeDataService.getStudents());
      setAttendance(CollegeDataService.getAttendance());
      setTimetable(CollegeDataService.getTimetable());
      setAnnouncements(CollegeDataService.getAnnouncements());
      setMaterials(CollegeDataService.getMaterials());
    };
    window.addEventListener('syt-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('syt-storage-update', handleStorageUpdate);
  }, []);

  // Find groups where this user is assigned as curator
  const curatedGroups = useMemo(() => {
    return allGroups.filter(
      (g) =>
        g.curatorTeacherId === currentUser.linkedEntityId ||
        (g.curatorName &&
          (g.curatorName.toLowerCase().includes(currentUser.fullName.toLowerCase()) ||
            currentUser.fullName.toLowerCase().includes(g.curatorName.toLowerCase()))) ||
        currentUser.role === 'admin' // Admin can inspect any curator space
    );
  }, [allGroups, currentUser]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    curatedGroups[0]?.id || allGroups[0]?.id || ''
  );

  const activeGroup = useMemo(() => {
    return allGroups.find((g) => g.id === selectedGroupId) || curatedGroups[0] || allGroups[0];
  }, [allGroups, curatedGroups, selectedGroupId]);

  // Filter for active group
  const groupStudents = useMemo(() => {
    return students.filter((s) => s.groupId === activeGroup?.id);
  }, [students, activeGroup]);

  const groupAttendance = useMemo(() => {
    return attendance.filter((a) => a.groupId === activeGroup?.id);
  }, [attendance, activeGroup]);

  const groupTimetable = useMemo(() => {
    return timetable.filter((l) => l.groupId === activeGroup?.id && l.subjectName);
  }, [timetable, activeGroup]);

  const groupAnnouncements = useMemo(() => {
    return announcements.filter(
      (a) => !a.targetGroupId || a.targetGroupId === activeGroup?.id
    );
  }, [announcements, activeGroup]);

  const groupMaterials = useMemo(() => {
    return materials.filter((m) => m.groupId === activeGroup?.id);
  }, [materials, activeGroup]);

  // Statistics
  const totalAtt = groupAttendance.length;
  const presentCount = groupAttendance.filter((a) => a.status === 'Keldi').length;
  const excusedCount = groupAttendance.filter((a) => a.status === 'Sababli').length;
  const absentCount = groupAttendance.filter((a) => a.status === 'Kelmadi').length;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 96;

  const avgGroupGPA =
    groupStudents.length > 0
      ? (
          groupStudents.reduce((acc, s) => acc + s.averageGrade, 0) / groupStudents.length
        ).toFixed(1)
      : '0.0';

  // Anomaly Detection: Students with multiple unexcused absences
  const atRiskList = useMemo(() => {
    return groupStudents
      .map((student) => {
        const unexcused = groupAttendance.filter(
          (a) => a.studentId === student.id && a.status === 'Kelmadi'
        ).length;
        const excused = groupAttendance.filter(
          (a) => a.studentId === student.id && a.status === 'Sababli'
        ).length;
        return { student, unexcused, excused };
      })
      .filter((item) => item.unexcused >= 2);
  }, [groupStudents, groupAttendance]);

  // Modal states for curator
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      onShowToast('Sarlavha va matn kiritilishi shart', 'error');
      return;
    }

    const created: AnnouncementItem = {
      id: `cur-ann-${Date.now()}`,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      authorName: `${currentUser.fullName} (Sinf kuratori)`,
      targetRole: 'Student',
      targetGroupId: activeGroup.id,
      date: new Date().toISOString().slice(0, 10),
      priority: 'Muhim',
    };

    CollegeDataService.saveAnnouncement(created);
    setAnnouncements(CollegeDataService.getAnnouncements());
    setIsNoticeModalOpen(false);
    setNoticeTitle('');
    setNoticeContent('');
    onShowToast(`"${activeGroup.name}" o‘quvchilariga eslatma yuborildi`, 'success');
  };

  const handleExportReport = () => {
    const rows = [
      ['№', 'O‘quvchining F.I.SH', 'Login', 'Telefon', 'GPA', 'Davomat foizi', 'Holat'],
    ];
    groupStudents.forEach((s, idx) => {
      rows.push([
        String(idx + 1),
        s.fullName,
        s.login,
        s.phone,
        String(s.averageGrade),
        `${s.attendancePercent}%`,
        s.status,
      ]);
    });
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `KURATORLIK_HISOBOTI_${activeGroup?.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Guruh hisoboti yuklab olindi', 'success');
  };

  if (!activeGroup) {
    return (
      <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-700 text-base">
          Sizga hozircha sinf kuratorligi biriktirilmagan
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Guruh kuratorligi texnikum administratori tomonidan belgilanadi. Ma’muriyat bilan bog‘laning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2.5">
              <UserCheck className="w-4 h-4" />
              <span>Sinf kuratori (Guruh rahbari) ish maydoni</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {activeGroup.name} · Kuratorlik kabineti
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Yo‘nalish: <b>{activeGroup.specialty}</b> · Mas’ul kurator: <b>{activeGroup.curatorName}</b>
            </p>
          </div>

          {/* Group Switcher if curator has multiple groups */}
          <div className="flex flex-wrap items-center gap-2">
            {curatedGroups.length > 1 && (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="py-2 px-3 bg-white/15 border border-white/20 text-white rounded-xl text-xs font-bold focus:outline-none"
              >
                {curatedGroups.map((g) => (
                  <option key={g.id} value={g.id} className="text-slate-900 font-semibold">
                    {g.name} ({g.specialty})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guruhga eslatma</span>
            </button>
            <button
              onClick={handleExportReport}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Hisobot</span>
            </button>
          </div>
        </div>

        {/* Mandatory Security & RBAC Policy Note */}
        <div className="mt-5 p-3 rounded-2xl bg-blue-900/40 border border-blue-700/40 text-xs text-blue-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <b>Kuratorlik vakolati bo‘yicha eslatma:</b> Siz o‘z guruhingizning davomati, o‘zlashtirish tahlili, dars jadvali va e’lonlarini to‘liq boshqarasiz. Baho kiritish huquqi faqat har bir fanga rasmiy biriktirilgan o‘qituvchida saqlanadi.
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘quvchilar</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{groupStudents.length} nafar</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Ro‘yxat bo‘yicha to‘liq</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘rtacha GPA</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{avgGroupGPA} / 5.0</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Guruh o‘zlashtirishi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Davomat foizi</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{attRate}%</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            {presentCount} kelgan / {absentCount} kelmagan
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Nazoratdagi talabalar</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{atRiskList.length} nafar</div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">Surunkali sababsiz</div>
        </div>
      </div>

      {/* Warning banner if students at risk */}
      {atRiskList.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-rose-950">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Sinf kuratori diqqatiga: Dars qoldirish xavfi aniqlangan o‘quvchilar</span>
          </div>
          <p className="text-rose-800">
            Quyidagi o‘quvchilar sababsiz ravishda 2 yoki undan ortiq dars juftliklariga qatnashmagan. Iltimos, ota-onalari bilan bog‘laning:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {atRiskList.map(({ student, unexcused, excused }) => (
              <div
                key={student.id}
                className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{student.fullName}</div>
                  <a
                    href={`tel:${student.phone}`}
                    className="text-[11px] text-blue-700 font-semibold hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{student.phone}</span>
                  </a>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs">
                    {unexcused} ta sababsiz
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{excused} ta sababli</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Student Roster & Group Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Students List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" />
              <span>Guruh o‘quvchilari va aloqa ma’lumotlari</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{groupStudents.length} nafar</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">№</th>
                    <th className="py-3 px-4">O‘quvchining F.I.SH</th>
                    <th className="py-3 px-3">Telefon</th>
                    <th className="py-3 px-3 text-center">GPA</th>
                    <th className="py-3 px-3 text-center">Davomat</th>
                    <th className="py-3 px-4 text-center">Aloqa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {groupStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.login}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{s.phone}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                          {s.averageGrade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {s.attendancePercent}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors"
                          title="Telefon qilish"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Timetable & Quick Group Notices */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Guruh dars jadvali</span>
              </h3>
              {onOpenTimetable && (
                <button
                  onClick={onOpenTimetable}
                  className="text-xs font-bold text-blue-900 hover:underline"
                >
                  To‘liq jadval →
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {groupTimetable.slice(0, 6).map((l) => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900">
                      {l.day} · {l.pairRoman}-juftlik
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {l.room || 'o‘quv xonasi'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{l.subjectName}</div>
                  <div className="text-[11px] text-slate-500">{l.teacherName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Materials / Textbooks */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-900" />
              <span>Guruh o‘quv materiallari ({groupMaterials.length})</span>
            </h3>

            <div className="space-y-2">
              {groupMaterials.slice(0, 3).map((mat) => (
                <div
                  key={mat.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{mat.title}</div>
                    <div className="text-[11px] text-slate-500">{mat.subjectName}</div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded">
                    {mat.fileType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for posting notice as curator */}
      {isNoticeModalOpen && (
        <Modal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          title={`"${activeGroup.name}" o‘quvchilariga eslatma yuborish`}
        >
          <form onSubmit={handlePostNotice} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sarlavha</label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="Masalan: Ertangi dars uchun forma va daftarlar nazorati"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Eslatma matni</label>
              <textarea
                required
                rows={4}
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="Guruh o‘quvchilariga yetkazilishi kerak bo‘lgan muhim xabarni yozing..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                Yuborish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
