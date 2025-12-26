# Алдааг Debug Хийх

## Алдаа: "Бүртгэл үүсгэхэд алдаа гарлаа"

Энэ алдааг засахын тулд дараах зүйлсийг шалгана уу:

### 1. ✅ Supabase SQL Migration ажиллуулсан эсэх

**Шалгах:**
- Supabase Dashboard → Table Editor
- Дараах table-ууд байх ёстой:
  - ✅ User
  - ✅ Exercise
  - ✅ Program
  - ✅ Day
  - ✅ DayExercise
  - ✅ Workout
  - ✅ Set

**Хэрэв table-ууд байхгүй бол:**
1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/001_initial_schema.sql` файлын агуулгыг copy хийж
3. Paste хийж Run хийж байна

### 2. ✅ Vercel Environment Variables тохируулсан эсэх

**Шалгах:**
- Vercel Dashboard → Settings → Environment Variables
- Дараах 2 хувьсагч байх ёстой:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Хэрэв байхгүй бол:**
1. Environment Variables руу очно уу
2. Дараах утгуудыг нэмнэ:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mxnwtlkwbduvownzfgrb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Production, Preview, Development бүгд дээр нэмнэ
4. Redeploy хийж байна

### 3. 🐛 Browser Console дээрх алдааг шалгах

1. Browser дээр F12 дарахад (Developer Tools нээх)
2. Console tab сонгох
3. Алдаа гарч байгаа эсэхийг шалгах
4. Network tab дээр `/api/users` request-ийг шалгах
5. Response дээр ямар алдаа гарч байгааг харах

### 4. 🔍 Vercel Logs шалгах

1. Vercel Dashboard → Project → Functions → Logs
2. Хамгийн сүүлийн error-ийг шалгах
3. Алдааны мэссэжийг харах

### 5. 📊 Supabase Logs шалгах

1. Supabase Dashboard → Logs → API Logs
2. Request-ууд гарч байгаа эсэхийг шалгах
3. Алдаа гарч байгаа эсэхийг харах

## Ердийн алдаанууд ба шийдлүүд

### Алдаа: "relation 'User' does not exist"
**Шалтгаан:** SQL migration ажиллаагүй байна
**Шийдэл:** Supabase дээр SQL migration ажиллуулах

### Алдаа: "Missing Supabase environment variables"
**Шалтгаан:** Vercel дээр environment variables тохируулаагүй
**Шийдэл:** Vercel дээр environment variables нэмэх

### Алдаа: "Invalid API key"
**Шалтгаан:** Буруу API key
**Шийдэл:** Supabase dashboard-аас зөв key-ийг copy хийж дахин нэмэх

### Алдаа: "permission denied"
**Шалтгаан:** Row Level Security (RLS) policy байна
**Шийдэл:** Supabase → Authentication → Policies дээр RLS идэвхжүүлээгүй эсэхийг шалгах, эсвэл policy нэмэх

## RLS Policy нэмэх (хэрэв шаардлагатай бол)

Supabase дээр RLS идэвхжсэн байвал, дараах SQL ажиллуулах:

```sql
-- Allow all operations on User table (for now, can restrict later)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- Or enable RLS but allow all operations
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on User" ON "User" FOR ALL USING (true) WITH CHECK (true);

-- Repeat for other tables if needed
ALTER TABLE "Exercise" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Program" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Day" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DayExercise" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Workout" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Set" DISABLE ROW LEVEL SECURITY;
```


