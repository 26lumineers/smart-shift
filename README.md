# SmartShift

เว็บแอปตารางเวรนอกเวลาราชการ กลุ่มงานเทคนิคการแพทย์ โรงพยาบาลสมเด็จพระยุพราชกระนวน
Next.js (App Router) + Cloudflare D1 + Drizzle ORM บน Cloudflare Workers ผ่าน OpenNext

สถานะปัจจุบัน: **เฟส 1 (MVP)** — ดูตารางบนมือถือ, login ด้วย PIN, ตารางตัวอย่าง ต.ค.–พ.ย. 2569
Production: https://smart-shift.firman-lasaman.workers.dev (worker `smart-shift`, D1 `smartshift-db`)
เฟสถัดไป: ตัวจัดเวรอัตโนมัติ (ดูแผนในประวัติการวางแผน) — ยังไม่รวมในโค้ดนี้

## เริ่มใช้งานในเครื่อง

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:generate        # สร้าง SQL migration จาก schema (ทำเมื่อแก้ schema)
npm run db:migrate:local   # apply migration ลง D1 จำลองในเครื่อง
npm run seed               # seed รายชื่อ/ประเภทเวร/ตารางตัวอย่าง + พิมพ์ PIN ครั้งเดียว
npm run dev                # เปิด http://localhost:3000
```

`npm run seed` จะพิมพ์ PIN 6 หลักของทุกคนทาง console (ไม่เก็บใน repo) — เก็บไว้ทดสอบ
รัน seed ซ้ำ = ล้างข้อมูลเดิมและสุ่ม PIN ใหม่

## ทดสอบ

```bash
npm test                          # vitest: lib/dates + ตัวสร้างตารางตัวอย่าง (กฎเด็ดขาด)
npx tsc --noEmit                  # typecheck
npm run preview                   # build แล้วรันบน Workers runtime ในเครื่อง
```

## Deploy ขึ้น Cloudflare

```bash
npx wrangler login
npx wrangler d1 create smartshift-db     # เอา database_id ที่ได้ไปใส่ wrangler.jsonc
npx wrangler secret put SESSION_SECRET   # ใส่ค่า secret ยาว ๆ (JWT cookie)
npm run db:migrate                       # apply migration บน D1 จริง
npm run deploy                           # opennextjs-cloudflare build && deploy
```

หมายเหตุ:
- `wrangler.jsonc` ใช้ `database_id: local-smartshift-db` เป็นค่าชั่วคราวสำหรับ `--local` เท่านั้น ต้องแทนด้วย id จริงก่อน deploy
- เบอร์โทรไม่อยู่ใน seed (ข้อมูลส่วนตัว) — เขียนลง D1 โดยตรงด้วย `wrangler d1 execute`; รัน seed ซ้ำจะล้างเบอร์โทร
- สะกดชื่อบุคลากรอิงตาม prompt แบบฟอร์ม F-OPR-012 — ตรวจทานกับเอกสารจริงก่อนใช้ production
- Workers Builds (auto-deploy): เชื่อม Git กับ worker `smart-shift` สาขา `main`, build command `npx opennextjs-cloudflare build`, deploy command `npx wrangler deploy`; GitHub App "Cloudflare Workers and Pages" ต้องได้สิทธิ์ repo `26lumineers/smart-shift` ด้วย ไม่อย่างนั้นจะขึ้น "disconnected from your Git account" และ push จะไม่ trigger build

## โครงสร้าง

```
src/
├── app/                    # หน้า login, /my (การ์ดมือถือ), /schedule (ตารางเต็ม + print A4)
├── components/schedule/    # MonthTable, DayCards, MonthPicker, TableFooter, PrintButton
├── lib/
│   ├── db/                 # schema (7 ตาราง), client (D1 binding), queries
│   ├── auth/               # PIN (PBKDF2 WebCrypto), JWT session (jose), rate limit
│   ├── dates.ts            # ISO ↔ พ.ศ., กริดเดือน, สุดสัปดาห์/วันหยุด
│   └── demo-schedule.ts    # ตัวสร้างตารางตัวอย่าง deterministic (บังคับกฎเด็ดขาด 1–11)
scripts/seed.ts             # seed ลง D1 local (better-sqlite3)
tests/                      # vitest
```

การป้องกันหน้า: ทุกหน้า server component เรียก `getSession()` และ redirect ไป `/login` เมื่อไม่มี session
(ไม่มี middleware/proxy เพราะ OpenNext ยังไม่รองรับ proxy.ts ของ Next 16 แบบเสถียร)

`CONTEXT.md` = glossary คำศัพท์โดเมน, `docs/adr/` = บันทึกการตัดสินใจ