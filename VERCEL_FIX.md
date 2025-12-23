# Vercel Deployment Алдаа Засах

## 🔴 Алдаа: "Бүртгэл үүсгэхэд алдаа гарлаа"

Энэ алдаа ихэвчлэн дараах шалтгаануудтай байна:

### ✅ 1. Supabase SQL Migration ажиллуулах (Хамгийн чухал!)

**Supabase dashboard дээр:**

1. https://supabase.com/dashboard/project/mxnwtlkwbduvownzfgrb руу орно уу
2. Зүүн талаас **SQL Editor** сонгоно уу
3. **New query** дарахад
4. `supabase/migrations/001_initial_schema.sql` файлын бүх агуулгыг copy хийж paste хийж
5. **Run** (эсвэл Cmd/Ctrl + Enter) дарахад
6. ✅ "Success" гэсэн мэссэж гарна

**Шалгах:**
- **Table Editor** → Table-ууд харагдах ёстой: User, Exercise, Program, Day, DayExercise, Workout, Set

### ✅ 2. Vercel Environment Variables тохируулах

**Vercel Dashboard дээр:**

1. https://vercel.com/dashboard → Project → gym → **Settings** → **Environment Variables**
2. Дараах 2 хувьсагчийг нэмнэ:

```
NEXT_PUBLIC_SUPABASE_URL=https://mxnwtlkwbduvownzfgrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnd0bGt3YmR1dm93bnpmZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1NzUsImV4cCI6MjA4MjA3MDU3NX0.VcZElAgo0TPDWmmpkxtq08Dw5opDZySJI90wZsVg_1g
```

3. **Environment** сонгох: Production, Preview, Development (бүгд)
4. **Save** дарахад
5. **Redeploy** хийх (эсвэл шинэ commit push хийх)

### ✅ 3. Redeploy хийх

Vercel dashboard → Deployments → Latest deployment → ... (three dots) → **Redeploy**

Эсвэл:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 🧪 Шалгах

1. Vercel dashboard → Functions → Logs дээр алдааг шалгана уу
2. Browser console дээр (F12) алдааг шалгана уу
3. Supabase → Logs → API Logs дээр request-уудыг шалгана уу

## 📝 Анхаарах

- SQL migration ажиллуулахгүй байвал table-ууд байхгүй → алдаа гарна
- Vercel дээр environment variables байхгүй бол → алдаа гарна
- Environment variables нэмсний дараа redeploy хийх хэрэгтэй

