import React, { useState } from 'react';
import { CollegeDataService } from '../../services/storage';
import { Group, Student, Subject, GradeRecord, AttendanceRecord } from '../../types';
import { BarChart3, Download, Printer, PieChart, TrendingUp, Award, CheckSquare } from 'lucide-react';

interface ReportsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast }) => {
  const [students, setStudents] = useState<Student[]>(() => CollegeDataService.getStudents());
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());
  const [grades, setGrades] = useState<GradeRecord[]>(() => CollegeDataService.getGrades());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => CollegeDataService.getAttendance());

  React.useEffect(() => {
    const handleUpdate = () => {
      setStudents(CollegeDataService.getStudents());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
      setGrades(CollegeDataService.getGrades());
      setAttendance(CollegeDataService.getAttendance());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  // Group achievements
  const groupStats = groups.map((g) => {
    const gStudents = students.filter((s) => s.groupId === g.id);
    const count = gStudents.length;
    const avgGPA =
      count > 0
        ? (
            gStudents.reduce((sum, s) => sum + s.averageGrade, 0) / count
          ).toFixed(1)
        : '0.0';
    const avgAtt =
      count > 0
        ? Math.round(
            gStudents.reduce((sum, s) => sum + s.attendancePercent, 0) / count
          )
        : 100;
    return { ...g, count, avgGPA, avgAtt };
  });

  // Subject achievements
  const subjectStats = subjects.map((subj) => {
    const sGrades = grades.filter((g) => g.subjectId === subj.id);
    const count = sGrades.length;
    const avgGrade =
      count > 0
        ? (sGrades.reduce((sum, g) => sum + g.gradeValue, 0) / count).toFixed(2)
        : '—';
    const excellent = sGrades.filter((g) => g.gradeValue === 5).length;
    return { ...subj, count, avgGrade, excellent };
  });

  const handleExportFullReport = () => {
    const rows = [
      ['Guruh', 'Mutaxassislik', 'Talabalar soni', 'O‘rtacha baho (GPA)', 'O‘rtacha davomat %'],
    ];
    groupStats.forEach((g) => {
      rows.push([g.name, g.specialty, String(g.count), g.avgGPA, `${g.avgAtt}%`]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `SIRDARYO_YT_HISOBOTI_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Umumiy hisobot CSV formatida yuklab olindi', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <span>Tahliliy hisobotlar va ko‘rsatkichlar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Texnikum o‘quv jarayoni, davomat sur’ati va o‘zlashtirish tahlillari.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFullReport}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV eksport</span>
          </button>
          <button
            onClick={() => window.print()}
            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
        </div>
      </div>

      {/* Group Achievement Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Guruhlar kesimida o‘zlashtirish va davomat ko‘rsatkichlari</span>
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Guruh nomi</th>
                <th className="py-3 px-3">Mutaxassislik</th>
                <th className="py-3 px-3 text-center">Talabalar soni</th>
                <th className="py-3 px-3 text-center">O‘rtacha baho (GPA)</th>
                <th className="py-3 px-3 text-center">Davomat ko‘rsatkichi</th>
                <th className="py-3 px-4 text-center">O‘zlashtirish darajasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupStats.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{g.name}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{g.specialty}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">{g.count} nafar</td>
                  <td className="py-3 px-3 text-center font-black text-slate-900">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                      {g.avgGPA} / 5.0
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-900">
                    {g.avgAtt}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="w-full bg-slate-100 rounded-full h-2 max-w-[120px] mx-auto overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (Number(g.avgGPA) / 5) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Statistics Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Fanlar kesimida baholash va yuklama hisoboti</span>
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Fan nomi</th>
                <th className="py-3 px-3">Kodi</th>
                <th className="py-3 px-3 text-center">Haftalik soat</th>
                <th className="py-3 px-3 text-center">Qo‘yilgan baholar</th>
                <th className="py-3 px-3 text-center">O‘rtacha ko‘rsatkich</th>
                <th className="py-3 px-3 text-center">A’lo baholar (5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectStats.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{s.code || '—'}</td>
                  <td className="py-3 px-3 text-center font-medium text-slate-600">{s.weeklyHours} soat</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{s.count} ta</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900">
                      {s.avgGrade}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-700">{s.excellent} ta</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
