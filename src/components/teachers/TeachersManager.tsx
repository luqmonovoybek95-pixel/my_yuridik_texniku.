import React, { useState, useMemo } from 'react';
import { Teacher, Subject, Group, TimetableLesson, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { Briefcase, Plus, Search, Calendar, Edit2, Trash2, BookOpen, Layers } from 'lucide-react';

interface TeachersManagerProps {
  onShowToast: ShowToastFn;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({ onShowToast }) => {
  const [teachers, setTeachers] = useState<Teacher[]>(() => CollegeDataService.getTeachers());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [timetable, setTimetable] = useState<TimetableLesson[]>(() => CollegeDataService.getTimetable());

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    fullName: '',
    login: '',
    phone: '',
    email: '',
    degree: 'O‘qituvchi',
    subjectNames: [],
    groupNames: [],
    status: 'Faol',
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      setTeachers(CollegeDataService.getTeachers());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
      setTimetable(CollegeDataService.getTimetable());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.fullName.toLowerCase().includes(q) ||
          t.login.toLowerCase().includes(q) ||
          t.subjectNames.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [teachers, searchQuery]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      login: '',
      phone: '+998 ',
      email: '',
      degree: 'O‘qituvchi',
      subjectNames: [subjects[0]?.name || ''],
      groupNames: [groups[0]?.name || ''],
      status: 'Faol',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData(t);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.login) {
      onShowToast('F.I.Sh va login kiritilishi shart', 'error');
      return;
    }

    if (editingTeacher) {
      const updated: Teacher = {
        ...editingTeacher,
        fullName: formData.fullName.trim(),
        login: formData.login.trim().toLowerCase(),
        phone: formData.phone?.trim() || '—',
        email: formData.email?.trim() || `${formData.login}@syt.uz`,
        degree: formData.degree || 'O‘qituvchi',
        subjectNames: formData.subjectNames || [],
        groupNames: formData.groupNames || [],
        status: (formData.status as any) || 'Faol',
      };
      CollegeDataService.saveTeacher(updated);
      onShowToast('O‘qituvchi ma’lumotlari yangilandi', 'success');
    } else {
      const created: Teacher = {
        id: `t-${Date.now()}`,
        fullName: formData.fullName.trim(),
        login: formData.login.trim().toLowerCase(),
        phone: formData.phone?.trim() || '—',
        email: formData.email?.trim() || `${formData.login}@syt.uz`,
        degree: formData.degree || 'O‘qituvchi',
        subjectIds: [],
        subjectNames: formData.subjectNames || [],
        groupIds: [],
        groupNames: formData.groupNames || [],
        status: (formData.status as any) || 'Faol',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      CollegeDataService.saveTeacher(created);

      // Create account
      CollegeDataService.saveUser({
        id: `usr-${created.id}`,
        login: created.login,
        passwordHash: 'teacher123',
        fullName: created.fullName,
        role: 'teacher',
        isActive: true,
        linkedEntityId: created.id,
        createdAt: new Date().toISOString().slice(0, 10),
      });

      onShowToast('O‘qituvchi hisobi yaratildi (parol: teacher123)', 'success');
    }

    setTeachers(CollegeDataService.getTeachers());
    setIsModalOpen(false);
  };

  const handleDelete = (t: Teacher) => {
    if (window.confirm(`Haqiqatan ham "${t.fullName}" o‘qituvchini o‘chirmoqchimisiz?`)) {
      CollegeDataService.deleteTeacher(t.id);
      setTeachers(CollegeDataService.getTeachers());
      onShowToast('O‘qituvchi ro‘yxatdan o‘chirildi', 'info');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O‘qituvchi F.I.Sh yoki fani..."
            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 w-64 sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          onClick={openAddModal}
          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>O‘qituvchi qo‘shish</span>
        </button>
      </div>

      {/* Mobile Responsive Cards (Phone) */}
      <div className="block md:hidden space-y-3">
        {filteredTeachers.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            O‘qituvchilar topilmadi.
          </div>
        ) : (
          filteredTeachers.map((t, idx) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {t.fullName}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {t.degree || 'O‘qituvchi'} · <span className="font-mono text-blue-900">{t.login}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                  {t.status}
                </span>
              </div>

              {/* Subjects & Groups */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap gap-1">
                  {t.subjectNames.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-[10px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-600">
                  Guruhlar: <span className="font-semibold text-slate-800">{t.groupNames.join(', ') || '12-guruh'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                <span>{t.phone}</span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewingTeacher(t)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                    title="Dars jadvalini ko‘rish"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Teachers Table (Desktop / Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">O‘qituvchining F.I.SH</th>
                <th className="py-3 px-3">Darajasi / Lavozimi</th>
                <th className="py-3 px-4">Biriktirilgan fanlar</th>
                <th className="py-3 px-3">Guruhlar</th>
                <th className="py-3 px-3">Login</th>
                <th className="py-3 px-3">Telefon</th>
                <th className="py-3 px-3 text-center">Holat</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{t.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t.email}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-semibold">{t.degree || 'O‘qituvchi'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {t.subjectNames.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-[10px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {t.groupNames.join(', ') || '12-guruh'}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-blue-900 font-semibold">
                    {t.login}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{t.phone}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingTeacher(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                        title="Dars jadvalini ko‘rish"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Teacher Schedule Modal */}
      {viewingTeacher && (
        <Modal
          isOpen={!!viewingTeacher}
          onClose={() => setViewingTeacher(null)}
          title={`${viewingTeacher.fullName} — Dars jadvali va yuklamasi`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-blue-950">{viewingTeacher.fullName}</div>
                <div className="text-xs text-blue-700">{viewingTeacher.degree} · Tel: {viewingTeacher.phone}</div>
              </div>
              <div className="text-xs font-bold text-blue-900">
                Fanlar: {viewingTeacher.subjectNames.join(', ')}
              </div>
            </div>

            <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
              O‘qituvchining haftalik dars jadvali:
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Kun</th>
                    <th className="py-2.5 px-2">Juftlik</th>
                    <th className="py-2.5 px-2">Vaqt</th>
                    <th className="py-2.5 px-3">Fan nomi</th>
                    <th className="py-2.5 px-2">Guruh</th>
                    <th className="py-2.5 px-2">Xona</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetable
                    .filter(
                      (l) =>
                        l.teacherName.toLowerCase().includes(viewingTeacher.fullName.toLowerCase()) ||
                        (l.splitSecondaryTeacher &&
                          l.splitSecondaryTeacher
                            .toLowerCase()
                            .includes(viewingTeacher.fullName.toLowerCase()))
                    )
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{l.day}</td>
                        <td className="py-2.5 px-2 font-black">{l.pairRoman}</td>
                        <td className="py-2.5 px-2 font-medium text-slate-600">{l.time}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-900">
                          {l.subjectName}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-700">{l.groupName}</td>
                        <td className="py-2.5 px-2 text-slate-600">{l.room || 'o\'quv xonasi'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTeacher ? 'O‘qituvchini tahrirlash' : 'Yangi o‘qituvchi qo‘shish'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                F.I.SH (To‘liq ism-sharif)
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Masalan: Qurbonaliyev Diyor"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tizim logini
                </label>
                <input
                  type="text"
                  required
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="diyor_q"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lavozim / Ilmiy daraja
                </label>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="O‘qituvchi">O‘qituvchi</option>
                  <option value="Katta o‘qituvchi">Katta o‘qituvchi</option>
                  <option value="Yetakchi o‘qituvchi">Yetakchi o‘qituvchi</option>
                  <option value="Kafedra mudiri">Kafedra mudiri</option>
                  <option value="Dotsent">Dotsent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@syt.uz"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dars beradigan fanlari
              </label>
              <input
                type="text"
                value={formData.subjectNames?.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subjectNames: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Chet tili, Rus tili"
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
                Saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
