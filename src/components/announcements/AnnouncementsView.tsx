import React, { useState } from 'react';
import { AnnouncementItem, UserRole, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { Bell, Plus, Calendar, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface AnnouncementsViewProps {
  role: UserRole;
  onShowToast: ShowToastFn;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ role, onShowToast }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    CollegeDataService.getAnnouncements()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AnnouncementItem>>({
    title: '',
    content: '',
    targetRole: 'All',
    priority: 'Muhim',
  });

  React.useEffect(() => {
    const handleUpdate = () => setAnnouncements(CollegeDataService.getAnnouncements());
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filtered = announcements.filter((a) => {
    if (a.targetRole === 'All') return true;
    if (role === 'teacher' && a.targetRole === 'Teacher') return true;
    if (role === 'student' && a.targetRole === 'Student') return true;
    if (role === 'admin') return true;
    return false;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      onShowToast('Sarlavha va matn kiritilishi shart', 'error');
      return;
    }

    const newAnn: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: formData.title.trim(),
      content: formData.content.trim(),
      authorName: role === 'admin' ? 'Texnikum Rahbariyati' : 'O‘qituvchi',
      targetRole: (formData.targetRole as any) || 'All',
      date: new Date().toISOString().slice(0, 10),
      priority: (formData.priority as any) || 'Muhim',
    };

    CollegeDataService.saveAnnouncement(newAnn);
    setAnnouncements(CollegeDataService.getAnnouncements());
    setIsModalOpen(false);
    onShowToast('E’lon muvaffaqiyatli chop etildi', 'success');
  };

  const handleDelete = (id: string) => {
    if (role !== 'admin') return;
    if (window.confirm('Ushbu e’lonni o‘chirmoqchimisiz?')) {
      CollegeDataService.deleteAnnouncement(id);
      setAnnouncements(CollegeDataService.getAnnouncements());
      onShowToast('E’lon o‘chirildi', 'info');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-900" />
            <span>Texnikum rasmiy e’lonlari</span>
          </h2>
          <p className="text-xs text-slate-500">
            Muhim xabarlar, oraliq nazoratlar va tadbirlar haqida rasmiy bildirishnomalar.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi e’lon joylash</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const priorityBadge =
            item.priority === 'Shoshilinch'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : item.priority === 'Muhim'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-blue-50 text-blue-800 border-blue-200';

          return (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${priorityBadge}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    {item.authorName}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">· {item.date}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  title="E’lonni o‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yangi e’lon berish"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                E’lon sarlavhasi
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masalan: Dars jadvalidagi o‘zgarishlar haqida"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Muhimlik darajasi
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="Oddiy">Oddiy</option>
                  <option value="Muhim">Muhim</option>
                  <option value="Shoshilinch">Shoshilinch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kimlar uchun
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="All">Barchaga (Talabalar & O‘qituvchilar)</option>
                  <option value="Student">Faqat o‘quvchilar uchun</option>
                  <option value="Teacher">Faqat o‘qituvchilar uchun</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                E’lon matni
              </label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="E’lon matnini kiriting..."
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
                E’lonni chop etish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
