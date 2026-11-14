export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserAccount {
  id: string;
  login: string;
  passwordHash: string; // Plain/hashed for demo & auth verification
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  linkedEntityId?: string; // studentId or teacherId
  createdAt: string;
  lastLogin?: string;
}

export interface Student {
  id: string;
  fullName: string;
  groupId: string;
  groupName: string;
  login: string;
  phone: string;
  email?: string;
  birthDate?: string;
  address?: string;
  status: 'Faol' | 'Akademik ta\'til' | 'Chetlashtirilgan';
  averageGrade: number;
  attendancePercent: number;
  notes?: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  login: string;
  phone: string;
  email?: string;
  degree?: string; // Mutaxassis, Katta o'qituvchi, etc.
  subjectIds: string[];
  subjectNames: string[];
  groupIds: string[];
  groupNames: string[];
  status: 'Faol' | 'Mehnat ta\'tilida' | 'Nofaol';
  createdAt: string;
}

export interface Group {
  id: string;
  name: string; // e.g. "12-guruh"
  specialty: string; // e.g. "Kompyuter tarmoqlari va IT" or "Yuridik xizmat"
  courseYear: number; // 1, 2, 3
  curatorTeacherId?: string;
  curatorName: string; // Sinf kuratori / Guruh rahbari
  curatorPhone?: string;
  curatorEmail?: string;
  curatorRoom?: string;
  academicYear: string; // "2026-2027"
  semester: number; // 1 or 2
  studentCount: number;
}

export interface Subject {
  id: string;
  code?: string;
  name: string;
  teacherIds: string[];
  teacherNames: string[];
  groupIds: string[];
  weeklyHours: number;
  totalHours: number;
  gradingSystem: '5_ball' | '100_ball';
  status: 'Faol' | 'Nofaol';
}

export type Weekday = 'Dushanba' | 'Seshanba' | 'Chorshanba' | 'Payshanba' | 'Juma' | 'Shanba' | 'Yakshanba';

export interface LessonSlot {
  pairNumber: number; // 1, 2, 3, 4
  pairRoman: string; // "I", "II", "III", "IV"
  startTime: string; // "08:30"
  endTime: string; // "09:50"
  timeLabel: string; // "08:30-09:50"
}

export type SlotColorType = 'white' | 'red' | 'green' | 'amber' | 'blue' | 'purple';

export interface TimetableLesson {
  id: string;
  groupId: string;
  groupName: string;
  academicYear: string;
  semester: number;
  day: Weekday;
  pairNumber: number; // 1, 2, 3, 4
  pairRoman: string; // "I", "II", "III", "IV"
  time: string; // "08:30-09:50"
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  colorType?: SlotColorType;
  colorNote?: string;
  // For split pairs (like in the photo: Fizika va astranomiya / Axborot texnalogiyalari):
  isSplit?: boolean;
  splitSecondarySubject?: string;
  splitSecondaryTeacher?: string;
  splitSecondaryRoom?: string;
  splitSecondaryColorType?: SlotColorType;
}

export type AttendanceStatus = 'Keldi' | 'Kelmadi' | 'Sababli';

export interface AttendanceRecord {
  id: string;
  lessonId?: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  pairNumber: number;
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
}

export interface GradeRecord {
  id: string;
  lessonId?: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  gradeValue: number; // 2, 3, 4, 5
  type: 'Joriy' | 'Oraliq' | 'Yakuniy' | 'Amaliy' | 'Mustaqil ish';
  note?: string;
  updatedAt: string;
}

export interface JournalLessonTopic {
  id: string;
  groupId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  pairNumber: number;
  topic: string;
  homework?: string;
  deadline?: string;
  resourcesUrl?: string;
}

export interface HomeworkItem {
  id: string;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dateAssigned: string;
  dueDate: string;
  topic: string;
  description: string;
  fileAttachment?: string;
  status: 'Faol' | 'Muddati o\'tgan';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  authorName: string;
  targetRole: 'All' | 'Teacher' | 'Student';
  targetGroupId?: string;
  date: string;
  priority: 'Oddiy' | 'Muhim' | 'Shoshilinch';
}

export interface GroupMaterial {
  id: string;
  groupId: string;
  groupName?: string;
  courseYear?: number;
  title: string;
  subjectName: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'jpg' | 'png' | 'link';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileData?: string; // Base64 data URL for downloaded / previewed files
  author: string;
  uploadDate: string;
  description?: string;
}

export interface ImportantDateItem {
  id: string;
  groupId?: string; // all or specific group
  title: string;
  date: string;
  type: 'imtihon' | 'oraliq' | 'topshiriq' | 'dam_olish' | 'tadbir';
  description?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  details: string;
}

export interface TestQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface TestItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  durationMinutes: number;
  maxScore: number;
  passingScore: number;
  startDate: string;
  endDate: string;
  status: 'Rejalashtirilgan' | 'Faol' | 'Yakunlangan';
  questions: TestQuestion[];
  createdAt: string;
}

export interface TestResultItem {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

export interface AppSettings {
  collegeName: string;
  departmentName: string;
  academicYear: string;
  currentSemester: number;
  lessonSlots: LessonSlot[];
  colorMeanings: {
    red: string;
    green: string;
    amber: string;
    white: string;
  };
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  useFirebaseBackend: boolean;
}

export type ToastType = 'success' | 'error' | 'info';
export type ShowToastFn = (msg: string, type?: ToastType) => void;
