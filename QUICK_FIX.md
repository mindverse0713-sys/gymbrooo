# Шууд Засах Алхам

## Supabase дээр RLS унтраах (Хамгийн чухал!)

Хэрэв Supabase table-ууд үүссэн бол, ихэвчлэн RLS (Row Level Security) policy-г унтраах хэрэгтэй.

### Алхам 1: Supabase SQL Editor руу орно уу

1. https://supabase.com/dashboard/project/mxnwtlkwbduvownzfgrb
2. Зүүн талаас **SQL Editor** сонгоно уу
3. **New query** дарахад

### Алхам 2: RLS унтраах команд ажиллуулах

Дараах SQL-ийг copy хийж run хийж байна:

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Exercise" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Program" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Day" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DayExercise" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Workout" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Set" DISABLE ROW LEVEL SECURITY;
```

Эсвэл `supabase/disable_rls.sql` файлын агуулгыг copy хийж run хийж байна.

### Алхам 3: Туршиж үзэх

Вебсайт дээр бүртгэл үүсгэх оролдож үзнэ үү. Одоо ажиллах ёстой!

## Хэрэв ажиллахгүй бол:

1. **Browser Console шалгах** (F12 → Console tab)
2. **Network tab** дээр `/api/users` request-ийг шалгах
3. **Vercel Logs** шалгах (Functions → Logs)
4. **Supabase Logs** шалгах (Logs → API Logs)

