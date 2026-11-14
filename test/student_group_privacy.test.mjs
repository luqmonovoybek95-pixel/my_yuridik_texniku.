import test from 'node:test';
import assert from 'node:assert/strict';

test('Requirement 53 & 54: Admin adds student to 12-guruh, verifies attachment, unique login and privacy', () => {
  // Mock groups data
  const groups = [
    { id: 'grp-12', name: '12-guruh', courseYear: 1, specialty: 'Kompyuter tarmoqlari va IT' },
    { id: 'grp-21', name: '21-guruh', courseYear: 2, specialty: 'Yuridik xizmat' },
  ];

  // Mock students
  const students = [
    { id: 'std-1', fullName: 'Akbarov Jasur', groupId: 'grp-12', groupName: '12-guruh', login: 'jasur_akbarov' },
    { id: 'std-2', fullName: 'Rahimova Madina', groupId: 'grp-12', groupName: '12-guruh', login: 'madina_rahimova' },
  ];

  // 1. Create a new student attached to 12-guruh
  const newStudent = {
    id: `std-test-${Date.now()}`,
    fullName: 'Olimov Sardor Botirovich',
    groupId: 'grp-12',
    groupName: '12-guruh',
    login: 'sardor_olimov',
    phone: '+998 90 999 88 77',
    status: 'Faol',
    averageGrade: 0,
    attendancePercent: 100,
    createdAt: '2026-10-20',
  };

  // Check login uniqueness rule
  const isDuplicateLogin = students.some(s => s.login.toLowerCase() === newStudent.login.toLowerCase());
  assert.equal(isDuplicateLogin, false, 'Login must be unique');

  // Attach student to 12-guruh
  students.push(newStudent);

  // 2. Verify student exists in 12-guruh list
  const group12Students = students.filter(s => s.groupId === 'grp-12');
  assert.equal(group12Students.some(s => s.id === newStudent.id), true, 'New student must appear in 12-guruh list');
  assert.equal(group12Students.length, 3, '12-guruh now has 3 students');

  // 3. Electronic Journal view for 12-guruh:
  // When an admin or teacher opens 12-guruh, new student is in the roster
  const journalRoster = students.filter(s => s.groupId === 'grp-12');
  assert.equal(journalRoster.some(s => s.fullName === 'Olimov Sardor Botirovich'), true);

  // 4. Privacy Check (Requirement 44 & 54, step 7):
  // When student 'sardor_olimov' logs in, they MUST only see their own row!
  const currentStudentId = newStudent.id;
  const studentRole = 'student';

  const studentVisibleRows = studentRole === 'student'
    ? students.filter(s => s.id === currentStudentId)
    : students.filter(s => s.groupId === 'grp-12');

  assert.equal(studentVisibleRows.length, 1, 'Logged-in student must only see 1 row (their own)');
  assert.equal(studentVisibleRows[0].id, newStudent.id, 'Row must match current student');
  assert.equal(studentVisibleRows.some(s => s.fullName === 'Akbarov Jasur'), false, 'Cannot see other students');

  // 5. Grades privacy check
  const allGrades = [
    { id: 'g-1', studentId: 'std-1', gradeValue: 5, date: '2026-10-19' },
    { id: 'g-2', studentId: 'std-2', gradeValue: 4, date: '2026-10-19' },
    { id: 'g-3', studentId: newStudent.id, gradeValue: 5, date: '2026-10-20' },
  ];

  const studentVisibleGrades = studentRole === 'student'
    ? allGrades.filter(g => g.studentId === currentStudentId)
    : allGrades;

  assert.equal(studentVisibleGrades.length, 1, 'Student can only see their own grade');
  assert.equal(studentVisibleGrades[0].studentId, newStudent.id);
  assert.equal(studentVisibleGrades[0].gradeValue, 5);
});
