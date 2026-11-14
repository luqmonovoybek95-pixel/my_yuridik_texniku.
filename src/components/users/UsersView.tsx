import React, { useState } from 'react';
import { UserAccount, UserRole, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { UserCog, Plus, Search, Shield, KeyRound, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface UsersViewProps {
  onShowToast: ShowToastFn;
}

export const UsersView: React.FC<UsersViewProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => CollegeDataService.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState<Partial<UserAccount>>({
    fullName: '',
    login: '',
    passwordHash: 'syt12345',
    role: 'teacher',
    phone: '',
    isActive: true,
  });

  React.useEffect(() => {
    const handleUpdate = () => setUsers(CollegeDataService.getUsers());
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.login.toLowerCase().includes(q);
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.login) {
      onShowToast('F.I.Sh va login kiritilishi shart', 'error');
      return;
    }

    const trimmedLogin = formData.login.trim().toLowerCase();
    if (users.some((u) => u.login.toLowerCase() === trimmedLogin)) {
      onShowToast('Ushbu login tizimda allaqachon mavjud', 'error');
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      login: trimmedLogin,
      passwordHash: formData.passwordHash || 'syt12345',
      fullName: formData.fullName.trim(),
      role: (formData.role as UserRole) || 'teacher',
      phone: formData.phone?.trim() || '—',
      isActive: formData.isActive ?? true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    CollegeDataService.saveUser(newUser);
    setUsers(CollegeDataService.getUsers());
    setIsModalOpen(false);
    onShowToast(`Yangi foydalanuvchi yaratildi. Login: ${newUser.login}`, 'success');
  };

  const handleToggleStatus = (user: UserAccount) => {
    if (user.login === 'admin') {
      onShowToast('Asosiy administrator hisobini faolsizlantirib bo‘lmaydi', 'error');
      return;
    }
    const updated = { ...user, isActive: !user.isActive };
    CollegeDataService.saveUser(updated);
    setUsers(CollegeDataService.getUsers());
    onShowToast(`Hisob holati: ${updated.isActive ? 'Faol' : 'Faolsizlantirildi'}`, 'info');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;

    const updated = { ...selectedUser, passwordHash: newPassword.trim() };
    CollegeDataService.saveUser(updated);
    setUsers(CollegeDataService.getUsers());
    setIsPasswordModalOpen(false);
    setNewPassword('');
    onShowToast(`"${selectedUser.fullName}" paroli yangilandi`, 'success');
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (u.login === 'admin') {
      onShowToast('Asosiy administrator hisobini o‘chirib bo‘lmaydi', 'error');
      return;
    }
    if (window.confirm(`"${u.fullName}" foydalanuvchi hisobini o‘chirishni xohlaysizmi?`)) {
      CollegeDataService.deleteUser(u.id);
      setUsers(CollegeDataService.getUsers());
      onShowToast('Hisob o‘chirildi', 'info');
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
            placeholder="F.I.Sh yoki login bo‘yicha..."
            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 w-64 sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          onClick={() => {
            setFormData({
              fullName: '',
              login: '',
              passwordHash: 'syt12345',
              role: 'teacher',
              phone: '+998 ',
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Foydalanuvchi qo‘shish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">F.I.SH</th>
                <th className="py-3 px-3">Login</th>
                <th className="py-3 px-3">Roli</th>
                <th className="py-3 px-3">Telefon</th>
                <th className="py-3 px-3 text-center">Holat</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{u.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Yaratilgan: {u.createdAt}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] font-semibold text-blue-900">
                    {u.login}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'teacher'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role === 'admin'
                        ? 'Administrator'
                        : u.role === 'teacher'
                        ? 'O‘qituvchi'
                        : 'O‘quvchi'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{u.phone || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        u.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {u.isActive ? 'Faol' : 'Nofaol'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewPassword('');
                          setIsPasswordModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                        title="Parolni yangilash"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.login !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hisobni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yangi foydalanuvchi hisobini ochish"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                F.I.SH (To‘liq ism)
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Masalan: Saidov Anvar Bobirovich"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Login
                </label>
                <input
                  type="text"
                  required
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="anvar_saidov"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Foydalanuvchi roli
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="student">O‘quvchi (Student)</option>
                  <option value="teacher">O‘qituvchi (Teacher)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dastlabki parol
                </label>
                <input
                  type="text"
                  required
                  value={formData.passwordHash}
                  onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                  placeholder="Kamida 6 belgi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Telefon raqami
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 ..."
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
                Hisobni saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && selectedUser && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`Parolni yangilash: ${selectedUser.fullName}`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Foydalanuvchi logini: <b className="text-slate-900 font-mono">{selectedUser.login}</b>
            </p>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Yangi parol
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parolni kiriting..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 font-mono"
              />
            </div>
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white"
              >
                Parolni o‘zgartirish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
