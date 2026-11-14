import React, { useState, useEffect, useMemo } from 'react';
import { GroupMaterial, Group, Subject, UserRole, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Upload,
  Plus,
  Search,
  Download,
  ExternalLink,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  HardDrive,
  Users,
  Layers,
  Calendar,
  Filter,
} from 'lucide-react';

interface MaterialsManagerProps {
  role: UserRole;
  currentUserName: string;
  currentStudentGroupId?: string;
  onShowToast: ShowToastFn;
}

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
  role,
  currentUserName,
  currentStudentGroupId,
  onShowToast,
}) => {
  const [materials, setMaterials] = useState<GroupMaterial[]>(() =>
    CollegeDataService.getMaterials()
  );
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>(
    role === 'student' && currentStudentGroupId ? currentStudentGroupId : 'all'
  );
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('all');

  // Upload Form Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    subjectName: string;
    groupId: string;
    courseYear: number;
    description: string;
    selectedFile: File | null;
  }>({
    title: '',
    subjectName: subjects[0]?.name || '',
    groupId: groups[0]?.id || '',
    courseYear: 1,
    description: '',
    selectedFile: null,
  });

  // Material to delete confirmation
  const [materialToDelete, setMaterialToDelete] = useState<GroupMaterial | null>(null);

  // Sync with storage update events
  useEffect(() => {
    const handleStorageUpdate = () => {
      setMaterials(CollegeDataService.getMaterials());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
    };
    window.addEventListener('syt-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('syt-storage-update', handleStorageUpdate);
  }, []);

  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      onShowToast(
        `Ruxsat etilmagan fayl formati (.${ext}). Faqat PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG fayllari qabul qilinadi.`,
        'error'
      );
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onShowToast(
        `Fayl hajmi juda katta (${(file.size / (1024 * 1024)).toFixed(1)} MB). Ruxsat etilgan maksimal hajm: 25 MB.`,
        'error'
      );
      e.target.value = '';
      return;
    }

    setFormData((prev) => ({
      ...prev,
      selectedFile: file,
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subjectName: subjects[0]?.name || '',
      groupId: groups[0]?.id || '',
      courseYear: 1,
      description: '',
      selectedFile: null,
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleOpenUploadModal = () => {
    resetForm();
    setIsUploadModalOpen(true);
  };

  // Requirement 30: Saqlash / Yuklash handler
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploading) return;

    if (!formData.title.trim()) {
      onShowToast('Darslik nomini kiritish majburiy!', 'error');
      return;
    }

    if (!formData.subjectName.trim()) {
      onShowToast('Fanni tanlash yoki kiritish majburiy!', 'error');
      return;
    }

    if (!formData.groupId) {
      onShowToast('Guruh yoki yo‘nalishni tanlang!', 'error');
      return;
    }

    if (!formData.selectedFile) {
      onShowToast('Iltimos, yuklanadigan darslik faylini tanlang!', 'error');
      return;
    }

    const file = formData.selectedFile;
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const normalizedExt: GroupMaterial['fileType'] =
      rawExt === 'jpeg' ? 'jpg' : (rawExt as GroupMaterial['fileType']);

    setIsUploading(true);
    setUploadProgress(30);

    // Read file as Base64 data URL
    const reader = new FileReader();

    reader.onload = async () => {
      setUploadProgress(80);
      const base64Data = reader.result as string;
      const targetGroup = groups.find((g) => g.id === formData.groupId);

      const newMaterial: GroupMaterial = {
        id: `mat-${Date.now()}`,
        title: formData.title.trim(),
        subjectName: formData.subjectName.trim(),
        groupId: formData.groupId,
        groupName: targetGroup?.name || 'Umumiy',
        courseYear: formData.courseYear,
        description: formData.description.trim(),
        fileType: normalizedExt,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
        fileData: base64Data,
        author: currentUserName || 'O‘qituvchi',
        uploadDate: new Date().toISOString().slice(0, 10),
      };

      // Save to storage
      CollegeDataService.saveMaterial(newMaterial);
      setMaterials(CollegeDataService.getMaterials());

      // Sync to backend /api/materials
      try {
        const user = CollegeDataService.getCurrentUser();
        fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || 'teacher',
            'x-user-name': user?.fullName || 'Ustoz',
          },
          body: JSON.stringify(newMaterial),
        }).catch(() => {});
      } catch (err) {}

      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 200));

      setIsUploading(false);
      setIsUploadModalOpen(false);
      resetForm();

      onShowToast(`«${newMaterial.title}» darsligi muvaffaqiyatli yuklandi va saqlandi!`, 'success');
    };

    reader.onerror = () => {
      setIsUploading(false);
      onShowToast('Faylni o‘qish va yuklashda xatolik yuz berdi. Qayta urinib ko‘ring.', 'error');
    };

    reader.readAsDataURL(file);
  };

  const handleDownload = (mat: GroupMaterial) => {
    if (mat.fileData) {
      const link = document.createElement('a');
      link.href = mat.fileData;
      link.download = mat.fileName || `${mat.title}.${mat.fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast(`«${mat.title}» fayli yuklab olinmoqda`, 'info');
    } else {
      onShowToast('Ushbu fayl uchun to‘g‘ridan-to‘g‘ri ma’lumot topilmadi', 'error');
    }
  };

  const handleOpenFile = (mat: GroupMaterial) => {
    if (mat.fileData) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<html><head><title>${mat.title}</title></head><body style="margin:0;padding:20px;font-family:sans-serif;background:#0f172a;color:#fff;display:flex;flex-direction:column;align-items:center;"><h2>${mat.title}</h2><p>${mat.subjectName} · Muallif: ${mat.author}</p><iframe src="${mat.fileData}" style="width:90vw;height:85vh;border:none;background:#fff;border-radius:12px;"></iframe></body></html>`
        );
      } else {
        handleDownload(mat);
      }
    } else {
      handleDownload(mat);
    }
  };

  const confirmDeleteMaterial = () => {
    if (!materialToDelete) return;
    CollegeDataService.deleteMaterial(materialToDelete.id);
    setMaterials(CollegeDataService.getMaterials());
    onShowToast(`«${materialToDelete.title}» darsligi o‘chirildi`, 'info');
    setMaterialToDelete(null);
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // If student role, restrict to student's group or all
      if (role === 'student' && currentStudentGroupId) {
        if (m.groupId !== 'all' && m.groupId !== currentStudentGroupId) {
          return false;
        }
      }

      if (selectedGroupFilter !== 'all' && m.groupId !== selectedGroupFilter) {
        return false;
      }

      if (selectedFormatFilter !== 'all') {
        if (selectedFormatFilter === 'pdf' && m.fileType !== 'pdf') return false;
        if (selectedFormatFilter === 'doc' && m.fileType !== 'doc' && m.fileType !== 'docx') return false;
        if (selectedFormatFilter === 'sheet' && m.fileType !== 'xls' && m.fileType !== 'xlsx') return false;
        if (selectedFormatFilter === 'ppt' && m.fileType !== 'ppt' && m.fileType !== 'pptx') return false;
        if (selectedFormatFilter === 'img' && m.fileType !== 'jpg' && m.fileType !== 'png') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.subjectName.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [materials, role, currentStudentGroupId, selectedGroupFilter, selectedFormatFilter, searchQuery]);

  const getFormatBadge = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'PDF Hujjat',
        };
      case 'doc':
      case 'docx':
        return {
          icon: FileText,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Word Hujjat',
        };
      case 'xls':
      case 'xlsx':
        return {
          icon: FileSpreadsheet,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Excel Jadval',
        };
      case 'ppt':
      case 'pptx':
        return {
          icon: Presentation,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Taqdimot (PPT)',
        };
      case 'jpg':
      case 'png':
        return {
          icon: ImageIcon,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Tasvir (Rasm)',
        };
      default:
        return {
          icon: BookOpen,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'O‘quv fayli',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-7 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Elektron Kutubxona & O‘quv Resurslari</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Darsliklar va O‘quv Materiallari
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Texnikum darsliklari, ma’ruzalar matni, taqdimotlar va amaliy mashg‘ulot fayllari yagona markazda.
          </p>
        </div>

        {role !== 'student' && (
          <button
            onClick={handleOpenUploadModal}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Yangi darslik yuklash</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Darslik nomi, fan yoki muallif..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Group filter (for teachers/admins) */}
          {role !== 'student' && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {/* Format filter */}
          <select
            value={selectedFormatFilter}
            onChange={(e) => setSelectedFormatFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Barcha formatlar</option>
            <option value="pdf">PDF fayllar</option>
            <option value="doc">Word (.doc, .docx)</option>
            <option value="sheet">Excel (.xls, .xlsx)</option>
            <option value="ppt">Taqdimot (.ppt, .pptx)</option>
            <option value="img">Rasmlar (.jpg, .png)</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Jami materiallar: <span className="text-blue-900 font-black text-sm">{filteredMaterials.length} ta</span>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">O‘quv materiallari topilmadi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ushbu fan yoki guruh bo‘yicha hozircha darsliklar yuklanmagan. Ustozlar yuqoridagi tugma orqali darslik qo‘shishi mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const badge = getFormatBadge(mat.fileType);
            const Icon = badge.icon;

            return (
              <div
                key={mat.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    {role !== 'student' && (
                      <button
                        onClick={() => setMaterialToDelete(mat)}
                        title="Darslikni o‘chirish"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                    {mat.title}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                      <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      <span>{mat.subjectName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Guruh: {mat.groupName || 'Barcha guruhlar'}</span>
                    </div>

                    {mat.description && (
                      <p className="text-[11px] text-slate-500 pt-1 line-clamp-2 leading-relaxed">
                        {mat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[10px] text-slate-400">
                    <div>{mat.author}</div>
                    <div>{mat.uploadDate} {mat.fileSize ? `· ${mat.fileSize}` : ''}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenFile(mat)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Brauzerda ko‘rish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ochish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(mat)}
                      className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Faylni yuklab olish"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Yuklab olish</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 30. DARSLIK YUKLASH FORMASI MODALI */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            if (!isUploading) setIsUploadModalOpen(false);
          }}
          title="Yangi darslik yoki o‘quv faylini yuklash"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs pb-2">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Darslik yoki material nomi <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masalan: Fuqarolik huquqi asoslari (1-qism)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Fan <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Guruh yoki kurs <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">Barcha guruhlar uchun</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Qisqacha izoh yoki mavzusi (ixtiyoriy)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Darslik bo‘yicha qo‘shimcha ma’lumot, mavzular va tavsiyalar..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Fayl tanlash maydoni */}
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 space-y-2">
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Fayl tanlash (PDF, Word, Excel, PPT, Rasm) <span className="text-rose-600">*</span>
              </label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block">
                Ruxsat etilgan formatlar: .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .jpg, .png. Maksimal hajm: 25 MB.
              </span>

              {formData.selectedFile && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold text-xs flex items-center justify-between">
                  <span>Tanlangan fayl: {formData.selectedFile.name}</span>
                  <span className="text-[11px] text-emerald-700">
                    {(formData.selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Fayl saqlanmoqda va yuklanmoqda...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-900 h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 30. FORMA OXIRIDA “SAQLASH/YUKLASH” VA “ORQAGA” TUGMALARI */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Orqaga</span>
              </button>

              <button
                type="submit"
                disabled={isUploading}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 cursor-pointer transition-all ${
                  isUploading
                    ? 'bg-blue-800 opacity-80 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-800 active:scale-95'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Yuklanmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Saqlash / Yuklash</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {materialToDelete && (
        <Modal
          isOpen={!!materialToDelete}
          onClose={() => setMaterialToDelete(null)}
          title="Darslikni o‘chirishni tasdiqlang"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>«{materialToDelete.title}» darsligini o‘chirish</span>
              </div>
              <p>
                Haqiqatan ham ushbu o‘quv materialini tizimdan butunlay o‘chirmoqchimisiz? O‘quvchilar bu fayldan foydalana olmay qoladilar.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDeleteMaterial}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ha, darslikni o‘chirish</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
