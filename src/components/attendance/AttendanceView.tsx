import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Group, Subject, UserRole, AttendanceStatus, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Filter, Download, Printer, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AttendanceViewProps {
  role: UserRole;
  currentStudentId?: string;
  onShowToast: ShowToastFn;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  role,
  currentStudentId,
  onShowToast,
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    CollegeDataService.getAttendance()
  );
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());

  // Filters
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reload listener
  React.useEffect(() => {
    const handleUpdate = () => {
      setAttendance(CollegeDataService.getAttendance());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredList = useMemo(() => {
    return attendance.filter((a) => {
      // If student role, ONLY show their records
      if (role === 'student' && currentStudentId && a.studentId !== currentStudentId) {
        return false;
      }
      if (filterGroup !== 'all' && a.groupId !== filterGroup) return false;
      if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          a.studentName.toLowerCase().includes(query) ||
          a.subjectName.toLowerCase().includes(query) ||
          a.groupName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [attendance, role, currentStudentId, filterGroup, filterSubject, filterStatus, searchQuery]);

  // Statistics (Only 3 states: Keldi, Kelmadi, Sababli kelmadi)
  const totalCount = filteredList.length;
  const presentCount = filteredList.filter((a) => a.status === 'Keldi').length;
  const excusedCount = filteredList.filter((a) => a.status === 'Sababli').length;
  const absentCount = filteredList.filter((a) => a.status === 'Kelmadi').length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  const cycleStatus = (record: AttendanceRecord) => {
    if (role === 'student') return;
    const states: AttendanceStatus[] = ['Keldi', 'Sababli', 'Kelmadi'];
    const nextIdx = (states.indexOf(record.status) + 1) % states.length;
    const nextStatus = states[nextIdx];
    const updated = { ...record, status: nextStatus, updatedAt: new Date().toISOString() };
    CollegeDataService.saveAttendance(updated);
    setAttendance(CollegeDataService.getAttendance());
    onShowToast(`Holat o‘zgartirildi: ${nextStatus === 'Sababli' ? 'Sababli kelmadi' : nextStatus}`, 'success');
  };

  const handleExportCSV = () => {
    const rows = [['O‘quvchi', 'Guruh', 'Fan', 'Sana', 'Juftlik', 'Holat', 'O‘qituvchi']];
    filteredList.forEach((r) => {
      const statusLabel = r.status === 'Sababli' ? 'Sababli kelmadi' : r.status;
      rows.push([r.studentName, r.groupName, r.subjectName, r.date, String(r.pairNumber), statusLabel, r.teacherName]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `DAVOMAT_HISOBOTI_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Davomat hisoboti CSV formatida yuklandi', 'success');
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Keldi':
        return {
          label: 'Keldi',
          className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
      case 'Sababli':
        return {
          label: 'Sababli kelmadi',
          className: 'bg-amber-100 text-amber-800 border border-amber-200',
        };
      case 'Kelmadi':
      default:
        return {
          label: 'Kelmadi',
          className: 'bg-rose-100 text-rose-800 border border-rose-200',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Stats - 4 Balanced Cards: Foiz, Kelgan, Sababli, Kelmagan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Davomat foizi</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{rate}%</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">O‘rtacha ko‘rsatkich</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Kelgan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{presentCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Darslarda to‘liq</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sababli kelmadi</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{excusedCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Ma’lumotnoma bilan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sababsiz kelmadi</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{absentCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Kelmadi</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O‘quvchi yoki fan bo‘yicha qidirish..."
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {role !== 'student' && (
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha fanlar</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha holatlar</option>
            <option value="Keldi">Keldi</option>
            <option value="Sababli">Sababli kelmadi</option>
            <option value="Kelmadi">Kelmadi</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Cards (Phone) */}
      <div className="block md:hidden space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Mos keluvchi davomat yozuvlari topilmadi.
          </div>
        ) : (
          filteredList.map((rec) => {
            const badge = getStatusBadge(rec.status);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug break-words">
                      {rec.studentName}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {rec.groupName} · {rec.subjectName}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>
                    {rec.date} ({rec.pairNumber}-juftlik)
                  </span>
                  {role !== 'student' && (
                    <button
                      type="button"
                      onClick={() => cycleStatus(rec)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      O‘zgartirish
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Attendance Table (Desktop / Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">O‘quvchining F.I.SH</th>
                <th className="py-3 px-3">Guruh</th>
                <th className="py-3 px-3">Fan</th>
                <th className="py-3 px-3">Sana & Juftlik</th>
                <th className="py-3 px-4 text-center">Holat</th>
                <th className="py-3 px-3">O‘qituvchi</th>
                {role !== 'student' && <th className="py-3 px-3 text-right">Amal</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Mos keluvchi davomat yozuvlari topilmadi.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec, idx) => {
                  const badge = getStatusBadge(rec.status);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{rec.studentName}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{rec.groupName}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{rec.subjectName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{rec.date}</span>{' '}
                        <span className="text-[10px] text-slate-400">({rec.pairNumber}-juftlik)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{rec.teacherName}</td>
                      {role !== 'student' && (
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => cycleStatus(rec)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            O‘zgartirish
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
