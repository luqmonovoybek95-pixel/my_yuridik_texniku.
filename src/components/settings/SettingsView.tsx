import React, { useState } from 'react';
import { AppSettings, ShowToastFn } from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Settings, Save, RotateCcw, Database, ShieldCheck, Palette, Clock } from 'lucide-react';

interface SettingsViewProps {
  onShowToast: ShowToastFn;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<AppSettings>(() => CollegeDataService.getSettings());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    CollegeDataService.updateSettings(settings);
    onShowToast('Tizim sozlamalari saqlandi', 'success');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Diqqat: Barcha ma’lumotlarni dastlabki holatga (namunaviy 12-guruh IT dars jadvali va o‘quvchilar ro‘yxatiga) qaytarmoqchimisiz?'
      )
    ) {
      CollegeDataService.resetToDefault();
      setSettings(CollegeDataService.getSettings());
      onShowToast('Barcha ma’lumotlar dastlabki holatga qaytarildi', 'info');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-900" />
            <span>Platforma sozlamalari</span>
          </h2>
          <p className="text-xs text-slate-500">
            Dars vaqtlari, jadval ranglari ma’nosi, semestr hamda Firebase konfiguratsiyasi.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Boshlang‘ich holatga qaytarish</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Institution Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            1. Ta’lim muassasasi va o‘quv davri
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Muassasa nomi
              </label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bo‘lim / Tizim sarlavhasi
              </label>
              <input
                type="text"
                value={settings.departmentName}
                onChange={(e) => setSettings({ ...settings, departmentName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                O‘quv yili
              </label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Joriy semestr
              </label>
              <select
                value={settings.currentSemester}
                onChange={(e) =>
                  setSettings({ ...settings, currentSemester: Number(e.target.value) })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                <option value={1}>1-semestr (Kuzgi)</option>
                <option value={2}>2-semestr (Bahorgi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timetable Lesson Slots */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Dars vaqtlari (Juftliklar soati)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {settings.lessonSlots.map((slot, idx) => (
              <div key={slot.pairNumber} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800">
                  {slot.pairRoman}-juftlik ({slot.pairNumber}-dars)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Boshlanishi:</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => {
                        const updated = [...settings.lessonSlots];
                        updated[idx].startTime = e.target.value;
                        updated[idx].timeLabel = `${e.target.value}-${updated[idx].endTime}`;
                        setSettings({ ...settings, lessonSlots: updated });
                      }}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Tugashi:</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => {
                        const updated = [...settings.lessonSlots];
                        updated[idx].endTime = e.target.value;
                        updated[idx].timeLabel = `${updated[idx].startTime}-${e.target.value}`;
                        setSettings({ ...settings, lessonSlots: updated });
                      }}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Meanings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Palette className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              3. Dars jadvalidagi ranglar ma’nosini sozlash
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-sm bg-red-600" />
                <label className="font-bold text-slate-700">Qizil rang ma’nosi</label>
              </div>
              <input
                type="text"
                value={settings.colorMeanings.red}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    colorMeanings: { ...settings.colorMeanings, red: e.target.value },
                  })
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600" />
                <label className="font-bold text-slate-700">Yashil rang ma’nosi</label>
              </div>
              <input
                type="text"
                value={settings.colorMeanings.green}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    colorMeanings: { ...settings.colorMeanings, green: e.target.value },
                  })
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-sm bg-amber-400" />
                <label className="font-bold text-slate-700">Sariq rang ma’nosi</label>
              </div>
              <input
                type="text"
                value={settings.colorMeanings.amber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    colorMeanings: { ...settings.colorMeanings, amber: e.target.value },
                  })
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Firebase Backend Instructions & Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">
                4. Firebase & Cloud Firestore integratsiyasi
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
              {settings.useFirebaseBackend ? 'Firebase faol' : 'Lokal doimiy baza faol'}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-2">
            <p className="font-bold">Firebase ma’lumotlar bazasini ulash bo‘yicha yo‘riqnoma:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Firebase Console (console.firebase.google.com) ga kiring va yangi loyiha oching.</li>
              <li>Authentication bo‘limida Email/Password yoki Custom Auth yoqing.</li>
              <li>Firestore Database bo‘limida yangi ma’lumotlar bazasini yarating.</li>
              <li>Loyihaning ildiz papkasidagi <code className="bg-white px-1 py-0.5 rounded text-blue-800">firestore.rules</code> qoidalarini joylashtiring.</li>
              <li>Loyiha sozlamalaridan Web App qo‘shing va quyidagi konfiguratsiya kalitlarini kiriting.</li>
            </ol>
            <p className="text-[11px] text-slate-500 italic mt-1">
              Eslatma: Agar Firebase kalitlari kiritilmasa ham, tizim to‘liq ishlashda davom etadi va barcha ma’lumotlarni brauzer xotirasida avtomatik saqlab boradi.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900">
              <input
                type="checkbox"
                checked={settings.useFirebaseBackend}
                onChange={(e) =>
                  setSettings({ ...settings, useFirebaseBackend: e.target.checked })
                }
                className="w-4 h-4 text-blue-900 rounded-sm"
              />
              <span>Firebase Cloud Firestore orqali sinxronlashni yoqish</span>
            </label>
          </div>

          {settings.useFirebaseBackend && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">API Key (apiKey)</label>
                <input
                  type="text"
                  value={settings.firebaseConfig?.apiKey || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      firebaseConfig: {
                        ...(settings.firebaseConfig || ({} as any)),
                        apiKey: e.target.value,
                      },
                    })
                  }
                  placeholder="AIzaSy..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                <input
                  type="text"
                  value={settings.firebaseConfig?.projectId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      firebaseConfig: {
                        ...(settings.firebaseConfig || ({} as any)),
                        projectId: e.target.value,
                      },
                    })
                  }
                  placeholder="sirdaryo-yt-app"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="py-2.5 px-6 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Sozlamalarni saqlash</span>
          </button>
        </div>
      </form>
    </div>
  );
};
