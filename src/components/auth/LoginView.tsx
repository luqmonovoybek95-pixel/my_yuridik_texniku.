import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, BookOpen, Shield, GraduationCap } from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { SytLogo } from '../common/SytLogo';
import { ThemeAndFontControls } from '../common/ThemeAndFontControls';

interface LoginViewProps {
  onSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedLogin = login.trim().toLowerCase();
      const users = CollegeDataService.getUsers();

      // Find user matching login and role
      const user = users.find(
        (u) => u.login.toLowerCase() === trimmedLogin && u.role === selectedRole
      );

      if (!user) {
        setErrorMessage(
          `"${selectedRole === 'admin' ? 'Administrator' : selectedRole === 'teacher' ? 'O‘qituvchi' : 'O‘quvchi'}" rolida ushbu login topilmadi. Login va rolni tekshirib qayta kiriting.`
        );
        setIsLoading(false);
        return;
      }

      if (!user.isActive) {
        setErrorMessage('Ushbu hisob faolsizlantirilgan. Texnikum ma’muriyati bilan bog‘laning.');
        setIsLoading(false);
        return;
      }

      // Password verification
      if (user.passwordHash !== password) {
        setErrorMessage('Kiritilgan parol noto‘g‘ri. Qayta urinib ko‘ring.');
        setIsLoading(false);
        return;
      }

      // Successful login
      user.lastLogin = new Date().toISOString();
      CollegeDataService.saveUser(user);
      CollegeDataService.setCurrentUser(user);
      setIsLoading(false);
      onSuccess(user);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 text-slate-100">
      {/* Left visual & branding panel */}
      <div className="relative flex-1 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls Row: Official College Logo & Theme/Font Switcher */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <SytLogo size="lg" textColor="light" />
          <ThemeAndFontControls />
        </div>

        {/* Center Presentation Copy - Refined, clean and compact */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Sirdaryo Yuridik Texnikumi
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            O‘quv jarayonini boshqarish, dars jadvallari, elektron jurnal va davomat tizimi.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
          <span>© 2026 Sirdaryo Yuridik Texnikumi. Barcha huquqlar himoyalangan.</span>
          <span className="text-slate-400">Asia/Tashkent vaqt mintaqasi</span>
        </div>
      </div>

      {/* Right Login form panel - Clean, professional */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-10 lg:p-12 flex flex-col justify-center border-l border-slate-200 dark:border-slate-800 transition-colors">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center mb-4 font-bold text-xl border border-blue-100 dark:border-blue-900">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Assalomu alaykum!
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Shaxsiy hisobingizga kirish uchun login va parolingizni kiriting.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Foydalanuvchi roli
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setErrorMessage(''); }}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('teacher'); setErrorMessage(''); }}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'teacher'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>O‘qituvchi</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('student'); setErrorMessage(''); }}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>O‘quvchi</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Loginni kiriting..."
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Tekshirilmoqda...</span>
              ) : (
                <span>Tizimga kirish →</span>
              )}
            </button>
          </form>

          {/* Secure System Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
              Sirdaryo Yuridik Texnikumi axborot xavfsizligi standarti bo‘yicha himoyalangan. Foydalanuvchi hisoblari faqat ma’muriyat tomonidan beriladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
