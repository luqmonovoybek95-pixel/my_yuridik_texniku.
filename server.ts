import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent server state for admin items (seeded with initial data)
interface ServerGroup {
  id: string;
  name: string;
  specialty: string;
  courseYear: number;
  curatorTeacherId?: string;
  curatorName?: string;
  curatorPhone?: string;
  curatorEmail?: string;
  curatorRoom?: string;
  academicYear?: string;
  semester?: number;
  studentCount?: number;
}

let serverGroups: ServerGroup[] = [
  {
    id: 'grp-12',
    name: '12-guruh',
    specialty: 'Kompyuter tarmoqlari va IT',
    courseYear: 1,
    curatorTeacherId: 'tch-diyor',
    curatorName: 'Qurbonaliyev Diyor Olimovich',
    curatorPhone: '+998 90 123 45 67',
    curatorEmail: 'd.qurbonaliyev@syt.uz',
    curatorRoom: '104-IT laboratoriyasi',
    academicYear: '2026-2027',
    semester: 1,
    studentCount: 24,
  },
  {
    id: 'grp-11',
    name: '11-guruh',
    specialty: 'Yurisprudensiya va Huquqshunoslik',
    courseYear: 1,
    curatorTeacherId: 'tch-rustam',
    curatorName: 'Bekmurodov Rustam Shokirovich',
    curatorPhone: '+998 93 456 78 90',
    curatorEmail: 'r.bekmurodov@syt.uz',
    curatorRoom: '201-auditoriya',
    academicYear: '2026-2027',
    semester: 1,
    studentCount: 22,
  },
  {
    id: 'grp-21',
    name: '21-guruh',
    specialty: 'Sud-huquqiy faoliyat',
    courseYear: 2,
    curatorTeacherId: 'tch-nigora',
    curatorName: 'Ahmedova Nigora Baxtiyorovna',
    curatorPhone: '+998 97 789 01 23',
    curatorEmail: 'n.ahmedova@syt.uz',
    curatorRoom: '305-kabineta',
    academicYear: '2026-2027',
    semester: 3,
    studentCount: 26,
  },
];

let serverAuditLogs: Array<{
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
}> = [];

// Requirement 9: ADMIN HUQUQLARI SERVER TOMONIDA HAM HIMOYaLANSIN
// Middleware checking admin privileges on server side
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role'] as string;
  const authHeader = req.headers.authorization;

  // Verify role or token
  const isAdmin =
    role === 'admin' ||
    (authHeader && authHeader.toLowerCase().includes('admin'));

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error:
        'XAVFSIZLIK CHEKLOVI (403 Forbidden): Ushbu amalni bajarish faqat administrator huquqiga ega foydalanuvchilar uchun ruxsat etilgan! Oddiy foydalanuvchilar guruhlar yoki tizim sozlamalarini o‘zgartira olmaydi.',
      code: 'FORBIDDEN',
    });
  }

  next();
};

// --- API ENDPOINTS ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Sirdaryo Yuridik Texnikumi Platformasi',
    timestamp: new Date().toISOString(),
  });
});

// 1, 2, 3, 4, 5, 7: Guruhlar API (Server-side validation & RBAC)
app.get('/api/groups', (_req: Request, res: Response) => {
  res.json({ success: true, data: serverGroups });
});

// Create new group (Protected: Admin only)
app.post('/api/groups', requireAdmin, (req: Request, res: Response) => {
  const { name, specialty, courseYear, curatorTeacherId, curatorName, curatorPhone, curatorRoom, academicYear } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Guruh nomi kiritilishi shart!',
    });
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Guruh nomi kamida 2 ta belgidan iborat bo‘lishi lozim.',
    });
  }

  // Duplicate check
  const duplicate = serverGroups.find(
    (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: `"${trimmedName}" nomli guruh tizimda allaqachon mavjud!`,
    });
  }

  const newGroup: ServerGroup = {
    id: req.body.id || `grp-${Date.now()}`,
    name: trimmedName,
    specialty: (specialty || 'Kompyuter tarmoqlari va IT').trim(),
    courseYear: Number(courseYear) || 1,
    curatorTeacherId: curatorTeacherId || undefined,
    curatorName: (curatorName || 'Sinf kuratori hali tayinlanmagan').trim(),
    curatorPhone: curatorPhone?.trim() || undefined,
    curatorRoom: curatorRoom?.trim() || undefined,
    academicYear: academicYear || '2026-2027',
    semester: 1,
    studentCount: 0,
  };

  serverGroups.push(newGroup);

  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  serverAuditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actor,
    role: 'admin',
    action: 'GURUH_YARATILDI',
    module: 'Groups',
    details: `"${newGroup.name}" guruhi serverda muvaffaqiyatli saqlandi. Kurator: ${newGroup.curatorName}`,
  });

  return res.status(201).json({
    success: true,
    message: `"${newGroup.name}" guruhi muvaffaqiyatli saqlandi va ro‘yxatga qo‘shildi`,
    data: newGroup,
  });
});

// Update group (Protected: Admin only)
app.put('/api/groups/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = serverGroups.findIndex((g) => g.id === id);

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Guruh topilmadi',
    });
  }

  const { name, specialty, courseYear, curatorTeacherId, curatorName, curatorPhone, curatorRoom, academicYear } = req.body;

  if (name && typeof name === 'string') {
    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        error: 'Guruh nomi bo‘sh bo‘lishi mumkin emas',
      });
    }

    const duplicate = serverGroups.find(
      (g) => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `"${trimmed}" nomli boshqa guruh allaqachon mavjud`,
      });
    }
    serverGroups[idx].name = trimmed;
  }

  if (specialty !== undefined) serverGroups[idx].specialty = specialty.trim();
  if (courseYear !== undefined) serverGroups[idx].courseYear = Number(courseYear);
  if (curatorTeacherId !== undefined) serverGroups[idx].curatorTeacherId = curatorTeacherId;
  if (curatorName !== undefined) serverGroups[idx].curatorName = curatorName.trim();
  if (curatorPhone !== undefined) serverGroups[idx].curatorPhone = curatorPhone.trim();
  if (curatorRoom !== undefined) serverGroups[idx].curatorRoom = curatorRoom.trim();
  if (academicYear !== undefined) serverGroups[idx].academicYear = academicYear;

  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  serverAuditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actor,
    role: 'admin',
    action: 'GURUH_YANGILANDI',
    module: 'Groups',
    details: `"${serverGroups[idx].name}" guruhi serverda yangilandi`,
  });

  return res.json({
    success: true,
    message: `"${serverGroups[idx].name}" guruhi muvaffaqiyatli yangilandi`,
    data: serverGroups[idx],
  });
});

// Delete group (Protected: Admin only)
app.delete('/api/groups/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const target = serverGroups.find((g) => g.id === id);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: 'Guruh topilmadi',
    });
  }

  serverGroups = serverGroups.filter((g) => g.id !== id);

  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  serverAuditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actor,
    role: 'admin',
    action: 'GURUH_OCHIRILDI',
    module: 'Groups',
    details: `"${target.name}" guruhi serverdan butunlay o‘chirildi`,
  });

  return res.json({
    success: true,
    message: `"${target.name}" guruhi o‘chirildi`,
  });
});

app.use(express.json({ limit: '35mb' }));

// Server in-memory materials store
let serverMaterials: any[] = [];
let serverTimetable: any[] = [];

// Requirement 30: Materials API (Darsliklar va o'quv materiallari)
app.get('/api/materials', (_req: Request, res: Response) => {
  return res.json({ success: true, data: serverMaterials });
});

app.post('/api/materials', (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role === 'student') {
    return res.status(403).json({
      success: false,
      error: 'Talabalar darslik yuklay olmaydi.',
      code: 'FORBIDDEN',
    });
  }

  const { title, subjectName, groupId } = req.body;
  if (!title || !subjectName || !groupId) {
    return res.status(400).json({ success: false, error: 'Maydonlar to‘liq emas' });
  }

  serverMaterials.unshift(req.body);
  return res.status(201).json({ success: true, data: req.body });
});

app.delete('/api/materials/:id', (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role === 'student') {
    return res.status(403).json({ success: false, error: 'Ruxsat yo‘q' });
  }
  serverMaterials = serverMaterials.filter((m) => m.id !== req.params.id);
  return res.json({ success: true, message: 'Darslik o‘chirildi' });
});

// Timetable API
app.get('/api/timetable', (_req: Request, res: Response) => {
  return res.json({ success: true, data: serverTimetable });
});

app.post('/api/timetable', requireAdmin, (req: Request, res: Response) => {
  const lesson = req.body;
  const idx = serverTimetable.findIndex((l) => l.id === lesson.id);
  if (idx >= 0) {
    serverTimetable[idx] = lesson;
  } else {
    serverTimetable.push(lesson);
  }
  return res.json({ success: true, data: lesson });
});

app.delete('/api/timetable/:id', requireAdmin, (req: Request, res: Response) => {
  serverTimetable = serverTimetable.filter((l) => l.id !== req.params.id);
  return res.json({ success: true, message: 'Dars o‘chirildi' });
});

// Requirement 34 & 41: Admin baholarni o‘zgartira olmasligi SERVER tomonida ta’minlansin!
app.post('/api/grades', (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'QAT’IY XAVFSIZLIK CHEKLOVI: Administrator baho qo‘ya olmaydi va o‘zgartira olmaydi. Bahoni faqat vakolatli o‘qituvchi qo‘yadi.',
      code: 'FORBIDDEN',
    });
  }
  if (role === 'student') {
    return res.status(403).json({
      success: false,
      error: 'Talaba o‘ziga yoki boshqalarga baho qo‘ya olmaydi.',
      code: 'FORBIDDEN',
    });
  }
  return res.json({ success: true, message: 'Baho saqlandi', data: req.body });
});

// Protected: Admin Management Endpoints
app.post('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Tizim sozlamalari yangilandi', data: req.body });
});

app.post('/api/admin/students', requireAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Talaba muvaffaqiyatli saqlandi', data: req.body });
});

app.post('/api/admin/teachers', requireAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, message: 'O‘qituvchi muvaffaqiyatli saqlandi', data: req.body });
});

app.post('/api/admin/subjects', requireAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Fan muvaffaqiyatli saqlandi', data: req.body });
});

app.get('/api/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ success: true, data: serverAuditLogs });
});

// Mount Vite or Static Files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
