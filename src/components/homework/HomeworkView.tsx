import React, { useState } from 'react';
import { HomeworkItem, Group, Subject, UserRole, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { FileText, Plus, ExternalLink, Calendar, Trash2, CheckCircle2 } from 'lucide-react';

interface HomeworkViewProps {
  role: UserRole;
  currentGroupName?: string;
  onShowToast: ShowToastFn;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  role,
  currentGroupName,
  onShowToast,
}) => {
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(() =>
    CollegeDataService.getHomeworks()
  );
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<HomeworkItem>>({
    groupId: groups[0]?.id || 'grp-12',
    subjectId: subjects[0]?.id || 'subj-it',
    topic: '',
    description: '',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    fileAttachment: '',
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      setHomeworks(CollegeDataService.getHomeworks());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredHomeworks = homeworks.filter((hw) => {
    if (role === 'student' && currentGroupName && hw.groupName !== currentGroupName) {
      return false;
    }
    return true;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || !formData.description) {
      onShowToast('Mavzu va tavsif kiritilishi shart', 'error');
      return;
    }

    const grp = groups.find((g) => g.id === formData.groupId) || groups[0];
    const sb = subjects.find((s) => s.id === formData.subjectId) || subjects[0];

    const newItem: HomeworkItem = {
      id: `hw-${Date.now()}`,
      groupId: grp.id,
      groupName: grp.name,
      subjectId: sb.id,
      subjectName: sb.name,
      teacherId: 't-1',
      teacherName: 'O‘qituvchi',
      dateAssigned: new Date().toISOString().slice(0, 10),
      dueDate: formData.dueDate || new Date().toISOString().slice(0, 10),
      topic: formData.topic.trim(),
      description: formData.description.trim(),
      fileAttachment: formData.fileAttachment?.trim() || undefined,
      status: 'Faol',
    };

    CollegeDataService.saveHomework(newItem);
    setHomeworks(CollegeDataService.getHomeworks());
    setIsModalOpen(false);
    onShowToast('Yangi uyga vazifa muvaffaqiyatli yuklandi', 'success');
  };

  const handleDelete = (id: string) => {
    if (role === 'student') return;
    if (window.confirm('Vazifani o‘chirishni tasdiqlaysizmi?')) {
      CollegeDataService.deleteHomework(id);
      setHomeworks(CollegeDataService.getHomeworks());
      onShowToast('Vazifa o‘chirildi', 'info');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-900" />
            <span>Uyga vazifalar va topshiriqlar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Darslar bo‘yicha amaliy topshiriqlar, adabiyotlar va topshirish muddatlari.
          </p>
        </div>

        {role !== 'student' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi vazifa berish</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHomeworks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Hozircha faol uyga vazifalar mavjud emas.
          </div>
        ) : (
          filteredHomeworks.map((hw) => {
            const isOverdue = new Date(hw.dueDate) < new Date();

            return (
              <div
                key={hw.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900">
                      {hw.groupName} · {hw.subjectName}
                    </span>
                    {role !== 'student' && (
                      <button
                        onClick={() => handleDelete(hw.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                    {hw.topic}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 whitespace-pre-line">
                    {hw.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Muddati: <b className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>{hw.dueDate}</b></span>
                  </div>

                  {hw.fileAttachment && (
                    <a
                      href={hw.fileAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-900 hover:underline"
                    >
                      <span>Material</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yangi uyga vazifa berish"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guruh
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fan
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Topshiriq mavzusi
              </label>
              <input
                type="text"
                required
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Unit 4: Legal terminology essay"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vazifa matni va talablar
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Topshiriq shartlarini batafsil yozing..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Topshirish muddati (deadline)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Material yoki havola (URL)
                </label>
                <input
                  type="text"
                  value={formData.fileAttachment}
                  onChange={(e) => setFormData({ ...formData, fileAttachment: e.target.value })}
                  placeholder="https://lex.uz/... yoki fayl havolasi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
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
                Vazifani e’lon qilish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
