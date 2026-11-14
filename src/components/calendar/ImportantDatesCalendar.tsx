import React, { useState, useMemo } from 'react';
import { ImportantDateItem, UserRole, Group, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { CalendarDays, Plus, Filter, AlertCircle, Bookmark, CheckCircle2, Flag, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ImportantDatesCalendarProps {
  role: UserRole;
  onShowToast: ShowToastFn;
  currentGroupId?: string;
}

export const ImportantDatesCalendar: React.FC<ImportantDatesCalendarProps> = ({
  role,
  onShowToast,
  currentGroupId,
}) => {
  const [dates, setDates] = useState<ImportantDateItem[]>(() =>
    CollegeDataService.getImportantDates()
  );
  const groups = CollegeDataService.getGroups();

  const [filterGroup, setFilterGroup] = useState<string>(currentGroupId || 'all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newType, setNewType] = useState<'oraliq' | 'imtihon' | 'topshiriq' | 'dam_olish' | 'tadbir'>('oraliq');
  const [newTargetGroup, setNewTargetGroup] = useState<string>('all');
  const [newDesc, setNewDesc] = useState('');

  const filteredDates = useMemo(() => {
    return dates
      .filter((d) => {
        if (filterGroup !== 'all' && d.groupId && d.groupId !== filterGroup) return false;
        if (filterType !== 'all' && d.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dates, filterGroup, filterType]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onShowToast('Sarlavha kiritilishi shart', 'error');
      return;
    }

    const created: ImportantDateItem = {
      id: `dt-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      type: newType,
      groupId: newTargetGroup === 'all' ? undefined : newTargetGroup,
      description: newDesc.trim() || undefined,
    };

    CollegeDataService.saveImportantDate(created);
    setDates(CollegeDataService.getImportantDates());
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    onShowToast('Muhim sana kalendarga muvaffaqiyatli kiritildi', 'success');
  };

  const handleDelete = (id: string) => {
    if (role === 'student') return;
    if (window.confirm('Ushbu sanani o‘chirmoqchimisiz?')) {
      CollegeDataService.deleteImportantDate(id);
      setDates(CollegeDataService.getImportantDates());
      onShowToast('Sana o‘chirildi', 'info');
    }
  };

  const getTypeBadge = (type: ImportantDateItem['type']) => {
    switch (type) {
      case 'oraliq':
        return { label: 'Oraliq nazorat', className: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'imtihon':
        return { label: 'Imtihon', className: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'topshiriq':
        return { label: 'Topshiriq muddati', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'dam_olish':
        return { label: 'Dam olish kuni', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'tadbir':
      default:
        return { label: 'Tadbir / Eslatma', className: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-900" />
            <span>Muhim sanalar, muddatlar va eslatmalar taqvimi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Oraliq va yakuniy nazorat sinovlari, topshiriq muddatlari va texnikumning rasmiy taqvimi.
          </p>
        </div>

        {role !== 'student' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi sana kiritish</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha toifalar</option>
            <option value="oraliq">Oraliq nazorat</option>
            <option value="imtihon">Imtihonlar</option>
            <option value="topshiriq">Topshiriq muddatlari</option>
            <option value="dam_olish">Dam olish kunlari</option>
            <option value="tadbir">Tadbirlar</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Rejadagi sanalar: <span className="text-blue-900 font-extrabold">{filteredDates.length} ta</span>
        </div>
      </div>

      {/* Dates Timeline / List */}
      <div className="space-y-3">
        {filteredDates.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Rejalashtirilgan muhim sanalar topilmadi.
          </div>
        ) : (
          filteredDates.map((item) => {
            const badge = getTypeBadge(item.type);
            const targetGroup = groups.find((g) => g.id === item.groupId);
            const dateObj = new Date(item.date);
            const isPast = dateObj.getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={item.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  isPast ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Date Block */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-extrabold uppercase text-blue-700">
                      {dateObj.toLocaleDateString('uz-UZ', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black leading-none">{dateObj.getDate()}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {targetGroup ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                          {targetGroup.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Umumiy texnikum
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          (O‘tib ketgan)
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {role !== 'student' && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sanani o‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Date Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Muhim sana yoki muddat kiritish"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tadbir yoki topshiriq nomi
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Masalan: 1-Oraliq nazorat sinovlari haftaligi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sana
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategoriya turi
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="oraliq">Oraliq nazorat</option>
                  <option value="imtihon">Yakuniy imtihon</option>
                  <option value="topshiriq">Topshiriq muddati</option>
                  <option value="dam_olish">Dam olish kuni</option>
                  <option value="tadbir">Texnikum tadbiri</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tegishli guruh
              </label>
              <select
                value={newTargetGroup}
                onChange={(e) => setNewTargetGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                <option value="all">Barcha guruhlar uchun umumiy</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Batafsil tavsif (ixtiyoriy)
              </label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Tadbir vaqti, joyi yoki o‘quvchilarga kerakli ko‘rsatmalar..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-xs cursor-pointer"
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
