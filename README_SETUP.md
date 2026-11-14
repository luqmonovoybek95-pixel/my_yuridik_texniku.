# SIRDARYO YURIDIK TEXNIKUMI — ELEKTRON TA’LIM VA HEMIS TIZIMI

Ushbu platforma O‘zbekiston Respublikasi Adliya vazirligi tizimidagi **Sirdaryo yuridik texnikumi** uchun ta’lim jarayonini avtomatlashtirish, dars jadvali, elektron jurnal, baholash va davomat nazoratini yuritish maqsadida yaratilgan professional tizimdir.

---

## 1. Tizimga kirish va hisoblar (Demo va real hisoblar)

Sayt ochilganda birinchi bo‘lib login sahifasi ko‘rinadi. Rolni tanlab, quyidagi hisoblar bilan tizimga kirishingiz mumkin:

| Rol | Login | Parol | F.I.SH | Imkoniyatlar |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Sirdaryo YT Ma'muriyat | Barcha bo‘limlarni boshqarish, o‘quvchi/o‘qituvchi/guruh qo‘shish, dars jadvali va sozlamalarni tahrirlash |
| **O‘qituvchi** | `qurbonaliyev_d` | `teacher123` | Qurbonaliyev Diyor | Faqat o‘ziga biriktirilgan fanlar va guruhlar jurnali, davomat belgilash, 5 ballik baho qo‘yish, mavzu va vazifa yuklash |
| **O‘qituvchi** | `asadov_z` | `teacher123` | Asadov Ziyodulla | Axborot texnologiyalari fani o‘qituvchisi |
| **O‘quvchi** | `jasur_akbarov` | `student123` | Akbarov Jasur Bobirovich | 12-guruh IT talabasi: o‘z baholari, davomati, bugungi/ertangi jadvali va vazifalarini ko‘rish |

---

## 2. Dars jadvali — Yuborilgan rasm asosida

Yuborgan rasmingiz asosida **12-guruh "Kompyuter tarmoqlari va IT" kasbi 1-bosqich** uchun dars jadvali to‘liq shakllantirildi:

- **Jadval ustunlari:** Hafta kunlari, Juftlik (I, II, III, IV), Dars vaqti, Fan nomi, O‘qituvchining F.I.SH, Xona raqami.
- **Sariq sarlavha qatori** (`#ffc000`), qora chiziqlar va rasmiy HEMIS formati.
- **Binafsha rangli ajratuvchi qatorlar** kunlar orasida joylashtirilgan.
- **Qizil va Yashil bo‘lingan darslar (Split slots):**
  - **Seshanba III-juftlik:** Yuqori qizil qatorda *Fizika va astranomiya* (Abdullayeva Ozoda), pastki yashil qatorda *Axborot texnalogiyalari* (Asadov Ziyodulla).
  - **Payshanba IV-juftlik:** Maxsus ajratilgan mashg‘ulot (Qizil) va *ChQBT* (Babadjanov Aziz, Yashil).
- **O‘qituvchilar vaqt to‘qnashuvi nazorati (Conflict check):** Agar bir o‘qituvchi bir vaqtda ikkita guruhga darsga qo‘yilsa, tizim ogohlantirish beradi.
- **A4 formatida chop etish (Print CSS):** Maxsus chop etish tugmasi orqali dekanat tasdiqlash imzolari bilan rasmiy blankada chiqariladi.

---

## 3. Elektron jurnal va Davomat

- **Mahkamlangan talabalar ustuni (Sticky column):** Katta jadvallarda gorizontal aylantirilganda ham talabalar ism-shariflari chap tomonda ko‘rinib turadi.
- **Tezkor davomat:** `Keldi`, `Kelmadi`, `Kechikdi`, `Sababli`.
- **"Barchasini Keldi deb belgilash":** Bitta tugma bilan guruhdagi barcha o‘quvchilarga bir zumda davomat qo‘yish mumkin.
- **Baholash jurnali:** 5 ballik tizim (5 — A’lo, 4 — Yaxshi, 3 — Qoniqarli, 2 — Qoniqarsiz), o‘rtacha GPA avtomatik qayta hisoblanadi.
- **Mavzu va uyga vazifalar:** Har bir sana va juftlik uchun dars mavzusi va uyga vazifa matni kiritiladi va tegishli guruh talabalariga darhol ko‘rinadi.

---

## 4. Firebase Cloud Firestore integratsiyasi

Loyihada **Firestore Security Rules** (`/firestore.rules`) tayyorlangan.

### Firebase ma’lumotlar bazasi tuzilmasi:
- `users`: foydalanuvchilar hisoblari va rollari
- `students`: o‘quvchilar ro‘yxati va profillari
- `teachers`: pedagoglar va ularga biriktirilgan fanlar
- `groups`: o‘quv guruhlari
- `subjects`: fanlar katalogi
- `schedules`: dars jadvallari
- `grades`: baholar tarixi
- `attendance`: davomat yozuvlari
- `homework`: uyga vazifalar
- `announcements`: e’lonlar
- `auditLogs`: tizim amallari tarixi

### Firebase-ni faollashtirish uchun:
1. Tizimga **Admin** sifatida kiring (`admin` / `admin123`).
2. Chap menyudan **"Tizim sozlamalari"** bo‘limiga o‘ting.
3. **"4. Firebase & Cloud Firestore integratsiyasi"** bo‘limidagi *"Firebase Cloud Firestore orqali sinxronlashni yoqish"* katakchasini belgilang.
4. Firebase Console-dan olgan `apiKey` va `projectId` qiymatlarini kiriting va **"Sozlamalarni saqlash"** tugmasini bosing.
5. Agar Firebase ulanmagan bo‘lsa ham, dastur **avtonom doimiy lokal xotira (localStorage/IndexedDB)** bilan to‘liq ishlaydi — sahifa yangilanganda ham ma’lumotlar yo‘qolmaydi!
