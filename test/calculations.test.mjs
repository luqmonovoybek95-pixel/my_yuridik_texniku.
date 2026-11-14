import { test } from 'node:test';
import assert from 'node:assert';

function calculateGPA(grades) {
  if (!grades || grades.length === 0) return 0;
  const sum = grades.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / grades.length).toFixed(1));
}

// Requirement 26 & 35: Davomat holatlari faqat: "Keldi", "Kelmadi", "Sababli". "Kechikdi" yo'q
function calculateAttendanceRate(records) {
  if (!records || records.length === 0) return 100;
  const present = records.filter(r => r === 'Keldi').length;
  return Math.round((present / records.length) * 100);
}

function checkTeacherClash(existingLessons, newLesson) {
  return existingLessons.some(
    l =>
      l.id !== newLesson.id &&
      l.day === newLesson.day &&
      l.pairNumber === newLesson.pairNumber &&
      (l.teacherName === newLesson.teacherName || l.splitSecondaryTeacher === newLesson.teacherName) &&
      l.groupId !== newLesson.groupId
  );
}

// Requirement 1, 2, 3: Group name validation & save logic
function validateGroupName(name, existingGroups) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Guruh nomi kiritilishi shart' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Guruh nomi kamida 2 ta belgidan iborat bo‘lishi lozim' };
  }
  const duplicate = existingGroups.some(g => g.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    return { valid: false, error: `"${trimmed}" nomli guruh allaqachon mavjud` };
  }
  return { valid: true, trimmedName: trimmed };
}

// Requirement 9: Admin role RBAC protection
function checkAdminPermission(userRole) {
  return userRole === 'admin';
}

// Requirement 29: Dars qo'shish majburiy maydonlarini tekshirish
function validateLesson(lesson) {
  if (!lesson.groupId) return { valid: false, error: 'Guruh tanlanmagan' };
  if (!lesson.day) return { valid: false, error: 'Hafta kuni tanlanmagan' };
  if (!lesson.pairNumber || !lesson.time) return { valid: false, error: 'Dars vaqti belgilanmagan' };
  if (!lesson.subjectName || !lesson.subjectName.trim()) return { valid: false, error: 'Fan nomi kiritilmagan' };
  if (!lesson.teacherName || !lesson.teacherName.trim()) return { valid: false, error: 'O‘qituvchi tanlanmagan' };
  if (!lesson.room || !lesson.room.trim()) return { valid: false, error: 'Xona raqami kiritilmagan' };
  return { valid: true };
}

// Requirement 30: Fayl turi va hajmini tekshirish
function validateMaterialFile(fileName, sizeBytes) {
  const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'png'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !allowed.includes(ext)) {
    return { valid: false, error: `Ruxsat etilmagan fayl formati: .${ext}` };
  }
  const maxSize = 25 * 1024 * 1024;
  if (sizeBytes > maxSize) {
    return { valid: false, error: 'Fayl hajmi 25 MB dan oshmasligi lozim' };
  }
  return { valid: true, ext };
}

// Requirement 31: Kurslar bo'yicha talabalar sonini hisoblash
function calculateCourseStats(students, groups) {
  const groupMap = new Map(groups.map(g => [g.id, g.courseYear]));
  let c1 = 0, c2 = 0, c3 = 0, c4 = 0;
  for (const s of students) {
    const course = groupMap.get(s.groupId) || 1;
    if (course === 1) c1++;
    else if (course === 2) c2++;
    else if (course === 3) c3++;
    else if (course === 4) c4++;
  }
  return { total: students.length, c1, c2, c3, c4 };
}

// Requirement 34 & 41: Admin baho kiritishi yoki o'zgartirishi taqiqlangan
function canUserModifyGrades(userRole) {
  return userRole === 'teacher';
}

test('calculateGPA correctly calculates average', () => {
  assert.strictEqual(calculateGPA([5, 5, 4, 4]), 4.5);
  assert.strictEqual(calculateGPA([5, 5, 5]), 5.0);
  assert.strictEqual(calculateGPA([]), 0);
});

test('calculateAttendanceRate counts present correctly without Kechikdi', () => {
  assert.strictEqual(calculateAttendanceRate(['Keldi', 'Keldi', 'Sababli', 'Kelmadi']), 50);
  assert.strictEqual(calculateAttendanceRate(['Keldi', 'Keldi']), 100);
  assert.strictEqual(calculateAttendanceRate([]), 100);
});

test('validateGroupName enforces non-empty, length and non-duplicate rules', () => {
  const groups = [{ id: '1', name: '12-guruh' }, { id: '2', name: '11-guruh' }];

  // Empty name
  assert.strictEqual(validateGroupName('', groups).valid, false);
  assert.strictEqual(validateGroupName('  ', groups).valid, false);

  // Too short
  assert.strictEqual(validateGroupName('1', groups).valid, false);

  // Duplicate name (case insensitive)
  assert.strictEqual(validateGroupName('12-guruh', groups).valid, false);
  assert.strictEqual(validateGroupName('12-GURUH', groups).valid, false);

  // Valid new name
  const valid = validateGroupName('13-guruh', groups);
  assert.strictEqual(valid.valid, true);
  assert.strictEqual(valid.trimmedName, '13-guruh');
});

test('validateLesson enforces all required timetable fields', () => {
  const validLesson = {
    groupId: 'grp-12',
    day: 'Dushanba',
    pairNumber: 1,
    time: '08:30-09:50',
    subjectName: 'Yurisprudensiya',
    teacherName: 'Asadov Ziyodulla',
    room: '104-xona',
  };
  assert.strictEqual(validateLesson(validLesson).valid, true);

  // Missing room
  assert.strictEqual(validateLesson({ ...validLesson, room: '' }).valid, false);
  // Missing subject
  assert.strictEqual(validateLesson({ ...validLesson, subjectName: '  ' }).valid, false);
  // Missing teacher
  assert.strictEqual(validateLesson({ ...validLesson, teacherName: '' }).valid, false);
});

test('validateMaterialFile enforces allowed extensions and 25MB limit', () => {
  assert.strictEqual(validateMaterialFile('darslik.pdf', 5 * 1024 * 1024).valid, true);
  assert.strictEqual(validateMaterialFile('maruza.docx', 2 * 1024 * 1024).valid, true);
  assert.strictEqual(validateMaterialFile('slayd.pptx', 10 * 1024 * 1024).valid, true);
  assert.strictEqual(validateMaterialFile('jadval.xlsx', 1 * 1024 * 1024).valid, true);
  assert.strictEqual(validateMaterialFile('sxema.png', 500 * 1024).valid, true);

  // Disallowed extensions (e.g. .exe, .sh)
  assert.strictEqual(validateMaterialFile('virus.exe', 1000).valid, false);
  assert.strictEqual(validateMaterialFile('script.sh', 1000).valid, false);

  // Oversized (> 25MB)
  assert.strictEqual(validateMaterialFile('big_book.pdf', 30 * 1024 * 1024).valid, false);
});

test('calculateCourseStats calculates distribution correctly across courses', () => {
  const groups = [
    { id: 'g1', courseYear: 1 },
    { id: 'g2', courseYear: 2 },
    { id: 'g3', courseYear: 3 },
  ];
  const students = [
    { id: 's1', groupId: 'g1' },
    { id: 's2', groupId: 'g1' },
    { id: 's3', groupId: 'g2' },
    { id: 's4', groupId: 'g3' },
  ];
  const stats = calculateCourseStats(students, groups);
  assert.strictEqual(stats.total, 4);
  assert.strictEqual(stats.c1, 2);
  assert.strictEqual(stats.c2, 1);
  assert.strictEqual(stats.c3, 1);
  assert.strictEqual(stats.c4, 0);
});

test('canUserModifyGrades strictly allows only teachers, blocks admin and student', () => {
  assert.strictEqual(canUserModifyGrades('teacher'), true);
  assert.strictEqual(canUserModifyGrades('admin'), false);
  assert.strictEqual(canUserModifyGrades('student'), false);
  assert.strictEqual(canUserModifyGrades(undefined), false);
});

test('checkTeacherClash catches simultaneous lessons for same teacher in different groups', () => {
  const existing = [
    {
      id: 'l-1',
      day: 'Dushanba',
      pairNumber: 1,
      teacherName: 'Qurbonaliyev Diyor',
      groupId: 'grp-12',
    },
  ];

  assert.strictEqual(
    checkTeacherClash(existing, {
      id: 'l-2',
      day: 'Dushanba',
      pairNumber: 1,
      teacherName: 'Qurbonaliyev Diyor',
      groupId: 'grp-21',
    }),
    true
  );

  assert.strictEqual(
    checkTeacherClash(existing, {
      id: 'l-3',
      day: 'Dushanba',
      pairNumber: 2,
      teacherName: 'Qurbonaliyev Diyor',
      groupId: 'grp-21',
    }),
    false
  );
});
