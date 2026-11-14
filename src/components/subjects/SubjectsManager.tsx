import React, { useState } from 'react';
import { Subject, Teacher, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { BookOpen, Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface SubjectsManagerProps {
  onShowToast: ShowToastFn;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({ onShowToast }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());
  const [teachers] = useState<Teacher[]>(() => CollegeDataService.getTeachers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    code: '',
    teacherNames: [],
    weeklyHours: 2,
    totalHours: 34,
    gradingSystem: '5_ball',
    status: 'Faol',
  });

  React.useEffect(() => {
    const handleUpdate = () => setSubjects(CollegeDataService.getSubjects());
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q));
  });

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      teacherNames: [teachers[0]?.fullName || ''],
      weeklyHours: 2,
      totalHours: 34,
      gradingSystem: '5_ball',
      status: 'Faol',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setFormData(s);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      onShowToast('Fan nomi kiritilishi shart', 'error');
      return;
    }

    if (editingSubject) {
      const updated: Subject = {
        ...editingSubject,
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        teacherNames: formData.teacherNames || [],
        weeklyHours: Number(formData.weeklyHours) || 2,
        totalHours: Number(formData.totalHours) || 34,
        status: (formData.status as any) || 'Faol',
      };
      CollegeDataService.saveSubject(updated);
      onShowToast('Fan ma’lumotlari yangilandi', 'success');
    } else {
      const created: Subject = {
        id: `subj-${Date.now()}`,
        name: formData.name.trim(),
        code: formData.code?.trim() || `FAN-${Math.floor(100 + Math.random() * 900)}`,
        teacherIds: [],
        teacherNames: formData.teacherNames || [],
        groupIds: ['grp-12'],
        weeklyHours: Number(formData.weeklyHours) || 2,
        totalHours: Number(formData.totalHours) || 34,
        gradingSystem: '5_ball',
        status: 'Faol',
      };
      CollegeDataService.saveSubject(created);
      onShowToast('Yangi fan qo‘shildi', 'success');
    }

    setSubjects(CollegeDataService.getSubjects());
    setIsModalOpen(false);
  };

  const handleDelete = (s: Subject) => {
    if (window.confirm(`"${s.name}" fanini o‘chirishni xohlaysizmi?`)) {
      CollegeDataService.deleteSubject(s.id);
      setSubjects(CollegeDataService.getSubjects());
      onShowToast('Fan o‘chirildi', 'info');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fan nomi yoki kodi bo‘yicha..."
            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 w-64 sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          onClick={openAddModal}
          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi fan qo‘shish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">Fan nomi</th>
                <th className="py-3 px-3">Fan kodi</th>
                <th className="py-3 px-4">Biriktirilgan o‘qituvchilar</th>
                <th className="py-3 px-3 text-center">Haftalik soat</th>
                <th className="py-3 px-3 text-center">Umumiy soat</th>
                <th className="py-3 px-3 text-center">Baholash tizimi</th>
                <th className="py-3 px-3 text-center">Holat</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-600">
                    {s.code || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {s.teacherNames.join(', ') || 'Biriktirilmagan'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">
                    {s.weeklyHours} soat
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-600">
                    {s.totalHours} soat
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-blue-900">
                    5 ballik
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSubject ? 'Fanni tahrirlash' : 'Yangi fan qo‘shish'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fan nomi
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: Axborot xavfsizligi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fan kodi
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="SEC-104"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Haftalik dars soati
                </label>
                <input
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                O‘qituvchilar (vergul bilan ajrating)
              </label>
              <input
                type="text"
                value={formData.teacherNames?.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherNames: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                  })
                }
                placeholder="Abduboyev Adham, Asadov Ziyodulla"
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
