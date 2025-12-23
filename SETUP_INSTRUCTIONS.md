# Setup Instructions

## ✅ 1. Environment Variables (Done!)
`.env.local` файл үүсгэгдээд Supabase credentials нэмэгдлээ.

## 📋 2. SQL Migration ажиллуулах

### Сонголт A: Supabase Dashboard ашиглах (Хамгийн амар)

1. https://supabase.com/dashboard/project/mxnwtlkwbduvownzfgrb руу очно уу
2. Зүүн талаас **SQL Editor** сонгоно уу
3. **New query** дарахад
4. `supabase/migrations/001_initial_schema.sql` файлын бүх агуулгыг хуулж paste хийж
5. **Run** (эсвэл Cmd/Ctrl + Enter) дарахад
6. ✅ "Success. No rows returned" гэсэн мэссэж гарна

### Сонголт B: Supabase CLI ашиглах (хэрэв суулгасан бол)

```bash
supabase db push
```

## 🚀 3. Dev Server эхлүүлэх

```bash
npm run dev
```

## 🧪 4. Туршиж үзэх

1. Browser дээр http://localhost:3000 руу орно уу
2. Хэрэглэгч бүртгэх эсвэл нэвтрэх оролдож үзнэ үү
3. Дасгал нэмэх оролдож үзнэ үү

## 📝 5. Vercel дээр Deploy хийх

Vercel dashboard → Settings → Environment Variables дээр дараах 2 хувьсагчийг нэмнэ:

```
NEXT_PUBLIC_SUPABASE_URL=https://mxnwtlkwbduvownzfgrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnd0bGt3YmR1dm93bnpmZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1NzUsImV4cCI6MjA4MjA3MDU3NX0.VcZElAgo0TPDWmmpkxtq08Dw5opDZySJI90wZsVg_1g
```

## 🔍 Алдаа гарвал

- Console дээрх алдааг шалгана уу
- Supabase dashboard → Database → Tables дээр table-ууд үүссэн эсэхийг шалгана уу
- `.env.local` файл зөв байгаа эсэхийг шалгана уу

