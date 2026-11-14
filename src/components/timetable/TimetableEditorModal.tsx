import React, { useState, useEffect, useMemo } from 'react';
import { TimetableLesson, Weekday, Teacher, Subject, Group, ShowToastFn } from '../../types';
import { Modal } from '../common/Modal';
import { CollegeDataService } from '../../services/storage';
import {
  AlertCircle,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  Layers,
  BookOpen,
  User,
  Building,
} from 'lucide-react';

interface TimetableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: TimetableLesson) => void;
  onDelete?: (lessonId: string) => void;
  initialLesson: TimetableLesson | null;
  groups: Group[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: TimetableLesson[];
  onShowToast: ShowToastFn;
}

export const TimetableEditorModal: React.FC<TimetableEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialLesson,
  groups,
  teachers,
  subjects,
  allLessons,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<TimetableLesson>({
    id: '',
    groupId: groups[0]?.id || 'grp-12',
    groupName: groups[0]?.name || '12-guruh',
    academicYear: '2026-2027',
    semester: 1,
    day: 'Dushanba',
    pairNumber: 1,
    pairRoman: 'I',
    time: '08:30-09:50',
    subjectId: '',
    subjectName: '',
    teacherId: '',
    teacherName: '',
    room: "o'quv xonasi",
    colorType: 'white',
    colorNote: '',
    isSplit: false,
    splitSecondarySubject: '',
    splitSecondaryTeacher: '',
    splitSecondaryRoom: '',
    splitSecondaryColorType: 'green',
  });

  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialLesson) {
        setFormData(initialLesson);
        setInitialSnapshot(JSON.stringify(initialLesson));
      } else {
        const defaultGroup = groups[0] || { id: 'grp-12', name: '12-guruh' };
        const defaultSubject = subjects[0] || { id: '', name: '' };
        const defaultTeacher = teachers[0] || { id: '', fullName: '' };

        const defaultData: TimetableLesson = {
          id: 'tt-' + Date.now(),
          groupId: defaultGroup.id,
          groupName: defaultGroup.name,
          academicYear: '2026-2027',
          semester: 1,
          day: 'Dushanba',
          pairNumber: 1,
          pairRoman: 'I',
          time: '08:30-09:50',
          subjectId: defaultSubject.id || '',
          subjectName: defaultSubject.name || '',
          teacherId: defaultTeacher.id || '',
          teacherName: defaultTeacher.fullName || '',
          room: "o'quv xonasi",
          colorType: 'white',
          colorNote: '',
          isSplit: false,
          splitSecondarySubject: '',
          splitSecondaryTeacher: '',
          splitSecondaryRoom: '',
          splitSecondaryColorType: 'green',
        };
        setFormData(defaultData);
        setInitialSnapshot(JSON.stringify(defaultData));
      }
      setShowDiscardConfirm(false);
      setIsSaving(false);
    }
  }, [initialLesson, isOpen, groups, subjects, teachers]);

  // Conflict check: Check if teacher is assigned to another group at this exact day and time
  useEffect(() => {
    if (!formData.teacherName || formData.teacherName === 'Guruh rahbari') {
      setConflictWarning(null);
      return;
    }

    const clash = allLessons.find(
      (l) =>
        l.id !== formData.id &&
        l.day === formData.day &&
        l.pairNumber === formData.pairNumber &&
        (l.teacherName === formData.teacherName ||
          l.splitSecondaryTeacher === formData.teacherName) &&
        l.groupId !== formData.groupId
    );

    if (clash) {
      setConflictWarning(
        `Diqqat: O‘qituvchi "${formData.teacherName}" ushbu vaqtda (${formData.day}, ${formData.pairRoman}-juftlik) boshqa "${clash.groupName}" guruhiga darsga biriktirilgan!`
      );
    } else {
      setConflictWarning(null);
    }
  }, [
    formData.day,
    formData.pairNumber,
    formData.teacherName,
    formData.groupId,
    formData.id,
    allLessons,
  ]);

  const timePairs: { num: number; roman: string; time: string }[] = [
    { num: 1, roman: 'I', time: '08:30-09:50' },
    { num: 2, roman: 'II', time: '10:00-11:20' },
    { num: 3, roman: 'III', time: '11:40-13:00' },
    { num: 4, roman: 'IV', time: '13:10-14:30' },
  ];

  const handlePairChange = (num: number) => {
    const pair = timePairs.find((p) => p.num === num);
    if (pair) {
      setFormData({
        ...formData,
        pairNumber: pair.num,
        pairRoman: pair.roman,
        time: pair.time,
      });
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grp = groups.find((g) => g.id === e.target.value);
    if (grp) {
      setFormData({ ...formData, groupId: grp.id, groupName: grp.name });
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subj = subjects.find((s) => s.id === e.target.value);
    if (subj) {
      const assignedTeacher = teachers.find((t) => subj.teacherIds?.includes(t.id));
      setFormData({
        ...formData,
        subjectId: subj.id,
        subjectName: subj.name,
        teacherId: assignedTeacher ? assignedTeacher.id : formData.teacherId,
        teacherName: assignedTeacher ? assignedTeacher.fullName : formData.teacherName,
      });
    } else {
      setFormData({
        ...formData,
        subjectId: '',
        subjectName: e.target.value,
      });
    }
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = teachers.find((tch) => tch.id === e.target.value);
    if (t) {
      setFormData({ ...formData, teacherId: t.id, teacherName: t.fullName });
    } else {
      setFormData({ ...formData, teacherId: '', teacherName: e.target.value });
    }
  };

  const isFormDirty = useMemo(() => {
    return JSON.stringify(formData) !== initialSnapshot;
  }, [formData, initialSnapshot]);

  // Requirement 29: "Orqaga" tugmasi
  const handleBack = () => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Requirement 29: "Saqlash" tugmasi
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSaving) return; // Prevent double submit

    // 1 & 2: Majburiy maydonlarni tekshirish
    if (!formData.groupId) {
      onShowToast('Iltimos, dars uchun guruhni tanlang!', 'error');
      return;
    }

    if (!formData.day) {
      onShowToast('Iltimos, dars o‘tiladigan hafta kunini tanlang!', 'error');
      return;
    }

    if (!formData.pairNumber || !formData.time) {
      onShowToast('Iltimos, dars juftligi va vaqtini belgilang!', 'error');
      return;
    }

    const trimmedSubject = formData.subjectName?.trim();
    if (!trimmedSubject) {
      onShowToast('Iltimos, fan nomini tanlang yoki kiriting!', 'error');
      return;
    }

    const trimmedTeacher = formData.teacherName?.trim();
    if (!trimmedTeacher) {
      onShowToast('Iltimos, dars o‘tuvchi o‘qituvchini tanlang!', 'error');
      return;
    }

    const trimmedRoom = formData.room?.trim();
    if (!trimmedRoom) {
      onShowToast('Iltimos, dars o‘tiladigan auditoriya yoki xona raqamini kiriting!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // 3: Darsni ma'lumotlar bazasiga saqlash
      const lessonToSave: TimetableLesson = {
        ...formData,
        subjectName: trimmedSubject,
        teacherName: trimmedTeacher,
        room: trimmedRoom,
      };

      CollegeDataService.saveLesson(lessonToSave);

      // Async sync to server
      try {
        const user = CollegeDataService.getCurrentUser();
        fetch('/api/timetable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || 'admin',
            'x-user-name': user?.fullName || 'Admin',
          },
          body: JSON.stringify(lessonToSave),
        }).catch(() => {});
      } catch (err) {}

      // Short delay for visual confirmation and double submit prevention
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 5: Muvaffaqiyatli saqlanganda xabar
      onShowToast(
        initialLesson
          ? `"${lessonToSave.subjectName}" darsi muvaffaqiyatli yangilandi!`
          : `"${lessonToSave.subjectName}" darsi jadvalga muvaffaqiyatli qo‘shildi!`,
        'success'
      );

      // 6: Yangi dars jadvalda darhol ko‘rinsin
      onSave(lessonToSave);
      onClose();
    } catch (err) {
      onShowToast('Darsni saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleBack}
      title={initialLesson ? 'Jadvaldagi darsni tahrirlash' : 'Jadvalga dars qo‘shish'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs pb-4">
        {/* Discard changes alert modal */}
        {showDiscardConfirm && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Saqlanmagan o‘zgarishlar mavjud</span>
            </div>
            <p className="text-xs">
              Siz dars ma’lumotlariga o‘zgartirish kiritgansiz. Oynani yopsangiz, kiritilgan ma’lumotlar saqlanmaydi. Chiqishni tasdiqlaysizmi?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg font-bold text-amber-900 cursor-pointer"
              >
                Tahrirlashda qolish
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Ha, saqlamasdan chiqish
              </button>
            </div>
          </div>
        )}

        {conflictWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{conflictWarning}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Group */}
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Guruh</span> <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.groupId}
                onChange={handleGroupChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Hafta kuni</span> <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as Weekday })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="Dushanba">Dushanba</option>
                <option value="Seshanba">Seshanba</option>
                <option value="Chorshanba">Chorshanba</option>
                <option value="Payshanba">Payshanba</option>
                <option value="Juma">Juma</option>
                <option value="Shanba">Shanba</option>
                <option value="Yakshanba">Yakshanba</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pair & Time */}
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Dars juftligi va vaqti</span> <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.pairNumber}
                onChange={(e) => handlePairChange(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                {timePairs.map((p) => (
                  <option key={p.num} value={p.num}>
                    {p.roman}-juftlik: {p.time}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-700" />
                <span>Xona / Auditoriya</span> <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Masalan, o'quv xonasi yoki 104-laboratoriya"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Primary Subject & Teacher */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-800" />
                <span>Fan va o‘qituvchi ma’lumotlari</span>
              </span>
              {formData.isSplit && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  1-kichik guruh (Qizil qator)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fan nomi <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.subjectId}
                  onChange={handleSubjectChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Fanni tanlang --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'Fan'})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  placeholder="Yoki fanni qo‘lda yozing..."
                  className="mt-1.5 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Dars beruvchi o‘qituvchi <span className="text-rose-600">*</span></span>
                </label>
                <select
                  value={formData.teacherId}
                  onChange={handleTeacherChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- O‘qituvchini tanlang --</option>
                  <option value="rahbar">Guruh rahbari (Kurator)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.degree || 'O‘qituvchi'})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  placeholder="Yoki o‘qituvchini qo‘lda yozing..."
                  className="mt-1.5 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Color Highlight Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jadval katakcha rangi
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colorType: 'white' })}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold text-xs cursor-pointer ${
                    formData.colorType === 'white'
                      ? 'border-blue-600 bg-white ring-2 ring-blue-600/30'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  Oq
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colorType: 'red' })}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold text-xs cursor-pointer ${
                    formData.colorType === 'red'
                      ? 'border-red-600 bg-red-600 text-white font-bold'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  Qizil
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colorType: 'green' })}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold text-xs cursor-pointer ${
                    formData.colorType === 'green'
                      ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  Yashil
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colorType: 'amber' })}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold text-xs cursor-pointer ${
                    formData.colorType === 'amber'
                      ? 'border-amber-500 bg-amber-500 text-white font-bold'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  Sariq
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rang izohi (ixtiyoriy)
              </label>
              <input
                type="text"
                value={formData.colorNote || ''}
                onChange={(e) => setFormData({ ...formData, colorNote: e.target.value })}
                placeholder="Masalan: 1-kichik guruh yoki O'zgartirilgan dars"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Split Pair Option */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={formData.isSplit || false}
                onChange={(e) => setFormData({ ...formData, isSplit: e.target.checked })}
                className="w-4 h-4 text-blue-900 rounded-sm focus:ring-blue-500"
              />
              <span>Bo‘lingan juftlik (Qizil/yashil 2 ta yarim qator)</span>
            </label>

            {formData.isSplit && (
              <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  2-kichik guruh (Yashil qator ma’lumotlari):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">2-fan nomi</label>
                    <input
                      type="text"
                      value={formData.splitSecondarySubject || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, splitSecondarySubject: e.target.value })
                      }
                      placeholder="Masalan: Axborot texnologiyalari"
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">2-o‘qituvchi</label>
                    <input
                      type="text"
                      value={formData.splitSecondaryTeacher || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, splitSecondaryTeacher: e.target.value })
                      }
                      placeholder="Masalan: Asadov Ziyodulla"
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REQUIREMENT 29: FORMA OXIRIDA ANIQ “SAQLASH” VA “ORQAGA” TUGMALARI */}
          <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-white py-3.5 px-2 -mx-2 z-20 shadow-xs sm:shadow-none">
            {initialLesson && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Haqiqatan ham bu darsni jadvaldan o‘chirmoqchimisiz?')) {
                    onDelete(initialLesson.id);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Darsni o‘chirish</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Majburiy maydonlar to‘ldirilgach «Saqlash» tugmasini bosing
              </span>
            )}

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* ORQAGA TUGMASI */}
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Orqaga</span>
              </button>

              {/* SAQLASH TUGMASI */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSubmit()}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isSaving
                    ? 'bg-blue-800 opacity-80 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/25 active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Saqlash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
