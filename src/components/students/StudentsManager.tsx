import React, { useState, useMemo, useEffect } from 'react';
import { Student, Group, Teacher, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  GraduationCap,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  Users,
  Layers,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Phone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface StudentsManagerProps {
  onShowToast: ShowToastFn;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({ onShowToast }) => {
  const [students, setStudents] = useState<Student[]>(() => CollegeDataService.getStudents());
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [teachers, setTeachers] = useState<Teacher[]>(() => CollegeDataService.getTeachers());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    fullName: '',
    groupId: groups[0]?.id || 'grp-12',
    login: '',
    phone: '',
    status: 'Faol',
  });
  const [studentPassword, setStudentPassword] = useState('student123');
  const [isSaving, setIsSaving] = useState(false);

  // Quick group creation from inside student modal
  const [isQuickGroupOpen, setIsQuickGroupOpen] = useState(false);
  const [quickGroupName, setQuickGroupName] = useState('');
  const [quickGroupSpecialty, setQuickGroupSpecialty] = useState('Kompyuter tarmoqlari va IT');
  const [quickGroupCourse, setQuickGroupCourse] = useState(1);

  // Delete Modal
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setStudents(CollegeDataService.getStudents());
      setGroups(CollegeDataService.getGroups());
      setTeachers(CollegeDataService.getTeachers());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  // Helper: map student to their group object
  const getStudentGroup = (groupId: string): Group | undefined => {
    return groups.find((g) => g.id === groupId);
  };

  // 31. STATISTIKA HAQIQIY MA'LUMOTLAR BAZASIDAN HISOBLANADI
  const stats = useMemo(() => {
    const totalStudents = students.length;

    const count1 = students.filter((s) => {
      const g = getStudentGroup(s.groupId);
      return g?.courseYear === 1;
    }).length;

    const count2 = students.filter((s) => {
      const g = getStudentGroup(s.groupId);
      return g?.courseYear === 2;
    }).length;

    const count3 = students.filter((s) => {
      const g = getStudentGroup(s.groupId);
      return g?.courseYear === 3;
    }).length;

    const count4 = students.filter((s) => {
      const g = getStudentGroup(s.groupId);
      return g?.courseYear === 4;
    }).length;

    return {
      totalStudents,
      count1,
      count2,
      count3,
      count4,
      totalTeachers: teachers.length,
      totalGroups: groups.length,
    };
  }, [students, groups, teachers]);

  // 31. KURS VA GURUH FILTRLARI
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const g = getStudentGroup(s.groupId);
      const course = g?.courseYear || 1;

      // Course filter
      if (selectedCourseFilter !== 'all' && course !== selectedCourseFilter) {
        return false;
      }

      // Group filter
      if (selectedGroupFilter !== 'all' && s.groupId !== selectedGroupFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const curatorName = g?.curatorName || '';
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.login.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          (s.groupName && s.groupName.toLowerCase().includes(q)) ||
          curatorName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [students, groups, selectedCourseFilter, selectedGroupFilter, searchQuery]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      fullName: '',
      groupId: groups[0]?.id || 'grp-12',
      login: '',
      phone: '+998 ',
      status: 'Faol',
    });
    setStudentPassword('student123');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData(s);
    const existingUsers = CollegeDataService.getUsers();
    const user = existingUsers.find(
      (u) => u.linkedEntityId === s.id || u.login.toLowerCase() === s.login.toLowerCase()
    );
    setStudentPassword(user?.passwordHash || 'student123');
    setIsModalOpen(true);
  };

  const generateLoginFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/['`ʻ’]/g, '')
      .replace(/sh/g, 'sh')
      .replace(/ch/g, 'ch')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 2)
      .join('_')
      .slice(0, 20);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.login) {
      onShowToast('F.I.Sh va login kiritilishi shart', 'error');
      return;
    }

    const cleanLogin = formData.login.trim().toLowerCase();
    const allUsers = CollegeDataService.getUsers();
    const allStudents = CollegeDataService.getStudents();

    // 53. TAKRORLANMAYDIGAN LOGIN TEKSHIRUVI
    const isLoginTaken =
      allStudents.some(
        (s) => s.login.toLowerCase() === cleanLogin && (!editingStudent || s.id !== editingStudent.id)
      ) ||
      allUsers.some(
        (u) =>
          u.login.toLowerCase() === cleanLogin &&
          (!editingStudent || (u.linkedEntityId !== editingStudent.id && u.id !== `usr-${editingStudent.id}`))
      );

    if (isLoginTaken) {
      onShowToast(
        `"${cleanLogin}" logini tizimda allaqachon mavjud! Iltimos, boshqa takrorlanmaydigan login kiriting.`,
        'error'
      );
      return;
    }

    const groupObj = groups.find((g) => g.id === formData.groupId) || groups[0];
    if (!groupObj) {
      onShowToast('Talaba biriktirilishi uchun kamida bitta guruh mavjud bo‘lishi shart', 'error');
      return;
    }

    setIsSaving(true);

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        fullName: formData.fullName.trim(),
        groupId: groupObj.id,
        groupName: groupObj.name,
        login: cleanLogin,
        phone: formData.phone?.trim() || '—',
        status: (formData.status as any) || 'Faol',
      };
      CollegeDataService.saveStudent(updated);

      // User hisobini ham bir vaqtning o‘zida yangilash
      const existingUser = allUsers.find(
        (u) => u.linkedEntityId === updated.id || u.login.toLowerCase() === editingStudent.login.toLowerCase()
      );

      if (existingUser) {
        CollegeDataService.saveUser({
          ...existingUser,
          fullName: updated.fullName,
          login: cleanLogin,
          passwordHash: studentPassword.trim() || existingUser.passwordHash,
          isActive: updated.status === 'Faol',
        });
      } else {
        CollegeDataService.saveUser({
          id: `usr-${updated.id}`,
          login: cleanLogin,
          passwordHash: studentPassword.trim() || 'student123',
          fullName: updated.fullName,
          role: 'student',
          isActive: updated.status === 'Faol',
          linkedEntityId: updated.id,
          createdAt: new Date().toISOString().slice(0, 10),
        });
      }

      onShowToast(`"${updated.fullName}" talaba ${groupObj.name}ga muvaffaqiyatli biriktirildi`, 'success');
    } else {
      const created: Student = {
        id: `std-${Date.now()}`,
        fullName: formData.fullName.trim(),
        groupId: groupObj.id,
        groupName: groupObj.name,
        login: cleanLogin,
        phone: formData.phone?.trim() || '—',
        status: (formData.status as any) || 'Faol',
        averageGrade: 0,
        attendancePercent: 100,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      CollegeDataService.saveStudent(created);

      // Yangi foydalanuvchi hisobini ochish
      CollegeDataService.saveUser({
        id: `usr-${created.id}`,
        login: created.login,
        passwordHash: studentPassword.trim() || 'student123',
        fullName: created.fullName,
        role: 'student',
        isActive: true,
        linkedEntityId: created.id,
        createdAt: new Date().toISOString().slice(0, 10),
      });

      // Server-side audit sync
      fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-user-name': 'Admin',
        },
        body: JSON.stringify(created),
      }).catch(() => {});

      onShowToast(
        `"${created.fullName}" ${groupObj.name}ga biriktirildi (login: ${created.login}, parol: ${studentPassword || 'student123'})`,
        'success'
      );
    }

    setStudents(CollegeDataService.getStudents());
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleCreateQuickGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickGroupName.trim();
    if (!name) {
      onShowToast('Guruh nomini kiriting', 'error');
      return;
    }

    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name,
      specialty: quickGroupSpecialty.trim() || 'Kompyuter tarmoqlari va IT',
      courseYear: quickGroupCourse,
      academicYear: '2026-2027',
      semester: 1,
      studentCount: 0,
      curatorName: 'Sinf kuratori hali tayinlanmagan',
    };

    CollegeDataService.saveGroup(newGroup);

    // Sync with server
    fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'x-user-name': 'Admin',
      },
      body: JSON.stringify(newGroup),
    }).catch(() => {});

    const updatedGroups = CollegeDataService.getGroups();
    setGroups(updatedGroups);
    setFormData((prev) => ({ ...prev, groupId: newGroup.id }));
    setIsQuickGroupOpen(false);
    setQuickGroupName('');
    onShowToast(`"${newGroup.name}" guruhi muvaffaqiyatli yaratildi va o‘quvchiga tanlandi`, 'success');
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    CollegeDataService.deleteStudent(studentToDelete.id);
    setStudents(CollegeDataService.getStudents());
    onShowToast(`"${studentToDelete.fullName}" talaba o‘chirildi`, 'info');
    setStudentToDelete(null);
  };

  // CSV Import
  const handleCSVImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split('\n').filter((l) => l.trim().length > 0);
          let count = 0;

          lines.slice(1).forEach((line) => {
            const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
            if (parts.length >= 2) {
              const fullName = parts[0];
              const groupName = parts[1] || '12-guruh';
              const phone = parts[2] || '+998 90 000 00 00';
              const login = fullName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .slice(0, 15);

              const grp = groups.find((g) => g.name === groupName) || groups[0];

              const newStd: Student = {
                id: `std-imp-${Date.now()}-${count}`,
                fullName,
                groupId: grp.id,
                groupName: grp.name,
                login,
                phone,
                status: 'Faol',
                averageGrade: 4.5,
                attendancePercent: 95,
                createdAt: new Date().toISOString().slice(0, 10),
              };
              CollegeDataService.saveStudent(newStd);
              count++;
            }
          });

          setStudents(CollegeDataService.getStudents());
          onShowToast(`${count} ta talaba CSV faylidan muvaffaqiyatli import qilindi`, 'success');
        } catch (err) {
          onShowToast('Faylni o‘qishda xatolik yuz berdi', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportCSV = () => {
    const rows = [
      ['№', 'F.I.SH', 'Guruh', 'Kurs', 'Sinf kuratori', 'Login', 'Telefon', 'Holat', 'O‘rtacha baho', 'Davomat %'],
    ];
    filteredStudents.forEach((s, idx) => {
      const g = getStudentGroup(s.groupId);
      rows.push([
        String(idx + 1),
        s.fullName,
        s.groupName,
        `${g?.courseYear || 1}-kurs`,
        g?.curatorName || 'Tayinlanmagan',
        s.login,
        s.phone,
        s.status,
        String(s.averageGrade),
        `${s.attendancePercent}%`,
      ]);
    });
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `TEXNIKUM_TALABALARI_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Talabalar ro‘yxati CSV formatida yuklab olindi', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 31. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-7 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Paneli · Talabalar boshqaruvi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Texnikum O‘quvchilari
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Barcha bosqich va mutaxassisliklar bo‘yicha talabalar kontingenti, guruhlari, sinf kuratorlari va hisoblari.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi talaba qo‘shish</span>
        </button>
      </div>

      {/* 31. KPI STATISTIKA KARTALARI (HAQIQIY MA'LUMOTLAR BAZASIDAN) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Jami o'quvchilar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Jami o‘quvchilar</span>
            <Users className="w-3.5 h-3.5 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalStudents}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Faol talabalar</div>
        </div>

        {/* 1-kurs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>1-kurs</span>
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.count1}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">1-bosqich talabalari</div>
        </div>

        {/* 2-kurs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>2-kurs</span>
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.count2}</div>
          <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">2-bosqich talabalari</div>
        </div>

        {/* 3-kurs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>3-kurs</span>
            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.count3}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">3-bosqich talabalari</div>
        </div>

        {/* 4-kurs (agar mavjud bo'lsa) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>4-kurs</span>
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.count4}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">4-bosqich talabalari</div>
        </div>

        {/* Jami ustozlar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Jami ustozlar</span>
            <Briefcase className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalTeachers}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Pedagogik tarkib</div>
        </div>

        {/* Jami guruhlar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Jami guruhlar</span>
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalGroups}</div>
          <div className="text-[10px] text-cyan-700 font-semibold mt-0.5">Akademik guruhlar</div>
        </div>
      </div>

      {/* 31. KURSLAR BO‘YICHA TUGMALAR VA QIDIRUV FORMASI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Kurs tugmalari: “Barchasi”, “1-kurs”, “2-kurs”, “3-kurs”, “4-kurs” */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Kurs:</span>
            <button
              onClick={() => setSelectedCourseFilter('all')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCourseFilter === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Barchasi ({stats.totalStudents})
            </button>
            <button
              onClick={() => setSelectedCourseFilter(1)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCourseFilter === 1
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              1-kurs ({stats.count1})
            </button>
            <button
              onClick={() => setSelectedCourseFilter(2)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCourseFilter === 2
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              2-kurs ({stats.count2})
            </button>
            <button
              onClick={() => setSelectedCourseFilter(3)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCourseFilter === 3
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3-kurs ({stats.count3})
            </button>
            <button
              onClick={() => setSelectedCourseFilter(4)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCourseFilter === 4
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              4-kurs ({stats.count4})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVImport}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="CSV orqali yuklash"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV import</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="CSV eksport"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV eksport</span>
            </button>
          </div>
        </div>

        {/* Search and Group Selector */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism-familiya, login, guruh yoki kurator bo‘yicha qidiruv..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Barcha guruhlar ({groups.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.courseYear}-kurs ({students.filter((s) => s.groupId === g.id).length} nafar)
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-500 ml-auto">
            Topildi: <span className="text-blue-900 font-extrabold">{filteredStudents.length} nafar</span>
          </span>
        </div>
      </div>

      {/* 31. O‘QUVCHILAR JADVALI (DESKTOP) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5 text-center w-12">№</th>
                <th className="py-3 px-4">Ism-Familiyasi</th>
                <th className="py-3 px-3.5">Tizim logini</th>
                <th className="py-3 px-3">Kursi</th>
                <th className="py-3 px-3.5">Guruhi & Mutaxassislik</th>
                <th className="py-3 px-3.5">Sinf kuratori</th>
                <th className="py-3 px-3 text-center">GPA</th>
                <th className="py-3 px-3 text-center">Davomat</th>
                <th className="py-3 px-3 text-center">Holati</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Mos keluvchi talabalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const grp = getStudentGroup(s.groupId);
                  const courseYear = grp?.courseYear || 1;
                  const curatorName = grp?.curatorName || 'Sinf kuratori hali tayinlanmagan';

                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400">{s.phone}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold bg-slate-100 text-blue-900 px-2 py-0.5 rounded text-[11px]">
                          {s.login}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {courseYear}-kurs
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{s.groupName}</div>
                        <div className="text-[11px] text-slate-500">{grp?.specialty || 'IT mutaxassisligi'}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="line-clamp-1">{curatorName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-slate-900">{s.averageGrade}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-emerald-700">{s.attendancePercent}%</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            s.status === 'Faol'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 31. O‘QUVCHILAR MOBIL KARTALARI (SMARTFON) */}
      <div className="block md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Mos keluvchi talabalar topilmadi.
          </div>
        ) : (
          filteredStudents.map((s, idx) => {
            const grp = getStudentGroup(s.groupId);
            const courseYear = grp?.courseYear || 1;
            const curatorName = grp?.curatorName || 'Sinf kuratori hali tayinlanmagan';

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {s.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="font-mono font-bold bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded">
                          {s.login}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">{courseYear}-kurs</span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">{s.groupName}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      s.status === 'Faol'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="font-bold">Kurator:</span>
                    <span className="line-clamp-1">{curatorName}</span>
                  </div>

                  {s.phone && s.phone !== '—' && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3 h-3" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      GPA: <b className="text-slate-900">{s.averageGrade}</b>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Davomat: {s.attendancePercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentToDelete(s)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TALABA QO‘SHISH / TAHRIRLASH MODALI */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStudent ? 'Talaba ma’lumotlarini tahrirlash' : 'Yangi talaba qo‘shish'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs pb-1">
            {/* F.I.SH */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                F.I.SH (To‘liq ism-sharif) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => {
                  const val = e.target.value;
                  const updates: Partial<Student> = { fullName: val };
                  if (!editingStudent && (!formData.login || formData.login === generateLoginFromName(formData.fullName || ''))) {
                    updates.login = generateLoginFromName(val);
                  }
                  setFormData({ ...formData, ...updates });
                }}
                placeholder="Masalan: Akbarov Jasur Bobirovich"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Guruh va Kurs biriktirish */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Guruh <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickGroupOpen(true)}
                    className="text-[11px] font-bold text-blue-800 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Guruh ochish</span>
                  </button>
                </div>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.courseYear}-kurs ({g.specialty})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Admin yaratgan haqiqiy guruhlar ro‘yxati
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Akkaunt holati
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Faol">Faol</option>
                  <option value="Akademik ta'til">Akademik ta’til</option>
                  <option value="Chetlashtirilgan">Chetlashtirilgan</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  O‘quv jarayonidagi holati
                </span>
              </div>
            </div>

            {/* Login va Parol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Tizim logini <span className="text-rose-600">*</span>
                  </label>
                  {formData.fullName && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          login: generateLoginFromName(formData.fullName || ''),
                        })
                      }
                      className="text-[10px] font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      Login yaratish
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="jasur_akbarov"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Takrorlanmaydigan unikal login
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tizim paroli
                </label>
                <input
                  type="text"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="student123"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  O‘quvchi kirishi uchun boshlang‘ich parol
                </span>
              </div>
            </div>

            {/* Telefon raqami */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefon raqami
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Buttons: Saqlash va Orqaga */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Orqaga
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl font-black bg-blue-900 hover:bg-blue-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QUICK GURUH YARATISH MODALI */}
      {isQuickGroupOpen && (
        <Modal
          isOpen={isQuickGroupOpen}
          onClose={() => setIsQuickGroupOpen(false)}
          title="Yangi guruh yaratish (Tezkor)"
        >
          <form onSubmit={handleCreateQuickGroup} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guruh nomi <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={quickGroupName}
                onChange={(e) => setQuickGroupName(e.target.value)}
                placeholder="Masalan: 12-guruh yoki 13-guruh"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kursi
                </label>
                <select
                  value={quickGroupCourse}
                  onChange={(e) => setQuickGroupCourse(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={1}>1-kurs</option>
                  <option value={2}>2-kurs</option>
                  <option value={3}>3-kurs</option>
                  <option value={4}>4-kurs</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mutaxassislik
                </label>
                <input
                  type="text"
                  value={quickGroupSpecialty}
                  onChange={(e) => setQuickGroupSpecialty(e.target.value)}
                  placeholder="Kompyuter tarmoqlari va IT"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickGroupOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Orqaga
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-black bg-blue-900 hover:bg-blue-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Guruhni saqlash</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* TALABANI O‘CHIRISHNI TASDIQLASH MODALI */}
      {studentToDelete && (
        <Modal
          isOpen={!!studentToDelete}
          onClose={() => setStudentToDelete(null)}
          title="Talabani ro‘yxatdan o‘chirish"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>«{studentToDelete.fullName}» talabani o‘chirish</span>
              </div>
              <p>
                Haqiqatan ham ushbu talabani ro‘yxatdan butunlay o‘chirmoqchimisiz? Guruh: <b>{studentToDelete.groupName}</b>, Login: <b>{studentToDelete.login}</b>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ha, o‘chirish</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
