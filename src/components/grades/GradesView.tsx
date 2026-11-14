import React, { useState, useMemo } from 'react';
import { GradeRecord, Group, Subject, Student, UserRole, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Award, Plus, Download, Printer, TrendingUp, Star, Filter } from 'lucide-react';
import { Modal } from '../common/Modal';

interface GradesViewProps {
  role: UserRole;
  currentStudentId?: string;
  onShowToast: ShowToastFn;
}

export const GradesView: React.FC<GradesViewProps> = ({
  role,
  currentStudentId,
  onShowToast,
}) => {
  const [grades, setGrades] = useState<GradeRecord[]>(() => CollegeDataService.getGrades());
  const [students, setStudents] = useState<Student[]>(() => CollegeDataService.getStudents());
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());

  // Filters
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Grade Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentId: students[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    gradeValue: 5,
    type: 'Joriy' as const,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      setGrades(CollegeDataService.getGrades());
      setGroups(CollegeDataService.getGroups());
      setStudents(CollegeDataService.getStudents());
      setSubjects(CollegeDataService.getSubjects());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      if (role === 'student' && currentStudentId && g.studentId !== currentStudentId) {
        return false;
      }
      if (filterGroup !== 'all' && g.groupId !== filterGroup) return false;
      if (filterSubject !== 'all' && g.subjectId !== filterSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.studentName.toLowerCase().includes(q) ||
          g.subjectName.toLowerCase().includes(q) ||
          g.groupName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [grades, role, currentStudentId, filterGroup, filterSubject, searchQuery]);

  // Overall statistics
  const totalGradesCount = filteredGrades.length;
  const gradeSum = filteredGrades.reduce((acc, curr) => acc + curr.gradeValue, 0);
  const overallAvg = totalGradesCount > 0 ? (gradeSum / totalGradesCount).toFixed(2) : '—';
  const excellentCount = filteredGrades.filter((g) => g.gradeValue === 5).length;
  const goodCount = filteredGrades.filter((g) => g.gradeValue === 4).length;
  const satisfactoryCount = filteredGrades.filter((g) => g.gradeValue === 3).length;

  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newGrade.studentId);
    const sb = subjects.find((s) => s.id === newGrade.subjectId);
    if (!st || !sb) return;

    const record: GradeRecord = {
      id: `grd-${Date.now()}`,
      studentId: st.id,
      studentName: st.fullName,
      groupId: st.groupId,
      groupName: st.groupName,
      subjectId: sb.id,
      subjectName: sb.name,
      teacherId: 't-1',
      teacherName: 'O‘qituvchi',
      date: newGrade.date,
      gradeValue: Number(newGrade.gradeValue),
      type: newGrade.type,
      note: newGrade.note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    CollegeDataService.saveGrade(record);
    setGrades(CollegeDataService.getGrades());
    setIsModalOpen(false);
    onShowToast('Baho jurnalga muvaffaqiyatli kiritildi', 'success');
  };

  const handleDeleteGrade = (id: string) => {
    if (role === 'student') return;
    if (window.confirm('Ushbu bahoni o‘chirishni tasdiqlaysizmi?')) {
      CollegeDataService.deleteGrade(id);
      setGrades(CollegeDataService.getGrades());
      onShowToast('Baho o‘chirildi', 'info');
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">O‘rtacha ko‘rsatkich</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{overallAvg} / 5.0</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">5 ballik baholash tizimi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">A’lo (5)</span>
            <Star className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{excellentCount} ta</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">A’lo baholar ulushi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Yaxshi (4)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700">{goodCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Yaxshi o‘zlashtirish</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Qoniqarli (3)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{satisfactoryCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Nazorat talab</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
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
        </div>

        <div className="flex items-center gap-2">
          {role !== 'student' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Baho qo‘yish</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Cards (Phone) */}
      <div className="block md:hidden space-y-3">
        {filteredGrades.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Hozircha baholar yozuvi topilmadi.
          </div>
        ) : (
          filteredGrades.map((g, idx) => {
            const badgeColor =
              g.gradeValue === 5
                ? 'bg-emerald-600 text-white'
                : g.gradeValue === 4
                ? 'bg-blue-600 text-white'
                : g.gradeValue === 3
                ? 'bg-amber-500 text-white'
                : 'bg-rose-600 text-white';

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {g.studentName}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {g.groupName} · {g.subjectName}
                    </div>
                  </div>
                  <span
                    className={`w-8 h-8 rounded-xl inline-flex items-center justify-center font-black text-sm shadow-2xs shrink-0 ${badgeColor}`}
                  >
                    {g.gradeValue}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {g.type}
                    </span>
                    <span>{g.date}</span>
                  </div>
                  {role !== 'student' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGrade(g.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      O‘chirish
                    </button>
                  )}
                </div>

                {g.note && (
                  <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    {g.note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Grades Table (Desktop / Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">O‘quvchining F.I.SH</th>
                <th className="py-3 px-3">Guruh</th>
                <th className="py-3 px-3">Fan</th>
                <th className="py-3 px-3">Baho turi</th>
                <th className="py-3 px-3">Sana</th>
                <th className="py-3 px-4 text-center">Baho</th>
                <th className="py-3 px-3">Izoh</th>
                {role !== 'student' && <th className="py-3 px-3 text-right">Amal</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Hozircha baholar yozuvi topilmadi.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => {
                  const badgeColor =
                    g.gradeValue === 5
                      ? 'bg-emerald-600 text-white'
                      : g.gradeValue === 4
                      ? 'bg-blue-600 text-white'
                      : g.gradeValue === 3
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white';

                  return (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{g.studentName}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{g.groupName}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{g.subjectName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {g.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{g.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-black text-xs ${badgeColor}`}>
                          {g.gradeValue}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                        {g.note || '—'}
                      </td>
                      {role !== 'student' && (
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteGrade(g.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            O‘chirish
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

      {/* Add Grade Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yangi baho qo‘yish"
        >
          <form onSubmit={handleCreateGrade} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                O‘quvchi
              </label>
              <select
                value={newGrade.studentId}
                onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.groupName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fan
              </label>
              <select
                value={newGrade.subjectId}
                onChange={(e) => setNewGrade({ ...newGrade, subjectId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                {subjects.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Baho qiymati
                </label>
                <select
                  value={newGrade.gradeValue}
                  onChange={(e) => setNewGrade({ ...newGrade, gradeValue: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                >
                  <option value={5}>5 — A’lo</option>
                  <option value={4}>4 — Yaxshi</option>
                  <option value={3}>3 — Qoniqarli</option>
                  <option value={2}>2 — Qoniqarsiz</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Baho turi
                </label>
                <select
                  value={newGrade.type}
                  onChange={(e) => setNewGrade({ ...newGrade, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="Joriy">Joriy nazorat</option>
                  <option value="Oraliq">Oraliq nazorat</option>
                  <option value="Yakuniy">Yakuniy nazorat</option>
                  <option value="Amaliy">Amaliy mashg‘ulot</option>
                  <option value="Mustaqil ish">Mustaqil ish</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sana
              </label>
              <input
                type="date"
                value={newGrade.date}
                onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Izoh (ixtiyoriy)
              </label>
              <input
                type="text"
                value={newGrade.note}
                onChange={(e) => setNewGrade({ ...newGrade, note: e.target.value })}
                placeholder="Masalan: Faol qatnashganligi uchun"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white"
              >
                Bahoni saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
