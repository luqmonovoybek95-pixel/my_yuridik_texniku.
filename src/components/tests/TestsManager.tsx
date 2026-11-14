import React, { useState, useMemo, useEffect } from 'react';
import {
  TestItem,
  TestQuestion,
  TestResultItem,
  Subject,
  Group,
  UserRole,
  UserAccount,
  ShowToastFn,
} from '../../types';
import { CollegeDataService } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  FileQuestion,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  Edit2,
  Trash2,
  Search,
  Users,
  Layers,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface TestsManagerProps {
  role: UserRole;
  currentUser: UserAccount;
  onShowToast: ShowToastFn;
}

export const TestsManager: React.FC<TestsManagerProps> = ({
  role,
  currentUser,
  onShowToast,
}) => {
  const [tests, setTests] = useState<TestItem[]>(() => CollegeDataService.getTests());
  const [testResults, setTestResults] = useState<TestResultItem[]>(() =>
    CollegeDataService.getTestResults()
  );
  const [subjects, setSubjects] = useState<Subject[]>(() => CollegeDataService.getSubjects());
  const [groups, setGroups] = useState<Group[]>(() => CollegeDataService.getGroups());

  // Listen for storage events (e.g. When a new group is saved, groups list automatically updates)
  useEffect(() => {
    const handleUpdate = () => {
      setTests(CollegeDataService.getTests());
      setTestResults(CollegeDataService.getTestResults());
      setGroups(CollegeDataService.getGroups());
      setSubjects(CollegeDataService.getSubjects());
    };
    window.addEventListener('syt-storage-update', handleUpdate);
    return () => window.removeEventListener('syt-storage-update', handleUpdate);
  }, []);

  // Filter states
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formGroupId, setFormGroupId] = useState('');
  const [formDuration, setFormDuration] = useState(30);
  const [formMaxScore, setFormMaxScore] = useState(5);
  const [formPassingScore, setFormPassingScore] = useState(3);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [formStatus, setFormStatus] = useState<'Faol' | 'Rejalashtirilgan' | 'Yakunlangan'>('Faol');

  // Questions within the test
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  // Interactive Test Taking (for students or preview)
  const [activeTakingTest, setActiveTakingTest] = useState<TestItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [testCompletedResult, setTestCompletedResult] = useState<TestResultItem | null>(null);

  // Results inspection modal
  const [inspectingTestResults, setInspectingTestResults] = useState<TestItem | null>(null);

  const openAddModal = () => {
    setEditingTest(null);
    setFormTitle('');
    setFormSubjectId(subjects[0]?.id || '');
    setFormGroupId(groups[0]?.id || '');
    setFormDuration(30);
    setFormMaxScore(5);
    setFormPassingScore(3);
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setFormStatus('Faol');
    setQuestions([
      {
        id: `q-${Date.now()}-1`,
        questionText: '1-savol matnini kiriting...',
        options: ['A varianti', 'B varianti', 'C varianti', 'D varianti'],
        correctOptionIndex: 0,
      },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (test: TestItem) => {
    setEditingTest(test);
    setFormTitle(test.title);
    setFormSubjectId(test.subjectId);
    setFormGroupId(test.groupId);
    setFormDuration(test.durationMinutes);
    setFormMaxScore(test.maxScore);
    setFormPassingScore(test.passingScore);
    setFormStartDate(test.startDate);
    setFormEndDate(test.endDate);
    setFormStatus(test.status);
    setQuestions([...test.questions]);
    setIsModalOpen(true);
  };

  const handleAddQuestionToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptionA.trim() || !newOptionB.trim()) {
      onShowToast('Savol matni va kamida 2 ta variant to‘ldirilishi shart', 'error');
      return;
    }

    const q: TestQuestion = {
      id: `q-${Date.now()}`,
      questionText: newQuestionText.trim(),
      options: [
        newOptionA.trim(),
        newOptionB.trim(),
        newOptionC.trim() || 'Javob berilmagan',
        newOptionD.trim() || 'Barcha javoblar to‘g‘ri',
      ],
      correctOptionIndex: newCorrectIndex,
    };

    setQuestions([...questions, q]);
    setNewQuestionText('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewCorrectIndex(0);
    onShowToast('Savol testga qo‘shildi', 'success');
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'student') return;

    if (!formTitle.trim()) {
      onShowToast('Test sarlavhasi kiritilishi shart', 'error');
      return;
    }

    const selectedSubj = subjects.find((s) => s.id === formSubjectId) || subjects[0];
    const selectedGrp = groups.find((g) => g.id === formGroupId) || groups[0];

    if (!selectedGrp) {
      onShowToast('Guruh tanlanmagan. Avval guruh yarating.', 'error');
      return;
    }

    if (questions.length === 0) {
      onShowToast('Testda kamida 1 ta savol bo‘lishi lozim', 'error');
      return;
    }

    const testItem: TestItem = {
      id: editingTest ? editingTest.id : `tst-${Date.now()}`,
      title: formTitle.trim(),
      subjectId: selectedSubj?.id || 'subj-1',
      subjectName: selectedSubj?.name || 'Fan',
      groupId: selectedGrp.id,
      groupName: selectedGrp.name,
      durationMinutes: Number(formDuration) || 30,
      maxScore: Number(formMaxScore) || 5,
      passingScore: Number(formPassingScore) || 3,
      startDate: formStartDate,
      endDate: formEndDate,
      status: formStatus,
      questions,
      createdAt: editingTest ? editingTest.createdAt : new Date().toISOString().slice(0, 10),
    };

    CollegeDataService.saveTest(testItem);
    setTests(CollegeDataService.getTests());
    setIsModalOpen(false);
    onShowToast(`"${testItem.title}" testi muvaffaqiyatli saqlandi!`, 'success');
  };

  const handleDeleteTest = (test: TestItem) => {
    if (role === 'student') return;
    if (window.confirm(`Haqiqatan ham "${test.title}" testini o‘chirmoqchimisiz?`)) {
      CollegeDataService.deleteTest(test.id);
      setTests(CollegeDataService.getTests());
      onShowToast('Test o‘chirildi', 'info');
    }
  };

  // Student Test Submission
  const startTestTaking = (test: TestItem) => {
    setActiveTakingTest(test);
    setUserAnswers({});
    setTestCompletedResult(null);
  };

  const submitTestAnswers = () => {
    if (!activeTakingTest) return;

    let correctCount = 0;
    activeTakingTest.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const totalQuestions = activeTakingTest.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const calculatedScore = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * activeTakingTest.maxScore * 10) / 10
      : 0;

    const result: TestResultItem = {
      id: `res-${Date.now()}`,
      testId: activeTakingTest.id,
      studentId: currentUser.linkedEntityId || currentUser.id,
      studentName: currentUser.fullName,
      groupId: activeTakingTest.groupId,
      score: calculatedScore,
      maxScore: activeTakingTest.maxScore,
      percentage,
      passed: calculatedScore >= activeTakingTest.passingScore,
      completedAt: new Date().toISOString(),
    };

    CollegeDataService.saveTestResult(result);
    setTestResults(CollegeDataService.getTestResults());
    setTestCompletedResult(result);
    onShowToast(`Test yakunlandi! Natijangiz: ${calculatedScore} ball (${percentage}%)`, 'success');
  };

  // Filtered tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (filterGroup !== 'all' && t.groupId !== filterGroup) return false;
      if (filterSubject !== 'all' && t.subjectId !== filterSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.subjectName.toLowerCase().includes(q) ||
          t.groupName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tests, filterGroup, filterSubject, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-7 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Testlar va Imtihonlar Markazi (HEMIS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Nazorat Sinovlari va Test Boshqaruvi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Guruhlar va fanlar bo‘yicha oraliq hamda yakuniy testlarni tuzish, o‘tkazish va natijalarni nazorat qilish.
          </p>
        </div>

        {role !== 'student' && (
          <button
            onClick={openAddModal}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi test tuzish</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Jami testlar</span>
            <FileQuestion className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{tests.length} ta</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Barcha fanlar bo‘yicha</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Faol testlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {tests.filter((t) => t.status === 'Faol').length} ta
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Topshirishga ochiq</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Topshirilgan</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{testResults.length} marta</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Talabalar natijalari</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">O‘rtacha o‘tish</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {testResults.length > 0
              ? Math.round(
                  (testResults.filter((r) => r.passed).length / testResults.length) * 100
                )
              : 100}
            %
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Muvaffaqiyat ko‘rsatkichi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test yoki fan nomi bo‘yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="all">Barcha fanlar</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Ko‘rsatilmoqda: <span className="text-blue-900 font-black">{filteredTests.length} ta test</span>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => {
          const resultsForThisTest = testResults.filter((r) => r.testId === test.id);
          const hasTaken = resultsForThisTest.some(
            (r) => r.studentId === currentUser.linkedEntityId || r.studentName === currentUser.fullName
          );
          const studentResult = resultsForThisTest.find(
            (r) => r.studentId === currentUser.linkedEntityId || r.studentName === currentUser.fullName
          );

          return (
            <div
              key={test.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      test.status === 'Faol'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : test.status === 'Rejalashtirilgan'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {test.status}
                  </span>

                  {role !== 'student' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(test)}
                        title="Testni tahrirlash"
                        className="p-1 rounded text-slate-400 hover:text-blue-900 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test)}
                        title="Testni o‘chirish"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                  {test.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Fan:</span>
                    </span>
                    <span className="font-bold text-slate-900">{test.subjectName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Guruh:</span>
                    </span>
                    <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {test.groupName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Vaqt / Savollar:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {test.durationMinutes} daq · {test.questions.length} ta savol
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Maksimal ball:</span>
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      {test.maxScore} ball (O‘tish: {test.passingScore})
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Result */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {role === 'student' ? (
                  hasTaken && studentResult ? (
                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Topshirildi: {studentResult.score} / {studentResult.maxScore} ball
                      </span>
                      <button
                        onClick={() => startTestTaking(test)}
                        className="text-xs font-bold text-blue-900 hover:underline"
                      >
                        Qayta ko‘rish
                      </button>
                    </div>
                  ) : test.status === 'Faol' ? (
                    <button
                      onClick={() => startTestTaking(test)}
                      className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Testni boshlash</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Hozircha faol emas</span>
                  )
                ) : (
                  <div className="w-full flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInspectingTestResults(test)}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Natijalar ({resultsForThisTest.length})
                    </button>
                    <button
                      onClick={() => startTestTaking(test)}
                      className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Ko‘rish
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredTests.length === 0 && (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
            <FileQuestion className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Testlar topilmadi</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ushbu filtr bo‘yicha testlar kiritilmagan. Yuqoridagi «Yangi test tuzish» tugmasi orqali test qo‘shishingiz mumkin.
            </p>
          </div>
        )}
      </div>

      {/* TEST YARATISH / TAHRIRLASH MODALI */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTest ? `"${editingTest.title}" testini tahrirlash` : 'Yangi test tuzish'}
        >
          <form onSubmit={handleSaveTest} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Test sarlavhasi <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Masalan: Axborot texnologiyalari — 1-Oraliq nazorat testi"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fan
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guruh
                </label>
                <select
                  value={formGroupId}
                  onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vaqti (daq)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Max ball
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  O‘tish bali
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formPassingScore}
                  onChange={(e) => setFormPassingScore(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Boshlanish sanasi
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tugash sanasi
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Test Savollari Ro‘yxati */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">
                  Test savollari ({questions.length} ta)
                </span>
                <span className="text-[10px] text-slate-500">To‘g‘ri javobni tanlang</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {qIdx + 1}. {q.questionText}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pl-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={optIdx === q.correctOptionIndex ? 'font-bold text-emerald-700' : ''}
                        >
                          {['A', 'B', 'C', 'D'][optIdx]}) {opt} {optIdx === q.correctOptionIndex && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Yangi savol qo‘shish formasi */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">
                  + Yangi savol qo‘shish:
                </span>
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Savol matnini kiriting..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    placeholder="A varianti"
                    className="p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    placeholder="B varianti"
                    className="p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    placeholder="C varianti"
                    className="p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={newOptionD}
                    onChange={(e) => setNewOptionD(e.target.value)}
                    placeholder="D varianti"
                    className="p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">To‘g‘ri javob:</span>
                    <select
                      value={newCorrectIndex}
                      onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                      className="p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                    >
                      <option value={0}>A varianti</option>
                      <option value={1}>B varianti</option>
                      <option value={2}>C varianti</option>
                      <option value={3}>D varianti</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestionToForm}
                    className="py-1 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Savolni qo‘shish
                  </button>
                </div>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Testni saqlash</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* INTERFAOL TEST TOPSHIRISH OYNASI */}
      {activeTakingTest && (
        <Modal
          isOpen={!!activeTakingTest}
          onClose={() => setActiveTakingTest(null)}
          title={`Test: ${activeTakingTest.title}`}
        >
          <div className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {testCompletedResult ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {testCompletedResult.passed ? 'Tabriklaymiz, testdan o‘tdingiz!' : 'Sinov yakunlandi'}
                </h3>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">To‘plangan ball</span>
                    <span className="text-xl font-black text-slate-900">
                      {testCompletedResult.score} / {testCompletedResult.maxScore}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Foiz</span>
                    <span className="text-xl font-black text-blue-900">
                      {testCompletedResult.percentage}%
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Holat</span>
                    <span
                      className={`text-sm font-black ${
                        testCompletedResult.passed ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {testCompletedResult.passed ? 'O‘tdi' : 'Qayta topshirish'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTakingTest(null)}
                  className="py-2.5 px-6 bg-blue-900 text-white font-bold rounded-xl"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-slate-600">
                  <span>Fan: <b className="text-slate-900">{activeTakingTest.subjectName}</b></span>
                  <span>Vaqt: <b className="text-blue-900">{activeTakingTest.durationMinutes} daqiqa</b></span>
                </div>

                <div className="space-y-4">
                  {activeTakingTest.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {idx + 1}-savol: {q.questionText}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              userAnswers[idx] === optIdx
                                ? 'bg-blue-50 border-blue-600 font-bold text-blue-950'
                                : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${idx}`}
                              checked={userAnswers[idx] === optIdx}
                              onChange={() => setUserAnswers({ ...userAnswers, [idx]: optIdx })}
                              className="w-3.5 h-3.5 text-blue-900"
                            />
                            <span>
                              <b>{['A', 'B', 'C', 'D'][optIdx]})</b> {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Javob berildi: {Object.keys(userAnswers).length} / {activeTakingTest.questions.length} ta
                  </span>
                  <button
                    type="button"
                    onClick={submitTestAnswers}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Testni yakunlash va baholash
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* NATIJALARNI KO‘RISH MODALI (Admin / O‘qituvchi uchun) */}
      {inspectingTestResults && (
        <Modal
          isOpen={!!inspectingTestResults}
          onClose={() => setInspectingTestResults(null)}
          title={`"${inspectingTestResults.title}" natijalari`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-700">
                Guruh: {inspectingTestResults.groupName} · Fan: {inspectingTestResults.subjectName}
              </span>
              <span className="font-bold text-blue-900">
                Jami topshirganlar:{' '}
                {testResults.filter((r) => r.testId === inspectingTestResults.id).length} nafar
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.filter((r) => r.testId === inspectingTestResults.id).length > 0 ? (
                testResults
                  .filter((r) => r.testId === inspectingTestResults.id)
                  .map((res) => (
                    <div
                      key={res.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900">{res.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          Topshirdi: {res.completedAt.slice(0, 16).replace('T', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900">
                          {res.score} / {res.maxScore} ball ({res.percentage}%)
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            res.passed ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {res.passed ? '✓ O‘tgan' : '✗ Yiqilgan'}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  Hozircha ushbu test bo‘yicha talabalar natijasi mavjud emas.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingTestResults(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"
              >
                Yopish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
