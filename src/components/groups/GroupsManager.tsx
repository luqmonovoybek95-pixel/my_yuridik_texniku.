import React, { useState, useMemo, useEffect } from 'react';
import { Group, Student, Teacher, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  Layers,
  Plus,
  Users,
  GraduationCap,
  Edit2,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building,
  Sparkles,
} from 'lucide-react';

interface GroupsManagerProps {
  onShowToast: ShowToastFn;
  onSelectGroupForJournal?: (groupId: string) => void;
  onOpenGroupDetail?: (group: Group) => void;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  onShowToast,
  onSelectGroupForJournal,
  onOpenGroupDetail,
}) => {
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [students] = useState<Student[]>(() => CollegeDataService.getStudents());
  const [teachers] = useState<Teacher[]>(() => CollegeDataService.getTeachers());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<number | 'all'>('all');

  // Direct Inline "Yangi guruh qo‘shish" fields
  const [quickName, setQuickName] = useState('');
  const [quickSpecialty, setQuickSpecialty] = useState('Kompyuter tarmoqlari va IT');
  const [quickCourse, setQuickCourse] = useState(1);
  const [quickCuratorId, setQuickCuratorId] = useState('');
  const [quickCuratorPhone, setQuickCuratorPhone] = useState('');
  const [quickCuratorRoom, setQuickCuratorRoom] = useState('');
  const [isQuickFormExpanded, setIsQuickFormExpanded] = useState(true);
  const [curatorSearchText, setCuratorSearchText] = useState('');

  // Delete Confirmation Modal State
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Group>>({
    name: '',
    specialty: '',
    courseYear: 1,
    curatorTeacherId: '',
    curatorName: '',
    curatorPhone: '',
    curatorEmail: '',
    curatorRoom: '',
    academicYear: '2026-2027',
  });
  const [editCuratorSearchText, setEditCuratorSearchText] = useState('');

  // Listen for storage events so group lists always stay in sync
  useEffect(() => {
    const handleUpdate = () => {
      setGroups(CollegeDataService.getGroups());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  // Handle Quick Curator change
  const handleQuickCuratorSelect = (teacherId: string) => {
    setQuickCuratorId(teacherId);
    if (!teacherId) {
      setQuickCuratorPhone('');
      return;
    }
    const t = teachers.find((teach) => teach.id === teacherId);
    if (t) {
      setQuickCuratorPhone(t.phone || '');
    }
  };

  // 1 & 2 & 3: Save newly created group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickName.trim();

    if (!trimmedName) {
      onShowToast('Guruh nomini kiritish shart! Iltimos, guruh nomini yozing.', 'error');
      return;
    }

    if (trimmedName.length < 2) {
      onShowToast('Guruh nomi kamida 2 ta belgidan iborat bo‘lishi lozim.', 'error');
      return;
    }

    // Check duplicate name
    const existingGroup = groups.find(
      (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingGroup) {
      onShowToast(`"${trimmedName}" nomli guruh tizimda allaqachon mavjud! Boshqa nom kiriting.`, 'error');
      return;
    }

    let curatorName = 'Sinf kuratori hali tayinlanmagan';
    let curatorEmail = '';
    if (quickCuratorId) {
      const selectedTeacher = teachers.find((t) => t.id === quickCuratorId);
      if (selectedTeacher) {
        curatorName = selectedTeacher.fullName;
        curatorEmail = selectedTeacher.email || '';
      }
    }

    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: trimmedName,
      specialty: quickSpecialty.trim() || 'Kompyuter tarmoqlari va IT',
      courseYear: Number(quickCourse) || 1,
      curatorTeacherId: quickCuratorId || undefined,
      curatorName,
      curatorPhone: quickCuratorPhone.trim() || undefined,
      curatorEmail: curatorEmail || undefined,
      curatorRoom: quickCuratorRoom.trim() || undefined,
      academicYear: '2026-2027',
      semester: 1,
      studentCount: 0,
    };

    // Save to storage
    CollegeDataService.saveGroup(newGroup);

    // Refresh local state immediately
    const updated = CollegeDataService.getGroups();
    setGroups(updated);

    // Clear form
    setQuickName('');
    setQuickCuratorId('');
    setQuickCuratorPhone('');
    setQuickCuratorRoom('');

    onShowToast(`"${newGroup.name}" guruhi muvaffaqiyatli saqlandi va ro‘yxatga qo‘shildi!`, 'success');
  };

  // Open Edit Modal
  const openEditModal = (g: Group) => {
    setEditingGroup(g);
    setEditFormData({
      ...g,
      curatorTeacherId: g.curatorTeacherId || '',
      curatorName: g.curatorName || '',
      curatorPhone: g.curatorPhone || '',
      curatorEmail: g.curatorEmail || '',
      curatorRoom: g.curatorRoom || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditCuratorSelect = (teacherId: string) => {
    if (!teacherId) {
      setEditFormData({
        ...editFormData,
        curatorTeacherId: '',
        curatorName: '',
        curatorPhone: '',
        curatorEmail: '',
      });
      return;
    }
    const t = teachers.find((teach) => teach.id === teacherId);
    if (t) {
      setEditFormData({
        ...editFormData,
        curatorTeacherId: t.id,
        curatorName: t.fullName,
        curatorPhone: t.phone || '',
        curatorEmail: t.email || '',
      });
    }
  };

  // Save edited group
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    const trimmedName = editFormData.name?.trim();
    if (!trimmedName) {
      onShowToast('Guruh nomi bo‘sh bo‘lishi mumkin emas', 'error');
      return;
    }

    // Check duplicate name excluding current
    const duplicate = groups.find(
      (g) => g.id !== editingGroup.id && g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      onShowToast(`"${trimmedName}" nomli boshqa guruh mavjud. Boshqa nom tanlang.`, 'error');
      return;
    }

    const curatorName =
      editFormData.curatorName?.trim() || 'Sinf kuratori hali tayinlanmagan';

    const updated: Group = {
      ...editingGroup,
      name: trimmedName,
      specialty: editFormData.specialty?.trim() || editingGroup.specialty,
      courseYear: Number(editFormData.courseYear) || editingGroup.courseYear,
      curatorTeacherId: editFormData.curatorTeacherId || undefined,
      curatorName,
      curatorPhone: editFormData.curatorPhone?.trim() || undefined,
      curatorEmail: editFormData.curatorEmail?.trim() || undefined,
      curatorRoom: editFormData.curatorRoom?.trim() || undefined,
    };

    CollegeDataService.saveGroup(updated);
    setGroups(CollegeDataService.getGroups());
    setIsEditModalOpen(false);
    onShowToast(`"${updated.name}" guruhi ma’lumotlari muvaffaqiyatli yangilandi`, 'success');
  };

  // 5. Guruhni o‘chirishni so‘rash (In-app modal orqali)
  const handleDeleteGroup = (g: Group) => {
    setGroupToDelete(g);
  };

  const handleConfirmDelete = () => {
    if (!groupToDelete) return;
    const name = groupToDelete.name;
    CollegeDataService.deleteGroup(groupToDelete.id);
    setGroups(CollegeDataService.getGroups());
    onShowToast(`"${name}" guruhi tizimdan butunlay o‘chirildi`, 'info');
    setGroupToDelete(null);
  };

  // Filtered list
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (filterCourse !== 'all' && g.courseYear !== filterCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.specialty.toLowerCase().includes(q) ||
          (g.curatorName && g.curatorName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [groups, filterCourse, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-7 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin boshqaruv markazi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Guruhlar va Sinf Kuratorlarini Boshqarish
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Yangi guruhlar qo‘shish, guruh nomini kiritish, sinf kuratorini biriktirish va ro‘yxatlarni real vaqtda yangilash.
          </p>
        </div>

        <button
          onClick={() => setIsQuickFormExpanded(!isQuickFormExpanded)}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isQuickFormExpanded ? 'Formani yashirish' : 'Yangi guruh ochish'}</span>
        </button>
      </div>

      {/* 1, 2, 3: YANGI GURUH QO‘SHISH FORMASI (Guruh nomini adminning o‘zi kiritadi va Saqlash bosilgandan keyin ro'yxatda paydo bo'ladi) */}
      {isQuickFormExpanded && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-blue-200/80 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Yangi guruh kiritish maydoni
                </h2>
                <p className="text-[11px] text-slate-500">
                  Guruh nomini yozing, parametrlarini belgilang va «Saqlash» tugmasini bosing.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hidden sm:inline-block">
              Faqat «Saqlash» bosilganda ro‘yxatda paydo bo‘ladi
            </span>
          </div>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Guruh nomi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Guruh nomi (Admin kiritadi) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Masalan: 13-guruh yoki 14-IT guruhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Admin tomonidan mustaqil kiritiladi
                </span>
              </div>

              {/* Mutaxassislik */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Yo‘nalish yoki Mutaxassislik <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickSpecialty}
                  onChange={(e) => setQuickSpecialty(e.target.value)}
                  placeholder="Kompyuter tarmoqlari va IT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ta’lim yo‘nalishi nomi
                </span>
              </div>

              {/* Bosqich */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  O‘quv bosqichi (Kurs)
                </label>
                <select
                  value={quickCourse}
                  onChange={(e) => setQuickCourse(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value={1}>1-bosqich (1-kurs)</option>
                  <option value={2}>2-bosqich (2-kurs)</option>
                  <option value={3}>3-bosqich (3-kurs)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  2026-2027 o‘quv yili
                </span>
              </div>
            </div>

            {/* Sinf kuratorini tayinlash qismi */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Sinf kuratori (Guruh rahbari)ni tayinlash</span>
                </span>
                <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                  Mavjud ustozlar ro‘yxatidan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Mas’ul o‘qituvchini tanlang:
                    </label>
                  </div>
                  {teachers.length > 5 && (
                    <input
                      type="text"
                      value={curatorSearchText}
                      onChange={(e) => setCuratorSearchText(e.target.value)}
                      placeholder="Ustoz qidirish..."
                      className="w-full mb-1.5 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg"
                    />
                  )}
                  <select
                    value={quickCuratorId}
                    onChange={(e) => handleQuickCuratorSelect(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">— Hozircha tayinlanmasin —</option>
                    {teachers
                      .filter(
                        (t) =>
                          !curatorSearchText.trim() ||
                          t.fullName.toLowerCase().includes(curatorSearchText.toLowerCase()) ||
                          (t.degree && t.degree.toLowerCase().includes(curatorSearchText.toLowerCase()))
                      )
                      .map((teach) => (
                        <option key={teach.id} value={teach.id}>
                          {teach.fullName} ({teach.degree || 'O‘qituvchi'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kurator telefon raqami:
                  </label>
                  <input
                    type="text"
                    value={quickCuratorPhone}
                    onChange={(e) => setQuickCuratorPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xona / Auditoriya:
                  </label>
                  <input
                    type="text"
                    value={quickCuratorRoom}
                    onChange={(e) => setQuickCuratorRoom(e.target.value)}
                    placeholder="Masalan: 104-IT xonasi"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 2 & 3: SAQLASH TUGMASI */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                Guruh nomi saqlangandan so‘ng, tizimdagi barcha dars jadvallari, jurnallar va talabalar ro‘yxatida ushbu guruh darhol aks etadi.
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 px-6 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Guruhni tanlash, qidirish va filtr paneli */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Guruh nomi yoki kurator bo‘yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={filterCourse}
            onChange={(e) =>
              setFilterCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha bosqichlar</option>
            <option value={1}>1-bosqich</option>
            <option value={2}>2-bosqich</option>
            <option value={3}>3-bosqich</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Faol guruhlar: <span className="text-blue-900 font-black text-sm">{groups.length} ta guruh</span>
        </div>
      </div>

      {/* 5. GURUHLAR RO‘YXATI (Guruh nomini o‘zgartirish, o‘chirish, kuratorini yangilash) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const groupStudents = students.filter((s) => s.groupId === group.id);
          const count = groupStudents.length;
          const avgGrade =
            count > 0
              ? (
                  groupStudents.reduce((acc, s) => acc + s.averageGrade, 0) / count
                ).toFixed(1)
              : '0.0';

          const hasCurator =
            group.curatorName &&
            group.curatorName !== 'Sinf kuratori hali tayinlanmagan' &&
            !group.curatorName.includes('tayinlanmagan');

          return (
            <div
              key={group.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {group.courseYear}-bosqich · {group.academicYear || '2026-2027'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {group.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Guruh nomini va kuratorni o‘zgartirish tugmasi */}
                    <button
                      onClick={() => openEditModal(group)}
                      title="Guruh nomini o‘zgartirish va tahrirlash"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Guruhni o‘chirish tugmasi */}
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      title="Guruhni o‘chirish"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-semibold mb-3">
                  Mutaxassislik: <span className="text-slate-900 font-bold">{group.specialty}</span>
                </div>

                {/* 7. Sinf kuratori bloki */}
                <div
                  className={`p-3 rounded-xl border mb-3 text-xs ${
                    hasCurator
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                      <span>Sinf kuratori:</span>
                    </span>
                    {hasCurator ? (
                      <span className="text-[10px] font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                        Tayinlangan
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                        Tayinlanmagan
                      </span>
                    )}
                  </div>

                  <div className="font-extrabold text-slate-900 text-sm">
                    {hasCurator ? group.curatorName : 'Sinf kuratori hali tayinlanmagan'}
                  </div>

                  {hasCurator && (
                    <div className="mt-2 pt-2 border-t border-blue-100 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      {group.curatorPhone && (
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-blue-700" />
                          <span>{group.curatorPhone}</span>
                        </span>
                      )}
                      {group.curatorRoom && (
                        <span className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-blue-700" />
                          <span>{group.curatorRoom}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* O‘quvchilar va O‘zlashtirish statistikasi */}
                <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>O‘quvchilar soni:</span>
                    </span>
                    <span className="font-extrabold text-slate-900">{count} nafar</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>O‘rtacha o‘zlashtirish:</span>
                    </span>
                    <span className="font-extrabold text-emerald-700">{avgGrade} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                {onOpenGroupDetail && (
                  <button
                    onClick={() => onOpenGroupDetail(group)}
                    className="py-1.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Guruh sahifasi</span>
                  </button>
                )}

                {onSelectGroupForJournal && (
                  <button
                    onClick={() => onSelectGroupForJournal(group.id)}
                    className="py-1.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Jurnal
                  </button>
                )}

                <button
                  onClick={() => openEditModal(group)}
                  className="py-1.5 px-2.5 rounded-xl text-blue-900 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tahrirlash
                </button>
              </div>
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Guruhlar topilmadi</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Qidiruv so‘zini o‘zgartiring yoki yuqoridagi formadan yangi guruh kiritib «Guruhni saqlash» tugmasini bosing.
            </p>
          </div>
        )}
      </div>

      {/* 5. GURUH NOMINI VA MA’LUMOTLARINI TAHRIRLASH MODALI */}
      {isEditModalOpen && editingGroup && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`"${editingGroup.name}" guruhini tahrirlash`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guruh nomi va raqami <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Masalan: 12-guruh"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Guruh nomini o‘zgartirishingiz mumkin
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Yo‘nalish yoki Mutaxassislik <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={editFormData.specialty}
                onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
                placeholder="Masalan: Kompyuter tarmoqlari va IT"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bosqich (Kurs)
                </label>
                <select
                  value={editFormData.courseYear}
                  onChange={(e) => setEditFormData({ ...editFormData, courseYear: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                >
                  <option value={1}>1-bosqich</option>
                  <option value={2}>2-bosqich</option>
                  <option value={3}>3-bosqich</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  O‘quv yili
                </label>
                <input
                  type="text"
                  value={editFormData.academicYear}
                  onChange={(e) => setEditFormData({ ...editFormData, academicYear: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            {/* CURATOR EDIT SECTION */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Sinf kuratorini almashtirish / tayinlash</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-blue-100">
                  Faqat Admin huquqi
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                  Mavjud ustozlar ro‘yxatidan tanlang:
                </label>
                <select
                  value={editFormData.curatorTeacherId || ''}
                  onChange={(e) => handleEditCuratorSelect(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">— Sinf kuratori hali tayinlanmagan —</option>
                  {teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>
                      {teach.fullName} ({teach.degree || 'O‘qituvchi'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kurator telefon raqami
                  </label>
                  <input
                    type="text"
                    value={editFormData.curatorPhone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, curatorPhone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Xona / Auditoriya
                  </label>
                  <input
                    type="text"
                    value={editFormData.curatorRoom || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, curatorRoom: e.target.value })}
                    placeholder="Masalan: 102-IT xonasi"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-900 hover:bg-blue-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>O‘zgarishlarni saqlash</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. GURUHNI O‘CHIRISHNI TASDIQLASH MODALI (window.confirm o‘rniga to‘liq interaktiv in-app modal) */}
      {groupToDelete && (
        <Modal
          isOpen={!!groupToDelete}
          onClose={() => setGroupToDelete(null)}
          title="Guruhni o‘chirishni tasdiqlang"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>«{groupToDelete.name}» guruhini o‘chirish</span>
              </div>
              <p>
                Haqiqatan ham <b>«{groupToDelete.name}»</b> ({groupToDelete.specialty}) guruhini tizimdan butunlay o‘chirmoqchimisiz?
              </p>
              {students.filter((s) => s.groupId === groupToDelete.id).length > 0 && (
                <p className="font-semibold text-rose-700 bg-white/70 p-2 rounded-lg border border-rose-200">
                  Diqqat: Ushbu guruhda {students.filter((s) => s.groupId === groupToDelete.id).length} nafar faol talaba mavjud!
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Ushbu amal ma’lumotlar bazasida saqlanadi va audit jurnaliga qayd etiladi.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ha, guruhni o‘chirish</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
