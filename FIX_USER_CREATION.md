# User Creation Алдаа Засах

## ❌ Алдаа: "Failed to create user"

Энэ алдаа ихэвчлэн дараах шалтгаануудтай байна:

### 1. ✅ Password Column байхгүй (Хамгийн их магадлалтай)

Supabase дээр User table-д password column нэмэх хэрэгтэй.

**Шийдэл:**

1. Supabase Dashboard → SQL Editor руу орно уу
2. Дараах SQL ажиллуулна:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
```

Эсвэл `supabase/add_password_column.sql` файлын агуулгыг copy хийж run хийж байна.

### 2. ✅ Table байхгүй

User table үүсээгүй байх магадлалтай.

**Шийдэл:**

1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/001_initial_schema.sql` файлын бүх агуулгыг copy хийж run хийж байна

### 3. ✅ RLS Policy

Row Level Security идэвхжсэн байвал policy нэмэх хэрэгтэй.

**Шийдэл:**

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
```

Эсвэл `supabase/disable_rls.sql` файлын агуулгыг ажиллуулна.

### 4. ✅ Environment Variables

Vercel дээр environment variables тохируулсан эсэхийг шалгана уу:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔍 Алдааг шалгах

Browser console дээр (F12) алдааны мэссэжийг харах:
- Хэрэв "column 'password' does not exist" гэж гарвал → Password column нэмэх
- Хэрэв "relation 'User' does not exist" гэж гарвал → Table үүсгэх
- Хэрэв "permission denied" гэж гарвал → RLS disable хийх

## ✅ Хийх дараалал:

1. Password column нэмэх (дээрх SQL)
2. Table үүсээгүй бол migration ажиллуулах
3. RLS disable хийх
4. Vercel environment variables шалгах
5. Browser refresh хийж дахин оролдох


