import React, { useState, useMemo } from 'react';
import { UserAccount, Student, GradeRecord, AttendanceRecord, HomeworkItem, AnnouncementItem, Group, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import {
  User,
  GraduationCap,
  Award,
  CheckSquare,
  Calendar,
  FileText,
  Bell,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Layers,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StudentProfileViewProps {
  currentUser: UserAccount;
  onShowToast: ShowToastFn;
  onOpenTimetable?: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  currentUser,
  onShowToast,
  onOpenTimetable,
}) => {
  const students = CollegeDataService.getStudents();
  const groups = CollegeDataService.getGroups();
  const grades = CollegeDataService.getGrades();
  const attendance = CollegeDataService.getAttendance();
  const homeworks = CollegeDataService.getHomeworks();
  const announcements = CollegeDataService.getAnnouncements();

  // Find linked student entity
  const student =
    students.find((s) => s.id === currentUser.linkedEntityId) ||
    students.find((s) => s.login.toLowerCase() === currentUser.login.toLowerCase()) ||
    students[0];

  const group = groups.find((g) => g.id === student?.groupId);

  const studentGrades = useMemo(() => {
    return grades.filter((g) => g.studentId === student?.id);
  }, [grades, student]);

  const studentAttendance = useMemo(() => {
    return attendance.filter((a) => a.studentId === student?.id);
  }, [attendance, student]);

  const groupHomeworks = useMemo(() => {
    return homeworks.filter((h) => h.groupId === student?.groupId);
  }, [homeworks, student]);

  const personalAnnouncements = useMemo(() => {
    return announcements.filter(
      (a) => a.targetRole === 'All' || a.targetRole === 'Student' || a.targetGroupId === student?.groupId
    );
  }, [announcements, student]);

  // Attendance breakdown (strictly 3 states: Keldi, Kelmadi, Sababli kelmadi)
  const totalLessons = studentAttendance.length;
  const presentCount = studentAttendance.filter((a) => a.status === 'Keldi').length;
  const excusedCount = studentAttendance.filter((a) => a.status === 'Sababli').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'Kelmadi').length;
  const attRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : student?.attendancePercent || 96;

  // Grades breakdown by subject
  const gradesBySubject = useMemo(() => {
    const map: Record<string, GradeRecord[]> = {};
    studentGrades.forEach((g) => {
      if (!map[g.subjectName]) map[g.subjectName] = [];
      map[g.subjectName].push(g);
    });
    return map;
  }, [studentGrades]);

  const hasCurator =
    group?.curatorName &&
    group.curatorName !== 'Sinf kuratori hali tayinlanmagan' &&
    !group.curatorName.includes('tayinlanmagan');

  return (
    <div className="space-y-6">
      {/* Profile Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20 border-2 border-white/20">
              {student?.fullName.slice(0, 2).toUpperCase() || 'ST'}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[11px] border border-blue-400/30 uppercase tracking-wider">
                  O‘quvchi profili
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  {student?.status || 'Faol'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {student?.fullName || currentUser.fullName}
              </h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span>Login: <b className="font-mono text-amber-300">{currentUser.login}</b></span>
                {student?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.phone}</span>
                  </span>
                )}
                {student?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-between md:justify-center pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Umumiy o‘zlashtirish
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {student?.averageGrade || 4.8} / 5.0
              </span>
            </div>
            {onOpenTimetable && (
              <button
                onClick={onOpenTimetable}
                className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Dars jadvalim →
              </button>
            )}
          </div>
        </div>

        {/* Read-only Security Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Ma’lumotlar himoyalangan: Baho, davomat va shaxsiy yozuvlar faqat ma’muriyat tomonidan o‘zgartirilishi mumkin.</span>
          </div>
          <span className="text-[11px] text-slate-500">ID: {student?.id}</span>
        </div>
      </div>

      {/* Group & Class Curator Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-900" />
          <span>Guruh va Sinf kuratori ma’lumotlari</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group details */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              O‘quv guruhi
            </span>
            <div className="text-lg font-black text-slate-900">
              {group?.name || student?.groupName || '12-guruh'}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Mutaxassislik: <b>{group?.specialty || 'Kompyuter tarmoqlari va IT'}</b>
            </div>
            <div className="text-xs text-slate-500">
              Bosqich: <b>{group?.courseYear || 1}-kurs</b> · {group?.academicYear || '2026-2027'} o‘quv yili
            </div>
          </div>

          {/* Sinf kuratori */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            hasCurator ? 'bg-blue-50/60 border-blue-200' : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-900" />
                <span>Sinf kuratori:</span>
              </span>
              {hasCurator ? (
                <span className="text-[10px] font-extrabold bg-blue-900 text-white px-2 py-0.5 rounded">
                  Tayinlangan
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded">
                  Kutilmoqda
                </span>
              )}
            </div>

            <div className="text-base font-black text-slate-900">
              {hasCurator ? group?.curatorName : 'Sinf kuratori hali tayinlanmagan'}
            </div>

            {hasCurator ? (
              <div className="space-y-1 pt-1 border-t border-blue-100 text-xs text-slate-700">
                {group?.curatorPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-800" />
                    <a href={`tel:${group.curatorPhone}`} className="font-semibold hover:underline">
                      {group.curatorPhone}
                    </a>
                  </div>
                )}
                {group?.curatorEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-800" />
                    <a href={`mailto:${group.curatorEmail}`} className="font-semibold hover:underline">
                      {group.curatorEmail}
                    </a>
                  </div>
                )}
                {group?.curatorRoom && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-blue-800" />
                    <span>Xona: {group.curatorRoom}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Texnikum ma’muriyati tomonidan guruh uchun mas’ul kurator belgilanadi.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Baholar & Davomat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘rtacha baho</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{student?.averageGrade || 4.8}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">A’lo natija</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Davomat ko‘rsatkichi</span>
            <CheckSquare className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-900">{attRate}%</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">{presentCount} ta darsda qatnashgan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sababli kelmagan</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{excusedCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Ma’lumotnoma bilan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sababsiz kelmagan</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{absentCount} ta</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Dars qoldirish</div>
        </div>
      </div>

      {/* Main Grid: Grades breakdown and Attendance history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject-by-Subject Grades */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Fanlar bo‘yicha baholarim</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              Jami baholar: {studentGrades.length} ta
            </span>
          </h3>

          <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {Object.keys(gradesBySubject).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Hozircha baholar qayd etilmagan.
              </div>
            ) : (
              Object.entries(gradesBySubject).map(([subjName, subjGrades]) => {
                const avg = (
                  subjGrades.reduce((sum, g) => sum + g.gradeValue, 0) / subjGrades.length
                ).toFixed(1);
                return (
                  <div
                    key={subjName}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{subjName}</span>
                      <span className="font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        O‘rtacha: {avg}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subjGrades.map((g) => (
                        <span
                          key={g.id}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-2xs ${
                            g.gradeValue === 5
                              ? 'bg-emerald-600 text-white'
                              : g.gradeValue === 4
                              ? 'bg-blue-600 text-white'
                              : g.gradeValue === 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                          title={`${g.date}: ${g.gradeValue} ball (${g.type})`}
                        >
                          {g.gradeValue}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-900" />
              <span>Davomat tarixi</span>
            </span>
            <span className="text-xs font-bold text-slate-500">{totalLessons} ta qayd</span>
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {studentAttendance.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Davomat yozuvlari mavjud emas.
              </div>
            ) : (
              studentAttendance.map((att) => (
                <div
                  key={att.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{att.subjectName}</div>
                    <div className="text-[11px] text-slate-500">
                      {att.date} ({att.pairNumber}-juftlik) · {att.teacherName}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      att.status === 'Keldi'
                        ? 'bg-emerald-100 text-emerald-800'
                        : att.status === 'Sababli'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {att.status === 'Sababli' ? 'Sababli kelmadi' : att.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Homework assignments & Personal notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Homework */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Berilgan uy vazifalari</span>
            </span>
            <span className="text-xs font-bold text-slate-500">{groupHomeworks.length} ta</span>
          </h3>

          <div className="space-y-2.5">
            {groupHomeworks.map((hw) => (
              <div
                key={hw.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900">{hw.topic}</div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                    {hw.status}
                  </span>
                </div>
                <div className="text-slate-600 leading-relaxed">{hw.description}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Fan: <b>{hw.subjectName}</b></span>
                  <span className="text-rose-700 font-bold">Muddati: {hw.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications / Announcements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-blue-900" />
            <span>Sizga tegishli bildirishnomalar</span>
          </h3>

          <div className="space-y-2.5">
            {personalAnnouncements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[10px] text-slate-400">{ann.date}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Xabar beruvchi: <b>{ann.authorName}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
