import React, { useState, useEffect, useMemo } from 'react';
import { UserAccount, UserRole, Group } from './types';
import { CollegeDataService } from './services/storage';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer, ToastMessage } from './components/common/Modal';

// Views
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TimetableTable } from './components/timetable/TimetableTable';
import { ElectronicJournal } from './components/journal/ElectronicJournal';
import { AttendanceView } from './components/attendance/AttendanceView';
import { GradesView } from './components/grades/GradesView';
import { HomeworkView } from './components/homework/HomeworkView';
import { StudentsManager } from './components/students/StudentsManager';
import { TeachersManager } from './components/teachers/TeachersManager';
import { GroupsManager } from './components/groups/GroupsManager';
import { GroupDetailView } from './components/groups/GroupDetailView';
import { CuratorWorkspace } from './components/curator/CuratorWorkspace';
import { StudentProfileView } from './components/student/StudentProfileView';
import { ImportantDatesCalendar } from './components/calendar/ImportantDatesCalendar';
import { TestsManager } from './components/tests/TestsManager';
import { SubjectsManager } from './components/subjects/SubjectsManager';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';
import { MaterialsManager } from './components/materials/MaterialsManager';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    CollegeDataService.getCurrentUser()
  );
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<Group | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Listen to storage update events
  useEffect(() => {
    const handleUpdate = () => {
      const u = CollegeDataService.getCurrentUser();
      if (!u && currentUser) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, [currentUser]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
    showToast(`Xush kelibsiz, ${user.fullName}!`, 'success');
  };

  const handleLogout = () => {
    CollegeDataService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentTab('dashboard');
    showToast('Tizimdan muvaffaqiyatli chiqildi', 'info');
  };

  // Role Access Guard
  const handleSelectTab = (tab: NavTabId) => {
    if (!currentUser) return;

    // Check student restrictions
    if (currentUser.role === 'student') {
      const allowedForStudent: NavTabId[] = [
        'dashboard',
        'profile',
        'group_detail',
        'timetable',
        'journal',
        'grades',
        'tests',
        'attendance',
        'homework',
        'materials',
        'dates',
        'announcements',
      ];
      if (!allowedForStudent.includes(tab)) {
        showToast('Ushbu bo‘lim faqat o‘qituvchi va ma’muriyat uchun ruxsat etilgan', 'error');
        return;
      }
    }

    // Check teacher restrictions
    if (currentUser.role === 'teacher') {
      const restrictedForTeacher: NavTabId[] = ['students', 'teachers', 'users', 'settings', 'reports'];
      if (restrictedForTeacher.includes(tab)) {
        showToast('Ushbu bo‘limga kirish faqat administrator uchun ochiq', 'error');
        return;
      }
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, render LoginView
  if (!currentUser) {
    return (
      <>
        <LoginView onSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Resolve active student entity if role is student
  const activeStudentEntity = useMemo(() => {
    if (currentUser?.role !== 'student') return undefined;
    const allStudents = CollegeDataService.getStudents();
    return (
      allStudents.find((s) => s.id === currentUser.linkedEntityId) ||
      allStudents.find((s) => s.login.toLowerCase() === currentUser.login.toLowerCase()) ||
      allStudents.find((s) => s.id === currentUser.id)
    );
  }, [currentUser]);

  const activeStudentId = activeStudentEntity?.id || currentUser.linkedEntityId;

  // Render view corresponding to currentTab
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        if (currentUser.role === 'admin') {
          return <AdminDashboard onNavigate={handleSelectTab} />;
        }
        if (currentUser.role === 'teacher') {
          return <TeacherDashboard currentUser={currentUser} onNavigate={handleSelectTab} />;
        }
        return <StudentDashboard currentUser={currentUser} onNavigate={handleSelectTab} />;

      case 'timetable':
        return (
          <TimetableTable
            role={currentUser.role}
            currentUserName={currentUser.fullName}
            onShowToast={showToast}
          />
        );

      case 'journal':
        return (
          <ElectronicJournal
            role={currentUser.role}
            currentTeacherName={currentUser.fullName}
            currentStudentId={activeStudentId}
            onShowToast={showToast}
          />
        );

      case 'attendance':
        return (
          <AttendanceView
            role={currentUser.role}
            currentStudentId={activeStudentId}
            onShowToast={showToast}
          />
        );

      case 'grades':
        return (
          <GradesView
            role={currentUser.role}
            currentStudentId={activeStudentId}
            onShowToast={showToast}
          />
        );

      case 'tests':
        return (
          <TestsManager
            role={currentUser.role}
            currentUser={currentUser}
            onShowToast={showToast}
          />
        );

      case 'homework':
        return (
          <HomeworkView
            role={currentUser.role}
            currentGroupName="12-guruh"
            onShowToast={showToast}
          />
        );

      case 'materials': {
        const studentObj =
          currentUser.role === 'student'
            ? CollegeDataService.getStudents().find(
                (s) =>
                  s.id === currentUser.linkedEntityId ||
                  s.login.toLowerCase() === currentUser.login.toLowerCase()
              )
            : undefined;

        return (
          <MaterialsManager
            role={currentUser.role}
            currentUserName={currentUser.fullName}
            currentStudentGroupId={studentObj?.groupId}
            onShowToast={showToast}
          />
        );
      }

      case 'curator':
        return (
          <CuratorWorkspace
            currentUser={currentUser}
            onShowToast={showToast}
            onOpenTimetable={() => handleSelectTab('timetable')}
            onOpenJournal={() => handleSelectTab('journal')}
          />
        );

      case 'group_detail': {
        const allGroups = CollegeDataService.getGroups();
        let targetGroup = selectedGroupForDetail;
        if (!targetGroup) {
          if (currentUser.role === 'student') {
            const students = CollegeDataService.getStudents();
            const stud = students.find(
              (s) =>
                s.id === currentUser.linkedEntityId ||
                s.login.toLowerCase() === currentUser.login.toLowerCase()
            );
            targetGroup = allGroups.find((g) => g.id === stud?.groupId) || allGroups[0];
          } else {
            targetGroup = allGroups[0];
          }
        }
        if (!targetGroup) {
          return (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              Guruh ma’lumotlari topilmadi
            </div>
          );
        }
        return (
          <GroupDetailView
            group={targetGroup}
            role={currentUser.role}
            currentUser={currentUser}
            onBack={() => handleSelectTab(currentUser.role === 'student' ? 'dashboard' : 'groups')}
            onShowToast={showToast}
            onOpenTimetable={() => handleSelectTab('timetable')}
            onOpenJournal={() => handleSelectTab('journal')}
          />
        );
      }

      case 'profile':
        return (
          <StudentProfileView
            currentUser={currentUser}
            onShowToast={showToast}
            onOpenTimetable={() => handleSelectTab('timetable')}
          />
        );

      case 'dates':
        return (
          <ImportantDatesCalendar
            role={currentUser.role}
            onShowToast={showToast}
          />
        );

      case 'students':
        return <StudentsManager onShowToast={showToast} />;

      case 'teachers':
        return <TeachersManager onShowToast={showToast} />;

      case 'groups':
        return (
          <GroupsManager
            onShowToast={showToast}
            onSelectGroupForJournal={(_grpId) => {
              handleSelectTab('journal');
            }}
            onOpenGroupDetail={(grp) => {
              setSelectedGroupForDetail(grp);
              handleSelectTab('group_detail');
            }}
          />
        );

      case 'subjects':
        return <SubjectsManager onShowToast={showToast} />;

      case 'announcements':
        return <AnnouncementsView role={currentUser.role} onShowToast={showToast} />;

      case 'reports':
        return <ReportsView onShowToast={showToast} />;

      case 'users':
        return <UsersView onShowToast={showToast} />;

      case 'settings':
        return <SettingsView onShowToast={showToast} />;

      default:
        return <AdminDashboard onNavigate={handleSelectTab} />;
    }
  };

  const announcements = CollegeDataService.getAnnouncements();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        unreadAnnouncementsCount={announcements.length}
        onOpenAnnouncements={() => handleSelectTab('announcements')}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          role={currentUser.role}
          currentTab={currentTab}
          currentUserName={currentUser.fullName}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-2.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 lg:pb-8 main-content-area min-w-0 overflow-x-hidden">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        role={currentUser.role}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
