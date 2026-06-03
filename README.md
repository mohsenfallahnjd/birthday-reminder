# جشن تولد — Birthday Reminder

وب‌اپ یادآوری تولد شمسی، گروه‌ها، لیست آرزو و جمع‌آوری هدیه گروهی با تأیید ادمین مالی.

## ویژگی‌ها

- تقویم شمسی (Persian date picker) برای ثبت تولد
- گروه با کد دعوت + افزودن دوستان با ایمیل
- یادآور تولد با اعلان درون‌برنامه‌ای (کرون روزانه روی Vercel)
- جشن تولد: لیست آرزو (عنوان، لینک، قیمت، cheap-in)
- پرداخت دلخواه + آپلود رسید (Vercel Blob)
- ادمین مالی: شماره کارت، تأیید/رد پرداخت، اعلان به بدهکاران

## Tech stack

- **Bun** — package manager & runtime
- **Biome** — lint & format
- **Next.js 16** — App Router
- **Prisma** + PostgreSQL (Neon on Vercel)
- **Vercel** — deploy + Blob + Cron

## شروع محلی

```bash
bun install
cp .env.example .env
# DATABASE_URL و AUTH_SECRET را پر کنید
bun run db:push
bun run dev
```

## Deploy on Vercel

1. پروژه را به Vercel وصل کنید.
2. **Neon Postgres** (یا Postgres دیگر) اضافه کنید → `DATABASE_URL`
3. `AUTH_SECRET` — رشته تصادفی طولانی
4. `BLOB_READ_WRITE_TOKEN` — از Storage → Blob برای رسید پرداخت
5. `CRON_SECRET` — اختیاری برای امنیت `/api/cron/birthdays`
6. `NEXT_PUBLIC_APP_URL` — مثلاً `https://your-app.vercel.app`
7. Deploy — `postinstall` اجرای `prisma generate` را انجام می‌دهد.

```bash
bun run build
```

## اسکریپت‌ها

| دستور | توضیح |
|--------|--------|
| `bun run dev` | سرور توسعه |
| `bun run build` | build تولید |
| `bun run lint` | Biome check |
| `bun run db:push` | sync schema به DB |

## ساختار components

- `@/components/link` — لینک با استایل جشن
- `@/components/image` — تصویر با قاب party/avatar
- `@/components/icon` — آیکون‌های lucide (cake, gift, party, …)
- `@/components/persian-date-picker` — انتخاب تاریخ شمسی
