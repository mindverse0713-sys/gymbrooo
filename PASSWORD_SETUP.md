# Нууц үгийн тохиргоо

## ✅ Хийгдсэн өөрчлөлтүүд:

1. ✅ Password column нэмэгдсэн (Supabase migration файл)
2. ✅ bcryptjs суулгасан (password hashing)
3. ✅ Login API endpoint (`/api/users/login`)
4. ✅ Password hashing signup дээр
5. ✅ Password verification login дээр
6. ✅ Password fields форм дээр нэмэгдсэн

## 📋 Supabase дээр хийх:

Supabase дээр password column нэмэхийн тулд:

1. Supabase Dashboard → SQL Editor
2. Дараах SQL ажиллуулна:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
```

Эсвэл `supabase/add_password_column.sql` файлын агуулгыг copy хийж run хийж байна.

## 🔐 Нууц үгийн шаардлага:

- Signup: Хамгийн багадаа 6 тэмдэгт
- Login: Имэйл + нууц үг
- Password-ууд bcrypt ашиглан hash хийгддэг (salt rounds: 10)

## ⚠️ Хуучин хэрэглэгчдэд:

Хуучин хэрэглэгчид (password байхгүй) одоогоор нэвтрэх боломжтой (migration-ын тулд). Ирээдүйд password reset хийх шаардлагатай болно.


