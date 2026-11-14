import {
  UserAccount,
  Student,
  Teacher,
  Group,
  Subject,
  TimetableLesson,
  AttendanceRecord,
  GradeRecord,
  HomeworkItem,
  AnnouncementItem,
  JournalLessonTopic,
  AuditLogItem,
  AppSettings,
  UserRole,
  GroupMaterial,
  ImportantDateItem,
  TestItem,
  TestResultItem,
} from '../types';

import {
  INITIAL_SETTINGS,
  INITIAL_GROUPS,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_USER_ACCOUNTS,
  INITIAL_TIMETABLE,
  INITIAL_GRADES,
  INITIAL_ATTENDANCE,
  INITIAL_HOMEWORKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TOPICS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MATERIALS,
  INITIAL_IMPORTANT_DATES,
  INITIAL_TESTS,
  INITIAL_TEST_RESULTS,
} from './initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'syt_auth_current_user',
  SETTINGS: 'syt_db_settings_v2',
  GROUPS: 'syt_db_groups_v2',
  TEACHERS: 'syt_db_teachers_v2',
  SUBJECTS: 'syt_db_subjects_v2',
  STUDENTS: 'syt_db_students_v2',
  USERS: 'syt_db_users_v2',
  TIMETABLE: 'syt_db_timetable_v2',
  GRADES: 'syt_db_grades_v2',
  ATTENDANCE: 'syt_db_attendance_v2',
  HOMEWORKS: 'syt_db_homeworks_v2',
  ANNOUNCEMENTS: 'syt_db_announcements_v2',
  TOPICS: 'syt_db_topics_v2',
  AUDIT_LOGS: 'syt_db_audit_logs_v2',
  MATERIALS: 'syt_db_materials_v2',
  IMPORTANT_DATES: 'syt_db_dates_v2',
  TESTS: 'syt_db_tests_v2',
  TEST_RESULTS: 'syt_db_test_results_v2',
};

// Safe JSON loader
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('syt-storage-update', { detail: { key } }));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
}

export class CollegeDataService {
  // Current user / session
  static getCurrentUser(): UserAccount | null {
    return loadFromStorage<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: UserAccount | null): void {
    if (user) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
      this.logAudit(user.fullName, user.role, 'LOGIN', 'Auth', 'Tizimga muvaffaqiyatli kirildi');
    } else {
      const current = this.getCurrentUser();
      if (current) {
        this.logAudit(current.fullName, current.role, 'LOGOUT', 'Auth', 'Tizimdan chiqildi');
      }
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new CustomEvent('syt-storage-update', { detail: { key: STORAGE_KEYS.CURRENT_USER } }));
    }
  }

  // Settings
  static getSettings(): AppSettings {
    return loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static updateSettings(settings: AppSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    const user = this.getCurrentUser();
    this.logAudit(user?.fullName || 'Admin', user?.role || 'admin', 'SOZLAMALAR_YANGILANDI', 'Settings', 'Tizim sozlamalari yangilandi');
  }

  // Groups
  static getGroups(): Group[] {
    return loadFromStorage<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  }

  static saveGroup(group: Group): void {
    const user = this.getCurrentUser();
    // Qat'iy xavfsizlik cheklovi: Faqat administrator guruhlarni boshqara oladi
    if (user && user.role !== 'admin') {
      console.warn('XAVFSIZLIK CHEKLOVI: Faqat administrator yangi guruh yarata yoki o‘zgartira oladi');
      return;
    }
    if (!group.name || !group.name.trim()) {
      console.warn('XATO: Guruh nomi kiritilmagan');
      return;
    }

    const trimmedGroup: Group = {
      ...group,
      name: group.name.trim(),
      specialty: (group.specialty || '').trim() || 'Kompyuter tarmoqlari va IT',
      curatorName: (group.curatorName || '').trim() || 'Sinf kuratori hali tayinlanmagan',
    };

    const groups = this.getGroups();
    const idx = groups.findIndex(g => g.id === trimmedGroup.id);
    const existing = idx >= 0 ? groups[idx] : null;

    if (idx >= 0) {
      groups[idx] = trimmedGroup;
    } else {
      groups.push(trimmedGroup);
    }
    saveToStorage(STORAGE_KEYS.GROUPS, groups);

    if (existing && existing.curatorTeacherId !== trimmedGroup.curatorTeacherId) {
      this.logAudit(
        user?.fullName || 'Admin',
        user?.role || 'admin',
        'KURATOR_TAYINLANDI',
        'Groups',
        `"${trimmedGroup.name}" guruhiga ${trimmedGroup.curatorName} sinf kuratori etib tayinlandi`
      );
    } else {
      this.logAudit(
        user?.fullName || 'Admin',
        user?.role || 'admin',
        existing ? 'GURUH_YANGILANDI' : 'GURUH_YARATILDI',
        'Groups',
        `"${trimmedGroup.name}" guruhi muvaffaqiyatli saqlandi (Kurator: ${trimmedGroup.curatorName})`
      );
    }
  }

  static deleteGroup(groupId: string): void {
    const user = this.getCurrentUser();
    if (user && user.role !== 'admin') {
      console.warn('XAVFSIZLIK CHEKLOVI: Faqat administrator guruhni o‘chira oladi');
      return;
    }
    const groups = this.getGroups();
    const target = groups.find(g => g.id === groupId);
    const updated = groups.filter(g => g.id !== groupId);
    saveToStorage(STORAGE_KEYS.GROUPS, updated);
    this.logAudit(
      user?.fullName || 'Admin',
      user?.role || 'admin',
      'GURUH_OCHIRILDI',
      'Groups',
      `"${target?.name || groupId}" guruhi tizimdan butunlay o‘chirildi`
    );
  }

  // Teachers
  static getTeachers(): Teacher[] {
    return loadFromStorage<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  }

  static saveTeacher(teacher: Teacher): void {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex(t => t.id === teacher.id);
    if (idx >= 0) {
      teachers[idx] = teacher;
    } else {
      teachers.push(teacher);
    }
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers);
    const user = this.getCurrentUser();
    this.logAudit(user?.fullName || 'Admin', user?.role || 'admin', 'OQITUVCHI_SAQLANDI', 'Teachers', `${teacher.fullName} o'qituvchi saqlandi`);
  }

  static deleteTeacher(teacherId: string): void {
    const teachers = this.getTeachers().filter(t => t.id !== teacherId);
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers);
  }

  // Subjects
  static getSubjects(): Subject[] {
    return loadFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  static saveSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === subject.id);
    if (idx >= 0) {
      subjects[idx] = subject;
    } else {
      subjects.push(subject);
    }
    saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
  }

  static deleteSubject(subjectId: string): void {
    const subjects = this.getSubjects().filter(s => s.id !== subjectId);
    saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
  }

  // Students
  static getStudents(): Student[] {
    return loadFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  static saveStudent(student: Student): void {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      students[idx] = student;
    } else {
      students.push(student);
    }
    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    const user = this.getCurrentUser();
    this.logAudit(user?.fullName || 'Admin', user?.role || 'admin', 'TALABA_SAQLANDI', 'Students', `${student.fullName} talaba saqlandi`);
  }

  static deleteStudent(studentId: string): void {
    const students = this.getStudents().filter(s => s.id !== studentId);
    saveToStorage(STORAGE_KEYS.STUDENTS, students);
  }

  // User Accounts
  static getUsers(): UserAccount[] {
    return loadFromStorage<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USER_ACCOUNTS);
  }

  static saveUser(account: UserAccount): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === account.id);
    if (idx >= 0) {
      users[idx] = account;
    } else {
      users.push(account);
    }
    saveToStorage(STORAGE_KEYS.USERS, users);
    const user = this.getCurrentUser();
    this.logAudit(user?.fullName || 'Admin', user?.role || 'admin', 'FOYDALANUVCHI_SAQLANDI', 'Users', `${account.login} (${account.role}) hisobi saqlandi`);
  }

  static deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    saveToStorage(STORAGE_KEYS.USERS, users);
  }

  // Timetable
  static getTimetable(): TimetableLesson[] {
    return loadFromStorage<TimetableLesson[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  }

  static saveLesson(lesson: TimetableLesson): void {
    const list = this.getTimetable();
    const idx = list.findIndex(l => l.id === lesson.id);
    if (idx >= 0) {
      list[idx] = lesson;
    } else {
      list.push(lesson);
    }
    saveToStorage(STORAGE_KEYS.TIMETABLE, list);
    const user = this.getCurrentUser();
    this.logAudit(
      user?.fullName || 'Admin',
      user?.role || 'admin',
      'DARS_JADVALI_TAHRIRLANDI',
      'Timetable',
      `${lesson.groupName} - ${lesson.day} ${lesson.time} (${lesson.subjectName || 'Dars'})`
    );
  }

  static deleteLesson(lessonId: string): void {
    const list = this.getTimetable().filter(l => l.id !== lessonId);
    saveToStorage(STORAGE_KEYS.TIMETABLE, list);
  }

  // Grades
  static getGrades(): GradeRecord[] {
    return loadFromStorage<GradeRecord[]>(STORAGE_KEYS.GRADES, INITIAL_GRADES);
  }

  static saveGrade(grade: GradeRecord): void {
    const user = this.getCurrentUser();
    // Qat'iy cheklov: Admin o'quvchilarga baho qo'ya olmaydi va o'zgartira olmaydi
    if (user && user.role === 'admin') {
      console.warn('QAT’IY CHEKLOV: Administrator o‘quvchilarga baho qo‘ya olmaydi yoki o‘zgartira olmaydi.');
      return;
    }

    const list = this.getGrades();
    const idx = list.findIndex(g => g.id === grade.id);
    if (idx >= 0) {
      list[idx] = grade;
    } else {
      list.unshift(grade);
    }
    saveToStorage(STORAGE_KEYS.GRADES, list);
    this.recalculateStudentMetrics(grade.studentId);
    this.logAudit(
      user?.fullName || 'O\'qituvchi',
      user?.role || 'teacher',
      'BAHO_QO\'YILDI',
      'Grades',
      `${grade.studentName}: ${grade.subjectName} fani - ${grade.gradeValue} ball`
    );
  }

  static deleteGrade(gradeId: string): void {
    const user = this.getCurrentUser();
    if (user && user.role === 'admin') {
      console.warn('QAT’IY CHEKLOV: Administrator bahoni o‘chira olmaydi.');
      return;
    }

    const existing = this.getGrades().find(g => g.id === gradeId);
    const list = this.getGrades().filter(g => g.id !== gradeId);
    saveToStorage(STORAGE_KEYS.GRADES, list);
    if (existing) {
      this.recalculateStudentMetrics(existing.studentId);
    }
  }

  // Attendance
  static getAttendance(): AttendanceRecord[] {
    return loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  static saveAttendance(record: AttendanceRecord): void {
    const list = this.getAttendance();
    const idx = list.findIndex(a => a.id === record.id || (
      a.studentId === record.studentId &&
      a.date === record.date &&
      a.subjectId === record.subjectId &&
      a.pairNumber === record.pairNumber
    ));

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.unshift(record);
    }
    saveToStorage(STORAGE_KEYS.ATTENDANCE, list);
    this.recalculateStudentMetrics(record.studentId);
  }

  static batchSaveAttendance(records: AttendanceRecord[]): void {
    const list = this.getAttendance();
    records.forEach(rec => {
      const idx = list.findIndex(a => a.id === rec.id || (
        a.studentId === rec.studentId &&
        a.date === rec.date &&
        a.subjectId === rec.subjectId &&
        a.pairNumber === rec.pairNumber
      ));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...rec };
      } else {
        list.push(rec);
      }
    });
    saveToStorage(STORAGE_KEYS.ATTENDANCE, list);
    const studentIds = Array.from(new Set(records.map(r => r.studentId)));
    studentIds.forEach(id => this.recalculateStudentMetrics(id));
    const user = this.getCurrentUser();
    this.logAudit(
      user?.fullName || 'O\'qituvchi',
      user?.role || 'teacher',
      'DAVOMAT_BELGILANDI',
      'Attendance',
      `${records.length} ta o'quvchi uchun davomat saqlandi`
    );
  }

  // Recalculate average grade and attendance percentage for a student
  static recalculateStudentMetrics(studentId: string): void {
    const grades = this.getGrades().filter(g => g.studentId === studentId);
    const attendance = this.getAttendance().filter(a => a.studentId === studentId);
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === studentId);

    if (idx >= 0) {
      if (grades.length > 0) {
        const sum = grades.reduce((acc, curr) => acc + curr.gradeValue, 0);
        students[idx].averageGrade = Number((sum / grades.length).toFixed(1));
      }
      if (attendance.length > 0) {
        const presentCount = attendance.filter(a => a.status === 'Keldi').length;
        students[idx].attendancePercent = Math.round((presentCount / attendance.length) * 100);
      }
      saveToStorage(STORAGE_KEYS.STUDENTS, students);
    }
  }

  // Topics / Learning journal log
  static getTopics(): JournalLessonTopic[] {
    return loadFromStorage<JournalLessonTopic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
  }

  static saveTopic(topic: JournalLessonTopic): void {
    const list = this.getTopics();
    const idx = list.findIndex(t => t.id === topic.id);
    if (idx >= 0) {
      list[idx] = topic;
    } else {
      list.push(topic);
    }
    saveToStorage(STORAGE_KEYS.TOPICS, list);
  }

  // Homework
  static getHomeworks(): HomeworkItem[] {
    return loadFromStorage<HomeworkItem[]>(STORAGE_KEYS.HOMEWORKS, INITIAL_HOMEWORKS);
  }

  static saveHomework(hw: HomeworkItem): void {
    const list = this.getHomeworks();
    const idx = list.findIndex(h => h.id === hw.id);
    if (idx >= 0) {
      list[idx] = hw;
    } else {
      list.unshift(hw);
    }
    saveToStorage(STORAGE_KEYS.HOMEWORKS, list);
  }

  static deleteHomework(hwId: string): void {
    const list = this.getHomeworks().filter(h => h.id !== hwId);
    saveToStorage(STORAGE_KEYS.HOMEWORKS, list);
  }

  // Announcements
  static getAnnouncements(): AnnouncementItem[] {
    return loadFromStorage<AnnouncementItem[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  static saveAnnouncement(ann: AnnouncementItem): void {
    const list = this.getAnnouncements();
    const idx = list.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = ann;
    } else {
      list.unshift(ann);
    }
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
  }

  static deleteAnnouncement(annId: string): void {
    const list = this.getAnnouncements().filter(a => a.id !== annId);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
  }

  // Audit Logs
  static getAuditLogs(): AuditLogItem[] {
    return loadFromStorage<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static logAudit(userName: string, userRole: UserRole, action: string, entity: string, details: string): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogItem = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      userName,
      userRole,
      action,
      entity,
      details,
    };
    logs.unshift(newEntry);
    if (logs.length > 200) logs.pop();
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Study Materials / Textbooks
  static getMaterials(): GroupMaterial[] {
    return loadFromStorage<GroupMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  }

  static saveMaterial(material: GroupMaterial): void {
    const list = this.getMaterials();
    const idx = list.findIndex(m => m.id === material.id);
    if (idx >= 0) {
      list[idx] = material;
    } else {
      list.unshift(material);
    }
    saveToStorage(STORAGE_KEYS.MATERIALS, list);
    const user = this.getCurrentUser();
    this.logAudit(
      user?.fullName || 'O\'qituvchi',
      user?.role || 'teacher',
      'MATERIAL_YUKLANDI',
      'Materials',
      `${material.title} (${material.subjectName}) o‘quv materiali joylandi`
    );
  }

  static deleteMaterial(materialId: string): void {
    const list = this.getMaterials().filter(m => m.id !== materialId);
    saveToStorage(STORAGE_KEYS.MATERIALS, list);
  }

  // Important Dates & Calendar
  static getImportantDates(): ImportantDateItem[] {
    return loadFromStorage<ImportantDateItem[]>(STORAGE_KEYS.IMPORTANT_DATES, INITIAL_IMPORTANT_DATES);
  }

  static saveImportantDate(dateItem: ImportantDateItem): void {
    const list = this.getImportantDates();
    const idx = list.findIndex(d => d.id === dateItem.id);
    if (idx >= 0) {
      list[idx] = dateItem;
    } else {
      list.push(dateItem);
    }
    saveToStorage(STORAGE_KEYS.IMPORTANT_DATES, list);
    const user = this.getCurrentUser();
    this.logAudit(
      user?.fullName || 'Admin',
      user?.role || 'admin',
      'SANA_QO‘SHILDI',
      'Calendar',
      `${dateItem.title} (${dateItem.date}) muhim sana kiritildi`
    );
  }

  static deleteImportantDate(dateId: string): void {
    const list = this.getImportantDates().filter(d => d.id !== dateId);
    saveToStorage(STORAGE_KEYS.IMPORTANT_DATES, list);
  }

  // Tests & Examinations
  static getTests(): TestItem[] {
    return loadFromStorage<TestItem[]>(STORAGE_KEYS.TESTS, INITIAL_TESTS);
  }

  static saveTest(test: TestItem): void {
    const user = this.getCurrentUser();
    if (user && user.role === 'student') {
      console.warn('XAVFSIZLIK CHEKLOVI: O‘quvchi test yarata olmaydi');
      return;
    }
    const list = this.getTests();
    const idx = list.findIndex(t => t.id === test.id);
    if (idx >= 0) {
      list[idx] = test;
    } else {
      list.unshift(test);
    }
    saveToStorage(STORAGE_KEYS.TESTS, list);
    this.logAudit(
      user?.fullName || 'Admin',
      user?.role || 'admin',
      'TEST_SAQLANDI',
      'Tests',
      `"${test.title}" testi saqlandi (${test.groupName})`
    );
  }

  static deleteTest(testId: string): void {
    const user = this.getCurrentUser();
    if (user && user.role === 'student') {
      console.warn('XAVFSIZLIK CHEKLOVI: O‘quvchi testni o‘chira olmaydi');
      return;
    }
    const list = this.getTests().filter(t => t.id !== testId);
    saveToStorage(STORAGE_KEYS.TESTS, list);
  }

  static getTestResults(): TestResultItem[] {
    return loadFromStorage<TestResultItem[]>(STORAGE_KEYS.TEST_RESULTS, INITIAL_TEST_RESULTS);
  }

  static saveTestResult(result: TestResultItem): void {
    const list = this.getTestResults();
    const idx = list.findIndex(r => r.id === result.id);
    if (idx >= 0) {
      list[idx] = result;
    } else {
      list.unshift(result);
    }
    saveToStorage(STORAGE_KEYS.TEST_RESULTS, list);
    const user = this.getCurrentUser();
    this.logAudit(
      user?.fullName || result.studentName,
      user?.role || 'student',
      'TEST_TOPSHIRILDI',
      'Tests',
      `${result.studentName} test topshirdi: ${result.score}/${result.maxScore} ball`
    );
  }

  // Reset database back to default initial seed
  static resetToDefault(): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    saveToStorage(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    saveToStorage(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    saveToStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    saveToStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USER_ACCOUNTS);
    saveToStorage(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    saveToStorage(STORAGE_KEYS.GRADES, INITIAL_GRADES);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    saveToStorage(STORAGE_KEYS.HOMEWORKS, INITIAL_HOMEWORKS);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    saveToStorage(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    saveToStorage(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    saveToStorage(STORAGE_KEYS.IMPORTANT_DATES, INITIAL_IMPORTANT_DATES);
    saveToStorage(STORAGE_KEYS.TESTS, INITIAL_TESTS);
    saveToStorage(STORAGE_KEYS.TEST_RESULTS, INITIAL_TEST_RESULTS);
  }
}
