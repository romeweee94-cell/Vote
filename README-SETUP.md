# วิธีติดตั้ง — Vercel + Supabase

โครงสร้างไฟล์:
```
vote-app/
├─ index.html
├─ style.css
├─ app.js
├─ supabase-config.js        ← ใส่ URL + anon key (public, ปลอดภัยที่จะฝังในโค้ด)
├─ schema.sql                ← รันในหน้า SQL Editor ของ Supabase
├─ package.json
├─ .env.example               ← ตัวอย่างตัวแปรลับ ไปตั้งจริงใน Vercel
└─ api/
   ├─ _lib/adminAuth.js       ← ตรวจคุกกี้แอดมิน + client ที่ใช้ service role key
   └─ admin/
      ├─ login.js             ← เช็ครหัสผ่านแอดมิน (ฝั่งเซิร์ฟเวอร์)
      ├─ logout.js
      ├─ session.js           ← เช็คว่ายัง login แอดมินอยู่ไหม
      ├─ schedule.js          ← ตั้งเวลาเปิด/ปิดโหวต
      ├─ reveal.js            ← เปิด/ปิดการเผยผลโหวต
      ├─ upload-url.js        ← ออก signed URL ให้อัปโหลดรูปตรงไป Storage
      └─ images.js            ← บันทึก/ลบแถวรูปภาพ
```

**สถาปัตยกรรมความปลอดภัยที่ใช้ (ตามที่เลือก):**
รหัสผ่านแอดมินตรวจที่ฝั่งเซิร์ฟเวอร์ (Vercel serverless function) ไม่ได้ฝังไว้ใน
JS ฝั่ง client อีกต่อไป เมื่อรหัสถูกต้อง เซิร์ฟเวอร์จะออกคุกกี้ที่เซ็นด้วยกุญแจลับ
(HttpOnly, เข้าถึงจาก JS ไม่ได้) ทุกคำสั่งของแอดมิน (ตั้งเวลา/เพิ่ม-ลบรูป/เปิดเผยผล)
ต้องแนบคุกกี้นี้และถูกตรวจซ้ำที่เซิร์ฟเวอร์ทุกครั้ง ส่วน `service_role key` ที่มีสิทธิ์
เขียนข้อมูลทุกตารางอยู่ในตัวแปรแวดล้อมของ Vercel เท่านั้น ไม่เคยถูกส่งมาที่ browser

ผู้โหวตทั่วไป (สมัคร/ล็อกอิน/โหวต) ก็ไม่ได้คุยกับตารางฐานข้อมูลตรง ๆ เช่นกัน แต่ผ่าน
Postgres function (RPC) ที่ตรวจสิทธิ์ในตัว — ดูรายละเอียดในคอมเมนต์ `schema.sql`

---

## 1) สร้างโปรเจกต์ Supabase

1. ไปที่ https://supabase.com → Sign in → **New project**
2. ตั้งชื่อโปรเจกต์ เลือก region ใกล้ผู้ใช้งาน (เช่น Singapore) ตั้งรหัสผ่านฐานข้อมูล (เก็บไว้เผื่อใช้)
3. รอสร้างเสร็จ (1-2 นาที)

## 2) รัน schema.sql

1. ในเมนูซ้าย ไปที่ **SQL Editor** → **New query**
2. เปิดไฟล์ `schema.sql` ที่แนบมา คัดลอกทั้งหมด วางแล้วกด **Run**
3. ควรเห็นข้อความสำเร็จ ไม่มี error สีแดง

## 3) สร้าง Storage bucket

1. เมนูซ้าย **Storage** → **New bucket**
2. ชื่อ bucket: `images` (ตัวพิมพ์เล็กทั้งหมด ต้องตรงกับใน `app.js`/API)
3. เปิดสวิตช์ **Public bucket** (ให้ทุกคนเปิดดูรูปได้จากลิงก์)
4. Create bucket

## 4) เอาคีย์มาใส่

ไปที่ **Project Settings** (รูปเฟือง) > **API**

| ค่า | เอาไปใส่ที่ไหน |
|---|---|
| Project URL | `supabase-config.js` → `SUPABASE_URL` **และ** Vercel env `SUPABASE_URL` |
| anon public key | `supabase-config.js` → `SUPABASE_ANON_KEY` |
| service_role key (secret) | Vercel env `SUPABASE_SERVICE_ROLE_KEY` **เท่านั้น** ห้ามใส่ในไฟล์ที่ขึ้น GitHub |

แก้ไฟล์ `supabase-config.js` ให้เรียบร้อยก่อน commit

## 5) ตั้งค่า Environment Variables บน Vercel

Vercel Dashboard > โปรเจกต์ > **Settings > Environment Variables** เพิ่ม 4 ตัว (ดู `.env.example`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSCODE` — รหัสผ่านแอดมินที่จะใช้ล็อกอิน (ตั้งเอง)
- `ADMIN_SESSION_SECRET` — สตริงสุ่มยาว ๆ (เช่นรันคำสั่ง `openssl rand -hex 32` แล้วก็อปมาใส่)

ตั้งให้ครบทั้ง 3 environment (Production, Preview, Development) แล้ว **Redeploy**

## 6) Deploy ขึ้น Vercel

ทางที่ง่ายที่สุด (ผ่าน Git):
1. Push โฟลเดอร์ `vote-app/` ทั้งหมดขึ้น GitHub repo
2. Vercel Dashboard > **Add New Project** > เลือก repo นี้ > Deploy
   (Vercel จะรัน `npm install` ให้เองตาม `package.json` และตรวจพบโฟลเดอร์ `api/`
   เป็น Serverless Functions โดยอัตโนมัติ ไม่ต้องตั้งค่า Framework Preset)
3. ตั้ง Environment Variables ตามข้อ 5 ก่อนหรือหลัง deploy ก็ได้ (ถ้าตั้งทีหลังต้อง Redeploy)

หรือใช้ Vercel CLI:
```
npm i -g vercel
cd vote-app
vercel          # ตั้งค่าตามคำถามในเทอร์มินัล, deploy เป็น preview ก่อน
vercel --prod   # deploy จริง
```

---

## 7) ทดสอบอ่าน/เขียน (ทำเองหลัง deploy)

**หมายเหตุ:** ผมไม่มีอินเทอร์เน็ตในระบบที่ใช้เตรียมไฟล์นี้ให้ จึงต่อไป Supabase/Vercel
โดยตรงเพื่อทดสอบให้ไม่ได้ — เช็คลิสต์นี้ให้ทำเองหลัง deploy เสร็จ (ใช้เวลาไม่เกิน 10 นาที):

- [ ] เปิดเว็บ → เห็นหน้า "เข้าสู่ระบบเพื่อโหวต"
- [ ] สมัครสมาชิกชื่อทดสอบ → ควรเด้งเข้าหน้าโหวตทันที (ทดสอบ RPC `register_user`)
- [ ] ออกจากระบบแล้วล็อกอินด้วยชื่อ/รหัสเดิม → ควรเข้าได้ (ทดสอบ `login_user`)
- [ ] ลองสมัครชื่อซ้ำ → ต้องขึ้น "มีชื่อผู้ใช้นี้อยู่แล้ว"
- [ ] กดปุ่ม "แอดมิน" ใส่รหัสแอดมิน (ค่าที่ตั้งใน `ADMIN_PASSCODE`) → ควรเข้าแผงควบคุมได้
- [ ] ใส่รหัสผิด → ต้องขึ้น "รหัสผ่านแอดมินไม่ถูกต้อง"
- [ ] ในแผงควบคุม ตั้งเวลาเปิดโหวต (เช่นเปิดตอนนี้ ปิดพรุ่งนี้) กด "บันทึกเวลา"
- [ ] เพิ่มรูปภาพ 1 รูป → รอจนอัปโหลดเสร็จ ควรเห็นรูปโผล่ในลิสต์แอดมินและในแกลเลอรีหน้าโหวต (ทดสอบ Storage upload + realtime)
- [ ] เปิดอีกแท็บ/เบราว์เซอร์ ล็อกอินคนละชื่อ กดโหวตรูป → กลับมาดูแท็บแรก คะแนนควรขยับแบบเรียลไทม์โดยไม่ต้องรีเฟรช
- [ ] ลองโหวตรูปเดิมซ้ำ (คนละแท็บเดียวกัน) → ปุ่มต้องเป็น "✓ โหวตแล้ว" กดซ้ำไม่ได้
- [ ] กด "เปิดเผยผลโหวต" → หน้าโหวตของผู้ใช้ทั่วไปต้องเห็นตารางผลโหวตขึ้นมา
- [ ] ลบรูปภาพ 1 รูปจากแผงแอดมิน → รูปต้องหายทั้งจากแกลเลอรีและ Storage

ถ้าขั้นไหน error ให้เปิด DevTools > Console/Network ดูข้อความ error (ทุก endpoint
ใน `api/admin/*` ตอบ JSON ที่มี `error` บอกสาเหตุ) หรือส่งข้อความ error กลับมาให้ผมดูได้เลย

## ข้อควรระวังเพิ่มเติม
- อย่า commit ไฟล์ที่มี `service_role key` หรือ `.env` จริงขึ้น GitHub
- ถ้าจะเปลี่ยนรหัสแอดมิน แก้ที่ `ADMIN_PASSCODE` ใน Vercel env แล้ว Redeploy — ไม่ต้องแก้โค้ด
- bucket `images` เปิด public read ไว้เพื่อให้แกลเลอรีโหลดรูปได้ตรง ๆ ส่วนการ**เขียน**เข้า bucket
  ทำได้เฉพาะผ่าน signed URL ที่ออกโดยแอดมินเท่านั้น (ไม่มีใครอัปโหลดตรงได้)
